import browser from 'sinon-chrome';
import { UrlUtils } from '../../../../../Extension/src/background/utils/url';
import { SafebrowsingApi } from '../../../../../Extension/src/background/api/safebrowsing';
import { SB_LRU_CACHE_KEY } from '../../../../../Extension/src/common/constants';
import { sbCache } from '../../../../../Extension/src/background/storages';
import { SettingsApi } from '../../../../../Extension/src/background/api';

describe('safebrowsing', () => {
    it('Inits cache', async () => {
        browser.storage.local.get.returns({
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669',
                    value: 'adguard-malware-shavar',
                },
            ]),
        });

        await SafebrowsingApi.initCache();

        expect(browser.storage.local.get.calledOnceWith(SB_LRU_CACHE_KEY)).toBe(true);
        expect(
            sbCache.get('CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669'),
        ).toBe('adguard-malware-shavar');
    });

    it('Clears cache', async () => {
        browser.storage.local.get.returns({
            [SB_LRU_CACHE_KEY]: JSON.stringify([
                {
                    key: 'CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669',
                    value: 'adguard-malware-shavar',
                },
            ]),
        });

        await SafebrowsingApi.initCache();

        await SafebrowsingApi.clearCache();

        expect(browser.storage.local.clear.calledOnce).toBe(true);
        expect(sbCache.get('CBD6FBF8EB019EBF5865D2A9120D27AC9FC44323A07AED8879E6CD9D28276669')).toBe(undefined);
    });

    it('Adds url to safebrowsing trusted', async () => {
        await SafebrowsingApi.initCache();

        const url = 'https://example.com';

        const host = UrlUtils.getHost(url)!;

        const hostHash = SafebrowsingApi.createHash(host);

        await SafebrowsingApi.addToSafebrowsingTrusted(url);

        expect(sbCache.get(hostHash)).toBe('allowlist');
    });

    it('Bypass safe url', async () => {
        await SettingsApi.init();
        await SafebrowsingApi.initCache();

        const url = 'https://example.com';

        const redirectUrl = await SafebrowsingApi.checkSafebrowsingFilter(url, url);

        expect(redirectUrl).toBe(undefined);
    });
});
