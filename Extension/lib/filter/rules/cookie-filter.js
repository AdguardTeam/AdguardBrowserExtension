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

(function (adguard, api) {

    'use strict';

    /**
     * Filter for cookie filter rules
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/961
     */
    api.CookieFilter = function (rules) {

        var cookieWhiteFilter = new api.UrlFilterRuleLookupTable();
        var cookieBlockFilter = new api.UrlFilterRuleLookupTable();

        /**
         * Add rules to filter
         * @param rules Collection of rules
         */
        function addRules(rules) {
            for (var i = 0; i < rules.length; i++) {
                addRule(rules[i]);
            }
        }

        /**
         * Add rule to filter
         * @param rule Rule object
         */
        function addRule(rule) {
            if (rule.whiteListRule) {
                cookieWhiteFilter.addRule(rule);
            } else {
                cookieBlockFilter.addRule(rule);
            }
        }

        /**
         * Removes from filter
         * @param rule Rule to remove
         */
        function removeRule(rule) {
            if (rule.whiteListRule) {
                cookieWhiteFilter.removeRule(rule);
            } else {
                cookieBlockFilter.removeRule(rule);
            }
        }

        /**
         * All rules in filter
         *
         * @returns {*|Array.<T>|string|Buffer}
         */
        function getRules() {
            var rules = cookieWhiteFilter.getRules();
            return rules.concat(cookieBlockFilter.getRules());
        }

        /**
         * Searches for rules matching specified request.
         *
         * @param url           URL
         * @param documentHost  Document Host
         * @param thirdParty    true if request is third-party
         * @param requestType   Request content type
         * @returns             Matching rules
         */
        function findCookieRules(url, documentHost, thirdParty, requestType) {
            //TODO: Implement

            return getRules();
        }

        if (rules) {
            addRules(rules);
        }

        return {
            addRules: addRules,
            addRule: addRule,
            removeRule: removeRule,
            getRules: getRules,
            findCookieRules: findCookieRules
        };
    };

})(adguard, adguard.rules);