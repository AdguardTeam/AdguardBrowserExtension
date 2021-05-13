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
     * @param badFilterRules
     * @constructor
     */
    api.ReplaceFilter = function (rules, badFilterRules) {
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
                replaceBlockFilter.removeRule(rule);
            }
        }

        /**
         * Returns rules from replace filter
         * @returns {Array} array of rules
         */
        function getRules() {
            const whiteRules = replaceWhiteFilter.getRules();
            const blockRules = replaceBlockFilter.getRules();
            return whiteRules.concat(blockRules);
        }

        /**
         * Returns suitable white rule from the list of rules
         * @param whiteRules list of white rules
         * @param blockRule block rule
         * @returns {?object} suitable whiteRule or null
         */
        const getWhitelistingRule = (whiteRules, blockRule) => {
            for (let i = 0; i < whiteRules.length; i += 1) {
                const whiteRule = whiteRules[i];
                if (whiteRule.replaceOption.optionText === blockRule.replaceOption.optionText) {
                    return whiteRule;
                }
            }
            return null;
        };

        /**
         * Function returns filtered replace block rules
         * @param url
         * @param documentHost
         * @param thirdParty
         * @param requestType
         * @returns {?Array} array of filtered replace blockRules or null
         */
        function findReplaceRules(url, documentHost, thirdParty, requestType) {
            const blockRules = replaceBlockFilter.findRules(url, documentHost, thirdParty, requestType, badFilterRules);

            if (!blockRules) {
                return null;
            }

            const whiteRules = replaceWhiteFilter.findRules(url, documentHost, thirdParty, requestType, badFilterRules);
            if (!whiteRules) {
                return blockRules;
            }

            if (whiteRules.length > 0) {
                const whiteRulesWithEmptyOptionText = whiteRules.filter(whiteRule => whiteRule.replaceOption.optionText === '');

                // @@||example.org^$replace will disable all $replace rules matching ||example.org^.
                if (whiteRulesWithEmptyOptionText.length > 0) {
                    // return first matched rule
                    return whiteRulesWithEmptyOptionText.slice(0, 1);
                }

                const foundReplaceRules = [];
                blockRules.forEach((blockRule) => {
                    const whitelistingRule = getWhitelistingRule(whiteRules, blockRule);
                    if (whitelistingRule) {
                        foundReplaceRules.push(whitelistingRule);
                    } else {
                        foundReplaceRules.push(blockRule);
                    }
                });
                return foundReplaceRules;
            }

            return blockRules.length > 0 ? blockRules : null;
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
