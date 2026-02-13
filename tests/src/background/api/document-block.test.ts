/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import browser from 'sinon-chrome';
import { type Storage } from 'webextension-polyfill';
import {
    describe,
    it,
    vi,
    expect,
    beforeEach,
} from 'vitest';

import { DocumentBlockApi } from '../../../../Extension/src/background/api/document-block';
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

        vi.spyOn(Date, 'now').mockImplementation(() => 0);

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

    it('Resets trusted domains', async () => {
        const url = 'https://example.org/test';

        await DocumentBlockApi.init();

        vi.spyOn(Date, 'now').mockImplementation(() => 0);

        await DocumentBlockApi.setTrustedDomain(url);

        expect(
            browser.storage.local.set.calledWith({
                [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([{
                    domain: 'example.org',
                    expires: DocumentBlockApi.TRUSTED_TTL_MS,
                }]),
            }),
        ).toBe(true);

        await DocumentBlockApi.reset();

        expect(
            browser.storage.local.set.calledWith({
                [TRUSTED_DOCUMENTS_CACHE_KEY]: JSON.stringify([]),
            }),
        ).toBe(true);
    });
});
