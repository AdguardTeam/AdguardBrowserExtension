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
    const stringUtils = adguard.utils.strings;
    /**
     * AdGuard scriptlet mask
     */
    const ADGUARD_SCRIPTLET_MASK = '${domains}#%#//scriptlet(${args})';
    /**
     * uBlock scriptlet rule mask
     */
    const UBO_SCRIPTLET_MASK_REG = /##script\:inject|##\s*\+js/;
    const UBO_SCRIPTLET_MASK_1 = '##+js';
    const UBO_SCRIPTLET_MASK_2 = '##script:inject';
    /**
     * AdBlock Plus snippet rule mask
     */
    const ABP_SCRIPTLET_MASK = '#$#';
    /**
     * AdGuard CSS rule mask
     */
    const ADG_CSS_MASK_REG = /#\$#.+?\s*\{.*\}\s*$/g;

    /**
     * Return array of strings separated by space which not in quotes
     * @param {string} str
     */
    function getSentences(str) {
        const reg = /'.*?'|".*?"|\S+/g;
        return str.match(reg);
    }

    /**
     * Returns substring enclosed in the widest braces
     * @param {string} str
     */
    function getStringInBraces(str) {
        const firstIndex = str.indexOf('(');
        const lastIndex = str.lastIndexOf(')');
        return str.substring(firstIndex + 1, lastIndex);
    }

    /**
     * Wrap str in double qoutes and replaces single quotes if need
     * @param {string} str
     */
    function wrapInDoubleQuotes(str) {
        if (str[0] === '\'' && str[str.length - 1] === '\'') {
            str = str.substring(1, str.length - 1);
            str = str.replace(/\"/g, '\\"');
        } else if (str[0] === '"' && str[str.length - 1] === '"') {
            str = str.substring(1, str.length - 1);
            str = str.replace(/\'/g, '\\\'');
        }
        return `"${str}"`;
    }


    /**
     * Replace string with data by placeholders
     * @param {string} str
     * @param {Object} data where keys is placeholdes names
     */
    function replacePlaceholders(str, data) {
        return Object.keys(data).reduce((acc, key) => {
            const reg = new RegExp(`\\$\\{${key}\\}`, 'g');
            acc = acc.replace(reg, data[key]);
            return acc;
        }, str);
    }

    /**
     * Convert string of UBO scriptlet rule to AdGuard scritlet rule
     * @param {string} rule UBO scriptlet rule
     */
    function convertUboScriptletRule(rule) {
        const domains = stringUtils.getBeforeRegExp(rule, UBO_SCRIPTLET_MASK_REG);
        const args = getStringInBraces(rule)
            .split(/, /g)
            .map((arg, index) => (index === 0 ? `ubo-${arg}` : arg))
            .map(arg => wrapInDoubleQuotes(arg))
            .join(', ');

        return replacePlaceholders(
            ADGUARD_SCRIPTLET_MASK,
            { domains, args }
        );
    }

    /**
     * Convert string of ABP scriptlet rule to AdGuard scritlet rule
     * @param {string} rule UBO scriptlet rule
     */
    function convertAbpSnippetRule(rule) {
        const SEMICOLON_DIVIDER = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
        const domains = stringUtils.substringBefore(rule, ABP_SCRIPTLET_MASK);
        const args = stringUtils.substringAfter(rule, ABP_SCRIPTLET_MASK);
        return args.split(SEMICOLON_DIVIDER)
            .map(args => getSentences(args)
                .filter(arg => arg)
                .map((arg, index) => (index === 0 ? `abp-${arg}` : arg))
                .map(arg => wrapInDoubleQuotes(arg))
                .join(', '))
            .map(args => replacePlaceholders(ADGUARD_SCRIPTLET_MASK, { domains, args }));
    }

    /**
     * Check is uBO scriptlet rule
     * @param {string} rule rule text
     */
    function isUboScriptletRule(rule) {
        return (
            rule.indexOf(UBO_SCRIPTLET_MASK_1) > -1
            || rule.indexOf(UBO_SCRIPTLET_MASK_2) > -1
        )
        && UBO_SCRIPTLET_MASK_REG.test(rule);
    }

    /**
     * Check is AdBlock Plus snippet
     * @param {string} rule rule text
     */
    function isAbpSnippetRule(rule) {
        return rule.indexOf(ABP_SCRIPTLET_MASK) > -1 && rule.search(ADG_CSS_MASK_REG) === -1;
    }

    /**
     * Returns false or converted rule
     *
     * Example:
     * "example.com##h1:style(background-color: blue !important)"
     * -> "example.com##h1 {background-color: blue !important}"
     *
     * @param {string} ruleText - rule text to check if should be checked and if necessary converted
     * @return {string|boolean} - converted rule text or false
     */
    function convertUboCssStyleRule(ruleText) {
        const UBO_CSS_RULE_MARKERS = {
            MASK_CSS_RULE: '##',
            MASK_CSS_EXCEPTION_RULE: '#@#',
            MASK_CSS_EXTENDED_CSS_RULE: '#?#',
            MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE: '#@?#',
        };

        const CSS_TO_INJECT_PAIRS = {
            [UBO_CSS_RULE_MARKERS.MASK_CSS_RULE]: '#$#',
            [UBO_CSS_RULE_MARKERS.MASK_CSS_EXCEPTION_RULE]: '#@$#',
            [UBO_CSS_RULE_MARKERS.MASK_CSS_EXTENDED_CSS_RULE]: '#$?#',
            [UBO_CSS_RULE_MARKERS.MASK_CSS_EXCEPTION_EXTENDED_CSS_RULE]: '#@$?#',
        };

        const RULE_MARKER_FIRST_CHAR = '#';

        const UBO_CSS_STYLE_PSEUDO_CLASS = ':style(';

        const mask = api.FilterRule.findRuleMarker(
            ruleText,
            Object.values(UBO_CSS_RULE_MARKERS),
            RULE_MARKER_FIRST_CHAR
        );
        if (!mask) {
            return false;
        }
        const maskIndex = ruleText.indexOf(mask);
        const cssContent = ruleText.substring(maskIndex + mask.length);
        const shouldConvert = cssContent.indexOf(UBO_CSS_STYLE_PSEUDO_CLASS) > -1;
        if (!shouldConvert) {
            return false;
        }

        const domainsPart = ruleText.substring(0, maskIndex);
        const regex = /:style\s*\(\s*(\S+.*\S)\s*\)/;
        const subst = ' { $1 }';
        const convertedCssContent = cssContent.replace(regex, subst);
        if (convertedCssContent === cssContent) {
            throw new Error(`Empty :style pseudo class: ${cssContent}`);
        }
        return domainsPart + CSS_TO_INJECT_PAIRS[mask] + convertedCssContent;
    }

    /**
     * Convert external scriptlet rule to AdGuard scriptlet syntax
     * @param {string} rule convert rule
     */
    function convertRule(rule) {
        if (isUboScriptletRule(rule)) {
            return convertUboScriptletRule(rule);
        }
        if (isAbpSnippetRule(rule)) {
            return convertAbpSnippetRule(rule);
        }
        const uboCssStyleRule = convertUboCssStyleRule(rule);
        if (uboCssStyleRule) {
            return uboCssStyleRule;
        }
        return rule;
    }

    api.ruleConverter = { convertRule };
})(adguard, adguard.rules);
