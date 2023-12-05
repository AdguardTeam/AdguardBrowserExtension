import { Storage } from 'webextension-polyfill';
// Fake timers from jest didn't work with fetch polyfill wrapper around xhr
// (because of setTimeout before send response).
// See https://github.com/mswjs/msw/issues/448
import FakeTimers from '@sinonjs/fake-timers';

import {
    Categories,
    FiltersApi,
    FilterUpdateApi,
    SettingsApi,
} from '../../../../../Extension/src/background/api';
import { App } from '../../../../../Extension/src/background/app';
import { filterVersionStorage } from '../../../../../Extension/src/background/storages';
import { server } from '../../../../../testSetup';
import { fakeFilterV2 } from '../../../../helpers/fixtures/fake_filter_v2';
import { fakeFilterV1 } from '../../../../helpers/fixtures/fake_filter_v1';
import { getMetadataFixture } from '../../../../helpers/fixtures';
import { mockLocalStorage } from '../../../../helpers';
import { AntibannerGroupsId, APP_VERSION_KEY } from '../../../../../Extension/src/common/constants';
import { SettingOption } from '../../../../../Extension/src/background/schema';

jest.mock('../../../../../Extension/src/background/engine');

describe('Filter Update API should', () => {
    const metadata = getMetadataFixture();

    // TODO: Maybe create mock metadata for this test and not modify
    // existing mock
    // Add fake filters to local metadata
    const newFilterIdx = metadata.filters.push({
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
    });
    const filterId3Index = metadata.filters.findIndex(f => f.filterId === 3);
    metadata.filters[filterId3Index]!.version = '1.0.0.0';
    // Fake local metadata
    server.respondWith('GET', /\/filters.js(on)?/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(metadata),
    ]);

    // Add filter meta to remote mock
    const remoteMetadata = JSON.parse(JSON.stringify(metadata));
    remoteMetadata.filters[newFilterIdx - 1]!.version = '2.0.0.0';
    remoteMetadata.filters[filterId3Index]!.version = '2.0.0.0';
    // Fake remote metadata
    server.respondWith('GET', /filters\.adtidy\.org.*\/filters.js(on)?/, [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(remoteMetadata),
    ]);

    let storage: Storage.StorageArea;

    // Groups test with real timers
    describe('', () => {
        beforeEach(async () => {
            storage = mockLocalStorage({
                [APP_VERSION_KEY]: '4.2.0.0',
            });
            await App.init();
        });

        afterEach(() => {
            storage.clear();
        });

        it('check for updates after load filter from local resources', async () => {
            const filterId = 999;

            server.respondWith('GET', /\/filters\/999\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterV2,
            ]);

            await FiltersApi.loadAndEnableFilters([filterId]);

            let filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('1.0.0.0');

            // If run the check - the filter should not update, because the timeout
            // has not expired.
            let updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
            filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('1.0.0.0');
            expect(updatedFilters.length).toBe(0);

            // Use FilterUpdateApi.RECENTLY_CHECKED_FILTER_TIMEOUT_MS
            const forwardTime = Date.now() + 1000 * 60 * 5 + 1;
            // Move time forward to check expire
            // Note: can't use `jest.useFakeTimers().setSystemTime(forwardTime)`
            // because it that case implementation of fetch will not resolve promise
            // with zero setTimeout and execution will freeze.
            Date.now = jest.fn(() => forwardTime);

            updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
            filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('2.0.0.0');
            expect(updatedFilters.length).toBe(1);
        });

        it('download latest filter from remote resources', async () => {
            const filterId = 999;

            server.respondWith('GET', /\/filters\/999\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterV2,
            ]);

            await FiltersApi.loadAndEnableFilters([filterId], true);

            const filterVersion = filterVersionStorage.get(filterId);
            expect(filterVersion?.version).toStrictEqual('2.0.0.0');
        });

        it('load filter from local resources after enable group with recommended filters', async () => {
            const groupId = AntibannerGroupsId.PrivacyFilterGroupId;
            const recommendedPrivacyFilterId = 3;

            server.respondWith('GET', /\/filter_3\.txt/, [
                200,
                { 'Content-Type': 'text/plain' },
                fakeFilterV1,
            ]);

            await Categories.enableGroup(groupId);

            const filterVersion = filterVersionStorage.get(recommendedPrivacyFilterId);
            expect(filterVersion?.version).toStrictEqual('1.0.0.0');
        });
    });

    it('update filters after 30 minutes delay', async () => {
        const clock = FakeTimers.install();
        let promise = App.init();
        await clock.tickAsync(10);
        await promise;

        const filterId = 999;

        server.respondWith('GET', /\/filters\/999\.txt/, [
            200,
            { 'Content-Type': 'text/plain' },
            fakeFilterV2,
        ]);

        promise = FiltersApi.loadAndEnableFilters([filterId]);
        await clock.tickAsync(10);
        await promise;

        let filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual('1.0.0.0');

        // If run the check - the filter should not update, because the timeout
        // for recently checked filters has not expired.
        const updatedFilters = await FilterUpdateApi.checkForFiltersUpdates([filterId]);
        filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual('1.0.0.0');
        expect(updatedFilters.length).toBe(0);

        // Wait for 31 minutes
        await clock.tickAsync(1000 * 60 * 31);
        filterVersion = filterVersionStorage.get(filterId);
        // Filter version still the same because filter didn't epxired
        expect(filterVersion?.version).toStrictEqual('1.0.0.0');

        // Set period update to 100ms
        await SettingsApi.setSetting(SettingOption.FiltersUpdatePeriod, 100);
        // Wait for first check after filter expired
        await clock.tickAsync(1000 * 60 * 31);
        filterVersion = filterVersionStorage.get(filterId);
        expect(filterVersion?.version).toStrictEqual('2.0.0.0');
    });
});
