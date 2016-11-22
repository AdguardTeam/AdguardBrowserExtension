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

var ShortcutsLookupTable = require('../../../lib/filter/rules/shortcuts-lookup-table').ShortcutsLookupTable;
var DomainsLookupTable = require('../../../lib/filter/rules/domains-lookup-table').DomainsLookupTable;
var CollectionUtils = require('../../../lib/utils/common').CollectionUtils;
var UrlUtils = require('../../../lib/utils/url').UrlUtils;
var RequestTypes = require('../../../lib/utils/common').RequestTypes;
var UrlFilterRule = require('../../../lib/filter/rules/url-filter-rule').UrlFilterRule;

/**
 * Special lookup table
 */
var UrlFilterRuleLookupTable = exports.UrlFilterRuleLookupTable = function () {
    this.shortcutsLookupTable = new ShortcutsLookupTable();
    this.domainsLookupTable = new DomainsLookupTable();
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
        CollectionUtils.removeRule(this.rulesWithoutShortcuts, rule);
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

        var urlLowerCase = url.toLowerCase();
        var rules = this.shortcutsLookupTable.lookupRules(urlLowerCase);

        // Check against rules with shortcuts
        if (rules != null && rules.length > 0) {
            var rule = this._findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
            if (rule != null) {
                return rule;
            }
        }

        rules = this.domainsLookupTable.lookupRules(documentHost);
        if (rules != null) {
            var rule = this._findRule(url, documentHost, rules, thirdParty, contentTypes, genericRulesAllowed);
            if (rule != null) {
                return rule;
            }
        }

        // Check against rules without shortcuts
        if (this.rulesWithoutShortcuts.length > 0) {
            var rule = this._findRule(url, documentHost, this.rulesWithoutShortcuts, thirdParty, contentTypes, genericRulesAllowed);
            if (rule != null) {
                return rule;
            }
        }

        return null;
    },

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
    _findRule: function (url, referrerHost, rules, thirdParty, contentTypes, genericRulesAllowed) {
        if (UrlFilterRule.contentTypes[contentTypes] == UrlFilterRule.contentTypes.DOCUMENT) {
            // Looking for document level rules
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                if (((UrlFilterRule.contentTypes.DOCUMENT_LEVEL_EXCEPTIONS & rule.permittedContentType) > 0)
                        && this.isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, "DOCUMENT_LEVEL_EXCEPTIONS")) {
                    return rule;
                }
            }
        }

        for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (this.isFiltered(rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes)) {
                return rule;
            }
        }

        return null;
    },

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
    isFiltered: function (rule, referrerHost, url, genericRulesAllowed, thirdParty, contentTypes) {

        return (rule.isPermitted(referrerHost)
        && (genericRulesAllowed || !rule.isGeneric())
        && rule.isFiltered(url, thirdParty, contentTypes));
    }
};