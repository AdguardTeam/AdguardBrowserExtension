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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import browser from 'sinon-chrome';

import { type ConfigurationResult } from '@adguard/tswebextension/mv3';
import { type IRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';

// Mock messageHandler before importing the service, because
// the service module imports it at the top level.
vi.mock('../../../../../Extension/src/background/message-handler', () => ({
    messageHandler: { addListener: vi.fn() },
}));

// Mock storages to avoid side effects.
vi.mock('../../../../../Extension/src/background/storages/rules-limits', () => ({
    rulesLimitsStorage: {
        read: vi.fn().mockResolvedValue(JSON.stringify([])),
        setData: vi.fn().mockResolvedValue(undefined),
        setCache: vi.fn(),
        getData: vi.fn().mockReturnValue([]),
    },
}));

vi.mock('../../../../../Extension/src/background/storages', () => ({
    filterStateStorage: {
        enableFilters: vi.fn(),
        disableFilters: vi.fn(),
    },
    settingsStorage: {
        get: vi.fn().mockReturnValue(false),
    },
}));

vi.mock('../../../../../Extension/src/background/api', () => ({
    Categories: {},
    FiltersApi: {
        getEnabledFiltersWithMetadata: vi.fn().mockReturnValue([]),
    },
    iconsApi: { update: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../../../Extension/src/background/utils/arrays-are-equal', () => ({
    arraysAreEqual: vi.fn((a: number[], b: number[]) => {
        if (a.length !== b.length) {
            return false;
        }
        const sorted1 = [...a].sort();
        const sorted2 = [...b].sort();
        return sorted1.every((v, i) => v === sorted2[i]);
    }),
}));

// eslint-disable-next-line
import { RulesLimitsService } from '../../../../../Extension/src/background/services/rules-limits/rules-limits-service-mv3';

const RULESET_PREFIX = 'ruleset_';

/**
 * Creates a fake IRuleSet stub for testing.
 *
 * @param filterId The filter ID.
 * @param rulesCount Number of rules.
 * @param regexpRulesCount Number of regexp rules.
 *
 * @returns A partial IRuleSet with the needed methods.
 */
function createFakeRuleSet(filterId: number, rulesCount: number, regexpRulesCount: number): IRuleSet {
    return {
        getId: () => `${RULESET_PREFIX}${filterId}`,
        getRulesCount: () => rulesCount,
        getRegexpRulesCount: () => regexpRulesCount,
        getUnsafeRulesCount: () => 0,
        getRulesById: vi.fn().mockResolvedValue([]),
        getBadFilterRules: vi.fn().mockResolvedValue([]),
        getDeclarativeRules: vi.fn().mockResolvedValue([]),
        getSourceMap: vi.fn().mockResolvedValue(new Map()),
        getFilterList: vi.fn().mockResolvedValue(''),
        serialize: vi.fn().mockResolvedValue(new Uint8Array()),
        getRulesHashMap: vi.fn().mockResolvedValue(new Map()),
        close: vi.fn(),
    } as unknown as IRuleSet;
}

/**
 * Creates a minimal ConfigurationResult with the given static filters.
 *
 * @param staticFilters Array of IRuleSet stubs.
 *
 * @returns A ConfigurationResult.
 */
function createConfigurationResult(staticFilters: IRuleSet[]): ConfigurationResult {
    return {
        staticFiltersStatus: { errors: [] },
        staticFilters,
    } as unknown as ConfigurationResult;
}

describe.skipIf(!__IS_MV3__)('RulesLimitsService - onGetRulesLimitsCounters', () => {
    let service: RulesLimitsService;
    let mockGetEnabledRulesets: ReturnType<typeof vi.fn>;
    let mockGetAvailableStaticRuleCount: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        service = new RulesLimitsService();

        mockGetEnabledRulesets = vi.fn();
        mockGetAvailableStaticRuleCount = vi.fn();

        // Set up declarativeNetRequest mocks on the global chrome object
        // (which is assigned from sinon-chrome in vitest.setup.ts).
        // @ts-ignore
        Object.assign(browser.declarativeNetRequest, {
            getEnabledRulesets: mockGetEnabledRulesets,
            getAvailableStaticRuleCount: mockGetAvailableStaticRuleCount,
            MAX_NUMBER_OF_ENABLED_STATIC_RULESETS: 50,
        });
    });

    it('returns undefined when configurationResult is not set', async () => {
        // Access the private method for testing.
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = await service['onGetRulesLimitsCounters']();
        expect(result).toBeUndefined();
    });

    it('uses actually-enabled rulesets for static counts, not settings-based filters', async () => {
        // Settings say filters 1, 2, 3 are enabled (3 filters).
        // Chrome only enabled filters 1, 2 (filter 3 was rejected).
        const staticFilters = [
            createFakeRuleSet(1, 10000, 50),
            createFakeRuleSet(2, 20000, 100),
            createFakeRuleSet(3, 15000, 75),
        ];
        const configResult = createConfigurationResult(staticFilters);
        service.updateConfigurationResult(configResult, true);

        // Chrome says only filters 1 and 2 are actually enabled.
        mockGetEnabledRulesets.mockResolvedValue([
            `${RULESET_PREFIX}1`,
            `${RULESET_PREFIX}2`,
        ]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(120000);

        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = await service['onGetRulesLimitsCounters']();

        expect(result).toBeDefined();
        // Enabled count = filter 1 (10000) + filter 2 (20000) = 30000
        // NOT 45000 (which would include rejected filter 3).
        expect(result!.staticRulesEnabledCount).toBe(30000);
        // Maximum = enabled (30000) + available (120000) = 150000
        expect(result!.staticRulesMaximumCount).toBe(150000);
        // Enabled filters count = 2 (not 3)
        expect(result!.staticFiltersEnabledCount).toBe(2);
        // Regexp rules = filter 1 (50) + filter 2 (100) = 150 (not 225)
        expect(result!.staticRulesRegexpsEnabledCount).toBe(150);
    });

    it('enabled count never exceeds maximum', async () => {
        const staticFilters = [
            createFakeRuleSet(1, 50000, 10),
            createFakeRuleSet(2, 80000, 20),
        ];
        const configResult = createConfigurationResult(staticFilters);
        service.updateConfigurationResult(configResult, true);

        mockGetEnabledRulesets.mockResolvedValue([
            `${RULESET_PREFIX}1`,
            `${RULESET_PREFIX}2`,
        ]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(20000);

        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = await service['onGetRulesLimitsCounters']();

        expect(result).toBeDefined();
        expect(result!.staticRulesEnabledCount).toBeLessThanOrEqual(result!.staticRulesMaximumCount);
    });

    it('handles zero enabled filters', async () => {
        const staticFilters = [
            createFakeRuleSet(1, 10000, 50),
        ];
        const configResult = createConfigurationResult(staticFilters);
        service.updateConfigurationResult(configResult, true);

        mockGetEnabledRulesets.mockResolvedValue([]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(300000);

        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = await service['onGetRulesLimitsCounters']();

        expect(result).toBeDefined();
        expect(result!.staticRulesEnabledCount).toBe(0);
        expect(result!.staticFiltersEnabledCount).toBe(0);
        expect(result!.staticRulesRegexpsEnabledCount).toBe(0);
        expect(result!.staticRulesMaximumCount).toBe(300000);
    });

    it('returns correct actually-enabled filter IDs', async () => {
        const staticFilters = [
            createFakeRuleSet(1, 5000, 10),
            createFakeRuleSet(2, 5000, 10),
            createFakeRuleSet(3, 5000, 10),
        ];
        const configResult = createConfigurationResult(staticFilters);
        service.updateConfigurationResult(configResult, true);

        mockGetEnabledRulesets.mockResolvedValue([
            `${RULESET_PREFIX}1`,
            `${RULESET_PREFIX}3`,
        ]);
        mockGetAvailableStaticRuleCount.mockResolvedValue(290000);

        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = await service['onGetRulesLimitsCounters']();

        expect(result).toBeDefined();
        expect(result!.actuallyEnabledFilters).toEqual([1, 3]);
        expect(result!.staticFiltersEnabledCount).toBe(2);
        expect(result!.staticRulesEnabledCount).toBe(10000);
    });
});
