/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import browser from 'webextension-polyfill';

import { mockExtensionStoreEnvironment } from '../../../../helpers/mocks/extension-store';
import {
    BackendUpdateChecker,
} from '../../../../../Extension/src/background/services/extension-update/backend-update-checker';
import { UpdateCheckStatus } from '../../../../../Extension/src/background/services/extension-update/types';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { UserAgent } from '../../../../../Extension/src/common/user-agent';

// The global fetch is mocked in vitest.setup.ts via mockGlobalFetch().
// We override it per-test with vi.fn() for precise control.
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

let restoreEnvironment: () => void;

beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    global.fetch = fetchMock;

    // Default: clientId is available
    appContext.set(AppContextKey.ClientId, 'test-client-id');

    restoreEnvironment = mockExtensionStoreEnvironment();
});

afterEach(() => {
    restoreEnvironment();
    vi.restoreAllMocks();
});

/**
 * Creates a mock Response-like object for fetch.
 *
 * @param status HTTP status code.
 * @param body Response body (will be returned by .json()).
 *
 * @returns Mock Response.
 */
function createMockResponse(status: number, body?: unknown): Response {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: body !== undefined
            ? () => Promise.resolve(body)
            : () => Promise.reject(new Error('No body')),
        text: () => Promise.resolve(body !== undefined ? JSON.stringify(body) : ''),
        headers: new Headers(),
        redirected: false,
        statusText: '',
        type: 'basic' as ResponseType,
        url: '',
        clone: () => createMockResponse(status, body),
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
    } as Response;
}

describe('BackendUpdateChecker', () => {
    describe('checkUpdate', () => {
        // Prefs.version is '0.0.0' from vitest.setup.ts (browser.runtime.getManifest().version)
        // Prefs.id is 'test' from vitest.setup.ts (chrome.runtime.id)

        it('returns UpdateAvailable when backend reports newer version', async () => {
            fetchMock.mockResolvedValue(createMockResponse(200, { version: '5.3.0.18' }));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.UpdateAvailable);
            // @ts-expect-error -- status is already asserted above
            expect(result.version).toBe('5.3.0.18');
        });

        it('returns NoUpdate when backend reports same version', async () => {
            // Current version is '0.0.0' from the mock manifest
            fetchMock.mockResolvedValue(createMockResponse(200, { version: '0.0.0.0' }));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.NoUpdate);
        });

        it('returns NoContent when backend returns 204', async () => {
            fetchMock.mockResolvedValue(createMockResponse(204));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.NoContent);
        });

        it('returns Error when backend returns 500', async () => {
            fetchMock.mockResolvedValue(createMockResponse(500));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.Error);
        });

        it('returns Error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.Error);
            // @ts-expect-error -- status is already asserted above
            expect(result.error).toBeInstanceOf(Error);
        });

        it('returns Error when response has malformed JSON', async () => {
            const mockResponse = createMockResponse(200);
            // Override json() to reject (simulating invalid JSON)
            mockResponse.json = () => Promise.reject(new SyntaxError('Unexpected token'));
            fetchMock.mockResolvedValue(mockResponse);

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.Error);
        });

        it('returns Error when response schema is invalid (missing version field)', async () => {
            fetchMock.mockResolvedValue(createMockResponse(200, { update: true }));

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.Error);
        });

        it('returns Error when clientId is not available', async () => {
            // Clear the clientId
            appContext.set(AppContextKey.ClientId, undefined);

            const result = await BackendUpdateChecker.checkUpdate();

            expect(result.status).toBe(UpdateCheckStatus.Error);
        });

        it('constructs URL with correct query parameters', async () => {
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const calledUrl = fetchMock.mock.calls[0]![0] as string;

            // Verify query params
            const url = new URL(calledUrl);
            expect(url.searchParams.get('app_id')).toBe('test-client-id');
            expect(url.searchParams.get('ex_id')).toBe('test'); // from vitest.setup.ts chrome.runtime.id
            expect(url.searchParams.get('version')).toBe('0.0.0'); // from vitest.setup.ts manifest
            expect(url.searchParams.has('browser_version')).toBe(true);
        });

        it('routes the update check to Edge Add-ons for an Edge package installed into Chrome', async () => {
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: (
                    'https://microsoftedge.microsoft.com/addons/detail/pdffkfellgipmhklpdmokmckkkfcopbh'
                ),
            } as browser.Management.ExtensionInfo);
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            const calledUrl = fetchMock.mock.calls[0]![0] as string;
            expect(new URL(calledUrl).pathname).toBe('/api/v1/edge/check_update');
        });

        it('routes the update check to Chrome Web Store for a CWS package installed into Edge', async () => {
            Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: (
                    'https://chromewebstore.google.com/detail/bgnkhhnnamicmpeenaelnjfhikgbkllg'
                ),
            } as browser.Management.ExtensionInfo);
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            const calledUrl = fetchMock.mock.calls[0]![0] as string;
            expect(new URL(calledUrl).pathname).toBe('/api/v1/chrome/check_update');
        });

        it.each([
            {
                browserFlag: 'isOpera',
                homepageUrl: '',
                updateUrl: 'https://clients2.google.com/service/update2/crx',
            },
            {
                browserFlag: 'isOpera',
                homepageUrl: 'https://chrome.google.com/webstore/detail/adguard/test',
            },
            {
                browserFlag: 'isEdge',
                homepageUrl: 'https://chrome.google.com/webstore/detail/adguard/test',
            },
        ])('routes CWS to Chrome for $browserFlag with homepage "$homepageUrl"', async ({
            browserFlag,
            homepageUrl,
            updateUrl,
        }) => {
            Object.defineProperty(UserAgent, browserFlag, { value: true, configurable: true });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                id: 'bgnkhhnnamicmpeenaelnjfhikgbkllg',
                version: '5.5.2.23',
                installType: 'normal',
                homepageUrl,
                updateUrl,
            } as browser.Management.ExtensionInfo);
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            const calledUrl = fetchMock.mock.calls[0]![0] as string;
            expect(new URL(calledUrl).pathname).toBe('/api/v1/chrome/check_update');
        });

        it.each([
            { homepageUrl: 'https://addons.opera.com/extensions/details/adguard/' },
            { updateUrl: 'https://extension-updates.opera.com/api/omaha/update' },
        ])('routes an Opera package to Opera Add-ons using metadata %j', async (metadata) => {
            vi.mocked(browser.management.getSelf).mockResolvedValue(metadata as browser.Management.ExtensionInfo);
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();
            await BackendUpdateChecker.checkUpdate();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            fetchMock.mock.calls.forEach(([url]) => {
                expect(new URL(url as string).pathname).toBe('/api/v1/opera/check_update');
            });
            expect(browser.management.getSelf).toHaveBeenCalledOnce();
        });

        it('routes the update check to Opera Add-ons when metadata is unavailable in Opera', async () => {
            Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
            vi.mocked(browser.management.getSelf).mockRejectedValue(new Error('Management API unavailable'));
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            const calledUrl = fetchMock.mock.calls[0]![0] as string;
            expect(new URL(calledUrl).pathname).toBe('/api/v1/opera/check_update');
        });

        it('routes the update check to Firefox Add-ons for an AMO package', async () => {
            Object.defineProperty(UserAgent, 'isFirefox', { value: true, configurable: true });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl: 'https://addons.mozilla.org/firefox/addon/adguard-adblocker/',
            } as browser.Management.ExtensionInfo);
            fetchMock.mockResolvedValue(createMockResponse(204));

            await BackendUpdateChecker.checkUpdate();

            const calledUrl = fetchMock.mock.calls[0]![0] as string;
            expect(new URL(calledUrl).pathname).toBe('/api/v1/firefox/check_update');
        });
    });
});
