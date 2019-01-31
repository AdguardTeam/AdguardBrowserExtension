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

(function (api) {

    const ALL_IN_PARENTHESES_REGEX = /\(([^\[\]]*)\)/g;
    /**
     * Returns string in which enclosed in parentheses
     * @param {string} str
     */
    function getContentInParentheses(str) {
        const match = str.match(ALL_IN_PARENTHESES_REGEX)[0];
        if (!match) {
            return '';
        }
        return match.slice(1, -1);
    }

    /**
     * Remove duplicate quotes in string
     * @param {string} t
     */
    function removeInnerQuotes(t) {
        if (typeof t !== 'string') {
            return '';
        }
        t = t.trim();

        const first = t[0];
        const last = t[t.length - 1];
        if ((first === '\'' && last === '\'') || (first === '"' && last === '"')) {
            return t.slice(1, -1);
        }
        return t;
    }

    /**
     * Parse rule text and returns uBO scriplet data
     * @param {string} rule 
     */
    function parseUBOScriptletRule(rule) {
        let params = getContentInParentheses(rule);
        params = params
            .split(',')
            .map(t => removeInnerQuotes(t))
            .filter(t => t);

        const name = 'ubo-' + params[0];
        const args = params.splice(1);

        return { name: name, args: args };
    }

    /**
     * Parse rule text and returns ABP snippet data
     * @param {string} rule 
     */
    function parseABPSnippetRule(rule) {
        return rule.split(';')
            .map(rule => {
                const index = rule.indexOf('#$#');
                return index < 0 ? rule : rule.substring(index + 3, rule.length);
            })
            .map(rule => rule.trim())
            .map(rule => {
                const name = 'abp-' + rule.split(' ')[0];
                const args = rule
                    .match(/('.*?'|".*?"|\S+)/gm)
                    .splice(1)
                    .map(t => removeInnerQuotes(t));

                return { name: name, args: args };
            });
    }

    /**
     * Parse rule text and returns AdGuard scriplet data
     * @param {string} rule 
     */
    function parseAdguardScriptletRule(rule) {
        const params = getContentInParentheses(rule);
        const match = params
            .split(',')
            .map(t => removeInnerQuotes(t))
            .filter(t => t);

        const name = match[0];
        const args = match.splice(1);

        return { name: name, args: args };
    }

    /**
     * Parse rule text and return scriptlet data
     * @param {string} rule text of rule
     * @returns {Array<Object>} an array of scriptlets 
     */
    function parseScriptletRule(rule) {
        if (isUBOScriptletRule(rule)) {
            return parseUBOScriptletRule(rule);
        }
        if (isABPSnippetRule(rule)) {
            return parseABPSnippetRule(rule);
        }
        if (isAdguardScriptletRule(rule)) {
            return parseAdguardScriptletRule(rule);
        }
    };

    /**
     * Check is uBO scriptlet rule
     * @param {string} ruleText rule text
     */
    function isUBOScriptletRule(ruleText) {
        return ruleText.includes('##script:inject(') || ruleText.includes('##+js(');
    };

    /**
     * Check is AdBlock Plus snippet
     * @param {string} ruleText rule text
     */
    function isABPSnippetRule(ruleText) {
        return ruleText.includes('#$#') && !/#\$#.+{.*}\s*$/.test(ruleText)
    };

    /**
     * Check is AdGuard scriptlet rule
     * @param {string} ruleText 
     */
    function isAdguardScriptletRule(ruleText) {
        return /\/\/(\s*)scriptlet\(([^\)]+)\)/g.test(ruleText);
    };

    /**
     * Check is scriptlet rule
     * @param {string} ruleText
     */
    function isScriptletRule(ruleText) {
        return ruleText && (
            isUBOScriptletRule(ruleText)
            || isABPSnippetRule(ruleText)
            || isAdguardScriptletRule(ruleText)
        );
    };

    /**
     * Create ScriptletRule instance(s) with
     * @param {string} ruleText 
     * @param {number} filterId 
     * @param {Array<Object>|Object} params if passed array of params will returns an array of ScriptletRule insctances
     * 
     */
    function createScriptletRule(ruleText, filterId, params) {
        const extraParams = {
            rule: ruleText,
            engine: 'extension',
            version: 'testVersion', // todo add real engine version
            hit: () => console.log('Scriptlet ' + data.name + ' was executed') // todo add real hit
        };
        if (Array.isArray(params)) {
            return params.map(data => {
                data = Object.assign(data, extraParams);
                return new api.ScriptletRule(data, filterId);
            })
        }

        params = Object.assign(params, extraParams);
        return new api.ScriptletRule(params, filterId);
    }

    /**
     * Create ScriptletRule instances from rule text
     * @param {string} ruleText text of scriptlet rule
     * @param {number} filterId
     * @returns {Array<ScriptletRule>}
     */
    function createScriptletRules(ruleText, filterId) {
        const params = parseScriptletRule(ruleText);
        return createScriptletRule(ruleText, filterId, params);
    };

    api.ruleConverter = {
        createScriptletRules: createScriptletRules,
        isScriptletRule: isScriptletRule
    }

})(adguard.rules);
