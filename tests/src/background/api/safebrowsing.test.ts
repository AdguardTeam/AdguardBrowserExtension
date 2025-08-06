import browser from 'sinon-chrome';
import { type Storage } from 'webextension-polyfill';
import {
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { UrlUtils } from '../../../../Extension/src/background/utils/url';
import { SafebrowsingApi } from '../../../../Extension/src/background/api/safebrowsing';
import { SB_LRU_CACHE_KEY } from '../../../../Extension/src/common/constants';
import { SbCache, sbCache } from '../../../../Extension/src/background/storages';
import { SettingsApi } from '../../../../Extension/src/background/api/settings';
import { type SafebrowsingStorageData } from '../../../../Extension/src/background/schema/safebrowsing/safebrowsing';
import { mockLocalStorage } from '../../../helpers';
import { BLOCKING_SAFEBROWSING_OUTPUT } from '../../../../constants';

/**
 * We do not use Safebrowsing API in MV3. Actually we could try to implement
 * them, but CTO decided to not use them at all in MV3.
 */
describe.skipIf(__IS_MV3__)('Safebrowsing API', () => {
    let storage: Storage.StorageArea;

    beforeEach(() => {
        storage = mockLocalStorage();
    });

    const setCache = async (data: SafebrowsingStorageData) => {
        await storage.set({
            [SB_LRU_CACHE_KEY]: JSON.stringify(data),
        });
    };

    describe('initCache static method', () => {
        it('should init cache', async () => {
            const urlHash = 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669';
            const list = 'adguard-malware-shavar';

            await setCache([[urlHash, { value: list }]]);
            await SafebrowsingApi.initCache();

            expect(browser.storage.local.get.calledOnceWith(SB_LRU_CACHE_KEY)).toBe(true);
            expect(sbCache.get(urlHash)).toEqual(list);
        });
    });

    describe('clearCache static method', () => {
        it('should clear cache', async () => {
            const urlHash = 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669';
            const list = 'adguard-malware-shavar';

            await setCache([[urlHash, { value: list }]]);

            await SafebrowsingApi.clearCache();

            expect(browser.storage.local.set.calledOnceWith({ [SB_LRU_CACHE_KEY]: JSON.stringify([]) })).toBe(true);
            expect(sbCache.get(urlHash)).toBe(undefined);
        });
    });

    describe('addToSafebrowsingTrusted static method', () => {
        it('should add url to safebrowsing trusted', async () => {
            const url = 'https://example.com';

            await SafebrowsingApi.initCache();

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await SafebrowsingApi.addToSafebrowsingTrusted(url);

            expect(sbCache.get(hostHash)).toEqual(SbCache.SB_ALLOW_LIST);
        });
    });

    describe('checkSafebrowsingFilter static method', () => {
        it('should bypass safe domain', async () => {
            const url = 'https://example.com';

            await setCache([]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(undefined);
        });

        it('should block unsafe domain', async () => {
            const url = 'https://example.com';
            const list = 'adguard-malware-shavar';

            const expectedRedirectUrl = chrome.runtime.getURL(
                `${BLOCKING_SAFEBROWSING_OUTPUT}.html`
                + '?malware=true'
                + '&host=example.com'
                + '&url=https%3A%2F%2Fexample.com'
                + '&ref=https%3A%2F%2Fexample.com'
                + '&_locale=en',
            );

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([[hostHash, { value: list }]]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(expectedRedirectUrl);
        });

        it('should bypass allowlisted domain', async () => {
            const url = 'https://example.com';
            const list = SbCache.SB_ALLOW_LIST;

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([[hostHash, { value: list }]]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(undefined);
        });

        it('should ignore expired domain', async () => {
            const url = 'https://example.com';
            const list = 'adguard-malware-shavar';

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([
                [hostHash, {
                    value: list,
                    start: Date.now() - SbCache.CACHE_TTL_MS * 2,
                    ttl: SbCache.CACHE_TTL_MS,
                }],
            ]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(undefined);
        });
    });
});
