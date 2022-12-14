import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';
import { DocumentBlockApi } from '../../../../Extension/src/background/api';
import { TRUSTED_DOCUMENTS_CACHE_KEY } from '../../../../Extension/src/common/constants';
import { mockLocalStorage } from '../../../helpers';

describe('document block api', () => {
    let storage: Storage.StorageArea;

    beforeEach(() => {
        storage = mockLocalStorage();
    });

    it('Inits trusted domains cache', async () => {
        await DocumentBlockApi.init();

        expect(browser.storage.local.get.calledOnceWith(TRUSTED_DOCUMENTS_CACHE_KEY)).toBe(true);
        expect(
            browser.storage.local.set.calledOnceWith({ [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([]) }),
        ).toBe(true);
    });

    it('Gets non-expired domains', async () => {
        const domain = 'example.com';

        await storage.set({
            [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([{
                domain,
                expires: Date.now() + 1000000,
            }]),
        });

        await DocumentBlockApi.init();

        expect(
            await DocumentBlockApi.getTrustedDomains(),
        ).toStrictEqual([domain]);
    });

    it('Deletes expired domains', async () => {
        const domain = 'example.com';

        await storage.set({
            [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([{
                domain,
                expires: Date.now(),
            }]),
        });

        await DocumentBlockApi.init();

        expect(
            await DocumentBlockApi.getTrustedDomains(),
        ).toStrictEqual([]);
    });

    it('Sets trusted domains', async () => {
        const url = 'https://example.com';

        await DocumentBlockApi.init();

        jest.spyOn(Date, 'now').mockImplementation(() => 0);

        await DocumentBlockApi.setTrustedDomain(url);

        expect(
            browser.storage.local.set.calledWith({
                [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([{
                    domain: 'example.com',
                    expires: DocumentBlockApi.TRUSTED_TTL_MS,
                }]),
            }),
        ).toBe(true);
    });
});
