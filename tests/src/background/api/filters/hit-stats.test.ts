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
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import waitForExpect from 'wait-for-expect';

import { FilterList } from '@adguard/tswebextension';
import { FiltersStorage as TsWebExtensionFiltersStorage } from '@adguard/tswebextension/filters-storage';
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
import { filterVersionStorage, hybridStorage } from '../../../../../Extension/src/background/storages';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { logger } from '../../../../../Extension/src/common/logger';

const filter = new FilterList([
    'example.com##h1',
    '||example.org^$document',
].join('\n'));

describe('Hit Stats Api', () => {
    let storage: Storage.StorageArea;

    const filterId = AntiBannerFiltersId.EnglishFilterId;
    const ruleIndex = 4;

    /**
     * Ids of the filters used in the tests. In MV3, own filters are static
     * rulesets, so the mocked manifest declares all of them.
     */
    const staticFilterIds = [
        1,
        AntiBannerFiltersId.EnglishFilterId,
        AntiBannerFiltersId.TrackingFilterId,
    ];

    const currentDate = Date.now();
    const filterVersionDataMock: FilterVersionData = {
        version: '1',
        expires: currentDate + 1000,
        lastScheduledCheckTime: currentDate,
        lastUpdateTime: currentDate,
        lastCheckTime: currentDate,
    };

    /**
     * Ids of the MV3 static filters whose data the TSWebExtension storage returns.
     */
    const seededStaticFilterIds = new Set<number>();

    /**
     * Save-and-send runs started during a test. The debounce is a no-op in
     * tests, so `addRuleHit` starts a run without awaiting it, and the run can
     * still be in flight when the test ends.
     */
    let pendingFlushes: Promise<void>[] = [];

    /**
     * Private members of {@link HitStatsApi} that the tests override.
     */
    const hitStatsApiInternals = HitStatsApi as unknown as {
        maxTotalHits: number;
        saveAndSendHitStats: () => Promise<void>;
    };

    const defaultMaxTotalHits = hitStatsApiInternals.maxTotalHits;

    /**
     * Overrides the hits threshold for one test. `afterEach` restores it.
     *
     * @param value Number of hits after which the stats are sent.
     */
    const setMaxTotalHits = (value: number): void => {
        hitStatsApiInternals.maxTotalHits = value;
    };

    /**
     * Puts the test filter into the storage, from which the real
     * {@link FiltersStoragesAdapter} reads it. The adapter itself is not mocked,
     * so the tests fail when it reads a filter from the wrong storage.
     *
     * MV2 keeps the filter in the extension storage. In MV3, the TSWebExtension
     * storage owns static filters and exposes only read methods, so these
     * methods are the lowest point to substitute.
     *
     * @param id Filter id.
     */
    const seedFilter = async (id: number): Promise<void> => {
        if (__IS_MV3__) {
            seededStaticFilterIds.add(id);
            return;
        }

        await FiltersStoragesAdapter.set(id, filter);
    };

    beforeEach(async () => {
        storage = mockLocalStorage();

        const saveAndSendHitStats = hitStatsApiInternals.saveAndSendHitStats.bind(HitStatsApi);

        vi.spyOn(hitStatsApiInternals, 'saveAndSendHitStats').mockImplementation(() => {
            const flush = saveAndSendHitStats();
            pendingFlushes.push(flush);

            return flush;
        });

        if (__IS_MV3__) {
            vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
                ...browser.runtime.getManifest(),
                declarative_net_request: {
                    rule_resources: staticFilterIds.map((id) => ({
                        id: getRulesetId(id),
                        enabled: true,
                        path: getRulesetPath(id),
                    })),
                },
            });
            vi.spyOn(TsWebExtensionFiltersStorage, 'getRawFilterList').mockImplementation(async (id) => {
                return seededStaticFilterIds.has(id) ? filter.getContent() : undefined;
            });
            vi.spyOn(TsWebExtensionFiltersStorage, 'getConversionData').mockImplementation(async (id) => {
                return seededStaticFilterIds.has(id) ? filter.getConversionData() : undefined;
            });
        }
    });

    afterEach(async () => {
        // Wait for the runs started by the test, then remove all spies with
        // their call history. Otherwise a late send of one test is counted by
        // the spies of the next test.
        await Promise.allSettled(pendingFlushes);
        pendingFlushes = [];
        vi.restoreAllMocks();
        setMaxTotalHits(defaultMaxTotalHits);

        seededStaticFilterIds.clear();

        await hybridStorage.clear();
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

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        await seedFilter(FIRST_FILTER_ID);
        await seedFilter(SECOND_FILTER_ID);

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

            setMaxTotalHits(1);

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

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        await seedFilter(FIRST_FILTER_ID);
        await seedFilter(SECOND_FILTER_ID);

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
            setMaxTotalHits(1);

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
            vi.clearAllMocks();
        }
    });

    it('Sends collected hit stats after reaching the max total hits threshold', async () => {
        const FIRST_FILTER_ID = AntiBannerFiltersId.EnglishFilterId;
        const SECOND_FILTER_ID = AntiBannerFiltersId.TrackingFilterId;
        const FIRST_RULE_INDEX = 0;
        const SECOND_RULE_INDEX = 16;
        const FIRST_RULE_TEXT = 'example.com##h1';
        const SECOND_RULE_TEXT = '||example.org^$document';
        const UNKNOWN_RULE_INDEX = 999;

        // Note: lodash debounce is a no-op in tests (see vitest.setup.ts), so each
        // addRuleHit schedules save/send immediately. Keep the threshold equal to the
        // number of hits below so sending is triggered after the batch is collected.
        setMaxTotalHits(5);

        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        await seedFilter(FIRST_FILTER_ID);
        await seedFilter(SECOND_FILTER_ID);

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
    });

    it('does not send stats and drops them when no filter data can be transformed', async () => {
        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');
        const scheduleSpy = vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        // The filter is not put into the storage, so its data is not available
        // and every filter is skipped.

        try {
            await HitStatsApi.init();

            vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);
            HitStatsApi.addRuleHit(filterId, ruleIndex);

            setMaxTotalHits(1);

            await (HitStatsApi as unknown as {
                saveAndSendHitStats: () => Promise<void>;
            }).saveAndSendHitStats();

            // The collector answers an empty payload with HTTP 400, so do not send it.
            expect(sendHitStatsSpy).not.toHaveBeenCalled();

            // Nothing can be delivered, so the collected stats are dropped.
            expect(cleanupSpy).toHaveBeenCalledTimes(1);
            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
                [HIT_STATISTIC_KEY]: JSON.stringify({}),
            });
        } finally {
            scheduleSpy.mockRestore();
        }
    });

    it('drops collected hit stats when the send fails', async () => {
        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats')
            .mockRejectedValue(new Error('Received unexpected status 400 Bad Request'));
        const cleanupSpy = vi.spyOn(HitStatsApi, 'cleanup');

        await seedFilter(filterId);

        const scheduleSpy = vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        try {
            await HitStatsApi.init();

            vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);
            HitStatsApi.addRuleHit(filterId, ruleIndex);

            setMaxTotalHits(1);

            await (HitStatsApi as unknown as {
                saveAndSendHitStats: () => Promise<void>;
            }).saveAndSendHitStats();

            expect(sendHitStatsSpy).toHaveBeenCalledTimes(1);

            // The statistics are dropped, so the next hit does not resend them.
            expect(cleanupSpy).toHaveBeenCalledTimes(1);
            expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
                [HIT_STATISTIC_KEY]: JSON.stringify({}),
            });
        } finally {
            scheduleSpy.mockRestore();
        }
    });

    it('keeps hits collected during a pending send and does not send the batch twice', async () => {
        let finishSend = (): void => {};
        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(() => {
            return new Promise<void>((resolve) => {
                finishSend = resolve;
            });
        });

        await seedFilter(filterId);

        vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        await HitStatsApi.init();

        vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);
        setMaxTotalHits(2);

        HitStatsApi.addRuleHit(filterId, 0);
        HitStatsApi.addRuleHit(filterId, 0);

        const firstFlush = hitStatsApiInternals.saveAndSendHitStats();

        await waitForExpect(() => {
            expect(sendHitStatsSpy).toHaveBeenCalledTimes(1);
        }, 500);

        // One more hit comes while the request is pending.
        HitStatsApi.addRuleHit(filterId, 16);
        await hitStatsApiInternals.saveAndSendHitStats();

        finishSend();
        await firstFlush;

        // The pending batch is not sent again.
        expect(sendHitStatsSpy).toHaveBeenCalledTimes(1);
        expect(sendHitStatsSpy).toHaveBeenCalledWith({
            filters: {
                [filterId]: {
                    'example.com##h1': 2,
                },
            },
        });

        // The new hit stays in the storage for the next batch.
        const expected: HitStatsStorageData = {
            stats: {
                filters: {
                    [filterId]: {
                        16: 1,
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
    });

    it('drops the batch and does not reject when the filter data cannot be read', async () => {
        const sendHitStatsSpy = vi.spyOn(network, 'sendHitStats').mockImplementation(async () => {});
        const readError = new Error('storage is not available');

        vi.spyOn(FiltersStoragesAdapter, 'get').mockRejectedValue(readError);
        vi.spyOn(
            HitStatsApi as unknown as { debounceSaveAndSendHitStats: () => void },
            'debounceSaveAndSendHitStats',
        ).mockImplementation(() => {});

        await HitStatsApi.init();

        vi.spyOn(filterVersionStorage, 'get').mockReturnValue(filterVersionDataMock);
        HitStatsApi.addRuleHit(filterId, 0);

        setMaxTotalHits(1);

        await expect(hitStatsApiInternals.saveAndSendHitStats()).resolves.toBeUndefined();

        expect(sendHitStatsSpy).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.any(String), readError);

        // The batch is dropped, so the next hit does not read the filter again.
        expect(await storage.get(HIT_STATISTIC_KEY)).toStrictEqual({
            [HIT_STATISTIC_KEY]: JSON.stringify({}),
        });
    });
});
