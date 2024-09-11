import { Storage } from 'webextension-polyfill';

import { FiltersDownloader } from '@adguard/filters-downloader/browser';

import { App } from 'app';

import { fakeFilterV1 } from '../../../../helpers/fixtures/fake_filter_v1';
import { QuickFixesRulesApi } from '../../../../../Extension/src/background/api';
import { FiltersStorage } from '../../../../../Extension/src/background/storages/filters';
import { RawFiltersStorage } from '../../../../../Extension/src/background/storages/raw-filters';
import { i18nMetadataStorage, metadataStorage } from '../../../../../Extension/src/background/storages';
import { server } from '../../../../../testSetup';
import { getMetadataFixture } from '../../../../helpers/fixtures/getMetadataFixture';
import { getI18nMetadataFixture } from '../../../../helpers/fixtures/getI18nMetadataFixture';
import { REMOTE_I18N_METADATA_FILE_NAME, REMOTE_METADATA_FILE_NAME } from '../../../../../constants';
import { mockLocalStorage } from '../../../../helpers/mocks/storage';
import { getStorageFixturesV7 } from '../../../../helpers/fixtures/getStorageFixtures';
import { type Metadata, type I18nMetadata } from '../../../../../Extension/src/background/schema';

jest.mock('../../../../../Extension/src/background/engine');

describe('Quick Fixes API should', () => {
    let storage: Storage.StorageArea;

    const definedExpressions = {
        'adguard': true,
        'adguard_ext_chromium': true,
        'adguard_ext_edge': false,
        'adguard_ext_firefox': false,
        'adguard_ext_opera': false,
        'adguard_ext_safari': false,
    };

    const incrementPatchVersion = (version: string): string => {
        const updatedVersion = version
            .split('.')
            .map(Number);

        const patchVersion = updatedVersion[updatedVersion.length - 1];
        if (patchVersion !== undefined) {
            updatedVersion[updatedVersion.length - 1]! = patchVersion + 1;
        }

        return updatedVersion.join('.');
    };

    beforeEach(async () => {
        storage = mockLocalStorage(getStorageFixturesV7(0)[0]);
        await App.init();
    });

    afterEach(async () => {
        await storage.clear();
    });

    const updatedTime = new Date().toISOString();

    const updateMetadataOnRemote = () => {
        // Update metadata on "remote".
        const updatedMetadataFixture = getMetadataFixture();
        const updatedI18nMetadataFixture = getI18nMetadataFixture();

        // Update version for each filter.
        updatedMetadataFixture.filters.forEach((filter) => {
            filter.version = incrementPatchVersion(filter.version);
            filter.timeUpdated = updatedTime;
        });

        // Update i18n metadata description for each filter.
        Object.keys(updatedI18nMetadataFixture.filters)
            .map(Number)
            .forEach((filterIdAsKey: number) => {
                const filter = updatedI18nMetadataFixture.filters[filterIdAsKey];
                if (!filter?.['en']) {
                    return;
                }

                filter['en'].description += 'updated';
            });

        server.respondWith('GET', new RegExp(`/${REMOTE_METADATA_FILE_NAME}`), [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(updatedMetadataFixture),
        ]);

        server.respondWith('GET', new RegExp(`/${REMOTE_I18N_METADATA_FILE_NAME}`), [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(updatedI18nMetadataFixture),
        ]);
    };

    it('check for updates of Quick Fixes filter from remote and partially update metadata', async () => {
        if (!__IS_MV3__) {
            expect(true).toBeTruthy();
            return;
        }

        const filterId = 24;

        jest.spyOn(FiltersDownloader, 'downloadWithRaw')
            .mockImplementation(() => Promise.resolve({
                filter: fakeFilterV1.split('\n'),
                rawFilter: fakeFilterV1,
            }));

        // Read metadata from local storage.
        const metadata: Metadata = JSON.parse(JSON.stringify(metadataStorage.getData()));
        const i18nMetadata: I18nMetadata = JSON.parse(JSON.stringify(i18nMetadataStorage.getData()));

        // Simulate that metadata was updated on remote.
        updateMetadataOnRemote();

        // Update Quick Fixes filter with it's metadata.
        await QuickFixesRulesApi.updateQuickFixesFilter();

        // Check that filter has been updated.
        expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
            1,
            `https://filters.adtidy.org/extension/chromium-mv3/filters/${filterId}.txt`,
            {
                force: true,
                definedExpressions,
                validateChecksum: true,
                validateChecksumStrict: true,
            },
        );
        expect(await FiltersStorage.getRawPreprocessedFilterList(filterId)).toEqual(fakeFilterV1);
        expect(await RawFiltersStorage.get(filterId)).toEqual(fakeFilterV1);

        // Check that metadata was changed only for the Quick Fixes filter.
        const filterMetatada = metadata.filters.find((f) => f.filterId === filterId)!;
        filterMetatada.description += 'updated';
        filterMetatada.timeUpdated = updatedTime;
        filterMetatada.version = incrementPatchVersion(filterMetatada.version);
        i18nMetadata.filters[filterId]!['en']!.description += 'updated';

        expect(i18nMetadataStorage.getData()).toStrictEqual(i18nMetadata);
        expect(metadataStorage.getData()).toStrictEqual(metadata);
    });
});
