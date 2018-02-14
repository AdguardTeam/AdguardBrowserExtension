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
     * Method that parses rule text and creates object of a suitable class.
     *
     * @param ruleText Rule text
     * @param filterId Filter identifier
     * @returns Filter rule object. Either UrlFilterRule or CssFilterRule or ScriptFilterRule.
     */
    var createRule = function (ruleText, filterId) {

        ruleText = ruleText ? ruleText.trim() : null;
        if (!ruleText) {
            return null;
        }
        var rule = null;
        try {

            var StringUtils = adguard.utils.strings;

            if (StringUtils.startWith(ruleText, api.FilterRule.COMMENT) ||
                StringUtils.contains(ruleText, api.FilterRule.OLD_INJECT_RULES) ||
                StringUtils.contains(ruleText, api.FilterRule.MASK_JS_RULE)) {
                // Empty or comment, ignore
                // Content rules are not supported
                return null;
            }

            if (StringUtils.startWith(ruleText, api.FilterRule.MASK_WHITE_LIST)) {
                rule = new api.UrlFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_CONTENT_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_CONTENT_EXCEPTION_RULE)) {
                var responseContentFilteringSupported = adguard.prefs.features && adguard.prefs.features.responseContentFilteringSupported;
                if (!responseContentFilteringSupported) {
                    return null;
                }
                rule = new api.ContentFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_EXCEPTION_RULE)) {
                rule = new api.CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_INJECT_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE)) {
                rule = new api.CssFilterRule(ruleText, filterId);
            } else if (StringUtils.contains(ruleText, api.FilterRule.MASK_SCRIPT_RULE) || StringUtils.contains(ruleText, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE)) {
                rule = new api.ScriptFilterRule(ruleText, filterId);
            } else {
                rule = new api.UrlFilterRule(ruleText, filterId);
            }
        } catch (ex) {
            adguard.console.warn("Cannot create rule from filter {0}: {1}, cause {2}", filterId || 0, ruleText, ex);
        }
        return rule;
    };

    api.builder = {
        createRule: createRule
    };

})(adguard, adguard.rules);
