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
     * Constuctor for state machine class
     * Implements state machine pattern
     * @param {string} state initial state
     * @param {Object} transitions contains possible transitions between states
     */
    function StateMachine(state, transitions) {
        this.state = state;
        this.transitions = transitions;
        this.dispatch = function (actionName, payload) {
            const action = this.transitions[this.state]
                && this.transitions[this.state][actionName];
            if (action) {
                this.state = actionName;
                action(payload, { dispatch: this.dispatch.bind(this) });
            }
        };
    };

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
        let rule = removeBeforeIncludingMatch(ruleText);
        let currentProp = '';
        const props = [];
        const captureSymb = symb => currentProp += symb;
        const captureProp = () => {
            props.push(currentProp);
            currentProp = '';
        };
        const between = ({ rule, index }, { dispatch }) => {
            const char = rule[index];
            index++;
            switch (char) {
                case '\'':
                case '"':
                    dispatch('inParam', { rule, index, sep: char, last: char });
                    break;
                case ' ':
                case '(':
                case ',':
                    dispatch('between', { rule, index });
                    break;
                case ')':
                    dispatch('close');
                    break;
                default:
                    dispatch('error');
                    break;
            };
        };
        const inParam = ({ rule, index, sep, last }, { dispatch }) => {
            const char = rule[index];
            index++;
            switch (char) {
                case sep:
                    if (last === '\\') {
                        captureSymb(char);
                        dispatch('inParam', { rule, index, sep, last: char });
                    } else {
                        captureProp();
                        dispatch('betwParam', { rule, index });
                    }
                    break;
                case '\\':
                    dispatch('inParam', { rule, index, sep, last: char });
                    break;
                case undefined:
                    dispatch('error');
                    break;
                default:
                    captureSymb(char);
                    dispatch('inParam', { rule, index, sep, last: char });
                    break;
            }
        }
        const close = () => {};
        const error = () => {};
        
        const transitions = {
            init: {
                betwParam
            },
            betwParam: {
                betwParam,
                close,
                error,
                inParam,
            },
            inParam: {
                inParam,
                betwParam,
                error,
            }
        };
        const machine = new StateMachine('init', transitions);
        machine.dispatch('betwParam', { rule, index: 0 });

        const name = props[0];
        const args = props.splice(1);

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
