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
    // eslint-disable-next-line no-template-curly-in-string
    const ADGUARD_SCRIPTLET_MASK = '${domains}#%#//scriptlet(${args})';

    /**
     * AdGuard scriptlet exception mask
     */
    // eslint-disable-next-line no-template-curly-in-string
    const ADGUARD_SCRIPTLET_EXCEPTION_MASK = '${domains}#@%#//scriptlet(${args})';

    /**
     * uBlock scriptlet rule mask
     */
    const UBO_SCRIPTLET_MASK_REG = /#@?#script:inject|#@?#\s*\+js/;
    const UBO_SCRIPTLET_MASK_1 = '##+js';
    const UBO_SCRIPTLET_MASK_2 = '##script:inject';
    const UBO_SCRIPTLET_EXCEPTION_MASK_1 = '#@#+js';
    const UBO_SCRIPTLET_EXCEPTION_MASK_2 = '#@#script:inject';
    const UBO_SCRIPT_TAG_MASK = '##^script';
    /**
     * AdGuard max-length tag for uBlock scripts conversion
     */
    const ADGUARD_SCRIPT_MAX_LENGTH = '[max-length="262144"]';
    /**
     * AdBlock Plus snippet rule mask
     */
    const ABP_SCRIPTLET_MASK = '#$#';
    const ABP_SCRIPTLET_EXCEPTION_MASK = '#@$#';

    /**
     * AdGuard CSS rule mask
     */
    const ADG_CSS_MASK_REG = /#@?\$#.+?\s*\{.*\}\s*$/g;

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
        const mask = rule.match(UBO_SCRIPTLET_MASK_REG)[0];
        let template;
        if (mask.indexOf('@') > -1) {
            template = ADGUARD_SCRIPTLET_EXCEPTION_MASK;
        } else {
            template = ADGUARD_SCRIPTLET_MASK;
        }
        const args = getStringInBraces(rule)
            .split(/, /g)
            .map((arg, index) => (index === 0 ? `ubo-${arg}` : arg))
            .map(arg => wrapInDoubleQuotes(arg))
            .join(', ');

        return replacePlaceholders(
            template,
            { domains, args }
        );
    }

    /**
     * Convert string of ABP scriptlet rule to AdGuard scritlet rule
     * @param {string} rule UBO scriptlet rule
     */
    function convertAbpSnippetRule(rule) {
        const SEMICOLON_DIVIDER = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
        const mask = rule.indexOf(ABP_SCRIPTLET_MASK) > -1
            ? ABP_SCRIPTLET_MASK
            : ABP_SCRIPTLET_EXCEPTION_MASK;
        const template = mask === ABP_SCRIPTLET_MASK
            ? ADGUARD_SCRIPTLET_MASK
            : ADGUARD_SCRIPTLET_EXCEPTION_MASK;
        const domains = stringUtils.substringBefore(rule, mask);
        const args = stringUtils.substringAfter(rule, mask);
        return args.split(SEMICOLON_DIVIDER)
            .map(args => getSentences(args)
                .filter(arg => arg)
                .map((arg, index) => (index === 0 ? `abp-${arg}` : arg))
                .map(arg => wrapInDoubleQuotes(arg))
                .join(', '))
            .map(args => replacePlaceholders(template, { domains, args }));
    }

    /**
     * Check is uBO scriptlet rule
     * @param {string} rule rule text
     */
    function isUboScriptletRule(rule) {
        return (
            rule.indexOf(UBO_SCRIPTLET_MASK_1) > -1
            || rule.indexOf(UBO_SCRIPTLET_MASK_2) > -1
            || rule.indexOf(UBO_SCRIPTLET_EXCEPTION_MASK_1) > -1
            || rule.indexOf(UBO_SCRIPTLET_EXCEPTION_MASK_2) > -1
        )
            && UBO_SCRIPTLET_MASK_REG.test(rule);
    }

    /**
     * Check is AdBlock Plus snippet
     * @param {string} rule rule text
     */
    function isAbpSnippetRule(rule) {
        return (
            rule.indexOf(ABP_SCRIPTLET_MASK) > -1
            || rule.indexOf(ABP_SCRIPTLET_EXCEPTION_MASK) > -1
        ) && rule.search(ADG_CSS_MASK_REG) === -1;
    }

    /**
     * Converts UBO Script rule
     * @param {string} ruleText rule text
     * @returns {string} converted rule
     */
    function convertUboScriptTagRule(ruleText) {
        if (ruleText.indexOf(UBO_SCRIPT_TAG_MASK) === -1) {
            return null;
        }

        // We convert only one case ##^script:has-text at now
        const uboHasTextRule = ':has-text';
        const adgScriptTag = '$$script';
        const uboScriptTag = '##^script';

        const isRegExp = str => str[0] === '/' && str[str.length - 1] === '/';

        const match = ruleText.split(uboHasTextRule);
        if (match.length === 1) {
            return null;
        }

        const domains = match[0].replace(uboScriptTag, '');
        const rules = [];
        for (let i = 1; i < match.length; i += 1) {
            const attr = match[i].slice(1, -1);
            if (isRegExp(attr)) {
                rules.push(`${domains}${uboScriptTag}${uboHasTextRule}(${attr})`);
            } else {
                rules.push(`${domains}${adgScriptTag}[tag-content="${attr}"]${ADGUARD_SCRIPT_MAX_LENGTH}`);
            }
        }

        return rules;
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

        const uboMarkers = Object.keys(UBO_CSS_RULE_MARKERS).map(key => UBO_CSS_RULE_MARKERS[key]);

        const mask = api.FilterRule.findRuleMarker(
            ruleText,
            uboMarkers,
            RULE_MARKER_FIRST_CHAR
        );
        if (!mask) {
            return null;
        }
        const maskIndex = ruleText.indexOf(mask);
        const cssContent = ruleText.substring(maskIndex + mask.length);
        const shouldConvert = cssContent.indexOf(UBO_CSS_STYLE_PSEUDO_CLASS) > -1;
        if (!shouldConvert) {
            return null;
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
     * Converts abp rule into ag rule
     * e.g.
     * from:    "||example.org^$rewrite=abp-resource:blank-mp3"
     * to:      "||example.org^$redirect:blank-mp3"
     * @param {string} rule
     * @returns {string|null}
     */
    function convertAbpRedirectRule(rule) {
        const ABP_REDIRECT_KEYWORD = 'rewrite=abp-resource:';
        const AG_REDIRECT_KEYWORD = 'redirect=';
        if (!rule.includes(ABP_REDIRECT_KEYWORD)) {
            return null;
        }
        return rule.replace(ABP_REDIRECT_KEYWORD, AG_REDIRECT_KEYWORD);
    }

    function convertOptions(rule) {
        const OPTIONS_DELIMITER = '$';
        const ESCAPE_CHARACTER = '\\';
        const NAME_VALUE_SPLITTER = '=';
        const EMPTY_OPTION = 'empty';
        const MP4_OPTION = 'mp4';
        const CSP_OPTION = 'csp';
        const INLINE_SCRIPT_OPTION = 'inline-script';
        const INLINE_FONT_OPTION = 'inline-font';
        const MEDIA_OPTION = 'media';
        const ALL_OPTION = 'all';
        const POPUP_OPTION = 'popup';
        const DOCUMENT_OPTION = 'document';
        const GENERICHIDE_OPTION = 'generichide';
        const ELEMHIDE_OPTION = 'elemhide';

        /* eslint-disable max-len */
        const conversionMap = {
            [EMPTY_OPTION]: 'redirect=nooptext',
            [MP4_OPTION]: 'redirect=noopmp4-1s',
            [INLINE_SCRIPT_OPTION]: `${CSP_OPTION}=script-src 'self' 'unsafe-eval' http: https: data: blob: mediastream: filesystem:`,
            [INLINE_FONT_OPTION]: `${CSP_OPTION}=font-src 'self' 'unsafe-eval' http: https: data: blob: mediastream: filesystem:`,
            ['ghide']: GENERICHIDE_OPTION,
            ['ehide']: ELEMHIDE_OPTION,
        };
        /* eslint-enable max-len */

        let options;
        let domainPart;

        // Start looking from the prev to the last symbol
        // If dollar sign is the last symbol - we simply ignore it.
        for (let i = (rule.length - 2); i >= 0; i -= 1) {
            const currChar = rule.charAt(i);
            if (currChar !== OPTIONS_DELIMITER) {
                continue;
            }
            if (i > 0 && rule.charAt(i - 1) !== ESCAPE_CHARACTER) {
                domainPart = rule.substring(0, i);
                options = rule.substring(i + 1);
                // Options delimiter was found, doing nothing
                break;
            }
        }
        if (!options) {
            return null;
        }
        const optionsParts = options.split(',');
        let optionsConverted = false;

        let updatedOptionsParts = optionsParts.map((optionsPart) => {
            let convertedOptionsPart = conversionMap[optionsPart];

            // if option is $mp4, than it should go with $media option together
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1452
            if (optionsPart === MP4_OPTION) {
                // check if media is not already among options
                if (!optionsParts.some(option => option === MEDIA_OPTION)) {
                    convertedOptionsPart = `${convertedOptionsPart},media`;
                }
            }

            if (convertedOptionsPart) {
                optionsConverted = true;
                return convertedOptionsPart;
            }

            return optionsPart;
        });

        // if has more than one csp modifiers, we merge them into one;
        const cspParts = updatedOptionsParts.filter(optionsPart => stringUtils.startWith(optionsPart, CSP_OPTION));

        if (cspParts.length > 1) {
            const allButCsp = updatedOptionsParts
                .filter(optionsPart => !stringUtils.startWith(optionsPart, CSP_OPTION));

            const cspValues = cspParts.map((cspPart) => {
                // eslint-disable-next-line no-unused-vars
                const [_, value] = cspPart.split(NAME_VALUE_SPLITTER);
                return value;
            });

            const updatedCspOption = `${CSP_OPTION}${NAME_VALUE_SPLITTER}${cspValues.join('; ')}`;
            updatedOptionsParts = allButCsp.concat(updatedCspOption);
        }

        // options without all modifier
        const hasAllOption = updatedOptionsParts.indexOf(ALL_OPTION) > -1;

        if (hasAllOption) {
            // $all modifier should be converted in 4 rules
            // ||example.org^$document,popup
            // ||example.org^
            // ||example.org^$inline-font
            // ||example.org^$inline-script
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1506
            const allOptionReplacers = [
                [DOCUMENT_OPTION, POPUP_OPTION],
                [INLINE_SCRIPT_OPTION],
                [INLINE_FONT_OPTION],
                [''], //
            ];
            return allOptionReplacers.map((replacers) => {
                // remove replacer and all option from the list
                const optionsButAllAndReplacer = updatedOptionsParts
                    .filter(option => !(replacers.includes(option) || option === ALL_OPTION));

                // try get converted values, used for INLINE_SCRIPT_OPTION, INLINE_FONT_OPTION
                const convertedReplacers = replacers.map(replacer => conversionMap[replacer] || replacer);

                // add replacer to the list of options
                const updatedOptionsString = [...convertedReplacers, ...optionsButAllAndReplacer]
                    .filter(entity => entity)
                    .join(',');

                // create a new rule
                return updatedOptionsString.length < 1 ? domainPart : `${domainPart}\$${updatedOptionsString}`;
            });
        }

        if (optionsConverted) {
            const updatedOptions = updatedOptionsParts.join(',');
            return `${domainPart}\$${updatedOptions}`;
        }

        return null;
    }

    /**
     * Checks if rule text is comment e.g. !!example.org##+js(set-constant.js, test, false)
     * @param {string} rule
     * @return {boolean}
     */
    const isComment = rule => stringUtils.startWith(rule, api.FilterRule.COMMENT);

    /**
     * Convert external scriptlet rule to AdGuard scriptlet syntax
     * @param {string} rule convert rule
     */
    function convertRule(rule) {
        if (isComment(rule)) {
            return rule;
        }
        if (isUboScriptletRule(rule)) {
            return convertUboScriptletRule(rule);
        }
        if (isAbpSnippetRule(rule)) {
            return convertAbpSnippetRule(rule);
        }

        const uboScriptRule = convertUboScriptTagRule(rule);
        if (uboScriptRule) {
            return uboScriptRule;
        }

        const uboCssStyleRule = convertUboCssStyleRule(rule);
        if (uboCssStyleRule) {
            return uboCssStyleRule;
        }

        // Convert abp redirect rule
        const abpRedirectRule = convertAbpRedirectRule(rule);
        if (abpRedirectRule) {
            return abpRedirectRule;
        }

        // Convert options
        const ruleWithConvertedOptions = convertOptions(rule);
        if (ruleWithConvertedOptions) {
            return ruleWithConvertedOptions;
        }

        return rule;
    }

    api.ruleConverter = { convertRule };
})(adguard, adguard.rules);
