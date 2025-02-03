import { test } from 'vitest';
// TODO: uncomment this when quick fixes filter will be supported for MV3

// TODO: remove later
// empty test
test('', () => { });

// import { Storage } from 'webextension-polyfill';

// import { FiltersDownloader } from '@adguard/filters-downloader/browser';

// import { App } from 'app';

// import { fakeFilterV1 } from '../../../../helpers/fixtures/fake_filter_v1';
// // import { QuickFixesRulesApi } from '../../../../../Extension/src/background/api';
// import { FiltersStorage } from '../../../../../Extension/src/background/storages/filters';
// import { RawFiltersStorage } from '../../../../../Extension/src/background/storages/raw-filters';
// import { metadataStorage } from '../../../../../Extension/src/background/storages';
// import { mockLocalStorage } from '../../../../helpers/mocks/storage';
// import { getStorageFixturesV7 } from '../../../../helpers/fixtures/getStorageFixtures';
// import { type Metadata } from '../../../../../Extension/src/background/schema';
// import { fakeFilterV2 } from '../../../../helpers/fixtures/fake_filter_v2';

// vi.mock('../../../../../Extension/src/background/engine');
// vi.mock('../../../../../Extension/src/background/api/ui/icons');
// vi.mock('../../../../../Extension/src/background/storages/notification');

// describe('Quick Fixes API should', () => {
//     let storage: Storage.StorageArea;

//     const definedExpressions = {
//         'adguard': true,
//         'adguard_ext_chromium': true,
//         'adguard_ext_edge': false,
//         'adguard_ext_firefox': false,
//         'adguard_ext_opera': false,
//         'adguard_ext_safari': false,
//     };

//     beforeEach(async () => {
//         storage = mockLocalStorage(getStorageFixturesV7(0)[0]);
//         await App.init();
//     });

//     afterEach(async () => {
//         await storage.clear();
//     });

//     const updatedTimeWithHourOffset = new Date().toISOString()
//         .slice(0, -5)
//         .concat('+00:00');

//     it('check for updates of Quick Fixes filter from remote and partially update metadata', async () => {
//         if (!__IS_MV3__) {
//             expect(true).toBeTruthy();
//             return;
//         }

//         const filterId = 24;

//         let mock = jest.spyOn(FiltersDownloader, 'downloadWithRaw')
//             .mockImplementation(() => Promise.resolve({
//                 filter: fakeFilterV1.split('\n'),
//                 rawFilter: fakeFilterV1,
//             }));

//         // Read metadata from local storage.
//         const metadata: Metadata = JSON.parse(JSON.stringify(metadataStorage.getData()));

//         // FIXME fix tests
//         // First load and enable Quick Fixes.
//         // await QuickFixesRulesApi.loadAndEnableQuickFixesRules();

//         // Check that filter has been updated.
//         expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
//             1,
//             `https://filters.adtidy.org/extension/chromium-mv3/filters/${filterId}.txt`,
//             {
//                 force: true,
//                 definedExpressions,
//                 validateChecksum: true,
//                 validateChecksumStrict: true,
//             },
//         );
//         expect(await FiltersStorage.getPreprocessedFilterList(filterId)).toEqual(fakeFilterV1);
//         expect(await RawFiltersStorage.get(filterId)).toEqual(fakeFilterV1);

//         // Check that metadata was changed only for the Quick Fixes filter.
//         const filterMetatada = metadata.filters.find((f) => f.filterId === filterId)!;
//         Object.assign(filterMetatada, {
//             // Values from fake filter metadata.
//             diffPath: '',
//             expires: 345600,
//             homepage: '',
//             timeUpdated: '2023-02-01T00:00:00+00:00',
//             version: '1.0.0.0',
//         });
//         expect(metadataStorage.getData()).toStrictEqual(metadata);

//         // Update mocked filter.
//         mock.mockRestore();
//         mock = jest.spyOn(FiltersDownloader, 'downloadWithRaw')
//             .mockImplementation(() => Promise.resolve({
//                 filter: fakeFilterV2.split('\n'),
//                 rawFilter: fakeFilterV2,
//             }));

//         // Update Quick Fixes filter.
//         // await QuickFixesRulesApi.updateQuickFixesFilter();

//         // Check that filter has been updated.
//         expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
//             1,
//             `https://filters.adtidy.org/extension/chromium-mv3/filters/${filterId}.txt`,
//             {
//                 force: true,
//                 definedExpressions,
//                 validateChecksum: true,
//                 validateChecksumStrict: true,
//             },
//         );
//         expect(await FiltersStorage.getPreprocessedFilterList(filterId)).toEqual(fakeFilterV2);
//         expect(await RawFiltersStorage.get(filterId)).toEqual(fakeFilterV2);

//         // Check that metadata was changed only for the Quick Fixes filter.
//         Object.assign(filterMetatada, {
//             timeUpdated: updatedTimeWithHourOffset,
//             version: '2.0.0.0',
//         });

//         expect(metadataStorage.getData()).toStrictEqual(metadata);

//         mock.mockRestore();
//     });
// });
