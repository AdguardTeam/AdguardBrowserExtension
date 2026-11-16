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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import browser from 'webextension-polyfill';

import { mockExtensionStoreEnvironment } from '../../../../helpers/mocks/extension-store';
import { UserAgent } from '../../../../../Extension/src/common/user-agent';
import {
    ExtensionStore,
    ExtensionStoreResolver,
} from '../../../../../Extension/src/background/services/extension-store/extension-store-resolver';

describe('ExtensionStoreResolver.resolve', () => {
    const chromeWebStoreHomepageUrl = (
        'https://chromewebstore.google.com/detail/bgnkhhnnamicmpeenaelnjfhikgbkllg'
    );
    const edgeAddonsHomepageUrl = (
        'https://microsoftedge.microsoft.com/addons/detail/pdffkfellgipmhklpdmokmckkkfcopbh'
    );
    const operaAddonsHomepageUrl = 'https://addons.opera.com/extensions/details/adguard/';
    const amoHomepageUrl = 'https://addons.mozilla.org/firefox/addon/adguard-adblocker/';

    let restoreEnvironment: () => void;

    beforeEach(() => {
        restoreEnvironment = mockExtensionStoreEnvironment();
    });

    afterEach(() => {
        restoreEnvironment();
        vi.restoreAllMocks();
    });

    it('resolves Chrome Web Store for a CWS package installed into Edge', async () => {
        Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: chromeWebStoreHomepageUrl,
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
    });

    it('resolves Microsoft Edge Add-ons for an Edge package installed into Chrome', async () => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: edgeAddonsHomepageUrl,
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
    });

    it('resolves Opera Add-ons from the homepage URL', async () => {
        Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: operaAddonsHomepageUrl,
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Opera);
    });

    it('resolves Firefox Add-ons from the homepage URL', async () => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: amoHomepageUrl,
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Firefox);
    });

    it.each(['isEdge', 'isOpera'])('recognizes a legacy CWS homepage with %s', async (browserFlag) => {
        Object.defineProperty(UserAgent, browserFlag, { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: 'https://chrome.google.com/webstore/detail/adguard/bgnkhhnnamicmpeenaelnjfhikgbkllg',
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
    });

    it.each(['', undefined, 'https://example.com/'])(
        'uses the CWS update endpoint in Opera with homepage %s',
        async (homepageUrl) => {
            Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
            vi.mocked(browser.management.getSelf).mockResolvedValue({
                homepageUrl,
                updateUrl: 'https://clients2.google.com/service/update2/crx',
            } as browser.Management.ExtensionInfo);

            await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
        },
    );

    it.each([
        ['https://clients2.google.com/service/update2/crx?response=redirect', ExtensionStore.Chrome],
        ['https://edge.microsoft.com/extensionwebstorebase/v1/crx', ExtensionStore.Edge],
        ['https://extension-updates.opera.com/api/omaha/update/', ExtensionStore.Opera],
        ['https://extension-updates.opera.com/api/omaha/update', ExtensionStore.Opera],
        ['HTTPS://EXTENSION-UPDATES.OPERA.COM/api/omaha/update/?response=redirect', ExtensionStore.Opera],
    ])('recognizes store update endpoint %s without a homepage', async (updateUrl, expectedStore) => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({ updateUrl } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(expectedStore);
    });

    it.each([
        'https://extension-updates.opera.com.evil.example/api/omaha/update/',
        'https://extension-updates.opera.com/api/omaha/update-extra/',
        'https://extension-updates.opera.com/API/OMAHA/UPDATE/',
        'http://extension-updates.opera.com/api/omaha/update/',
    ])('does not identify an unrelated Opera endpoint: %s', async (updateUrl) => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({ updateUrl } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
    });

    it('reuses the successful result on subsequent calls', async () => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: edgeAddonsHomepageUrl,
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
        expect(browser.management.getSelf).toHaveBeenCalledOnce();
    });

    it('caches the browser fallback after a successful metadata lookup', async () => {
        Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({} as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
        expect(browser.management.getSelf).toHaveBeenCalledOnce();
    });

    it('retries after a failed metadata lookup instead of caching the browser fallback', async () => {
        Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf)
            .mockRejectedValueOnce(new Error('Management API unavailable'))
            .mockResolvedValue({ homepageUrl: chromeWebStoreHomepageUrl } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Opera);
        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
        expect(browser.management.getSelf).toHaveBeenCalledTimes(2);
    });

    it('prefers a known homepage over a conflicting update URL', async () => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: edgeAddonsHomepageUrl,
            updateUrl: 'https://clients2.google.com/service/update2/crx',
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
    });

    it.each([
        'https://clients2.google.com.evil.example/service/update2/crx',
        'https://clients2.google.com/service/update2/crx-extra',
        'http://clients2.google.com/service/update2/crx',
        'https://example.com/?url=https://clients2.google.com/service/update2/crx',
        'https://static.adtidy.org/extensions/adguardadblocker/beta/update.xml',
        'not a URL',
    ])('falls back to the browser for an unrecognized update URL: %s', async (updateUrl) => {
        Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({ updateUrl } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Opera);
    });

    it('falls back to the runtime browser when the homepage URL is missing', async () => {
        vi.mocked(browser.management.getSelf).mockResolvedValue({} as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Chrome);
    });

    it('falls back to the runtime browser when the homepage URL is unknown', async () => {
        Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({
            homepageUrl: 'https://example.com/',
        } as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
    });

    it('falls back to Edge for an unpacked Edge installation', async () => {
        Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({} as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Edge);
    });

    it('falls back to Opera for an unpacked Opera installation', async () => {
        Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockResolvedValue({} as browser.Management.ExtensionInfo);

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Opera);
    });

    it('resolves Firefox without reading metadata', async () => {
        Object.defineProperty(UserAgent, 'isFirefox', { value: true, configurable: true });
        vi.mocked(browser.management.getSelf).mockRejectedValue(new Error('Management API unavailable'));

        await expect(ExtensionStoreResolver.resolve()).resolves.toBe(ExtensionStore.Firefox);
        expect(browser.management.getSelf).not.toHaveBeenCalled();
    });
});
