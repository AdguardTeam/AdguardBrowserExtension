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
     * Filters unsupported rules from third-party sources
     *
     * @param ruleText
     */
    const filterUnsupportedRules = function (ruleText) {
        // uBO HTML filters
        if (ruleText.includes('##^')) {
            return false;
        }
        return true;
    };

    /**
     * Filters untrusted rules from custom filters
     *
     * @param ruleText
     */
    const isUntrustedRule = function (ruleText) {
        if (ruleText.includes(api.FilterRule.MASK_SCRIPT_RULE)) {
            return true;
        }

        const optionsDelimiterIndex = ruleText.indexOf(api.UrlFilterRule.OPTIONS_DELIMITER);
        if (optionsDelimiterIndex >= 0) {
            const replaceOptionIndex = ruleText.indexOf(`${api.UrlFilterRule.REPLACE_OPTION}=`);
            if (replaceOptionIndex > optionsDelimiterIndex) {
                return true;
            }
        }

        return false;
    };

    /**
     * Checks if rule length is less than minimum rule length.
     * Rules with length less than 4 are ignored
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1600
     * @param ruleText
     * @returns {boolean}
     */
    const isRuleTooSmall = function (ruleText) {
        const MIN_RULE_LENGTH = 4;
        return ruleText.length < MIN_RULE_LENGTH;
    };

    /**
     * Method that parses rule text and creates object of a suitable class.
     *
     * @param {string} ruleText Rule text
     * @param {number} filterId Filter identifier
     * @param {boolean} isTrustedFilter - custom filter can be trusted and untrusted, default is true
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    const _createRule = function (ruleText, filterId, isTrustedFilter) {
        ruleText = ruleText ? ruleText.trim() : null;
        if (!ruleText) {
            return null;
        }

        try {
            const StringUtils = adguard.utils.strings;

            if (StringUtils.startWith(ruleText, api.FilterRule.COMMENT)) {
                return null;
            }

            if (isRuleTooSmall(ruleText)) {
                return null;
            }

            if (!filterUnsupportedRules(ruleText)) {
                return null;
            }

            if (!isTrustedFilter && isUntrustedRule(ruleText)) {
                return null;
            }

            if (StringUtils.startWith(ruleText, api.FilterRule.MASK_WHITE_LIST)) {
                return new api.UrlFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.ContentFilterRule.RULE_MARKERS, api.ContentFilterRule.RULE_MARKER_FIRST_CHAR)) {
                const responseContentFilteringSupported = adguard.prefs.features && adguard.prefs.features.responseContentFilteringSupported;
                if (!responseContentFilteringSupported) {
                    return null;
                }
                return new api.ContentFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.CssFilterRule.RULE_MARKERS, api.CssFilterRule.RULE_MARKER_FIRST_CHAR)) {
                return new api.CssFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.ScriptFilterRule.RULE_MARKERS, api.ScriptFilterRule.RULE_MARKER_FIRST_CHAR)) {
                if (api.ScriptletRule.isAdguardScriptletRule(ruleText)) {
                    return new api.ScriptletRule(ruleText, filterId);
                }

                return new api.ScriptFilterRule(ruleText, filterId);
            }

            return new api.UrlFilterRule(ruleText, filterId);
        } catch (ex) {
            adguard.console.debug('Cannot create rule from filter {0}: {1}, cause {2}', filterId || 0, ruleText, ex);
        }

        return null;
    };

    /**
     * Convert rules to AdGuard syntax and create rule
     *
     * @param {string} ruleText Rule text
     * @param {number} filterId Filter identifier
     * @param {boolean} isTrustedFilter - custom filter can be trusted and untrusted,
     * default is true
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    const createRule = (ruleText, filterId, isTrustedFilter = true) => {
        let conversionResult;
        try {
            conversionResult = api.ruleConverter.convertRule(ruleText);
        } catch (ex) {
            adguard.console.debug('Cannot convert rule from filter {0}: {1}, cause {2}', filterId || 0, ruleText, ex);
        }
        if (!conversionResult) {
            return null;
        }
        if (Array.isArray(conversionResult)) {
            const rules = conversionResult
                .map(rt => _createRule(rt, filterId, isTrustedFilter))
                .filter(rule => rule !== null);
            // composite rule shouldn't be with without rules inside it
            if (rules.length === 0) {
                return null;
            }
            return new api.CompositeRule(ruleText, rules);
        }
        const rule = _createRule(conversionResult, filterId, isTrustedFilter);
        if (rule && conversionResult !== ruleText) {
            rule.ruleText = ruleText;
            rule.convertedRuleText = conversionResult;
        }
        return rule;
    };

    api.builder = { createRule };
})(adguard, adguard.rules);
