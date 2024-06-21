/**
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
    type InvalidDynamicResultData,
    type InvalidStaticResultData,
} from '../../../../background/services/rules-limits/interface';
import { translator } from '../../../../common/translators/translator';

/**
 * Returns a warning message based on the data.
 *
 * @param data Result of limits check of static rules.
 *
 * @returns Warning message or null if the data is invalid.
 */
export const getStaticWarningMessage = (data: InvalidStaticResultData): string | null => {
    const { filtersCount, rulesCount, rulesRegexpsCount } = data;

    if (filtersCount) {
        if (filtersCount.expected !== undefined && filtersCount.current !== undefined) {
            return translator.getMessage('options_all_limits_exceeded_warning', {
                current: filtersCount.current,
                expected: filtersCount.expected,
            });
        }

        if (filtersCount.maximum !== undefined && filtersCount.current !== undefined) {
            return translator.getMessage('options_limits_warning_static_filters', {
                current: filtersCount.current,
                maximum: filtersCount.maximum,
            });
        }
    }

    if (rulesCount) {
        return translator.getMessage('options_limits_warning_static_rules', {
            current: rulesCount.current,
            maximum: rulesCount.maximum,
        });
    }

    if (rulesRegexpsCount) {
        return translator.getMessage('options_limits_warning_static_regex_rules', {
            current: rulesRegexpsCount.current,
            maximum: rulesRegexpsCount.maximum,
        });
    }

    return null;
};

/**
 * Returns a warning message based on the data.
 *
 * @param data Result of limits check of dynamic rules.
 *
 * @returns Warning message or null if the data is invalid.
 */
export const getDynamicWarningMessage = (data: InvalidDynamicResultData): string | null => {
    const { rulesCount, rulesRegexpsCount } = data;

    if (rulesCount) {
        return translator.getMessage('options_limits_warning_dynamic_rules', {
            current: rulesCount.current,
            maximum: rulesCount.maximum,
        });
    }

    if (rulesRegexpsCount) {
        return translator.getMessage('options_limits_warning_dynamic_regex_rules', {
            current: rulesRegexpsCount.current,
            maximum: rulesRegexpsCount.maximum,
        });
    }

    return null;
};
