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
     * Returns rule priority
     * @param rule CSP rule
     */
    function getRulePriority(rule) {
        if (!rule) {
            return 0;
        }
        if (rule.whiteListRule && rule.isImportant) {
            return 4;
        } else if (rule.isImportant) {
            return 3;
        } else if (rule.whiteListRule) {
            return 2;
        }
        return 1;
    }

    /**
     * Decides which rule should be put into the given map.
     * Compares priorities of the two given rules with the equal CSP directive and the rule that may already in the map.
     *
     * @param rule CSP rule (not null)
     * @param whiteListRule CSP whitelist rule (may be null)
     * @param map Rules mapped by csp directive
     */
    function putWithPriority(rule, whiteListRule, map) {

        var cspDirective = rule.cspDirective;
        var existRule = map[cspDirective];

        var pr1 = getRulePriority(rule);
        var pr2 = getRulePriority(whiteListRule);
        var pr3 = getRulePriority(existRule);

        var max = Math.max(pr1, pr2, pr3);
        if (max === pr1) {
            map[cspDirective] = rule;
        } else if (max === pr2) {
            map[cspDirective] = whiteListRule;
        } else if (max === pr3) {
            map[cspDirective] = existRule;
        }
    }

    /**
     * Filter for CSP filter rules
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/685
     */
    api.CspFilter = function (rules, badFilterRules) {

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
         * Searches for CSP rules matching specified request.
         * It worth noting that all (blocked and whitelisted!) CSP rules will be returned: client should select which CSP rules will be added to headers.
         * @param url URL
         * @param documentHost Document Host
         * @param thirdParty true if request is third-party
         * @param requestType   Request content type. $CSP rules are applied only at DOCUMENT or SUB_DOCUMENT levels.
         * @returns Matching rules
         */
        function findCspRules(url, documentHost, thirdParty, requestType) {

            /**
             * CSP rules support only $SUBDOCUMENT and $DOCUMENT request type modifiers.
             * If it presents, we should match this rule when an iframe is loaded.
             * If a main_frame is loaded we should match rules without $SUBDOCUMENT modifier (or with negation $~SUBDOCUMENT)
             * So if we pass `adguard.RequestTypes.OTHER` we won't match rules with $SUBDOCUMENT modifier, as we expected
             *
             * For example:
             * rule1 = '||$csp'
             * rule2 = '||$csp,subdocument'
             * rule3 = '||$csp,~subdocument'
             * findCspRules(adguard.RequestTypes.SUBDOCUMENT) = [rule1, rule2];
             * findCspRules(adguard.RequestTypes.DOCUMENT) = [rule1, rule3];
             * view test "CSP rules are found correctly"
             */
            if (requestType !== adguard.RequestTypes.DOCUMENT
                && requestType !== adguard.RequestTypes.SUBDOCUMENT) {
                requestType = adguard.RequestTypes.OTHER;
            }

            var whiteRules = cspWhiteFilter.findRules(url, documentHost, thirdParty, requestType, badFilterRules);

            var whitelistedRulesByDirective = Object.create(null);

            var i, rule;

            // Collect whitelisted CSP rules
            if (whiteRules) {
                for (i = 0; i < whiteRules.length; i++) {
                    rule = whiteRules[i];
                    if (!rule.cspDirective) { // Global whitelist rule
                        return [rule];
                    }
                    putWithPriority(rule, null, whitelistedRulesByDirective);
                }
            }

            var blockingRules = cspBlockFilter.findRules(url, documentHost, thirdParty, requestType, badFilterRules);

            var rulesByDirective = Object.create(null);

            // Collect whitelist and blocking CSP rules in one array
            if (blockingRules) {

                for (i = 0; i < blockingRules.length; i++) {
                    rule = blockingRules[i];
                    var whiteListRule = whitelistedRulesByDirective[rule.cspDirective];
                    putWithPriority(rule, whiteListRule, rulesByDirective);
                }
            }

            var cspRules = [];
            Object.keys(rulesByDirective).forEach(function (key) {
                cspRules.push(rulesByDirective[key]);
            });
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

    api.CspFilter.DEFAULT_DIRECTIVE = 'connect-src http: https:; frame-src http: https:; child-src http: https:';

})(adguard, adguard.rules);
