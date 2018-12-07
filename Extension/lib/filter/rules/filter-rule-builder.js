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
        // Check ABP-/uBO- snippets
        if (/#\$#[a-zA-Z-_]+/.test(ruleText) || /#\$#[a-zA-Z-_]+\(.+\)/.test(ruleText)) {
            return false;
        }

        // uBO HTML filters
        if (ruleText.includes('##^')) {
            return false;
        }

        // uBO scriptlet injections
        if (ruleText.includes('##script:inject(') || ruleText.includes('##+js(')) {
            return false;
        }

        return true;
    };

    /**
     * Method that parses rule text and creates object of a suitable class.
     *
     * @param ruleText Rule text
     * @param filterId Filter identifier
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    const createRule = function (ruleText, filterId) {

        ruleText = ruleText ? ruleText.trim() : null;
        if (!ruleText) {
            return null;
        }

        try {
            const StringUtils = adguard.utils.strings;

            if (StringUtils.startWith(ruleText, api.FilterRule.COMMENT) ||
                StringUtils.contains(ruleText, api.FilterRule.OLD_INJECT_RULES) ||
                StringUtils.contains(ruleText, api.FilterRule.MASK_JS_RULE)) {
                // Empty or comment, ignore
                // Content rules are not supported
                return null;
            }

            if (!filterUnsupportedRules(ruleText)) {
                return null;
            }

            if (StringUtils.startWith(ruleText, api.FilterRule.MASK_WHITE_LIST)) {
                return new api.UrlFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.ContentFilterRule.RULE_MARKERS, api.ContentFilterRule.RULE_MARKER_FIRST_CHAR)) {
                let responseContentFilteringSupported = adguard.prefs.features && adguard.prefs.features.responseContentFilteringSupported;
                if (!responseContentFilteringSupported) {
                    return null;
                }
                return new api.ContentFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.CssFilterRule.RULE_MARKERS, api.CssFilterRule.RULE_MARKER_FIRST_CHAR)) {
                return new api.CssFilterRule(ruleText, filterId);
            }

            if (api.FilterRule.findRuleMarker(ruleText, api.ScriptFilterRule.RULE_MARKERS, api.ScriptFilterRule.RULE_MARKER_FIRST_CHAR)) {
                return new api.ScriptFilterRule(ruleText, filterId);
            }

            return new api.UrlFilterRule(ruleText, filterId);
        } catch (ex) {
            adguard.console.debug('Cannot create rule from filter {0}: {1}, cause {2}', filterId || 0, ruleText, ex);
        }

        return null;
    };

    api.builder = {
        createRule: createRule,
    };

})(adguard, adguard.rules);
