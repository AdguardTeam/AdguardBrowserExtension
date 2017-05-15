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
     * Filter for CSP filter rules
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/685
     */
    api.CspFilter = function (rules) {

        var cspWhiteFilter = new api.UrlFilterRuleLookupTable();
        var cspBlockFilter = new api.UrlFilterRuleLookupTable();

        /**
         * Add rules to CSP filter
         * @param rules Collection of $csp rules
         */
        function addRules(rules) {
            for (var i = 0; i < rules.length; i++) {
                addRule(rules[i]);
            }
        }

        /**
         * Add rule to CSP filter
         * @param rule Rule object
         */
        function addRule(rule) {
            if (rule.whiteListRule) {
                cspWhiteFilter.addRule(rule);
            } else {
                cspBlockFilter.addRule(rule);
            }
        }

        /**
         * Removes from CSP filter
         * @param rule Rule to remove
         */
        function removeRule(rule) {
            if (rule.whiteListRule) {
                cspWhiteFilter.removeRule(rule);
            } else {
                cspBlockFilter.removeRule(rule);
            }
        }

        function getRules() {
            var rules = cspWhiteFilter.getRules();
            return rules.concat(cspBlockFilter.getRules());
        }

        /**
         * Searches for rules matching specified request.
         * It worth noting that rules will be filtered by whitelist $csp rules.
         * @param url URL
         * @param documentHost Document Host
         * @param thirdParty true if request is third-party
         * @returns Matching rules
         */
        function findCspRules(url, documentHost, thirdParty) {

            var i, rule;

            var whiteRules = cspWhiteFilter.findRules(url, documentHost, thirdParty, adguard.RequestTypes.CSP);

            var whitelisted = Object.create(null);

            // Collect whitelisted CSP directives
            if (whiteRules) {
                for (i = 0; i < whiteRules.length; i++) {
                    rule = whiteRules[i];
                    if (!rule.cspDirective) { // Global whitelist rule
                        return null;
                    }
                    whitelisted[rule.cspDirective] = true;
                }
            }

            var cspRules = null;

            var blockingRules = cspBlockFilter.findRules(url, documentHost, thirdParty, adguard.RequestTypes.CSP);

            // Collect blocking CSP directives which aren't in whitelist
            if (blockingRules) {
                for (i = 0; i < blockingRules.length; i++) {
                    rule = blockingRules[i];
                    if (rule.cspDirective in whitelisted) {
                        continue;
                    }
                    if (cspRules === null) {
                        cspRules = [];
                    }
                    cspRules.push(rule);
                }
            }

            return cspRules;
        }

        if (rules) {
            addRules(rules);
        }

        return {
            addRules: addRules,
            addRule: addRule,
            removeRule: removeRule,
            getRules: getRules,
            findCspRules: findCspRules
        };
    };

})(adguard, adguard.rules);