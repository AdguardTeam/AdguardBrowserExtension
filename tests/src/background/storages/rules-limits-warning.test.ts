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

import { rulesLimitsWarningStorage } from '../../../../Extension/src/background/storages/rules-limits-warning';
import { GLOBAL_STATIC_RULE_LIMIT, RULES_LIMITS_WARNING_KEY } from '../../../../Extension/src/common/constants';
import { browserStorage } from '../../../../Extension/src/background/storages/shared-instances';

describe.skipIf(!__IS_MV3__)('RulesLimitsWarningStorage', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Clear storage and internal cache so each test starts fresh
        (rulesLimitsWarningStorage as unknown as { data: undefined }).data = undefined;
        await browserStorage.remove(RULES_LIMITS_WARNING_KEY);
    });

    describe('getState', () => {
        it('should return default state on first access', async () => {
            const state = await rulesLimitsWarningStorage.getState();
            expect(state.isDismissed).toBe(false);
            expect(state.dismissedAtStaticRulesMax).toBe(GLOBAL_STATIC_RULE_LIMIT);
        });

        it('should return cached state on subsequent access', async () => {
            await rulesLimitsWarningStorage.dismiss(300000);
            const state = await rulesLimitsWarningStorage.getState();
            expect(state.isDismissed).toBe(true);
            expect(state.dismissedAtStaticRulesMax).toBe(300000);
        });
    });

    describe('dismiss', () => {
        it('should mark warning as dismissed with current count', async () => {
            await rulesLimitsWarningStorage.dismiss(295000);
            const state = await rulesLimitsWarningStorage.getState();
            expect(state.isDismissed).toBe(true);
            expect(state.dismissedAtStaticRulesMax).toBe(295000);
        });

        it('should allow dismissing multiple times with different counts', async () => {
            await rulesLimitsWarningStorage.dismiss(300000);
            await rulesLimitsWarningStorage.dismiss(280000);
            const state = await rulesLimitsWarningStorage.getState();
            expect(state.dismissedAtStaticRulesMax).toBe(280000);
        });
    });

    describe('shouldShowWarning', () => {
        it('should return false when pool is above limit', async () => {
            const result = await rulesLimitsWarningStorage.shouldShowWarning(315000);
            expect(result).toBe(false);
        });

        it('should return true when pool is below limit and not dismissed', async () => {
            const result = await rulesLimitsWarningStorage.shouldShowWarning(295000);
            expect(result).toBe(true);
        });

        it('should return false when pool is below limit but dismissed at same count', async () => {
            await rulesLimitsWarningStorage.dismiss(295000);
            const result = await rulesLimitsWarningStorage.shouldShowWarning(295000);
            expect(result).toBe(false);
        });

        it('should return true when pool is below limit and dismissed at different count', async () => {
            await rulesLimitsWarningStorage.dismiss(300000);
            const result = await rulesLimitsWarningStorage.shouldShowWarning(280000);
            expect(result).toBe(true);
        });

        it('should return false when pool is exactly at limit', async () => {
            const result = await rulesLimitsWarningStorage.shouldShowWarning(310000);
            expect(result).toBe(false);
        });
    });
});
