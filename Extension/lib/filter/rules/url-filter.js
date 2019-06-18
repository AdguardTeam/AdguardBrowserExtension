/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

(function (api) {
    'use strict';

    /**
     * Filter for Url filter rules.
     * Read here for details:
     * http://adguard.com/en/filterrules.html#baseRules
     */
    const UrlFilter = function (rules, badFilterRules) {
        this.basicRulesTable = new api.UrlFilterRuleLookupTable();
        this.badFilterRules = badFilterRules;

        if (rules) {
            for (let i = 0; i < rules.length; i += 1) {
                this.addRule(rules[i]);
            }
        }
    };

    UrlFilter.prototype = {

        /**
         * Adds rule to UrlFilter
         *
         * @param rule Rule object
         */
        addRule(rule) {
            this.basicRulesTable.addRule(rule);
        },

        /**
         * Removes rule from UrlFilter
         *
         * @param rule Rule to remove
         */
        removeRule(rule) {
            this.basicRulesTable.removeRule(rule);
        },

        /**
         * Searches for first rule matching specified request
         *
         * @param url           Request url
         * @param documentHost  Document host
         * @param requestType   Request content type (UrlFilterRule.contentTypes)
         * @param thirdParty    true if request is third-party
         * @param skipGenericRules    skip generic rules
         * @return matching rule or null if no match found
         */
        isFiltered(url, documentHost, requestType, thirdParty, skipGenericRules) {
            return this.basicRulesTable.findRule(url,
                documentHost,
                thirdParty,
                requestType,
                !skipGenericRules,
                this.badFilterRules);
        },

        /**
         * Returns the array of loaded rules
         */
        getRules() {
            return this.basicRulesTable.getRules();
        },
    };

    api.UrlFilter = UrlFilter;
})(adguard.rules);
