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
     * AdGuard scriptlet rule mask
     */
    const ADG_SCRIPTLET_MASK = '//scriptlet';

    /**
     * Helper to accumulate an array of strings char by char
     */
    function wordSaver() {
        let str = '';
        let strs = [];
        const saveSymb = (s) => str += s;
        const saveStr = () => {
            strs.push(str);
            str = '';
        };
        const getAll = () => [...strs];
        return { saveSymb, saveStr, getAll };
    };

    /**
     * Iterate over iterable argument and evaluate current state with transitions
     * @param {string} init first transition name
     * @param {Array|Collection|string} iterable
     * @param {Object} transitions transtion functions
     * @param {any} args arguments which should be passed to transition functions
     */
    function iterateWithTransitions(iterable, transitions, init, args) {
        let state = init || Object.keys(transitions)[0];
        for (let i = 0; i < iterable.length; i++) {
            state = transitions[state](iterable, i, args);
        }
        return state;
    }

    /**
     * Parse and validate scriptlet rule
     * @param {*} ruleText
     * @returns {{name: string, args: Array<string>}}
     */
    function parseRule(ruleText) {
        ruleText = stringUtils.substringAfter(ruleText, ADG_SCRIPTLET_MASK);
        /**
         * Transition names
         */
        const TRANSITION = {
            OPENED: 'opened',
            PARAM: 'param',
            CLOSED: 'closed',
        };

        /**
         * Transition function: the current index position in start, end or between params
         * @param {string} rule
         * @param {number} index
         * @param {Object} Object
         * @property {Object} Object.sep contains prop symb with current separator char
         */
        const opened = (rule, index, { sep }) => {
            const char = rule[index];
            switch (char) {
                case ' ':
                case '(':
                case ',':
                    return TRANSITION.OPENED;
                case '\'':
                case '"':
                    sep.symb = char;
                    return TRANSITION.PARAM
                case ')':
                    return index === rule.length - 1
                        ? TRANSITION.CLOSED
                        : TRANSITION.OPENED;
            };
        };
        /**
         * Transition function: the current index position inside param
         * @param {string} rule 
         * @param {number} index 
         * @param {Object} Object
         * @property {Object} Object.sep contains prop `symb` with current separator char
         * @property {Object} Object.saver helper which allow to save strings by car by char
         */
        const param = (rule, index, { saver, sep }) => {
            const char = rule[index];
            switch (char) {
                case '\'':
                case '"':
                    const before = rule[index - 1];
                    if (char === sep.symb && before !== '\\') {
                        sep.symb = null;
                        saver.saveStr();
                        return TRANSITION.OPENED;
                    }
                default:
                    saver.saveSymb(char);
                    return TRANSITION.PARAM;
            }
        }
        const transitions = {
            [TRANSITION.OPENED]: opened,
            [TRANSITION.PARAM]: param,
            [TRANSITION.CLOSED]: () => { }
        };
        const sep = { symb: null };
        const saver = wordSaver();
        const state = iterateWithTransitions(ruleText, transitions, TRANSITION.OPENED, { sep, saver });
        if (state !== 'closed') {
            throw new Error(`Invalid scriptlet rule ${ruleText}`);
        }

        const args = saver.getAll();
        return {
            name: args[0],
            args: args.slice(1),
        };
    }


    /**
     * JS Scriplet rule constructor
     * @constructor ScriptletRule
     * @property {string} ruleText
     * @property {number|string} filterId
     */
    function ScriptletRule(ruleText, filterId) {
        this.ruleText = ruleText;
        this.filterId = filterId;
        this.scriptSource = 'local';
        this.whiteListRule = ruleText.includes(api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
        const mask = this.whiteListRule
            ? api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE
            : api.FilterRule.MASK_SCRIPT_RULE;
        const domain = adguard.utils.strings.substringBefore(ruleText, mask);
        if (domain) {
            this.loadDomains(domain);
        }
        const { name, args } = parseRule(ruleText);
        const scriptletParam = {
            name,
            args,
            ruleText,
            engine: 'extension',
            version: adguard.app && adguard.app.getVersion && adguard.app.getVersion(),
        };
        /* eslint-disable no-unused-expressions, no-console, prefer-template */
        if (adguard.filteringLog.isOpen()) {
            scriptletParam.hit = function (ruleText) {
                console.log('---------- ' + ruleText + ' trace start ----------');
                console.trace && console.trace();
                console.log('---------- ' + ruleText + ' trace end ----------');
            };
        }
        /* eslint-enable no-unused-expressions, no-console, prefer-template */

        this.script = scriptlets && scriptlets.invoke(scriptletParam);
    }

    /**
     * Check is AdGuard scriptlet rule
     * @static
     */
    ScriptletRule.isAdguardScriptletRule = rule => rule.indexOf(ADG_SCRIPTLET_MASK) > -1;

    /**
     * Extends BaseFilterRule
     */
    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);
    ScriptletRule.prototype.constructor = ScriptletRule;

    /**
     * @static ScriptletRule
     */
    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);
