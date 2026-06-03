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

import { RULES_LIMITS_WARNING_KEY } from '../../common/constants';
import { logger } from '../../common/logger';
import { getZodErrorMessage } from '../../common/error';
import { rulesLimitsWarningStorageDataValidator, type RulesLimitsWarningStorageData } from '../schema/rules-limits';
import { StringStorage } from '../utils/string-storage';

import { browserStorage } from './shared-instances';

/**
 * Global static DNR rule pool limit.
 * If staticRulesMaximumCount drops below this — other extensions are
 * consuming the pool and we show a warning.
 */
export const GLOBAL_STATIC_RULE_LIMIT = 310000;

/**
 * Storage for the rules limits warning dismissal state.
 * Tracks whether the user dismissed the warning and at what staticRulesMaximumCount.
 * When the count changes (and limit is still lowered), the warning is re-shown.
 */
class RulesLimitsWarningStorage extends StringStorage<
    typeof RULES_LIMITS_WARNING_KEY,
    RulesLimitsWarningStorageData,
    'async'
> {
    /**
     * Creates a new RulesLimitsWarningStorage instance.
     */
    constructor() {
        super(RULES_LIMITS_WARNING_KEY, browserStorage);
    }

    /**
     * Returns cached state or loads from storage on first access.
     *
     * @returns Cached state or loaded from storage.
     */
    public async getState(): Promise<RulesLimitsWarningStorageData> {
        if (this.data !== undefined) {
            return this.data;
        }

        try {
            const stored = await this.read();
            if (typeof stored === 'string') {
                const parsed = rulesLimitsWarningStorageDataValidator.parse(JSON.parse(stored));
                this.setCache(parsed);

                return parsed;
            }
        } catch (e) {
            logger.warn(
                '[ext.RulesLimitsWarningStorage.getState]: cannot parse state, using defaults:',
                getZodErrorMessage(e),
            );
        }

        const defaults = rulesLimitsWarningStorageDataValidator.parse(undefined);
        this.setCache(defaults);

        return defaults;
    }

    /**
     * Dismisses the warning and records the current staticRulesMaximumCount.
     *
     * @param staticRulesMaximumCount The current effective maximum of static rules.
     */
    public async dismiss(staticRulesMaximumCount: number): Promise<void> {
        await this.setData({
            isDismissed: true,
            dismissedAtStaticRulesMax: staticRulesMaximumCount,
        });
    }

    /**
     * Checks whether the warning should be shown.
     * The warning is shown if:
     * - the effective pool limit is below {@link GLOBAL_STATIC_RULE_LIMIT}
     *   (other extensions are consuming it), and
     * - it was never dismissed, or
     * - it was dismissed but the staticRulesMaximumCount has changed since
     *   dismissal (meaning the situation changed — new extensions
     *   installed/removed).
     *
     * @param staticRulesMaximumCount The current effective maximum of static rules.
     *
     * @returns True if the warning should be shown.
     */
    public async shouldShowWarning(staticRulesMaximumCount: number): Promise<boolean> {
        if (staticRulesMaximumCount >= GLOBAL_STATIC_RULE_LIMIT) {
            return false;
        }

        const state = await this.getState();

        if (!state.isDismissed) {
            return true;
        }

        if (state.dismissedAtStaticRulesMax !== staticRulesMaximumCount) {
            await this.setData({
                isDismissed: false,
                dismissedAtStaticRulesMax: staticRulesMaximumCount,
            });
            return true;
        }

        return false;
    }
}

export const rulesLimitsWarningStorage = new RulesLimitsWarningStorage();
