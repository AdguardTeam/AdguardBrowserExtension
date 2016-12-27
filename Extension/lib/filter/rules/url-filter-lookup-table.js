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
     * Checks if rule filters request
     *
     * @param rule                Rule
     * @param referrerHost        Referrer host
     * @param url                 Request url
     * @param genericRulesAllowed If true - generic rules are allowed
     * @param thirdParty          Is request third-party or not
     * @param contentTypes        Request content types mask
     * @return true if rule should filter this request
     */
    function isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes) {
        return rule.isPermitted(referrerHost) &&
            (genericRulesAllowed || !rule.isGeneric()) &&
            rule.isFiltered(url, thirdParty, contentTypes);
    }


    /**
     * Checks url against collection of rules
     *
     * @param url                 Request url
     * @param referrerHost        Request referrer host
     * @param rules               Rules to check
     * @param thirdParty          Is request third-party or not
     * @param contentTypes        Request content types mask
     * @param genericRulesAllowed If true - generic rules are allowed
     * @return first matching rule or null if nothing found
     */
    function findRule(url, referrerHost, rules, thirdParty, contentTypes, genericRulesAllowed) {

        var rule, i;

        if (api.UrlFilterRule.contentTypes[contentTypes] == api.UrlFilterRule.contentTypes.DOCUMENT) {
            // Looking for document level rules
            for (i = 0; i < rules.length; i++) {
                rule = rules[i];
                if (((api.UrlFilterRule.contentTypes.DOCUMENT_LEVEL_EXCEPTIONS & rule.permittedContentType) > 0) &&
                    isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, "DOCUMENT_LEVEL_EXCEPTIONS")) {
                    return rule;
                }
            }
        }

        for (i = 0; i < rules.length; i++) {
            rule = rules[i];
            if (isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes)) {
                return rule;
            }
        }

        return null;
    }

    /**
     * Special lookup table
     */
    var UrlFilterRuleLookupTable = function () {
        this.shortcutsLookupTable = new api.ShortcutsLookupTable();
        this.domainsLookupTable = new api.DomainsLookupTable();
        this.rulesWithoutShortcuts = [];
    };

    UrlFilterRuleLookupTable.prototype = {
        /**
         * Adds rule to the table
         *
         * @param rule Rule to add
         */
        addRule: function (rule) {
            if (!this.shortcutsLookupTable.addRule(rule)) {
                if (!this.domainsLookupTable.addRule(rule)) {
                    this.rulesWithoutShortcuts.push(rule);
                }
            }
        },

        /**
         * Removes rule from the table
         *
         * @param rule Rule to remove
         */
        removeRule: function (rule) {
            this.shortcutsLookupTable.removeRule(rule);
            this.domainsLookupTable.removeRule(rule);
            adguard.utils.collections.removeRule(this.rulesWithoutShortcuts, rule);
        },

        /**
         * Clears rules
         */
        clearRules: function () {
            this.shortcutsLookupTable.clearRules();
            this.domainsLookupTable.clearRules();
            this.rulesWithoutShortcuts = [];
        },

        getRules: function () {
            var rules = [];

            rules = rules.concat(this.rulesWithoutShortcuts);
            rules = rules.concat(this.shortcutsLookupTable.getRules());
            rules = rules.concat(this.domainsLookupTable.getRules());

            return rules;
        },

        /**
         * Returns filtering rule if request is filtered or NULL if nothing found
         *
         * @param url                 Url to check
         * @param documentHost        Request document host
         * @param thirdParty          Is request third-party or not
         * @param contentTypes        Request content types mask
         * @param genericRulesAllowed If true - generic rules are allowed
         * @return First matching rule or null if no match found
         */
        findRule: function (url, documentHost, thirdParty, contentTypes, genericRulesAllowed) {

            if (!url) {
                return null;
            }

            var rule;

            var urlLowerCase = url.toLowerCase();
            var rules = this.shortcutsLookupTable.lookupRules(urlLowerCase);

            // Check against rules with shortcuts
            if (rules && rules.length > 0) {
                rule = findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            rules = this.domainsLookupTable.lookupRules(documentHost);
            if (rules && rules.length > 0) {
                rule = findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            // Check against rules without shortcuts
            if (this.rulesWithoutShortcuts.length > 0) {
                rule = findRule(url, documentHost, this.rulesWithoutShortcuts, thirdParty, contentTypes, genericRulesAllowed);
                if (rule) {
                    return rule;
                }
            }

            return null;
        }
    };

    api.UrlFilterRuleLookupTable = UrlFilterRuleLookupTable;

})(adguard, adguard.rules);

