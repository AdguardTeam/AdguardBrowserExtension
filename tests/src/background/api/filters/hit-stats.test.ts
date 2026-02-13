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
import waitForExpect from 'wait-for-expect';
import { merge } from 'lodash-es';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    type MockInstance,
    vi,
} from 'vitest';

import { FilterList } from '@adguard/tswebextension';
import { getRuleSetId, getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import { network } from '../../../../../Extension/src/background/api/network';
import { HitStatsApi } from '../../../../../Extension/src/background/api/filters/hit-stats';
import { type FilterVersionData, type HitStatsStorageData } from '../../../../../Extension/src/background/schema';
import {
    AntiBannerFiltersId,
    CUSTOM_FILTERS_START_ID,
    HIT_STATISTIC_KEY,
} from '../../../../../Extension/src/common/constants';
import { mockLocalStorage } from '../../../../helpers';
import { FiltersStorage, filterVersionStorage } from '../../../../../Extension/src/background/storages';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';

const filter = new FilterList([
    'example.com##h1',
    '||example.org^$document',
].join('\n'));

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

    let getFilterSpy: MockInstance;
    let getManifestSpy: MockInstance | undefined;

    beforeEach(async () => {
        storage = mockLocalStorage();
        getFilterSpy = vi.spyOn(FiltersStoragesAdapter, 'get').mockResolvedValue(filter);

        if (__IS_MV3__) {
            getManifestSpy = vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
                ...browser.runtime.getManifest(),
                declarative_net_request: {
                    rule_resources: [
                        {
                            id: getRuleSetId(filterId),
                            enabled: true,
                            path: getRuleSetPath(filterId),
                        },
                    ],
                },
            });
        }
    });

    afterEach(() => {
        getFilterSpy.mockRestore();

        if (__IS_MV3__ && getManifestSpy) {
            getManifestSpy.mockRestore();
        }
    });

    it('inits', async () => {
        await HitStatsApi.init();

        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({ [HIT_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('Adds rule hit', async () => {
        await HitStatsApi.init();

        vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

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

        vi.clearAllMocks();
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

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');
        vi.spyOn(FiltersStorage, 'get').mockResolvedValue(filter);

        await HitStatsApi.init();

        // Initially, both filter has version '1'
        vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

        // Add hits to both filters
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, 0);

        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 0);
        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 0);
        HitStatsApi.addRuleHit(SECOND_FILTER_ID, 16);

        // Now let's simulate that the version of the first filter has increased
        vi.spyOn(filterVersionStorage, 'get').mockImplementation((filterId: number) => {
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

        // addRuleHit is a sync method, but it calls saveAndSendHitStats which is async,
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

        vi.clearAllMocks();

        // Restore the original value
        Object.defineProperty(HitStatsApi, 'maxTotalHits', originalMaxTotalHits);
    });
});
