import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';
import { UrlUtils } from '../../../../Extension/src/background/utils/url';
import { SafebrowsingApi } from '../../../../Extension/src/background/api/safebrowsing';
import { ADGUARD_SETTINGS_KEY, SB_LRU_CACHE_KEY } from '../../../../Extension/src/common/constants';
import { sbCache } from '../../../../Extension/src/background/storages';
import { SettingsApi } from '../../../../Extension/src/background/api';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import { SettingOption } from '../../../../Extension/src/background/schema';
import { mockLocalStorage } from '../../../helpers';

describe('safebrowsing', () => {
    let storage: Storage.StorageArea;

    beforeEach(() => {
        storage = mockLocalStorage();
    });

    it('Inits cache', async () => {
        const urlHash = 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669';
        const sbList = 'adguard-malware-shavar';

        await storage.set({
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: urlHash,
                    value: sbList,
                },
            ]),
        });

        await SafebrowsingApi.initCache();

        expect(browser.storage.local.get.calledOnceWith(SB_LRU_CACHE_KEY)).toBe(true);
        expect(sbCache.get(urlHash)).toBe(sbList);
    });

    it('Clears cache', async () => {
        const urlHash = 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669';
        const sbList = 'adguard-malware-shavar';

        await storage.set({
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: urlHash,
                    value: sbList,
                },
            ]),
        });

        await SafebrowsingApi.clearCache();

        expect(browser.storage.local.set.calledOnceWith({ [SB_LRU_CACHE_KEY]: JSON.stringify([]) })).toBe(true);
        expect(sbCache.get(urlHash)).toBe(undefined);
    });

    it('Adds url to safebrowsing trusted', async () => {
        const url = 'https://example.com';
        const expectedSbList = 'allowlist';

        await SafebrowsingApi.initCache();

        const host = UrlUtils.getHost(url)!;

        const hostHash = SafebrowsingApi.createHash(host);

        await SafebrowsingApi.addToSafebrowsingTrusted(url);

        expect(sbCache.get(hostHash)).toBe(expectedSbList);
    });

    it('Bypass safe domain', async () => {
        const url = 'https://example.com';

        await storage.set({
            [ADGUARD_SETTINGS_KEY]: {
                ...defaultSettings,
                [SettingOption.DisableSafebrowsing]: false,
            },
        });

        await SettingsApi.init();
        await SafebrowsingApi.initCache();

        const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

        expect(redirectUrl).toBe(undefined);
    });

    it('Block unsafe domain', async () => {
        const url = 'https://example.com';
        const sbList = 'adguard-malware-shavar';

        const expectedRedirectUrl = browser.runtime.getURL(
            'pages/safebrowsing.html'
            + '?malware=true'
            + '&host=example.com'
            + '&url=https%3A%2F%2Fexample.com'
            + '&ref=https%3A%2F%2Fexample.com',
        );

        const host = UrlUtils.getHost(url)!;

        const hostHash = SafebrowsingApi.createHash(host);

        await storage.set({
            [ADGUARD_SETTINGS_KEY]: {
                ...defaultSettings,
                [SettingOption.DisableSafebrowsing]: false,
            },
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: hostHash,
                    value: sbList,
                },
            ]),
        });

        await SettingsApi.init();
        await SafebrowsingApi.initCache();

        const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

        expect(redirectUrl).toBe(expectedRedirectUrl);
    });

    it('Bypass allowlisted domain', async () => {
        const url = 'https://example.com';
        const sbList = 'allowlist';

        const host = UrlUtils.getHost(url)!;

        const hostHash = SafebrowsingApi.createHash(host);

        await storage.set({
            [ADGUARD_SETTINGS_KEY]: {
                ...defaultSettings,
                [SettingOption.DisableSafebrowsing]: false,
            },
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: hostHash,
                    value: sbList,
                },
            ]),
        });

        await SettingsApi.init();
        await SafebrowsingApi.initCache();

        const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

        expect(redirectUrl).toBe(undefined);
    });
});
