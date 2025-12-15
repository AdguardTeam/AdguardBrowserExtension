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

import browser, { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type MockInstance,
    vi,
} from 'vitest';

import { getRuleSetId, getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { FiltersStorage as TsWebExtensionFiltersStorage } from '@adguard/tswebextension/filters-storage';
import { ConvertedFilterList } from '@adguard/tsurlfilter';

import { mockLocalStorage } from '../../../helpers';
import { FiltersStoragesAdapter } from '../../../../Extension/src/background/storages/filters-adapter';
import {
    FiltersStorage as BrowserExtensionFiltersStorage,
    hybridStorage,
} from '../../../../Extension/src/background/storages';

const rawFilter = [
    '! Title: Test filter',
    '! Description: Test filter',
    '! Expires: 4 days (update frequency)',
    'example.com##.ad',
].join('\n');

const filter = new ConvertedFilterList(rawFilter);

describe.skipIf(__IS_MV3__)('FiltersStoragesAdapter (MV2)', () => {
    let localStorage: Storage.StorageArea;

    beforeEach(() => {
        localStorage = mockLocalStorage();
    });

    afterEach(async () => {
        await localStorage.clear();
        await hybridStorage.clear();
    });

    it('set, get', async () => {
        await FiltersStoragesAdapter.set(1, filter);

        // Note: `get` method internally uses these methods:
        // - FiltersStorage.getRawFilterList
        // - FiltersStorage.getFilterList
        // - FiltersStorage.getConversionMap
        // - FiltersStorage.getSourceMap
        // So, we don't need to test them separately
        const filterFromStorage = await FiltersStoragesAdapter.get(1);

        expect(filterFromStorage).not.toBeUndefined();

        expect(filterFromStorage?.getContent()).toEqual(filter.getContent());
        expect(filterFromStorage?.getConversionData()).toEqual(filter.getConversionData());
    });

    it('has', async () => {
        await FiltersStoragesAdapter.set(1, filter);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeTruthy();
        await expect(FiltersStoragesAdapter.has(999)).resolves.toBeFalsy();
    });

    it('remove', async () => {
        await FiltersStoragesAdapter.set(1, filter);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeTruthy();
        await FiltersStoragesAdapter.remove(1);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeFalsy();

        // Nothing happens if we try to remove a non-existent filter
        await FiltersStoragesAdapter.remove(1);
    });
});

describe.skipIf(!__IS_MV3__)('FiltersStoragesAdapter (MV3)', () => {
    const staticFilterIds: ReadonlyArray<number> = [2, 3, 4];

    let localStorage: Storage.StorageArea;
    let getManifestSpy: MockInstance;
    let browserExtensionFiltersStorageSetSpy: MockInstance;
    let browserExtensionFiltersStorageRemoveSpy: MockInstance;
    let tsWebExtensionFiltersStorageHasSpy: MockInstance;

    beforeEach(() => {
        localStorage = mockLocalStorage();

        browserExtensionFiltersStorageSetSpy = vi.spyOn(BrowserExtensionFiltersStorage, 'set');
        browserExtensionFiltersStorageRemoveSpy = vi.spyOn(BrowserExtensionFiltersStorage, 'remove');

        tsWebExtensionFiltersStorageHasSpy = vi.spyOn(TsWebExtensionFiltersStorage, 'has');

        // Mock static filters
        getManifestSpy = vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
            ...browser.runtime.getManifest(),
            declarative_net_request: {
                rule_resources: staticFilterIds.map((id) => ({
                    id: getRuleSetId(id),
                    enabled: true,
                    path: getRuleSetPath(id),
                })),
            },
        });
    });

    afterEach(async () => {
        await localStorage.clear();
        await hybridStorage.clear();

        browserExtensionFiltersStorageSetSpy.mockRestore();
        browserExtensionFiltersStorageRemoveSpy.mockRestore();

        tsWebExtensionFiltersStorageHasSpy.mockRestore();

        getManifestSpy.mockRestore();
    });

    it('staticFilterIds should be set correctly', async () => {
        // Trigger retrieval of static filters
        await FiltersStoragesAdapter.set(1, filter);

        const staticFilterIdsDescriptor = Object.getOwnPropertyDescriptor(FiltersStoragesAdapter, 'staticFilterIds');
        const staticFilterIds = staticFilterIdsDescriptor?.value;

        expect(staticFilterIds).toBeInstanceOf(Set);
        expect(staticFilterIds).toEqual(new Set(staticFilterIds));
    });

    it('set, get', async () => {
        await FiltersStoragesAdapter.set(1, filter);

        // Note: `get` method internally uses these methods:
        // - FiltersStorage.getRawFilterList
        // - FiltersStorage.getFilterList
        // - FiltersStorage.getConversionMap
        // - FiltersStorage.getSourceMap
        // So, we don't need to test them separately
        const filterFromStorage = await FiltersStoragesAdapter.get(1);

        expect(filterFromStorage).not.toBeUndefined();

        expect(filterFromStorage?.getContent()).toEqual(filter.getContent());
        expect(filterFromStorage?.getConversionData()).toEqual(filter.getConversionData());
    });

    it('set should not save static filters', async () => {
        await FiltersStoragesAdapter.set(2, filter);

        expect(browserExtensionFiltersStorageSetSpy).not.toHaveBeenCalled();
    });

    it('has', async () => {
        await FiltersStoragesAdapter.set(1, filter);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeTruthy();
        await expect(FiltersStoragesAdapter.has(999)).resolves.toBeFalsy();
    });

    it('has works for static filters', async () => {
        // We just need to check that the method was called with the correct argument
        await FiltersStoragesAdapter.has(2);

        expect(tsWebExtensionFiltersStorageHasSpy).toHaveBeenCalledWith(2);
    });

    it('remove', async () => {
        await FiltersStoragesAdapter.set(1, filter);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeTruthy();
        await FiltersStoragesAdapter.remove(1);
        await expect(FiltersStoragesAdapter.has(1)).resolves.toBeFalsy();

        // Nothing happens if we try to remove a non-existent filter
        await FiltersStoragesAdapter.remove(1);
    });

    it('remove should not remove static filters', async () => {
        await FiltersStoragesAdapter.remove(2);

        expect(browserExtensionFiltersStorageRemoveSpy).not.toHaveBeenCalled();
    });
});
