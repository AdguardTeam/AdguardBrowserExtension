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
     * CSS rule.
     *
     * Read here for details:
     * http://adguard.com/en/filterrules.html#hideRules
     * http://adguard.com/en/filterrules.html#cssInjection
     */
    var CssFilterRule = (function () {
        /**
         * Parses first pseudo class from the specified CSS selector
         *
         * @param selector
         * @returns {*} first PseudoClass found or null
         */
        var parsePseudoClass = function (selector) {
            var beginIndex = 0;
            var nameStartIndex = -1;
            var squareBracketIndex = 0;

            while (squareBracketIndex >= 0) {
                nameStartIndex = selector.indexOf(':', beginIndex);
                if (nameStartIndex < 0) {
                    return null;
                }

                if (nameStartIndex > 0 && selector.charAt(nameStartIndex - 1) === '\\') {
                    // Escaped colon character
                    return null;
                }

                squareBracketIndex = selector.indexOf("[", beginIndex);
                while (squareBracketIndex >= 0) {
                    if (nameStartIndex > squareBracketIndex) {
                        var squareEndBracketIndex = selector.indexOf("]", squareBracketIndex + 1);
                        beginIndex = squareEndBracketIndex + 1;
                        if (nameStartIndex < squareEndBracketIndex) {
                            // Means that colon character is somewhere inside attribute selector
                            // Something like a[src^="http://domain.com"]
                            break;
                        }

                        if (squareEndBracketIndex > 0) {
                            squareBracketIndex = selector.indexOf("[", beginIndex);
                        } else {
                            // bad rule, example: a[src="http:
                            return null;
                        }
                    } else {
                        squareBracketIndex = -1;
                        break;
                    }
                }
            }

            var nameEndIndex = adguard.utils.strings.indexOfAny(selector, [' ', '\t', '>', '(', '[', '.', '#', ':', '+', '~', '"', "'"], nameStartIndex + 1);
            if (nameEndIndex < 0) {
                nameEndIndex = selector.length;
            }

            var name = selector.substring(nameStartIndex, nameEndIndex);
            if (name.length <= 1) {
                // Either empty name or a pseudo element (like ::content)
                return null;
            }

            return {
                name: name,
                nameStartIndex: nameStartIndex,
                nameEndIndex: nameEndIndex
            };
        };

        /**
         * CssFilterRule constructor
         */
        var constructor = function (rule, filterId) {

            api.FilterRule.call(this, rule, filterId);

            var mask = api.FilterRule.findRuleMarker(rule, CssFilterRule.RULE_MARKERS, CssFilterRule.RULE_MARKER_FIRST_CHAR);
            if (!mask) {
                throw new Error("ruleText does not contain a CSS rule marker: " + rule);
            }

            var isElemhideRule = CssFilterRule.ELEMHIDE_MARKERS.indexOf(mask) !== -1;
            var isInjectRule = CssFilterRule.INJECT_MARKERS.indexOf(mask) !== -1;
            this.whiteListRule = CssFilterRule.WHITELIST_MARKERS.indexOf(mask) !== -1;
            var isExtendedCss = CssFilterRule.EXTCSS_MARKERS.indexOf(mask) !== -1;

            var indexOfMask = rule.indexOf(mask);
            if (indexOfMask > 0) {
                // domains are specified, parsing
                var domains = rule.substring(0, indexOfMask);
                this.loadDomains(domains);
            }

            var stringUtils = adguard.utils.strings;
            var cssContent = rule.substring(indexOfMask + mask.length);

            if (isElemhideRule) {
                // prevent using elemhide rules (##) as css (#$#)
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1624
                if (/{.+}/.test(cssContent)
                    || stringUtils.hasUnquotedSubstring(cssContent, '{')
                    || stringUtils.hasUnquotedSubstring(cssContent, '/*')
                    || stringUtils.hasUnquotedSubstring(cssContent, ' //')) {
                    throw new SyntaxError(`Invalid elemhide rule: ${this.ruleText}`);
                }
            }

            if (!isInjectRule) {
                // We need to validate pseudo-classes
                // https://github.com/AdguardTeam/AdguardForAndroid/issues/701
                const pseudoClass = parsePseudoClass(cssContent);
                if (pseudoClass !== null) {
                    if (CssFilterRule.SUPPORTED_PSEUDO_CLASSES.indexOf(pseudoClass.name) < 0) {
                        throw new Error(`Unknown pseudo class: ${cssContent}`);
                    }
                }
            }

            if (isInjectRule) {
                // Simple validation for css injection rules
                if (!/{.+}/.test(cssContent)) {
                    throw new Error(`Invalid css injection rule, no style presented: ${rule}`);
                }
                // discard css inject rules containing "url"
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1196
                if (/url\(.*\)/gi.test(cssContent)) {
                    throw new Error(`Css injection rule with 'url' was omitted: ${rule}`);
                }

                // discard css inject rules containing other unsafe selectors
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1920
                if (/{.*image-set\(.*\)/gi.test(cssContent) ||
                    /{.*image\(.*\)/gi.test(cssContent) ||
                    /{.*cross-fade\(.*\)/gi.test(cssContent)) {
                    throw new Error(`CSS modifying rule with unsafe style was omitted: ${rule}`);
                }

                // Prohibit "\" character in CSS injection rules
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1444
                if ((cssContent.indexOf('\\') > -1) && !isExtendedCss) {
                    throw new Error(`Css injection rule with '\\' was omitted: ${rule}`);
                }
            }

            // Extended CSS selectors support
            // https://github.com/AdguardTeam/ExtendedCss
            for (var i = 0; i < CssFilterRule.EXTENDED_CSS_MARKERS.length; i++) {
                if (cssContent.indexOf(CssFilterRule.EXTENDED_CSS_MARKERS[i]) >= 0) {
                    isExtendedCss = true;
                }
            }

            this.isElemhideRule = isElemhideRule;
            this.isInjectRule = isInjectRule;
            this.extendedCss = isExtendedCss;
            this.cssSelector = cssContent;
        };

        return constructor;
    })();

    CssFilterRule.prototype = Object.create(api.FilterRule.prototype);

    /**
     * The problem with pseudo-classes is that any unknown pseudo-class makes browser ignore the whole CSS rule,
     * which contains a lot more selectors. So, if CSS selector contains a pseudo-class, we should try to validate it.
     * <p>
     * One more problem with pseudo-classes is that they are actively used in uBlock, hence it may mess AG styles.
     */
    CssFilterRule.SUPPORTED_PSEUDO_CLASSES = [":active",
        ":checked", ":contains", ":disabled", ":empty", ":enabled", ":first-child", ":first-of-type",
        ":focus", ":has", ":has-text", ":hover", ":if", ":if-not", ":in-range", ":invalid", ":lang",
        ":last-child", ":last-of-type", ":link", ":matches-css", ":matches-css-before", ":matches-css-after",
        ":not", ":nth-child", ":nth-last-child", ":nth-last-of-type", ":nth-of-type",
        ":only-child", ":only-of-type", ":optional", ":out-of-range", ":read-only",
        ":read-write", ":required", ":root", ":target", ":valid", ":visited",
        ":-abp-has", ":-abp-contains", ":xpath", ":nth-ancestor", ":upward", ":remove",
        ":matches-attr", ":matches-property", ":is"];

    /**
     * The problem with it is that ":has" and ":contains" pseudo classes are not a valid pseudo classes,
     * hence using it may break old versions of AG.
     */
    CssFilterRule.EXTENDED_CSS_MARKERS = ["[-ext-has=", "[-ext-contains=", "[-ext-has-text=", "[-ext-matches-css=",
        "[-ext-matches-css-before=", "[-ext-matches-css-after=", ":has(", ":has-text(", ":contains(",
        ":matches-css(", ":matches-css-before(", ":matches-css-after(", ":-abp-has(", ":-abp-contains(",
        ":if(", ":if-not(", ":xpath(", ":nth-ancestor(", ":upward(", ":remove(",
        ":matches-attr(", ":matches-property(", ":is("];

    /**
     * All CSS rules markers start with this character
     */
    CssFilterRule.RULE_MARKER_FIRST_CHAR = '#';

    /**
     * CSS rule markers
     */
    CssFilterRule.RULE_MARKERS = [
        api.FilterRule.MASK_CSS_EXCEPTION_INJECT_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE,
        api.FilterRule.MASK_CSS_INJECT_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_RULE,
        api.FilterRule.MASK_CSS_RULE,
    ];

    /**
     * Masks indicating whitelist exception rules
     */
    CssFilterRule.WHITELIST_MARKERS = [
        api.FilterRule.MASK_CSS_EXCEPTION_RULE, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE, api.FilterRule.MASK_CSS_EXCEPTION_INJECT_EXTENDED_CSS_RULE];

    /**
     * Masks indicating extended css rules
     */
    CssFilterRule.EXTCSS_MARKERS = [
        api.FilterRule.MASK_CSS_EXCEPTION_INJECT_EXTENDED_CSS_RULE, api.FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE, api.FilterRule.MASK_CSS_EXTENDED_CSS_RULE];

    /**
     * Masks indicating inject css rules
     */
    CssFilterRule.INJECT_MARKERS = [
        api.FilterRule.MASK_CSS_EXCEPTION_INJECT_EXTENDED_CSS_RULE, api.FilterRule.MASK_CSS_INJECT_EXTENDED_CSS_RULE,
        api.FilterRule.MASK_CSS_EXCEPTION_INJECT_RULE, api.FilterRule.MASK_CSS_INJECT_RULE];

    /**
     * Masks indicating elemhide rules
     */
    CssFilterRule.ELEMHIDE_MARKERS = [
        api.FilterRule.MASK_CSS_RULE, api.FilterRule.MASK_CSS_EXCEPTION_RULE];

    api.CssFilterRule = CssFilterRule;

})(adguard, adguard.rules);
