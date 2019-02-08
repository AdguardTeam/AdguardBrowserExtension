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

    /**
     * Acguard Scriptlet mask
     */
    const ADG_SCRIPTLET_MASK = /\/\/(\s*)scriptlet/;
    const UBO_SCRIPTLET_MASK = /##script\:inject|\+js/;
    const ABP_SCRIPTLET_MASK = /#\$#/;

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
        const removeMask = rule => rule.indexOf('#$#') > -1
            ? rule.substring(rule.indexOf('#$#') + 3, rule.length)
            : rule;
        const trim = rule => rule.trim();
        const getName = rule => 'abp-' + rule.split(' ')[0];
        const getArgs = rule => rule
            .match(/('.*?'|".*?"|\S+)/gm)
            .splice(1)
            .map(t => removeInnerQuotes(t));

        rules = rule.split(';');
        if (rules.length > 1) {
            return rule.split(';')
                .map(removeMask)
                .map(trim)
                .map(rule => ({
                    name: getName(rule),
                    args: getArgs(rule)
                }));
        }

        rule = trim(removeMask(rules[0]))
        return {
            name: getName(rule),
            args: getArgs(rule)
        };
    }

    /**
     * Remove all in string before and including passed regexp
     * @param {string} str source string
     * @param {RegExp} regx
     */
    function removeBeforeIncludingMatch(str, regx) {
        if (!str || !regx) {
            return str;
        }
        const index = str.search(regx);
        if (index === -1) {
            return str;
        }
        return str
            .substring(index, str.length)
            .replace(regx, '');
    }

    /**
     * Parse rule text and returns AdGuard scriplet data
     * @param {string} rule 
     */
    function parseAdguardScriptletRule(ruleText) {
        const currentProp = '';
        const props = [];
        function between(rule, index) {
            const char = rule[index];
            switch (char) {
                case '\'':
                case '"':
                    this.dispatch('param', rule, index++, char);
                    break;
                case ' ':
                case '(':
                    this.dispatch('between', rule, index++);
                    break;
                case ')':
                    this.dispatch('close');
                    break;
                default:
                    this.dispatch('error');
                    break;
            };
        };
        function param(rule, index, capture) {
            const char = rule[index];
            switch (char) {
                case capture:
                    props.push(currentProp);
                    currentProp = '';
                    this.dispatch('between', rule, index++);
                    break;
                case undefined:
                    this.dispatch('error');
                    break;
                default:
                    currentProp += char;
                    this.dispatch('param', rule, index++, capture);
                    break;
            }
        }
        function close() {
            props.push(currentProp);
            currentProp = '';
        };
        function error() {
            console.log('error');
        }

        const machine = {
            dispatch(actionName, rule, index, capture) {
                const action = this.transitions[this.state][actionName];
                if (action) {
                    action.apply(this, [rule, index, capture]);
                };
            },
            state: 'init',
            transitions: {
                'init': {
                    between
                    // between() {
                    //     between.apply(this, [...arguments])
                    // },
                },
                'between': {
                    between() {
                        between.bind(this)
                    },
                    'close': close.bind(this),
                    'error': error.bind(this),
                    'param': param.bind(this)
                },
                'param': {
                    'param': param.bind(this),
                    'between': between.bind(this),
                    'error': error.bind(this),
                }
            },
            setState: state => this.state = state,
        }
        console.log(props);

        machine.dispatch('between', `('abort-on-property-read', 'I10C')`, 0);


        // const res = removeBeforeIncludingMatch(rule, ADG_SCRIPTLET_MASK);
        // const res = parseParamsByState(res, ADG_STATE_MAP);


        // const params = getContentInParentheses(rule);
        // const match = params
        //     .split(',')
        //     .map(t => removeInnerQuotes(t))
        //     .filter(t => t);

        // const name = match[0];
        // const args = match.splice(1);

        return { name: name, args: args };
    }

    /**
     * Parse rule text and return scriptlet data
     * @param {string} rule text of rule
     * @returns {Array<Object>} an array of scriptlets 
     */
    function parseScriptletRule(rule) {
        if (isAdguardScriptletRule(rule)) {
            return parseAdguardScriptletRule(rule);
        }
        if (isUBOScriptletRule(rule)) {
            return parseUBOScriptletRule(rule);
        }
        if (isABPSnippetRule(rule)) {
            return parseABPSnippetRule(rule);
        }
    };

    /**
     * Check is AdGuard scriptlet rule
     * @param {string} ruleText 
     */
    function isAdguardScriptletRule(ruleText) {
        return ADG_SCRIPTLET_MASK.test(ruleText);
    };

    /**
     * Check is uBO scriptlet rule
     * @param {string} ruleText rule text
     */
    function isUBOScriptletRule(ruleText) {
        return UBO_SCRIPTLET_MASK.test(ruleText);
    };

    /**
     * Check is AdBlock Plus snippet
     * @param {string} ruleText rule text
     */
    function isABPSnippetRule(ruleText) {
        return ABP_SCRIPTLET_MASK.test(ruleText);
    };

    /**
     * Check is scriptlet rule
     * @param {string} ruleText
     */
    function isScriptletRule(ruleText) {
        return ruleText && (
            isAdguardScriptletRule(ruleText)
            || isUBOScriptletRule(ruleText)
            || isABPSnippetRule(ruleText)
        );
    };

    /**
     *
     * @param {string} rule convert rule
     */
    function convertRule(rule) {
        return isScriptletRule(rule)
            ? parseScriptletRule(rule)
            : rule;
    }

    api.ruleConverter = { convertRule };

})(adguard.rules);
