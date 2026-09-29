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

import { type ConfigurationResult } from '@adguard/tswebextension/mv3';

import { MessageType } from '../../../../../Extension/src/common/messages/constants';

// Create hoisted mocks for use inside vi.mock() factories.
const {
    mockSettingsStorageGet,
    mockRulesLimitsStorageGetData,
    mockGetEnabledFiltersWithMetadata,
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
 * Creates a configuration result whose static filters report the given counts.
 *
 * @param rulesets Counts per static ruleset.
 *
 * @returns Configuration result stub.
 */
function createConfigurationResult(rulesets: StaticRulesetCounts[]): ConfigurationResult {
    const staticFilters = rulesets.map((counts) => ({
        getId: () => rulesetName(counts.filterId),
        getSafeRulesCount: () => counts.safeRulesCount,
        getUnsafeRulesCount: () => counts.unsafeRulesCount,
        getRegexpRulesCount: () => counts.regexpRulesCount,
        getMetadataRulesCount: () => counts.metadataRulesCount,
    }));

    return { staticFilters } as unknown as ConfigurationResult;
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
});
