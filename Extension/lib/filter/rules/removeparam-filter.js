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
     * Filter for removeparam filter rules
     * @param rules
     * @param badFilterRules
     * @constructor
     */
    api.RemoveparamFilter = function RemoveparamFilter(rules, badFilterRules) {
        const allowlistTable = new api.UrlFilterRuleLookupTable();
        const blocklistTable = new api.UrlFilterRuleLookupTable();

        /**
         * Add rule to removeparam filter
         * @param rule Rule object
         */
        function addRule(rule) {
            if (rule.whiteListRule) {
                allowlistTable.addRule(rule);
            } else {
                blocklistTable.addRule(rule);
            }
        }

        /**
         * Add rules to removeparam filter
         * @param rules Array of rules
         */
        function addRules(rules) {
            for (let i = 0; i < rules.length; i += 1) {
                const rule = rules[i];
                addRule(rule);
            }
        }

        /**
         * Remove rule from removeparam filter
         * @param rule Rule object
         */
        function removeRule(rule) {
            if (rule.whiteListRule) {
                allowlistTable.removeRule(rule);
            } else {
                blocklistTable.removeRule(rule);
            }
        }

        /**
         * Returns rules from removeparam filter
         * @returns {Array} array of rules
         */
        function getRules() {
            const allowRules = allowlistTable.getRules();
            const blockRules = blocklistTable.getRules();
            return allowRules.concat(blockRules);
        }

        /**
         * Returns suitable allow rule from the list of rules
         * @param allowRules list of allow rules
         * @param blockRule block rule
         * @returns {object|null} suitable allow rule or null
         */
        const getAllowlistingRule = (allowRules, blockRule) => {
            for (let i = 0; i < allowRules.length; i += 1) {
                const allowRule = allowRules[i];
                if (allowRule.removeparamOption.optionText === blockRule.removeparamOption.optionText) {
                    return allowRule;
                }
            }
            return null;
        };

        /**
         * Function returns filtered removeparam block rules
         * @param url
         * @param documentHost
         * @param thirdParty
         * @param requestType
         * @returns {Array|null} array of filtered removeparam rules or null
         */
        function findRemoveparamRules(url, documentHost, thirdParty, requestType) {
            const blockRules = blocklistTable.findRules(url, documentHost, thirdParty, requestType, badFilterRules);
            if (!blockRules) {
                return null;
            }

            const allowRules = allowlistTable.findRules(url, documentHost, thirdParty, requestType, badFilterRules);
            if (!allowRules) {
                return blockRules;
            }

            const importantBlockRules = blockRules.filter(r => r.isImportant);

            if (allowRules.length > 0) {
                const allowRulesWithEmptyOptionText = allowRules
                    .filter(allowRule => allowRule.removeparamOption.optionText === '');

                // @@||example.org^$removeparam will disable all $removeparam rules matching ||example.org^.
                if (allowRulesWithEmptyOptionText.length > 0) {
                    // unless there is no important block rules
                    if (importantBlockRules.length > 0) {
                        return importantBlockRules;
                    }
                    // return first matched rule
                    return allowRulesWithEmptyOptionText.slice(0, 1);
                }

                const foundRemoveparamRules = [];
                blockRules.forEach((blockRule) => {
                    const allowlistingRule = getAllowlistingRule(allowRules, blockRule);
                    if (allowlistingRule) {
                        if (!allowlistingRule.isImportant && blockRule.isImportant) {
                            foundRemoveparamRules.push(blockRule);
                        } else {
                            foundRemoveparamRules.push(allowlistingRule);
                        }
                    } else {
                        foundRemoveparamRules.push(blockRule);
                    }
                });
                return foundRemoveparamRules;
            }

            return blockRules.length > 0 ? blockRules : null;
        }

        if (rules) {
            addRules(rules);
        }

        return {
            addRules,
            addRule,
            removeRule,
            getRules,
            findRemoveparamRules,
        };
    };
})(adguard, adguard.rules);
