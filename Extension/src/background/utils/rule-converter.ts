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

/* eslint-disable no-restricted-syntax */
import { RawRuleConverter } from '@adguard/agtree';

import { Log } from '../../common/log';

/**
 * Represents a converted filter list.
 */
export interface ConvertedFilter {
    /**
     * Converted filter rules.
     */
    filter: string[];

    /**
     * Map of converted rules to original rules. We use a simple object here, because extension storage
     * doesn't support Map.
     */
    conversionMap: { [key: string]: string };
}

/**
 * Utility class for converting rules to AdGuard format.
 */
export class FilterConverter {
    /**
     * Converts a list of rules to AdGuard format where it's possible
     * and returns the converted rules and the mapping between the original
     * and converted rules.
     *
     * @param filter Rules to convert.
     * @returns A {@link ConvertedFilter} object.
     */
    public static convertFilter(filter: string[]): ConvertedFilter {
        const result: ConvertedFilter = {
            filter: [],
            conversionMap: {},
        };

        for (const ruleText of filter) {
            try {
                // Just store empty rules as is
                if (!ruleText.trim()) {
                    result.filter.push(ruleText);
                    continue;
                }

                // Parse the rule and convert it to AdGuard format
                // Please note that one rule can be converted to multiple rules
                const conversionResult = RawRuleConverter.convertToAdg(ruleText);

                if (conversionResult.isConverted) {
                    for (const convertedRuleText of conversionResult.result) {
                        // Store the converted rules and the mapping between the original and converted rules
                        result.conversionMap[convertedRuleText] = ruleText;

                        // Store the converted rule in the filter list
                        result.filter.push(convertedRuleText);
                    }

                    Log.debug(`Converted rule: ${ruleText} -> ${conversionResult.result.join(', ')}`);
                } else {
                    // Store the original rule in the filter list
                    result.filter.push(ruleText);
                }
            } catch (error: unknown) {
                Log.error(`Failed to convert rule: ${ruleText}`, error);

                // Store the rule as is, we'll handle it later
                result.filter.push(ruleText);
            }
        }

        return result;
    }
}
