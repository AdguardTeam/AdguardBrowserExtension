import { Storage } from 'webextension-polyfill';
import waitForExpect from 'wait-for-expect';
import { merge } from 'lodash-es';

import { FilterListPreprocessor } from '@adguard/tswebextension';

import { network } from '../../../../../Extension/src/background/api/network';
import { HitStatsApi } from '../../../../../Extension/src/background/api/filters/hit-stats';
import { FilterVersionData, HitStatsStorageData } from '../../../../../Extension/src/background/schema';
import {
    AntiBannerFiltersId,
    CUSTOM_FILTERS_START_ID,
    HIT_STATISTIC_KEY,
} from '../../../../../Extension/src/common/constants';
import { mockLocalStorage } from '../../../../helpers';
import { FiltersStorage, filterVersionStorage } from '../../../../../Extension/src/background/storages';

describe('Hit Stats Api', () => {
    let storage: Storage.StorageArea;

    const filterId = AntiBannerFiltersId.EnglishFilterId;
    const ruleIndex = 4;

    const currentDate = Date.now();
    const filterVersionDataMock: FilterVersionData = {
        version: '1',
        expires: currentDate + 1000,
        lastScheduledCheckTime: currentDate,
        lastUpdateTime: currentDate,
        lastCheckTime: currentDate,
    };

    const preprocessedFilter = FilterListPreprocessor.preprocess([
        'example.com##h1',
        '||example.org^$document',
    ].join('\n'));

    beforeEach(async () => {
        storage = mockLocalStorage();
    });

    it('inits', async () => {
        await HitStatsApi.init();

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('Adds rule hit', async () => {
        await HitStatsApi.init();

        jest.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

        HitStatsApi.addRuleHit(filterId, ruleIndex);

        const expected: HitStatsStorageData = {
            stats: {
                filters: {
                    [filterId]: {
                        [ruleIndex]: 1,
                    },
                },
            },
            versions: {
                [filterId]: filterVersionDataMock.version,
            },
            totalHits: 1,
        };

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
            [HIT_STATISTIC_KEY]: JSON.stringify(expected),
        });

        jest.clearAllMocks();
    });

    it('Cleanup data', async () => {
        await storage.set({
            [HIT_STATISTIC_KEY]: JSON.stringify({
                stats: {
                    filters: {
                        [filterId]: {
                            [ruleIndex]: 1,
                        },
                    },
                },
                totalHits: 1,
            }),
        });

        await HitStatsApi.init();

        await HitStatsApi.cleanup();

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
    });

    describe('Ignores rule hits from unsupported filters', () => {
        const unsupportedFilters = [
            { title: 'User filter', filterId: AntiBannerFiltersId.UserFilterId },
            { title: 'Allowlist filter', filterId: AntiBannerFiltersId.AllowlistFilterId },
            {
                title: 'Tracking protection (formerly Stealth mode) filter',
                filterId: AntiBannerFiltersId.StealthModeFilterId,
            },
            { title: 'Custom filter', filterId: CUSTOM_FILTERS_START_ID + 1 },
        ];

        it.each(unsupportedFilters)('Ignores rule from $title', async ({ filterId }) => {
            await HitStatsApi.init();

            HitStatsApi.addRuleHit(filterId, ruleIndex);

            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
        });
    });

    it('Do not send stats for outdated filters', async () => {
        const FIRST_FILTER_ID = 1;
        const SECOND_FILTER_ID = 2;

        // Save the original value
        const originalMaxTotalHits = Object.getOwnPropertyDescriptor(HitStatsApi, 'maxTotalHits');

        if (!originalMaxTotalHits) {
            throw new Error('maxTotalHits is not defined');
        }

        // Mock the static member
        Object.defineProperty(HitStatsApi, 'maxTotalHits', merge(originalMaxTotalHits, { value: 5 }));

        const sendHitStatsSpy = jest.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = jest.spyOn(HitStatsApi, 'cleanup');
        jest.spyOn(FiltersStorage, 'getAllFilterData').mockResolvedValue(preprocessedFilter);

        await HitStatsApi.init();

        // Initially, both filter has version '1'
        jest.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

        // Add hits to both filters
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, 4);

        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 4);
        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 4);
        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 48);

        // Now let's simulate that the version of the first filter has increased
        jest.spyOn(filterVersionStorage, 'get').mockImplementation((filterId: number) => {
            if (filterId === FIRST_FILTER_ID) {
                return {
                    ...filterVersionDataMock,
                    version: '2',
                };
            }

            return filterVersionDataMock;
        });

        // Add a hit to the first filter again to trigger the sending of stats
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, ruleIndex);

        // addRuleHit is a sync method, but it calls saveAndSaveHitStats which is async,
        // so we need wait for it to be called
        await waitForExpect(
            () => {
                expect(sendHitStatsSpy).toHaveBeenCalled();
            },
            // use a short timeout, since its a mocked test and we don't need to wait too long
            500,
        );

        expect(sendHitStatsSpy).toHaveBeenCalledWith({
            filters: {
                [SECOND_FILTER_ID]: {
                    'example.com##h1': 2,
                    '||example.org^$document': 1,
                },
            },
        });

        expect(cleanupSpy).toHaveBeenCalled();

        jest.clearAllMocks();

        // Restore the original value
        Object.defineProperty(HitStatsApi, 'maxTotalHits', originalMaxTotalHits);
    });
});
