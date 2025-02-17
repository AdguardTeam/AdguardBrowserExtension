import browser, { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    MockInstance,
    vi,
} from 'vitest';

import { getRuleSetId, getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { FiltersStorage as TsWebExtensionFiltersStorage } from '@adguard/tswebextension/filters-storage';

import { FilterListPreprocessor } from 'tswebextension';

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

const filter = FilterListPreprocessor.preprocess(rawFilter);

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

        // Note: Under `filterList` key we have an Uint8Array, so we need to convert it before comparing
        expect({
            ...filterFromStorage,
            filterList: filterFromStorage!.filterList.map(Buffer.from),
        }).toEqual({
            ...filter,
            filterList: filter.filterList.map(Buffer.from),
        });
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

        // Note: Under `filterList` key we have an Uint8Array, so we need to convert it before comparing
        expect({
            ...filterFromStorage,
            filterList: filterFromStorage!.filterList.map(Buffer.from),
        }).toEqual({
            ...filter,
            filterList: filter.filterList.map(Buffer.from),
        });
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
