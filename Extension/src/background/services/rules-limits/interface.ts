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

/**
 * Interface for rules limits.
 */
export interface IRulesLimits {
    /**
     * How many dynamic rules are enabled in the browser.
     */
    dynamicRulesEnabledCount: number;

    /**
     * Maximum count of the dynamic rules, which can be enabled in the browser.
     */
    dynamicRulesMaximumCount: number;

    /**
     * How many user regexp rules are enabled in the browser.
     */
    dynamicRulesRegexpsEnabledCount: number;

    /**
     * Maximum count of the user regexp rules, which can be enabled in the browser.
     */
    dynamicRulesRegexpsMaximumCount: number;

    /**
     * How many static filters are enabled in the browser.
     */
    staticFiltersEnabledCount: number;

    /**
     * Maximum count of the static filters, which can be enabled in the browser.
     */
    staticFiltersMaximumCount: number;

    /**
     * How many static rules are enabled in the browser.
     */
    staticRulesEnabledCount: number;

    /**
     * Maximum count of the static rules, which can be enabled in the browser.
     */
    staticRulesMaximumCount: number;

    /**
     * How many static regexp rules are enabled in the browser.
     */
    staticRulesRegexpsEnabledCount: number;

    /**
     * Maximum count of the static regexp rules, which can be enabled in the browser.
     */
    staticRulesRegexpsMaxCount: number;

    /**
     * List of actually enabled filters ids.
     */
    actuallyEnabledFilters: number[];

    /**
     * List of expected enabled filters ids.
     */
    expectedEnabledFilters: number[];
}
