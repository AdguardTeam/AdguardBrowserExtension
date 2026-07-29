/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import waitForExpect from 'wait-for-expect';

import { FilterList } from '@adguard/tswebextension';
import { getRulesetId, getRulesetPath } from '@adguard/dnr-converter';

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
                            id: getRulesetId(filterId),
                            enabled: true,
                            path: getRulesetPath(filterId),
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

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');
        vi.spyOn(FiltersStorage, 'get').mockResolvedValue(filter);

        // lodash debounce is a no-op in tests (see vitest.setup.ts), so each
        // addRuleHit would otherwise fire saveAndSendHitStats immediately and race
        // concurrent sends. Collect hits with the scheduler stubbed, then flush once.
        const scheduleSpy = vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        try {
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

            // Record one more hit so the first filter stays in the cache, then flush.
            HitStatsApi.addRuleHit(FIRST_FILTER_ID, ruleIndex);

            Object.defineProperty(HitStatsApi, 'maxTotalHits', merge(originalMaxTotalHits, { value: 1 }));

            await (HitStatsApi as unknown as {
                saveAndSendHitStats: () => Promise<void>;
            }).saveAndSendHitStats();

            expect(sendHitStatsSpy).toHaveBeenCalledTimes(1);
            expect(sendHitStatsSpy).toHaveBeenCalledWith({
                filters: {
                    [SECOND_FILTER_ID]: {
                        'example.com##h1': 2,
                        '||example.org^$document': 1,
                    },
                },
            });

            expect(cleanupSpy).toHaveBeenCalled();
        } finally {
            scheduleSpy.mockRestore();
            Object.defineProperty(HitStatsApi, 'maxTotalHits', originalMaxTotalHits);
            vi.clearAllMocks();
        }
    });

    it('Sends valid collected hit stats content to backend', async () => {
        const FIRST_FILTER_ID = AntiBannerFiltersId.EnglishFilterId;
        const SECOND_FILTER_ID = AntiBannerFiltersId.TrackingFilterId;
        const FIRST_RULE_INDEX = 0;
        const SECOND_RULE_INDEX = 16;
        const FIRST_RULE_TEXT = 'example.com##h1';
        const SECOND_RULE_TEXT = '||example.org^$document';
        const UNKNOWN_RULE_INDEX = 999;

        // Save the original value
        const originalMaxTotalHits = Object.getOwnPropertyDescriptor(HitStatsApi, 'maxTotalHits');

        if (!originalMaxTotalHits) {
            throw new Error('maxTotalHits is not defined');
        }

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        // lodash debounce is a no-op in tests (see vitest.setup.ts), so each
        // addRuleHit would otherwise fire saveAndSendHitStats immediately and race
        // concurrent sends. Collect hits with the scheduler stubbed, then flush once.
        const scheduleSpy = vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        try {
            await HitStatsApi.init();

            vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

            // Collect hits for two supported filters / rules
            HitStatsApi.addRuleHit(FIRST_FILTER_ID, FIRST_RULE_INDEX);
            HitStatsApi.addRuleHit(FIRST_FILTER_ID, FIRST_RULE_INDEX);
            HitStatsApi.addRuleHit(FIRST_FILTER_ID, SECOND_RULE_INDEX);
            // Unknown rule index must be skipped and must not break valid entries
            HitStatsApi.addRuleHit(FIRST_FILTER_ID, UNKNOWN_RULE_INDEX);
            HitStatsApi.addRuleHit(SECOND_FILTER_ID, FIRST_RULE_INDEX);

            const expectedPayload = {
                filters: {
                    [FIRST_FILTER_ID]: {
                        [FIRST_RULE_TEXT]: 2,
                        [SECOND_RULE_TEXT]: 1,
                    },
                    [SECOND_FILTER_ID]: {
                        [FIRST_RULE_TEXT]: 1,
                    },
                },
            };

            // Allow send on the single controlled flush below
            Object.defineProperty(HitStatsApi, 'maxTotalHits', merge(originalMaxTotalHits, { value: 1 }));

            await (HitStatsApi as unknown as {
                saveAndSendHitStats: () => Promise<void>;
            }).saveAndSendHitStats();

            // Backend expects rule texts (not indexes) and correct hit counts — exactly once
            expect(sendHitStatsSpy).toHaveBeenCalledTimes(1);
            expect(sendHitStatsSpy).toHaveBeenCalledWith(expectedPayload);

            const sentPayload = sendHitStatsSpy.mock.calls[0]?.[0];
            expect(sentPayload).toEqual(expectedPayload);

            // Content validity: keys are rule texts (not indexes), values are positive integers.
            const filters = sentPayload?.filters;
            expect(filters).toBeDefined();

            Object.entries(filters!).forEach(([filterIdKey, ruleHits]) => {
                expect(Number.isInteger(Number(filterIdKey))).toBe(true);
                expect(ruleHits).toBeDefined();
                expect(Object.keys(ruleHits).length).toBeGreaterThan(0);

                Object.entries(ruleHits).forEach(([ruleText, hits]) => {
                    // Rule text must be real filter content, not a numeric index left unconverted
                    expect(ruleText.length).toBeGreaterThan(0);
                    expect(Number.isNaN(Number(ruleText))).toBe(true);
                    expect(Number.isInteger(hits)).toBe(true);
                    expect(hits).toBeGreaterThan(0);
                });
            });

            // Unknown rule index is not present in the sent payload
            expect(JSON.stringify(sentPayload)).not.toContain(String(UNKNOWN_RULE_INDEX));

            expect(cleanupSpy).toHaveBeenCalledTimes(1);

            // After a successful send, local stats storage is cleaned up
            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
                [HIT_STATISTIC_KEY]: JSON.stringify({}),
            });
        } finally {
            scheduleSpy.mockRestore();
            Object.defineProperty(HitStatsApi, 'maxTotalHits', originalMaxTotalHits);
            vi.clearAllMocks();
        }
    });

    it('Sends valid collected hit stats content to backend', async () => {
        const FIRST_FILTER_ID = AntiBannerFiltersId.EnglishFilterId;
        const SECOND_FILTER_ID = AntiBannerFiltersId.TrackingFilterId;
        const FIRST_RULE_INDEX = 0;
        const SECOND_RULE_INDEX = 16;
        const FIRST_RULE_TEXT = 'example.com##h1';
        const SECOND_RULE_TEXT = '||example.org^$document';
        const UNKNOWN_RULE_INDEX = 999;

        // Save the original value
        const originalMaxTotalHits = Object.getOwnPropertyDescriptor(HitStatsApi, 'maxTotalHits');

        if (!originalMaxTotalHits) {
            throw new Error('maxTotalHits is not defined');
        }

        // Note: lodash debounce is a no-op in tests (see vitest.setup.ts), so each
        // addRuleHit schedules save/send immediately. Keep the threshold equal to the
        // number of hits below so sending is triggered after the batch is collected.
        Object.defineProperty(HitStatsApi, 'maxTotalHits', merge(originalMaxTotalHits, { value: 5 }));

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        await HitStatsApi.init();

        vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);

        // Collect hits for two supported filters / rules
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, FIRST_RULE_INDEX);
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, FIRST_RULE_INDEX);
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, SECOND_RULE_INDEX);
        // Unknown rule index must be skipped and must not break valid entries
        HitStatsApi.addRuleHit(FIRST_FILTER_ID, UNKNOWN_RULE_INDEX);
        HitStatsApi.addRuleHit(SECOND_FILTER_ID, FIRST_RULE_INDEX);

        const expectedPayload = {
            filters: {
                [FIRST_FILTER_ID]: {
                    [FIRST_RULE_TEXT]: 2,
                    [SECOND_RULE_TEXT]: 1,
                },
                [SECOND_FILTER_ID]: {
                    [FIRST_RULE_TEXT]: 1,
                },
            },
        };

        // addRuleHit is sync but save/send is async
        await waitForExpect(
            () => {
                expect(sendHitStatsSpy).toHaveBeenCalled();
            },
            // short timeout: mocked debounce is sync, only the async save path remains
            500,
        );

        // Backend expects rule texts (not indexes) and correct hit counts
        expect(sendHitStatsSpy).toHaveBeenCalledWith(expectedPayload);

        const sentPayload = sendHitStatsSpy.mock.calls.find(
            (call) => call[0]?.filters?.[FIRST_FILTER_ID]
                && call[0]?.filters?.[SECOND_FILTER_ID],
        )?.[0];

        expect(sentPayload).toEqual(expectedPayload);

        // Content validity: keys are rule texts (not indexes), values are positive integers.
        const filters = sentPayload?.filters;
        expect(filters).toBeDefined();

        Object.entries(filters!).forEach(([filterIdKey, ruleHits]) => {
            expect(Number.isInteger(Number(filterIdKey))).toBe(true);
            expect(ruleHits).toBeDefined();
            expect(Object.keys(ruleHits).length).toBeGreaterThan(0);

            Object.entries(ruleHits).forEach(([ruleText, hits]) => {
                // Rule text must be real filter content, not a numeric index left unconverted
                expect(ruleText.length).toBeGreaterThan(0);
                expect(Number.isNaN(Number(ruleText))).toBe(true);
                expect(Number.isInteger(hits)).toBe(true);
                expect(hits).toBeGreaterThan(0);
            });
        });

        // Unknown rule index is not present in the sent payload
        expect(JSON.stringify(sentPayload)).not.toContain(String(UNKNOWN_RULE_INDEX));

        expect(cleanupSpy).toHaveBeenCalled();

        // After a successful send, local stats storage is cleaned up
        await waitForExpect(async () => {
            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
                [HIT_STATISTIC_KEY]: JSON.stringify({}),
            });
        }, 500);

        vi.clearAllMocks();

        // Restore the original value
        Object.defineProperty(HitStatsApi, 'maxTotalHits', originalMaxTotalHits);
    });
});
