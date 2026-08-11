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

import { UpdateCheckService } from '../../../../../Extension/src/background/services/update-check/update-check-service';
import { EXTENSION_UPDATE_CHECK_KEYS } from '../../../../../Extension/src/common/constants';
import { browserStorage } from '../../../../../Extension/src/background/storages';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { logger } from '../../../../../Extension/src/common/logger';

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let setIntervalSpy: ReturnType<typeof vi.spyOn>;
let clearIntervalSpy: ReturnType<typeof vi.spyOn>;
let updateCheckService: UpdateCheckService;

beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    global.fetch = fetchMock;
    updateCheckService = new UpdateCheckService();

    appContext.set(AppContextKey.ClientId, 'test-client-id');

    setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
        .mockReturnValue(1 as unknown as ReturnType<typeof setInterval>);
    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
        .mockImplementation(() => undefined);

    // Clean storage before each test
    return browserStorage.remove(EXTENSION_UPDATE_CHECK_KEYS.timestamp)
        .then(() => browserStorage.remove(EXTENSION_UPDATE_CHECK_KEYS.availableVersion));
});

afterEach(() => {
    vi.restoreAllMocks();
});

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

describe('UpdateCheckService', () => {
    describe('init', () => {
        it('performs check immediately when no prior timestamp exists', async () => {
            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('does not perform check when last check was less than 24h ago', async () => {
            const recentTimestamp = Date.now() - 5 * 60 * 60 * 1000; // 5h ago
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('performs check when last check was more than 24h ago', async () => {
            const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25h ago
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, oldTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('registers setInterval after init', async () => {
            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        });

        it('caches timestamp from storage in memory on init', async () => {
            const recentTimestamp = Date.now() - 5 * 60 * 60 * 1000; // 5h ago
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            // No check performed because timestamp was cached from storage
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('performs check when storage read fails on init', async () => {
            // Simulate failed timestamp read.
            vi.spyOn(browserStorage, 'get').mockRejectedValueOnce(new Error('Storage read failed'));

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            // One check runs because in-memory cache starts as undefined
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('clears stale available version when current version >= stored version', async () => {
            // Current version is '0.0.0' from vitest.setup.ts
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, '0.0.0');

            const recentTimestamp = Date.now();
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBeUndefined();
        });

        it('does not clear available version when current version < stored version', async () => {
            // Current version is '0.0.0' from vitest.setup.ts
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, '1.0.0');

            const recentTimestamp = Date.now();
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBe('1.0.0');
        });

        it('removes malformed stored available version without throwing', async () => {
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, 'not-a-version');

            const recentTimestamp = Date.now();
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));
            vi.mocked(logger.error).mockClear();

            await expect(updateCheckService.init()).resolves.toBeUndefined();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBeUndefined();
            expect(logger.error).toHaveBeenCalledWith(
                '[ext.UpdateCheckService.clearStaleAvailableVersion]: Failed to clear stale available version:',
                expect.any(Error),
            );
        });

        it('runs a check from the interval callback when the check period has elapsed', async () => {
            const baseTime = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(baseTime);

            const recentTimestamp = baseTime - 5 * 60 * 60 * 1000; // 5h ago
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();

            expect(fetchMock).not.toHaveBeenCalled();

            vi.mocked(Date.now).mockReturnValue(baseTime + 25 * 60 * 60 * 1000);

            const intervalCallback = setIntervalSpy.mock.calls[0]?.[0];
            expect(typeof intervalCallback).toBe('function');

            (intervalCallback as () => void)();

            await vi.waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('idempotent init', () => {
        it('clears existing interval before creating a new one on re-init', async () => {
            const recentTimestamp = Date.now();
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();
            await updateCheckService.init();

            // Both inits should read the timestamp from storage and skip the check
            expect(fetchMock).not.toHaveBeenCalled();
            // Two intervals created, one cleared (by the second init)
            expect(setIntervalSpy).toHaveBeenCalledTimes(2);
            expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        });

        it('does not reuse stale in-memory timestamp when storage value becomes invalid on re-init', async () => {
            const recentTimestamp = Date.now();
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, recentTimestamp);

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.init();
            expect(fetchMock).not.toHaveBeenCalled();

            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.timestamp, 'invalid');
            await updateCheckService.init();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('checkUpdate', () => {
        it('persists available version when backend reports newer version', async () => {
            fetchMock.mockResolvedValue(createMockResponse(200, { version: '5.3.0' }));

            await updateCheckService.checkUpdate();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBe('5.3.0');
        });

        it('clears available version when backend returns 204', async () => {
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, '5.3.0');

            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.checkUpdate();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBeUndefined();
        });

        it('clears available version when backend version is not newer', async () => {
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, '5.3.0');

            // Current version is '0.0.0' from vitest.setup.ts, so '0.0.0' is not newer
            fetchMock.mockResolvedValue(createMockResponse(200, { version: '0.0.0.0' }));

            await updateCheckService.checkUpdate();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBeUndefined();
        });

        it('persists timestamp after successful check', async () => {
            fetchMock.mockResolvedValue(createMockResponse(204));

            await updateCheckService.checkUpdate();

            const timestamp = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.timestamp);
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThan(0);
        });

        it('persists timestamp on network error', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await updateCheckService.checkUpdate();

            const timestamp = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.timestamp);
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThan(0);
        });

        it('persists timestamp on HTTP 500', async () => {
            fetchMock.mockResolvedValue(createMockResponse(500));

            await updateCheckService.checkUpdate();

            const timestamp = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.timestamp);
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThan(0);
        });

        it('skips overlapping checks while a check is already running', async () => {
            let resolveFetch!: (response: Response) => void;
            fetchMock
                .mockImplementationOnce(() => new Promise<Response>((resolve) => {
                    resolveFetch = resolve;
                }))
                .mockResolvedValue(createMockResponse(204));

            const firstCheck = updateCheckService.checkUpdate();
            await updateCheckService.checkUpdate();

            expect(fetchMock).toHaveBeenCalledTimes(1);

            resolveFetch(createMockResponse(204));
            await firstCheck;

            await updateCheckService.checkUpdate();
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('handles trailing zeros in version (4.3.6.0 equals 4.3.6)', async () => {
            fetchMock.mockResolvedValue(createMockResponse(200, { version: '0.0.0.0' }));

            await updateCheckService.checkUpdate();

            const stored = await browserStorage.get(EXTENSION_UPDATE_CHECK_KEYS.availableVersion);
            expect(stored).toBeUndefined();
        });
    });

    describe('getAvailableUpdateVersion', () => {
        it('returns the stored available update version', async () => {
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, '5.3.0');

            await expect(UpdateCheckService.getAvailableUpdateVersion()).resolves.toBe('5.3.0');
        });

        it('returns undefined for invalid stored values', async () => {
            await browserStorage.set(EXTENSION_UPDATE_CHECK_KEYS.availableVersion, 123);

            await expect(UpdateCheckService.getAvailableUpdateVersion()).resolves.toBeUndefined();
        });

        it('returns undefined and logs an error when storage read fails', async () => {
            const error = new Error('Storage read failed');
            vi.spyOn(browserStorage, 'get').mockRejectedValueOnce(error);

            await expect(UpdateCheckService.getAvailableUpdateVersion()).resolves.toBeUndefined();
            expect(logger.error).toHaveBeenCalledWith(
                '[ext.UpdateCheckService.getAvailableUpdateVersion]: Failed to read available update version:',
                error,
            );
        });
    });
});
