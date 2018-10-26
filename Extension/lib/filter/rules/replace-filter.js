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
    /**
     * Filter for replace filter rules
     * @param rules
     * @constructor
     */
    api.ReplaceFilter = function (rules) {
        const replaceWhiteFilter = new api.UrlFilterRuleLookupTable();
        const replaceBlockFilter = new api.UrlFilterRuleLookupTable();

        /**
         * Add rule to replace filter
         * @param rule Rule object
         */
        function addRule(rule) {
            if (rule.whiteListRule) {
                replaceWhiteFilter.addRule(rule);
            } else {
                replaceBlockFilter.addRule(rule);
            }
        }

        /**
         * Add rules to replace filter
         * @param rules Array of rules
         */
        function addRules(rules) {
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                addRule(rule);
            }
        }

        /**
         * Remove rule from replace filter
         * @param rule Rule object
         */
        function removeRule(rule) {
            if (rule.whiteListRule) {
                replaceWhiteFilter.removeRule(rule);
            } else {
                replaceWhiteFilter.removeRule(rule);
            }
        }

        /**
         * Returns rules from replace filter
         * @returns rules Array of rules
         */
        function getRules() {
            const whiteRules = replaceWhiteFilter.getRules();
            const blockRules = replaceBlockFilter.getRules();
            return whiteRules.concat(blockRules);
        }

        function findReplaceRules(url, documentHost, thirdParty, requestType) {
            // TODO return rules with priority
            const whiteRules = replaceWhiteFilter.findRules(url, documentHost, thirdParty, requestType);
            if (whiteRules) {
                return whiteRules;
            }
            const blockRules = replaceBlockFilter.findRules(url, documentHost, thirdParty, requestType);
            if (blockRules) {
                return blockRules;
            }
            return null;
        }

        if (rules) {
            addRules(rules);
        }

        return {
            addRules: addRules,
            addRule: addRule,
            removeRule: removeRule,
            getRules: getRules,
            findReplaceRules: findReplaceRules,
        };
    };
})(adguard, adguard.rules);
