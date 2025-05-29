import { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import escapeStringRegexp from 'escape-string-regexp';

import { FiltersDownloader } from '@adguard/filters-downloader/browser';

import {
    Categories,
    FiltersApi,
    FilterUpdateApi,
    SettingsApi,
} from '../../../../../Extension/src/background/api';
import { App } from '../../../../../Extension/src/background/app';
import {
    FiltersStorage,
    filterVersionStorage,
    RawFiltersStorage,
} from '../../../../../Extension/src/background/storages';
import { fakeFilterV2 } from '../../../../helpers/fixtures/fake_filter_v2';
import { fakeFilterV1 } from '../../../../helpers/fixtures/fake_filter_v1';
import { getMetadataFixture } from '../../../../helpers/fixtures';
import { mockLocalStorage } from '../../../../helpers';
import {
    AntibannerGroupsId,
    APP_VERSION_KEY,
    CLIENT_ID_KEY,
} from '../../../../../Extension/src/common/constants';
import { SettingOption } from '../../../../../Extension/src/background/schema';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { fakeFilterWithVersion } from '../../../../helpers/fixtures/fake-filter-with-version';
import { fakeFilterV4WithDiffPath } from '../../../../helpers/fixtures/fake_filter_v4_with_diff_path';
import {
    fakeFilterWithInclude,
    includedFakeFilter,
    includedFakeFilterName,
} from '../../../../helpers/fixtures/fake-filter-with-include';

vi.mock('../../../../../Extension/src/background/engine');
vi.mock('../../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../../Extension/src/background/storages/notification');

declare global {
    let sinonFakeServer: sinon.SinonFakeServer;
}

// We do not support filter updates in MV3 yet.
describe.skipIf(__IS_MV3__)('Filter Update API should', () => {
    const metadata = getMetadataFixture();

    const fakeFilter999 = {
        description: 'Fake filter',
        displayNumber: 999,
        expires: 345600000,
        filterId: 999,
        groupId: 1,
        homepage: '',
        languages: [],
        name: '',
        subscriptionUrl: '',
        tags: [],
        timeAdded: '2014-06-30T07:56:55+0000',
        timeUpdated: '2023-02-01T00:00:00+00:00',
        version: '1.0.0.0',
    };

    // TODO: Maybe create mock metadata for this test and not modify
    // existing mock
    // Add fake filters to local metadata
    const newFilterIdx = metadata.filters.push(fakeFilter999);
    const filterId3Index = metadata.filters.findIndex((f) => f.filterId === 3);
    metadata.filters[filterId3Index]!.version = '1.0.0.0';
    // Fake local metadata
    sinonFakeServer.respondWith('GET', /\/filters.js(on)?/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(metadata),
    ]);

    // Add filter meta to remote mock
    const remoteMetadata = JSON.parse(JSON.stringify(metadata));
    remoteMetadata.filters[newFilterIdx - 1]!.version = '2.0.0.0';
    remoteMetadata.filters[filterId3Index]!.version = '2.0.0.0';
    // Fake remote metadata
    sinonFakeServer.respondWith('GET', /filters\.adtidy\.org.*\/filters.js(on)?/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(remoteMetadata),
    ]);

    const returnMetadataWithVersion = (id: number, version: string, fake?: any) => {
        const metadata = getMetadataFixture();
        // Add filter meta to remote mock
        const remoteMetadata = JSON.parse(JSON.stringify(metadata));
        // @ts-ignore
        let filter = remoteMetadata.filters.find((f) => f.filterId === id);
        if (!filter) {
            filter = fake;
            remoteMetadata.filters.push(filter);
        }
        filter.version = version;

        // Fake remote metadata
        sinonFakeServer.respondWith('GET', /filters\.adtidy\.org.*\/filters.js(on)?/, [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(remoteMetadata),
        ]);
    };

    let storage: Storage.StorageArea;

    // Groups test with real timers
    describe('tests with real timers', () => {
        const nativeDateNow = Date.now;

        beforeEach(async () => {
            storage = mockLocalStorage({
                [APP_VERSION_KEY]: '5.2.0.0',
            });
            await App.init();
        });

        afterEach(async () => {
            await storage.clear();
            Date.now = nativeDateNow;
        });

        it('check for updates after load filter from local resources', async () => {
            const filterId = 999;

            const v2 = '2.0.0.0';

            sinonFakeServer.respondWith('GET', /\/filters\/999\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterWithVersion(v2),
            ]);

            // Remote true because filter 999 is not in local metadata and method
            // will skip loading it.
            await FiltersApi.loadAndEnableFilters([filterId], true);

            let filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual(v2);

            // If run the check - the filter should not update, because the timeout
            // has not expired.
            let updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
            filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('2.0.0.0');
            expect(updatedFilters.length).toBe(0);

            // Use FilterUpdateApi.RECENTLY_CHECKED_FILTER_TIMEOUT_MS
            const forwardTime = Date.now() + 1000 * 60 * 5 + 1;
            // Move time forward to check expire
            // Note: can't use `jest.useFakeTimers().setSystemTime(forwardTime)`
            // because it that case implementation of fetch will not resolve promise
            // with zero setTimeout and execution will freeze.
            Date.now = vi.fn(() => forwardTime);

            const v3 = '3.0.0.0';
            returnMetadataWithVersion(filterId, v3, fakeFilter999);
            sinonFakeServer.respondWith('GET', /\/filters\/999\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterWithVersion(v3),
            ]);

            updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
            filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual(v3);
            expect(updatedFilters.length).toBe(1);
        });

        it('download latest filter from remote resources', async () => {
            const filterId = 999;

            sinonFakeServer.respondWith('GET', /\/filters\/999\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterV2,
            ]);

            // Remote true because filter 999 is not in local metadata and method
            // will skip loading it.
            await FiltersApi.loadAndEnableFilters([filterId], true);

            const filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('2.0.0.0');
        });

        it('load filter from local resources after enable group with recommended filters', async () => {
            const groupId = AntibannerGroupsId.PrivacyFiltersGroupId;
            const recommendedPrivacyFilterId = 3;

            sinonFakeServer.respondWith('GET', /\/filter_3\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterV1,
            ]);

            const recommendedFiltersIds = Categories.getRecommendedFilterIdsByGroupId(groupId);
            await Categories.enableGroup(groupId, true, recommendedFiltersIds);

            const filterVersion = filterVersionStorage.get(recommendedPrivacyFilterId);
            expect(filterVersion?.version).toStrictEqual('1.0.0.0');
        });
    });

    it('update filters after 60 minutes delay', async () => {
        vi.useFakeTimers({
            // Note: We need to enable this option because our IndexedDB mock (fake-indexeddb)
            // uses `setTimeout` internally with a 0ms delay.
            // Enabling `shouldAdvanceTime` ensures that these timers run automatically, preventing
            // potential deadlocks in tests. The ±20ms time advancement is negligible for our use case.
            shouldAdvanceTime: true,
        });

        await App.init();

        const filterId = 999;
        const filterExpirationTimeOneHourMs = 1000 * 60 * 60;
        const oneMinuteMs = 1000 * 60;

        sinonFakeServer.respondWith('GET', /\/filters\/999\.txt/, [
            200,
            { 'Content-Type': 'text/plain' },
            fakeFilterV2,
        ]);

        await FiltersApi.loadAndEnableFilters([filterId], true);

        let filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual('2.0.0.0');

        // If run the check - the filter should not update, because the timeout
        // for recently checked filters has not expired.
        const updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
        filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual('2.0.0.0');
        expect(updatedFilters.length).toBe(0);

        // Wait for first check after filter expired = 1 hour filter ttl
        // + 100 ms for run checker + some time for check itself.
        // Note: important to use async version of advanceTimersByTimeAsync,
        // because it waits for all promises to resolve.
        await vi.advanceTimersByTime(filterExpirationTimeOneHourMs + oneMinuteMs);
        filterVersion = filterVersionStorage.get(filterId);
        // Filter version still the same because filter didn't expired
        expect(filterVersion?.version).toStrictEqual('2.0.0.0');

        const v3 = '3.0.0.0';
        returnMetadataWithVersion(filterId, v3, fakeFilter999);
        sinonFakeServer.respondWith('GET', /\/filters\/999\.txt/, [
            200,
            { 'Content-Type': 'text/plain' },
            fakeFilterWithVersion(v3),
        ]);
        // Set period update to 100ms
        await SettingsApi.setSetting(SettingOption.FiltersUpdatePeriod, 100);
        // Wait for first check after filter expired = 1 hour filter ttl
        // + 100 ms for run checker + some time for check itself.
        // Note: important to use async version of advanceTimersByTimeAsync,
        // because it waits for all promises to resolve.
        await vi.advanceTimersByTimeAsync(filterExpirationTimeOneHourMs + oneMinuteMs);
        filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual(v3);

        vi.useRealTimers();
    });

    describe('autoUpdateFilters', () => {
        const definedExpressions = {
            'adguard': true,
            'adguard_ext_chromium': true,
            'adguard_ext_edge': false,
            'adguard_ext_firefox': false,
            'adguard_ext_opera': false,
            'adguard_ext_safari': false,
        };

        beforeEach(async () => {
            storage = mockLocalStorage({
                [APP_VERSION_KEY]: '5.2.0.0',
                [CLIENT_ID_KEY]: 'id',
            });
            await App.init();

            vi.spyOn(FiltersDownloader, 'downloadWithRaw')
                .mockImplementation(() => Promise.resolve({
                    filter: fakeFilterV1.split('\n'),
                    rawFilter: fakeFilterV1,
                }));
        });

        afterEach(async () => {
            await storage.clear();
            vi.clearAllMocks();
            vi.restoreAllMocks();
        });

        it('calls downloadWithRaw', async () => {
            const filterId = 1;

            vi.spyOn(FiltersDownloader, 'downloadWithRaw')
                .mockImplementation(() => Promise.resolve({
                    filter: fakeFilterV1.split('\n'),
                    rawFilter: fakeFilterV1,
                }));

            await FiltersApi.loadAndEnableFilters([filterId]);
            await Categories.enableGroup(7, true);
            // after load and enable it downloads filters embedded into the extension
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                1,
                'chrome-extension://test/filters/filter_1.txt',
                {
                    force: true,
                    definedExpressions,
                    // Local filters loaded without checking checksum, because
                    // we store preprocessed filters and filter checksum can be
                    // changed.
                    validateChecksum: false,
                    validateChecksumStrict: true,
                },
            );

            returnMetadataWithVersion(filterId, '3.0.0.0');

            await FilterUpdateApi.autoUpdateFilters(true);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                2,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    force: true,
                    definedExpressions,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );
            expect(await FiltersStoragesAdapter.getRawFilterList(1)).toEqual(fakeFilterV1);
            expect(await RawFiltersStorage.get(1)).toEqual(fakeFilterV1);

            returnMetadataWithVersion(filterId, '4.0.0.0');
            const filterVersionData = filterVersionStorage.getData();
            filterVersionData[1]!.lastCheckTime = 0;

            // return filter with diff path
            vi.spyOn(FiltersDownloader, 'downloadWithRaw')
                .mockImplementation(() => Promise.resolve({
                    filter: fakeFilterV4WithDiffPath.split('\n'),
                    rawFilter: fakeFilterV4WithDiffPath,
                }));

            await FilterUpdateApi.autoUpdateFilters(false);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                // note: vi.spyOn resets call count
                1,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    force: true,
                    definedExpressions,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );
            expect(await FiltersStoragesAdapter.getRawFilterList(1)).toEqual(fakeFilterV4WithDiffPath);
            expect(await RawFiltersStorage.get(1)).toEqual(fakeFilterV4WithDiffPath);

            await FilterUpdateApi.autoUpdateFilters(false);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                2,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    definedExpressions,
                    rawFilter: fakeFilterV4WithDiffPath,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );
            expect(await FiltersStoragesAdapter.getRawFilterList(1)).toEqual(fakeFilterV4WithDiffPath);
            expect(await RawFiltersStorage.get(1)).toEqual(fakeFilterV4WithDiffPath);
        });

        it('Filters with diff path get full (force) update on expiring', async () => {
            const filterId = 1;

            vi.spyOn(FiltersDownloader, 'downloadWithRaw')
                .mockImplementation(() => Promise.resolve({
                    filter: fakeFilterV4WithDiffPath.split('\n'),
                    rawFilter: fakeFilterV4WithDiffPath,
                }));

            // Trigger full (force) filter update on filter load
            await FiltersApi.loadAndEnableFilters([filterId]);
            await Categories.enableGroup(7, true);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                1,
                'chrome-extension://test/filters/filter_1.txt',
                {
                    definedExpressions,
                    force: true,
                    // Local filters loaded without checking checksum, because
                    // we store preprocessed filters and filter checksum can be
                    // changed.
                    validateChecksum: false,
                    validateChecksumStrict: true,
                },
            );
            expect(await FiltersStoragesAdapter.getRawFilterList(1)).toEqual(fakeFilterV4WithDiffPath);
            expect(await RawFiltersStorage.get(1)).toEqual(fakeFilterV4WithDiffPath);

            // Auto update filter to get a diff patch
            await FilterUpdateApi.autoUpdateFilters(false);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                2,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    rawFilter: fakeFilterV4WithDiffPath,
                    definedExpressions,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );

            // Expire and update filter to get full (forced) update again
            await SettingsApi.setSetting(SettingOption.FiltersUpdatePeriod, 350);
            let filterVersionData = filterVersionStorage.getData();
            filterVersionData[1]!.lastCheckTime = 0;
            filterVersionData[1]!.lastScheduledCheckTime = 0;

            await FilterUpdateApi.autoUpdateFilters(false);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                3,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    force: true,
                    definedExpressions,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );

            // Force update must set new lastCheckTime to current time
            filterVersionData = filterVersionStorage.getData();

            let lastCheckTime = filterVersionData[1]!.lastCheckTime;
            let lastScheduledCheckTime = filterVersionData[1]!.lastScheduledCheckTime;
            expect(lastCheckTime > lastScheduledCheckTime).toBeTruthy();

            // Next auto update brings diff patch again
            await FilterUpdateApi.autoUpdateFilters(false);
            expect(FiltersDownloader.downloadWithRaw).nthCalledWith(
                4,
                'https://filters.adtidy.org/extension/chromium/filters/1.txt',
                {
                    definedExpressions,
                    rawFilter: fakeFilterV4WithDiffPath,
                    validateChecksum: true,
                    validateChecksumStrict: true,
                },
            );

            // Auto update must set new lastScheduledCheckTime to current time
            filterVersionData = filterVersionStorage.getData();

            lastCheckTime = filterVersionData[1]!.lastCheckTime;
            lastScheduledCheckTime = filterVersionData[1]!.lastScheduledCheckTime;
            expect(lastScheduledCheckTime).toBeGreaterThanOrEqual(lastCheckTime);
        });
    });

    describe('Should handle included content correctly', () => {
        const filterId = 999;

        beforeEach(async () => {
            storage = mockLocalStorage({
                [APP_VERSION_KEY]: '5.2.0.0',
                [CLIENT_ID_KEY]: 'id',
            });

            sinonFakeServer.respondWith('GET', new RegExp(`${escapeStringRegexp(`/filters/${filterId}.txt`)}`), [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterWithInclude,
            ]);

            sinonFakeServer.respondWith('GET', new RegExp(`${escapeStringRegexp('/included-fake-filter.txt')}`), [
                200,
                { 'Content-Type': 'text/plain' },
                includedFakeFilter,
            ]);

            returnMetadataWithVersion(filterId, '1.0.0.0', fakeFilter999);

            await App.init();
        });

        afterEach(async () => {
            await storage.clear();

            vi.clearAllMocks();
            vi.restoreAllMocks();
        });

        it('should update filter with include', async () => {
            await FiltersApi.loadAndEnableFilters([filterId], true);

            const rawFilterFromStorage = await FiltersStorage.getRawFilterList(filterId);

            // Raw filter from storage should contain included content,
            // and not the `!#include` directive.
            expect(rawFilterFromStorage).toEqual(
                fakeFilterWithInclude.replace(`!#include ./${includedFakeFilterName}`, includedFakeFilter),
            );
        });
    });
});
