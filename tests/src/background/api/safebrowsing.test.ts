import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';

import { UrlUtils } from '../../../../Extension/src/background/utils/url';
import { SafebrowsingApi } from '../../../../Extension/src/background/api/safebrowsing';
import { SB_LRU_CACHE_KEY } from '../../../../Extension/src/common/constants';
import { SbCache, sbCache } from '../../../../Extension/src/background/storages';
import { SettingsApi } from '../../../../Extension/src/background/api';
import { type SafebrowsingStorageData } from '../../../../Extension/src/background/schema';
import { mockLocalStorage } from '../../../helpers';

describe('Safebrowsing API', () => {
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
            const sbRecord = {
                list: 'adguard-malware-shavar',
                expires: Date.now() + SbCache.CACHE_TTL_MS,
            };

            await setCache([{
                key: urlHash,
                value: sbRecord,
            }]);

            await SafebrowsingApi.initCache();

            expect(browser.storage.local.get.calledOnceWith(SB_LRU_CACHE_KEY)).toBe(true);
            expect(sbCache.get(urlHash)).toEqual(sbRecord.list);
        });
    });

    describe('clearCache static method', () => {
        it('should clear cache', async () => {
            const urlHash = 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669';
            const sbRecord = {
                list: 'adguard-malware-shavar',
                expires: Date.now() + SbCache.CACHE_TTL_MS,
            };

            await setCache([{
                key: urlHash,
                value: sbRecord,
            }]);

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
            const sbRecord = {
                list: 'adguard-malware-shavar',
                expires: Date.now() + SbCache.CACHE_TTL_MS,
            };

            const expectedRedirectUrl = browser.runtime.getURL(
                'pages/safebrowsing.html'
            + '?malware=true'
            + '&host=example.com'
            + '&url=https%3A%2F%2Fexample.com'
            + '&ref=https%3A%2F%2Fexample.com',
            );

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([{
                key: hostHash,
                value: sbRecord,
            }]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(expectedRedirectUrl);
        });

        it('should bypass allowlisted domain', async () => {
            const url = 'https://example.com';
            const sbRecord = { list: SbCache.SB_ALLOW_LIST };

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([{
                key: hostHash,
                value: sbRecord,
            }]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(undefined);
        });

        it('should ignore expired domain', async () => {
            const url = 'https://example.com';
            const sbRecord = {
                list: 'adguard-malware-shavar',
                expires: Date.now(),
            };

            const host = UrlUtils.getHost(url)!;

            const hostHash = SafebrowsingApi.createHash(host);

            await setCache([{
                key: hostHash,
                value: sbRecord,
            }]);

            await SettingsApi.init();
            await SafebrowsingApi.initCache();

            const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

            expect(redirectUrl).toBe(undefined);
        });
    });
});
