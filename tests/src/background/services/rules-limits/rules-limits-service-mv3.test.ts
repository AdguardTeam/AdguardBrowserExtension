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

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import browser from 'webextension-polyfill';

import {
    type ConfigurationResult,
    TooManyRegexpRulesError,
    TooManyUnsafeRulesError,
} from '@adguard/tswebextension/mv3';

import { MessageType } from '../../../../../Extension/src/common/messages/constants';

// Create hoisted mocks for use inside vi.mock() factories.
const {
    mockSettingsStorageGet,
    mockRulesLimitsStorageGetData,
    mockGetEnabledFiltersWithMetadata,
    mockGetFiltersMetadata,
    mockGetEnabledRulesets,
    mockAddListener,
    mockGetGroupState,
    mockGetEnabledFiltersIdsByGroupId,
    mockGetAvailableStaticRuleCount,
    mockGetSessionRules,
} = vi.hoisted(() => ({
    mockSettingsStorageGet: vi.fn(),
    mockRulesLimitsStorageGetData: vi.fn(),
    mockGetEnabledFiltersWithMetadata: vi.fn(),
    mockGetFiltersMetadata: vi.fn((): { filterId: number }[] => []),
    mockGetEnabledRulesets: vi.fn(),
    mockAddListener: vi.fn(),
    mockGetGroupState: vi.fn(),
    mockGetEnabledFiltersIdsByGroupId: vi.fn(),
    mockGetAvailableStaticRuleCount: vi.fn(),
    mockGetSessionRules: vi.fn(),
}));

// Mock settingsStorage.
vi.mock(
    '../../../../../Extension/src/background/storages',
    () => ({
        settingsStorage: {
            get: (...args: unknown[]) => mockSettingsStorageGet(...args),
        },
        filterStateStorage: {},
    }),
);

// Mock rulesLimitsStorage.
vi.mock(
    '../../../../../Extension/src/background/storages/rules-limits',
    () => ({
        rulesLimitsStorage: {
            getData: () => mockRulesLimitsStorageGetData(),
            setData: vi.fn(),
            setCache: vi.fn(),
            read: vi.fn(),
        },
    }),
);

// Mock FiltersApi.getEnabledFiltersWithMetadata and other api exports.
vi.mock(
    '../../../../../Extension/src/background/api',
    () => ({
        FiltersApi: {
            getEnabledFiltersWithMetadata: () => mockGetEnabledFiltersWithMetadata(),
            getFiltersMetadata: () => mockGetFiltersMetadata(),
        },
        Categories: {
            getGroupState: (...args: unknown[]) => mockGetGroupState(...args),
            getEnabledFiltersIdsByGroupId: (...args: unknown[]) => mockGetEnabledFiltersIdsByGroupId(...args),
            getRecommendedFilterIdsByGroupId: vi.fn(),
        },
        iconsApi: {
            update: vi.fn(),
        },
    }),
);

// Mock message-handler to avoid circular dependency initialization.
vi.mock(
    '../../../../../Extension/src/background/message-handler',
    () => ({
        messageHandler: {
            addListener: (...args: unknown[]) => mockAddListener(...args),
        },
    }),
);

// Override chrome.declarativeNetRequest.getEnabledRulesets for tests.
const globalChrome = global.chrome as Record<string, unknown>;
const dnr = globalChrome.declarativeNetRequest as Record<string, unknown>;
dnr.getEnabledRulesets = mockGetEnabledRulesets;

// Static quota constants and counters come from the polyfill `browser`, which
// vitest.setup.ts maps to sinon-chrome. The constants are read when the service
// module loads, so set them before the import below.
const polyfillDnr = browser.declarativeNetRequest as unknown as Record<string, unknown>;
polyfillDnr.MAX_NUMBER_OF_ENABLED_STATIC_RULESETS = 50;
polyfillDnr.getAvailableStaticRuleCount = mockGetAvailableStaticRuleCount;
polyfillDnr.getSessionRules = mockGetSessionRules;

// Import the class under test AFTER all mocks are set up.
const { RulesLimitsService } = await import(
    '../../../../../Extension/src/background/services/rules-limits/rules-limits-service-mv3'
);

/**
 * Helper to create a minimal FilterMetadata stub for a common filter.
 *
 * @param filterId The filter ID.
 *
 * @returns A stub object with the filterId property.
 */
function createCommonFilterMetadata(filterId: number): { filterId: number } {
    return { filterId };
}

/**
 * Helper to create a ruleset name from a filter ID.
 *
 * @param filterId The filter ID.
 *
 * @returns The ruleset name string (e.g. 'ruleset_1').
 */
function rulesetName(filterId: number): string {
    return `ruleset_${filterId}`;
}

describe.skipIf(!__IS_MV3__)('RulesLimitsService.areFilterLimitsExceeded', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: filtering enabled.
        mockSettingsStorageGet.mockReturnValue(false);
        // Default: no cached filters (empty storage).
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        // Default: no filters enabled in configuration.
        mockGetEnabledFiltersWithMetadata.mockReturnValue([]);
        // Default: no rulesets enabled in browser.
        mockGetEnabledRulesets.mockResolvedValue([]);
    });

    it('returns false when filtering is disabled', async () => {
        mockSettingsStorageGet.mockReturnValue(true);
        // Even with mismatched filters, should return false.
        mockRulesLimitsStorageGetData.mockReturnValue([1, 2]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue([
            createCommonFilterMetadata(1),
            createCommonFilterMetadata(2),
        ]);
        mockGetEnabledRulesets.mockResolvedValue([]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(false);
    });

    it('returns false when all three filter lists are equal', async () => {
        const filterIds = [1, 2, 3];
        mockRulesLimitsStorageGetData.mockReturnValue([...filterIds]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            filterIds.map(createCommonFilterMetadata),
        );
        mockGetEnabledRulesets.mockResolvedValue(
            filterIds.map(rulesetName),
        );

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(false);
    });

    it('returns false when cached is empty and expected matches actual', async () => {
        const filterIds = [1, 2, 3];
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            filterIds.map(createCommonFilterMetadata),
        );
        mockGetEnabledRulesets.mockResolvedValue(
            filterIds.map(rulesetName),
        );

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(false);
    });

    it('returns false when all lists are empty', async () => {
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue([]);
        mockGetEnabledRulesets.mockResolvedValue([]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(false);
    });

    it('returns true when cached filters differ from actually enabled', async () => {
        // Cached says [1, 2, 3] were enabled before limits hit.
        mockRulesLimitsStorageGetData.mockReturnValue([1, 2, 3]);
        // But browser only has [1, 2].
        mockGetEnabledRulesets.mockResolvedValue([
            rulesetName(1),
            rulesetName(2),
        ]);
        // Expected config also says [1, 2, 3].
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            [1, 2, 3].map(createCommonFilterMetadata),
        );

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(true);
    });

    it('returns true when cached is empty but expected differs from actual', async () => {
        // No cached filters.
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        // Config expects [1, 2, 3].
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            [1, 2, 3].map(createCommonFilterMetadata),
        );
        // But browser only has [1, 2].
        mockGetEnabledRulesets.mockResolvedValue([
            rulesetName(1),
            rulesetName(2),
        ]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        expect(result).toBe(true);
    });

    // ---- Regression test for AG-53264 ----
    it('AG-53264: returns true when actually enabled is empty but expected is not', async () => {
        // No cached filters.
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        // Config expects filters [1, 2, 3].
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            [1, 2, 3].map(createCommonFilterMetadata),
        );
        // Browser has ZERO rulesets enabled (all were disabled due to limits).
        mockGetEnabledRulesets.mockResolvedValue([]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        // Before the fix, this incorrectly returned false due to the
        // `actuallyEnabledFilters.length === 0` early exit.
        expect(result).toBe(true);
    });

    it('AG-53264: returns true when actually enabled is empty and cached is not', async () => {
        // Cached filters from a previous broken state.
        mockRulesLimitsStorageGetData.mockReturnValue([1, 2, 3]);
        // Config expects same.
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            [1, 2, 3].map(createCommonFilterMetadata),
        );
        // Browser has ZERO rulesets enabled.
        mockGetEnabledRulesets.mockResolvedValue([]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        // cachedEnabledFilters.length > 0 && !arraysAreEqual([], [1,2,3]) → true
        expect(result).toBe(true);
    });

    it('handles arrays with same elements in different order', async () => {
        const filterIds = [3, 1, 2];
        mockRulesLimitsStorageGetData.mockReturnValue([2, 3, 1]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            filterIds.map(createCommonFilterMetadata),
        );
        mockGetEnabledRulesets.mockResolvedValue(
            [1, 3, 2].map(rulesetName),
        );

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        // arraysAreEqual sorts before comparing, so all three are equal.
        expect(result).toBe(false);
    });

    it('returns true when cached matches actual but expected differs', async () => {
        // Cached filters = [1, 2] (matches actual).
        mockRulesLimitsStorageGetData.mockReturnValue([1, 2]);
        // Config expects [1, 2, 3] (more than actual).
        mockGetEnabledFiltersWithMetadata.mockReturnValue(
            [1, 2, 3].map(createCommonFilterMetadata),
        );
        // Browser has [1, 2].
        mockGetEnabledRulesets.mockResolvedValue([
            rulesetName(1),
            rulesetName(2),
        ]);

        const result = await RulesLimitsService.areFilterLimitsExceeded();
        // Cached check passes (arrays equal), falls through to expected check.
        // Expected [1,2,3] ≠ actual [1,2] → true.
        expect(result).toBe(true);
    });
});

/**
 * Rule counts of a static ruleset stub.
 */
type StaticRulesetCounts = {
    filterId: number;
    safeRulesCount: number;
    unsafeRulesCount: number;
    regexpRulesCount: number;
    metadataRulesCount: number;
};

const FILTER_2: StaticRulesetCounts = {
    filterId: 2,
    safeRulesCount: 90,
    unsafeRulesCount: 10,
    regexpRulesCount: 4,
    metadataRulesCount: 5,
};

const FILTER_3: StaticRulesetCounts = {
    filterId: 3,
    safeRulesCount: 200,
    unsafeRulesCount: 0,
    regexpRulesCount: 6,
    metadataRulesCount: 7,
};

const FILTER_4: StaticRulesetCounts = {
    filterId: 4,
    safeRulesCount: 1000,
    unsafeRulesCount: 0,
    regexpRulesCount: 20,
    metadataRulesCount: 50,
};

const FILTER_5_REGEXP_HEAVY: StaticRulesetCounts = {
    filterId: 5,
    safeRulesCount: 991,
    unsafeRulesCount: 0,
    regexpRulesCount: 991,
    metadataRulesCount: 3,
};

/**
 * Creates static ruleset stubs that report the given counts.
 *
 * @param rulesets Counts per static ruleset.
 *
 * @returns Static rulesets stub.
 */
function createStaticRulesets(rulesets: StaticRulesetCounts[]): ConfigurationResult['staticFilters'] {
    return rulesets.map((counts) => ({
        getId: () => rulesetName(counts.filterId),
        getSafeRulesCount: () => counts.safeRulesCount,
        getUnsafeRulesCount: () => counts.unsafeRulesCount,
        getRegexpRulesCount: () => counts.regexpRulesCount,
        getMetadataRulesCount: () => counts.metadataRulesCount,
    })) as unknown as ConfigurationResult['staticFilters'];
}

/**
 * Creates a configuration result whose static filters report the given counts.
 *
 * @param rulesets Counts per static ruleset.
 * @param loadDisabledStaticFilters Loader of the rulesets of disabled filters.
 * @param loadDisabledStaticFilter Loader of a single disabled ruleset.
 *
 * @returns Configuration result stub.
 */
function createConfigurationResult(
    rulesets: StaticRulesetCounts[],
    loadDisabledStaticFilters: ConfigurationResult['loadDisabledStaticFilters'] = async () => [],
    loadDisabledStaticFilter: ConfigurationResult['loadDisabledStaticFilter'] = async (filterId) => {
        const loadedRulesets = await loadDisabledStaticFilters();

        return loadedRulesets.find((ruleset) => ruleset.getId() === rulesetName(filterId));
    },
): ConfigurationResult {
    return {
        staticFilters: createStaticRulesets(rulesets),
        loadDisabledStaticFilters,
        loadDisabledStaticFilter,
    } as unknown as ConfigurationResult;
}

/**
 * Loader of disabled rulesets that is settled by the test.
 */
type PendingLoader = {
    load: ConfigurationResult['loadDisabledStaticFilters'];
    resolve: (rulesets: StaticRulesetCounts[]) => void;
    reject: (error: Error) => void;
};

/**
 * Creates a loader of disabled rulesets that resolves only when asked to.
 *
 * @returns The loader and functions to settle it.
 */
function createPendingLoader(): PendingLoader {
    const { promise, resolve, reject } = Promise.withResolvers<ConfigurationResult['staticFilters']>();

    return {
        load: () => promise,
        resolve: (rulesets) => resolve(createStaticRulesets(rulesets)),
        reject,
    };
}

/**
 * Initializes a service with the given static rulesets and filtering enabled.
 *
 * @param rulesets Counts per static ruleset (enabled or not).
 */
async function initService(rulesets: StaticRulesetCounts[]): Promise<void> {
    const service = new RulesLimitsService();
    await service.init();
    service.updateConfigurationResult(createConfigurationResult(rulesets), true);
}

/**
 * Returns the listener the service registered for a message type.
 *
 * @param type Message type.
 *
 * @returns Registered listener.
 *
 * @throws Error if no listener was registered for the type.
 */
function getListener(type: MessageType): (message?: unknown) => Promise<unknown> {
    const call = mockAddListener.mock.calls.find(([registeredType]) => registeredType === type);
    if (!call) {
        throw new Error(`No listener registered for ${type}`);
    }
    return call[1];
}

describe.skipIf(!__IS_MV3__)('RulesLimitsService static quota with service rules', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSettingsStorageGet.mockReturnValue(false);
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        mockGetEnabledRulesets.mockResolvedValue([]);
        mockGetSessionRules.mockResolvedValue([]);
    });

    it('counts ordinary and service rules of enabled rulesets only', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2, 3].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(1000);
        await initService([FILTER_2, FILTER_3, FILTER_4]);

        const counters = await getListener(MessageType.GetRulesLimitsCountersMv3)();

        // (90 + 10 + 5) + (200 + 0 + 7); filter 4 is not enabled.
        expect(counters).toMatchObject({
            staticRulesEnabledCount: 312,
            staticRulesMaximumCount: 1312,
            staticRulesRegexpsEnabledCount: 10,
        });
    });

    it('admits a filter whose ordinary and service rules fit exactly', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2, 3].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(1050);
        await initService([FILTER_2, FILTER_3, FILTER_4]);

        const result = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        expect(result).toEqual({ ok: true });
    });

    it('rejects a filter that fits only without its service rules', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2, 3].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(1049);
        await initService([FILTER_2, FILTER_3, FILTER_4]);

        const result = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        expect(result).toEqual({
            ok: false,
            data: {
                type: 'static',
                rulesCount: { current: 1050, maximum: 1049 },
            },
        });
    });

    it('rejects a filter by the regexp limit without counting service rules', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2, 3].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(100_000);
        await initService([FILTER_2, FILTER_3, FILTER_5_REGEXP_HEAVY]);

        const result = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 5 },
        });

        // 4 + 6 enabled + 991 = 1001 > 1000.
        expect(result).toEqual({
            ok: false,
            data: {
                type: 'static',
                rulesRegexpsCount: { current: 991, maximum: 1000 },
            },
        });
    });

    it('admits a group whose ordinary and service rules fit exactly', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2].map(createCommonFilterMetadata));
        mockGetGroupState.mockReturnValue({ touched: true });
        mockGetEnabledFiltersIdsByGroupId.mockReturnValue([3, 4]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(1257);
        await initService([FILTER_2, FILTER_3, FILTER_4]);

        const result = await getListener(MessageType.CanEnableStaticGroupMv3)({
            type: MessageType.CanEnableStaticGroupMv3,
            data: { groupId: 1 },
        });

        expect(result).toEqual({ ok: true });
    });

    it('rejects a group that fits only without its service rules', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2].map(createCommonFilterMetadata));
        mockGetGroupState.mockReturnValue({ touched: true });
        mockGetEnabledFiltersIdsByGroupId.mockReturnValue([3, 4]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(1256);
        await initService([FILTER_2, FILTER_3, FILTER_4]);

        const result = await getListener(MessageType.CanEnableStaticGroupMv3)({
            type: MessageType.CanEnableStaticGroupMv3,
            data: { groupId: 1 },
        });

        // (200 + 7) + (1000 + 50).
        expect(result).toEqual({
            ok: false,
            data: {
                type: 'static',
                rulesCount: { current: 1257, maximum: 1256 },
            },
        });
    });

    it('rejects a filter without a ruleset counter instead of throwing', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(100_000);
        await initService([FILTER_2, FILTER_3]);

        const result = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 26 },
        });

        // The check fails, so the UI reverts the toggle without a message.
        expect(result).toEqual({ ok: false, data: { type: 'static' } });
    });

    it('ignores a filter without a ruleset counter when checking a group', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2].map(createCommonFilterMetadata));
        mockGetGroupState.mockReturnValue({ touched: true });
        mockGetEnabledFiltersIdsByGroupId.mockReturnValue([3, 26]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(207);
        await initService([FILTER_2, FILTER_3]);

        const result = await getListener(MessageType.CanEnableStaticGroupMv3)({
            type: MessageType.CanEnableStaticGroupMv3,
            data: { groupId: 1 },
        });

        // Filter 3 needs 200 + 7 rules; filter 26 has no ruleset and is skipped.
        expect(result).toEqual({ ok: true });
    });
});

describe.skipIf(!__IS_MV3__)('RulesLimitsService rulesets of disabled filters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSettingsStorageGet.mockReturnValue(false);
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        mockGetEnabledRulesets.mockResolvedValue([]);
        mockGetSessionRules.mockResolvedValue([]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2, 3].map(createCommonFilterMetadata));
        mockGetFiltersMetadata.mockReturnValue([2, 3, 4].map(createCommonFilterMetadata));
        mockGetAvailableStaticRuleCount.mockResolvedValue(1050);
    });

    /**
     * Initializes a service with enabled rulesets and a pending loader of the
     * disabled ones.
     *
     * @param loader Loader of the rulesets of disabled filters.
     *
     * @returns The initialized service.
     */
    const initServiceWithLoader = async (
        loader: ConfigurationResult['loadDisabledStaticFilters'],
    ): Promise<InstanceType<typeof RulesLimitsService>> => {
        const service = new RulesLimitsService();
        await service.init();
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], loader), true);

        return service;
    };

    it('loads the rulesets of disabled filters with the configuration result', async () => {
        const load = vi.fn(async () => createStaticRulesets([FILTER_4]));

        await initServiceWithLoader(load);

        expect(load).toHaveBeenCalledOnce();

        const check = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        // The loaded counter is available for the check.
        expect(check).toEqual({ ok: true });
    });

    it('waits for the counter of a disabled filter before checking it', async () => {
        const loader = createPendingLoader();
        await initServiceWithLoader(loader.load);

        const check = getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        loader.resolve([FILTER_4]);

        // Without the wait, the missing counter would reject the filter.
        expect(await check).toEqual({ ok: true });
    });

    it('keeps waiting while the needed counter is still loading', async () => {
        const loader = createPendingLoader();
        await initServiceWithLoader(loader.load);

        let resolved = false;
        const check = getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        }).then((result) => {
            resolved = true;
            return result;
        });

        // Let the check run up to its wait.
        await Promise.resolve();

        expect(resolved).toBe(false);

        loader.resolve([FILTER_4]);

        expect(await check).toEqual({ ok: true });
    });

    it('loads only the requested counter instead of waiting for the batch', async () => {
        const batchLoader = createPendingLoader();
        const service = new RulesLimitsService();
        await service.init();
        service.updateConfigurationResult(
            createConfigurationResult(
                [FILTER_2, FILTER_3],
                batchLoader.load,
                async () => {
                    const [ruleset] = createStaticRulesets([FILTER_4]);

                    return ruleset;
                },
            ),
            true,
        );

        // The batch is still pending, but the per-filter loader resolves the
        // requested counter.
        await expect(getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).resolves.toEqual({ ok: true });

        // Settle the batch.
        batchLoader.resolve([]);
    });

    it('does not wait for a loading when the needed counter is already cached', async () => {
        const loader = createPendingLoader();
        const service = new RulesLimitsService();
        await service.init();
        service.updateConfigurationResult(
            createConfigurationResult([FILTER_2, FILTER_3, FILTER_4], loader.load),
            true,
        );

        // Filter 4 is in the result, so its counter is cached while the
        // loading of the other disabled rulesets is still pending.
        await expect(getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).resolves.toEqual({ ok: true });

        loader.resolve([]);
    });

    it('waits for the counters of disabled filters before checking a group', async () => {
        mockGetEnabledFiltersWithMetadata.mockReturnValue([2].map(createCommonFilterMetadata));
        mockGetGroupState.mockReturnValue({ touched: true });
        mockGetEnabledFiltersIdsByGroupId.mockReturnValue([3, 4]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(1256);
        const loader = createPendingLoader();
        await initServiceWithLoader(loader.load);

        const check = getListener(MessageType.CanEnableStaticGroupMv3)({
            type: MessageType.CanEnableStaticGroupMv3,
            data: { groupId: 1 },
        });

        loader.resolve([FILTER_4]);

        // Without the wait, filter 4 would be skipped and the group admitted.
        expect(await check).toEqual({
            ok: false,
            data: {
                type: 'static',
                rulesCount: { current: 1257, maximum: 1256 },
            },
        });
    });

    it('does not load the rulesets of disabled filters again for a new configuration result', async () => {
        const service = await initServiceWithLoader(async () => createStaticRulesets([FILTER_4]));

        // The first check waits for the loading and caches filter 4 counter.
        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });

        const loadAgain = vi.fn(async () => createStaticRulesets([FILTER_4]));
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], loadAgain), true);

        // Counters do not depend on the configuration, so they are reused.
        expect(loadAgain).not.toHaveBeenCalled();
        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });
    });

    it('does not start a second loading while one is pending', async () => {
        const firstLoader = createPendingLoader();
        const service = await initServiceWithLoader(firstLoader.load);

        const secondLoader = vi.fn(async () => createStaticRulesets([FILTER_4]));
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], secondLoader), true);

        expect(secondLoader).not.toHaveBeenCalled();

        firstLoader.resolve([FILTER_4]);

        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });
    });

    it('uses the counters of a superseded loading for the current result', async () => {
        const outdatedLoader = createPendingLoader();
        const service = await initServiceWithLoader(outdatedLoader.load);
        const outdatedResult = service.configurationResult;
        const currentResult = createConfigurationResult([FILTER_2]);
        service.updateConfigurationResult(currentResult, true);

        outdatedLoader.resolve([FILTER_4]);

        const check = await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        // The loaded counter is valid for the new result too.
        expect(check).toEqual({ ok: true });
        // The deferred rulesets are kept in the service, not pushed into the
        // library's configuration results.
        expect(outdatedResult?.staticFilters).toHaveLength(2);
        expect(currentResult.staticFilters).toHaveLength(1);
    });

    it('stops waiting when the new configuration result disables filtering', async () => {
        const loader = createPendingLoader();
        const service = await initServiceWithLoader(loader.load);

        const check = getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        service.updateConfigurationResult(createConfigurationResult([]), false);

        // The check does not wait for the previous loading, because the new
        // result turns the limits checks off.
        expect(await check).toEqual({ ok: true });

        // Settle the superseded loading.
        loader.resolve([FILTER_4]);
    });

    it('starts a loading when filtering is enabled after a result with filtering off', async () => {
        const service = new RulesLimitsService();
        await service.init();
        service.updateConfigurationResult(createConfigurationResult([]), false);

        const load = vi.fn(async () => createStaticRulesets([FILTER_4]));
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], load), true);

        expect(load).toHaveBeenCalledOnce();
        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });
    });

    it('retries loading the rulesets of disabled filters after a failure', async () => {
        const failedLoader = createPendingLoader();
        const service = await initServiceWithLoader(failedLoader.load);

        failedLoader.reject(new Error('loading failed'));
        // Let the rejection handlers clear the pending loading.
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 0);
        });

        const loadAgain = vi.fn(async () => createStaticRulesets([FILTER_4]));
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], loadAgain), true);

        expect(loadAgain).toHaveBeenCalledOnce();
        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });
    });

    it('retries loading the rulesets of disabled filters when the loading is partial', async () => {
        const partialLoader = createPendingLoader();
        const service = await initServiceWithLoader(partialLoader.load);

        // The library skips a ruleset that fails to be created and still
        // resolves, so filter 4 is missing but the loading is not rejected.
        partialLoader.resolve([]);
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 0);
        });

        const loadAgain = vi.fn(async () => createStaticRulesets([FILTER_4]));
        service.updateConfigurationResult(createConfigurationResult([FILTER_2, FILTER_3], loadAgain), true);

        expect(loadAgain).toHaveBeenCalledOnce();
        expect(await getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        })).toEqual({ ok: true });
    });

    it('checks with the available counters if loading fails', async () => {
        const loader = createPendingLoader();
        await initServiceWithLoader(loader.load);

        const check = getListener(MessageType.CanEnableStaticFilterMv3)({
            type: MessageType.CanEnableStaticFilterMv3,
            data: { filterId: 4 },
        });

        loader.reject(new Error('loading failed'));

        expect(await check).toEqual({ ok: false, data: { type: 'static' } });
    });
});

/**
 * Dynamic counters reported by the configuration result.
 */
type DynamicCounts = NonNullable<ConfigurationResult['dynamicRules']>['counts'];

/**
 * Builds a configuration result with the given limitations and counters.
 *
 * @param overrides Limitations and counters to put into the result.
 *
 * @returns Configuration result stub.
 */
function createResultWithLimitations(overrides: {
    limitations?: NonNullable<ConfigurationResult['dynamicRules']>['limitations'];
    sessionLimitations?: ConfigurationResult['sessionRules'];
    counts?: DynamicCounts;
}): ConfigurationResult {
    return {
        staticFilters: [],
        loadDisabledStaticFilters: async () => [],
        loadDisabledStaticFilter: async () => undefined,
        sessionRules: overrides.sessionLimitations,
        dynamicRules: {
            counts: overrides.counts ?? { total: 0, unsafe: 0, regexp: 0 },
            ...(overrides.limitations ? { limitations: overrides.limitations } : {}),
        },
    } as unknown as ConfigurationResult;
}

/**
 * Counters returned by the rules limits counters message.
 */
type RulesLimitsCounters = {
    dynamicRulesEnabledCount: number;
    dynamicRulesUnsafeEnabledCount: number;
    dynamicRulesRegexpsEnabledCount: number;
};

describe.skipIf(!__IS_MV3__)('RulesLimitsService configuration result limitations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSettingsStorageGet.mockReturnValue(false);
        mockRulesLimitsStorageGetData.mockReturnValue([]);
        mockGetEnabledFiltersWithMetadata.mockReturnValue([]);
        mockGetEnabledRulesets.mockResolvedValue([]);
        mockGetSessionRules.mockResolvedValue([]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(1000);
    });

    /**
     * Creates a service with the given configuration result.
     *
     * @param result Configuration result.
     */
    async function initServiceWithResult(result: ConfigurationResult): Promise<void> {
        const service = new RulesLimitsService();
        await service.init();
        service.updateConfigurationResult(result, true);
    }

    it('reports a session unsafe overflow as a built-in rules limit', async () => {
        // The payload reports the count of unsafe session rules which can be
        // applied, not the raw quota: ids 1..6 are reserved for stealth rules.
        await initServiceWithResult(createResultWithLimitations({
            sessionLimitations: {
                limitations: [new TooManyUnsafeRulesError('session', [1, 2], 4994, 2)],
            },
        }));

        const result = await getListener(MessageType.CurrentLimitsMv3)();

        expect(result).toEqual({
            ok: false,
            staticFiltersData: {
                type: 'static',
                rulesSessionCount: { current: 4996, maximum: 4994 },
            },
        });
    });

    it('reports a session regexp overflow with the regexp warning', async () => {
        await initServiceWithResult(createResultWithLimitations({
            sessionLimitations: {
                limitations: [new TooManyRegexpRulesError('session', [3], 1000, 1)],
            },
        }));

        const result = await getListener(MessageType.CurrentLimitsMv3)();

        expect(result).toEqual({
            ok: false,
            staticFiltersData: {
                type: 'static',
                rulesRegexpsCount: { current: 1001, maximum: 1000 },
            },
        });
    });

    it('reports the final dynamic counters from the configuration result', async () => {
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 4, regexp: 2 },
        }));

        const counters = await getListener(MessageType.GetRulesLimitsCountersMv3)() as RulesLimitsCounters;

        expect(counters.dynamicRulesEnabledCount).toBe(10);
        expect(counters.dynamicRulesUnsafeEnabledCount).toBe(4);
        expect(counters.dynamicRulesRegexpsEnabledCount).toBe(2);
    });

    it('adds the excluded dynamic rules to the unsafe counter', async () => {
        // One source rule id can stand for several declarative rules
        // (`$removeheader` groups them), so the counter must use the
        // declarative count instead of the id count.
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 4999, regexp: 0 },
            limitations: [new TooManyUnsafeRulesError('dynamic', [1], 5000, 2)],
        }));

        const counters = await getListener(MessageType.GetRulesLimitsCountersMv3)() as RulesLimitsCounters;

        expect(counters.dynamicRulesUnsafeEnabledCount).toBe(5001);
    });

    it('adds the excluded dynamic rules to the regexp counter', async () => {
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 0, regexp: 998 },
            limitations: [new TooManyRegexpRulesError('dynamic', [5], 1000, 2)],
        }));

        const counters = await getListener(MessageType.GetRulesLimitsCountersMv3)() as RulesLimitsCounters;

        expect(counters.dynamicRulesRegexpsEnabledCount).toBe(1000);
    });

    it('keeps session limitations out of the dynamic counters', async () => {
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 4, regexp: 2 },
            sessionLimitations: {
                limitations: [new TooManyUnsafeRulesError('session', [1, 2], 4994, 2)],
            },
        }));

        const counters = await getListener(MessageType.GetRulesLimitsCountersMv3)() as RulesLimitsCounters;

        expect(counters.dynamicRulesEnabledCount).toBe(10);
        expect(counters.dynamicRulesUnsafeEnabledCount).toBe(4);
        expect(counters.dynamicRulesRegexpsEnabledCount).toBe(2);
    });

    it('reports a dynamic unsafe overflow only in the dynamic scope', async () => {
        // Rebuilt `$csp` rules of user rules land in `dynamicRules.limitations`,
        // so such an overflow must not produce a static warning.
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 4999, regexp: 0 },
            limitations: [new TooManyUnsafeRulesError('dynamic', [7, 8], 5000, 2)],
        }));

        const result = await getListener(MessageType.CurrentLimitsMv3)();

        expect(result).toEqual({
            ok: false,
            dynamicRulesData: {
                type: 'dynamic',
                rulesUnsafeCount: { current: 5001, maximum: 5000 },
            },
        });
    });

    it('reports each scope once when the same error class overflows both', async () => {
        // The two lists come from different quotas, so both warnings are
        // expected, but neither scope may leak its excluded rules into the other.
        await initServiceWithResult(createResultWithLimitations({
            counts: { total: 10, unsafe: 4999, regexp: 0 },
            limitations: [new TooManyUnsafeRulesError('dynamic', [7, 8], 5000, 2)],
            sessionLimitations: {
                limitations: [new TooManyUnsafeRulesError('session', [1, 2, 3], 4994, 3)],
            },
        }));

        const result = await getListener(MessageType.CurrentLimitsMv3)();

        expect(result).toEqual({
            ok: false,
            staticFiltersData: {
                type: 'static',
                rulesSessionCount: { current: 4997, maximum: 4994 },
            },
            dynamicRulesData: {
                type: 'dynamic',
                rulesUnsafeCount: { current: 5001, maximum: 5000 },
            },
        });
    });

    it('sums the rules dropped by both session quotas', async () => {
        // A rule dropped by the regexp quota never takes an id, so the unsafe
        // error alone would undercount the requested rules.
        await initServiceWithResult(createResultWithLimitations({
            sessionLimitations: {
                limitations: [
                    new TooManyUnsafeRulesError('session', [1, 2], 4994, 2),
                    new TooManyRegexpRulesError('session', [3], 1000, 5),
                ],
            },
        }));

        const result = await getListener(MessageType.CurrentLimitsMv3)();

        expect(result).toEqual({
            ok: false,
            staticFiltersData: {
                type: 'static',
                rulesSessionCount: { current: 5001, maximum: 4994 },
            },
        });
    });
});
