import { Storage } from 'webextension-polyfill';
import { HitStatsApi } from '../../../../../Extension/src/background/api/filters/hit-stats';
import { HitStatsStorageData } from '../../../../../Extension/src/background/schema';
import { AntiBannerFiltersId, HIT_STATISTIC_KEY } from '../../../../../Extension/src/common/constants';

import { mockLocalStorage } from '../../../../helpers';

describe('Hit Stats Api', () => {
    let storage: Storage.StorageArea;

    beforeEach(async () => {
        storage = mockLocalStorage();
    });

    it('inits', async () => {
        await HitStatsApi.init();

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('Adds rule hit', async () => {
        await HitStatsApi.init();

        HitStatsApi.addRuleHit('example.org', AntiBannerFiltersId.UserFilterId);

        const expected: HitStatsStorageData = {
            stats: {
                filters: {
                    [AntiBannerFiltersId.UserFilterId]: {
                        'example.org': 1,
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
                        [AntiBannerFiltersId.UserFilterId]: {
                            'example.org': 1,
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
});
