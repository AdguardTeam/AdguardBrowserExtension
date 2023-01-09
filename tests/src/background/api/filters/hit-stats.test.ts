import { Storage } from 'webextension-polyfill';
import { HitStatsApi } from '../../../../../Extension/src/background/api/filters/hit-stats';
import { HitStatsStorageData } from '../../../../../Extension/src/background/schema';
import {
    AntiBannerFiltersId,
    CUSTOM_FILTERS_START_ID,
    HIT_STATISTIC_KEY,
} from '../../../../../Extension/src/common/constants';

import { mockLocalStorage } from '../../../../helpers';

describe('Hit Stats Api', () => {
    let storage: Storage.StorageArea;

    const ruleText = '||example.org^';
    const filterId = AntiBannerFiltersId.EnglishFilterId;

    beforeEach(async () => {
        storage = mockLocalStorage();
    });

    it('inits', async () => {
        await HitStatsApi.init();

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('Adds rule hit', async () => {
        await HitStatsApi.init();

        HitStatsApi.addRuleHit(ruleText, filterId);

        const expected: HitStatsStorageData = {
            stats: {
                filters: {
                    [filterId]: {
                        [ruleText]: 1,
                    },
                },
            },
            totalHits: 1,
        };

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify(expected) });
    });

    it('Cleanup data', async () => {
        await storage.set({
            [HIT_STATISTIC_KEY]: JSON.stringify({
                stats: {
                    filters: {
                        [filterId]: {
                            [ruleText]: 1,
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
            { title: 'Custom filter', filterId: CUSTOM_FILTERS_START_ID + 1 },
        ];

        it.each(unsupportedFilters)('Ignores rule from $title', async ({ filterId }) => {
            await HitStatsApi.init();

            HitStatsApi.addRuleHit(ruleText, filterId);

            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
        });
    });
});
