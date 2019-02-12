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


// TODO
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
     * Parse rule text and returns AdGuard scriplet data
     * @param {string} rule 
     */
    function parseAdguardScriptletRule(ruleText) {
        let rule = removeBeforeIncludingMatch(ADG_SCRIPTLET_MASK, ruleText);
        let currentProp = '';
        const props = [];
        const captureSymb = symb => currentProp += symb;
        const captureProp = () => {
            props.push(currentProp);
            currentProp = '';
        };
        const betwParam = ({ rule, index }, { dispatch }) => {
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
                    dispatch('betwParam', { rule, index });
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
                case undefined:
                    dispatch('error');
                    break;
                default:
                    captureSymb(char);
                    dispatch('inParam', { rule, index, sep, last: char });
                    break;
            }
        }
        const close = () => { };
        const error = () => { };

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

        if (machine.state === 'close') {
            const name = props[0];
            const args = props.splice(1);
            return { name: name, args: args };
        }
    }

    /**
     * Parse rule text and returns uBO scriplet data
     * @param {string} rule 
     */
    function parseUBOScriptletRule(ruleText) {
        let rule = removeBeforeIncludingMatch(UBO_SCRIPTLET_MASK, ruleText);
        let currentProp = '';
        const props = [];
        const captureSymb = symb => currentProp += symb;
        const captureProp = () => {
            props.push(currentProp);
            currentProp = '';
        };
        const getRegexSource = (rule, start) => {
            const end = rule.search(/\/,\s|\)$/, start);
            if (end === -1) {
                return;
            }
            rule = rule.substring(start, end - 1);
            const source = new RegExp(rule).toString();
            return { end, source };
        };

        const betwParam = ({ rule, index }, { dispatch }) => {
            const char = rule[index]; index++;
            switch (char) {
                case '(':
                case ' ':
                    dispatch('inParam', { rule, index });
                    break;
                default:
                    dispatch('error');
                    break;
            };
        };
        const inParam = ({ rule, index }, { dispatch }) => {
            const char = rule[index]; index++;
            switch (char) {
                case ',':
                    captureProp();
                    dispatch('betwParam', { rule, index });
                    break;
                case '/':
                    const res = getRegexSource(rule, index);
                    if (!res) {
                        dispatch('error');
                    } else {
                        captureSymb(res.source);
                        dispatch('inParam', { rule, index: res.end + 1 });
                    }
                    break;
                case undefined:
                    dispatch('error');
                    break;
                case ')':
                    captureProp();
                    dispatch('close');
                    break;
                default:
                    captureSymb(char);
                    dispatch('inParam', { rule, index });
                    break;
            }
        }
        const close = () => { };
        const error = () => { };

        const transitions = {
            init: {
                betwParam
            },
            betwParam: {
                inParam,
                betwParam,
                error,
            },
            inParam: {
                inParam,
                betwParam,
                error,
                close,
            }
        };
        const machine = new StateMachine('init', transitions);
        machine.dispatch('betwParam', { rule, index: 0 });

        if (machine.state === 'close') {
            const name = 'ubo-' + props[0];
            const args = props.splice(1);
            return { name: name, args: args };
        }
    }

    /**
     * Parse rule text and returns ABP snippet data
     * @param {string} rule 
     */
    function parseABPSnippetRule(rule) {
        let currentProp = '';
        let props = [];
        const tree = [];
        const captureSymb = symb => currentProp += symb;
        const captureProp = () => {
            currentProp && props.push(currentProp);
            currentProp = '';
        };
        const captureLeaf = () => {
            tree.push([...props]);
            props = [];
        };
        const betwParam = ({ rule, index }, { dispatch }) => {
            const char = rule[index];
            index++;
            switch (char) {
                case ' ':
                    dispatch('inParam', { rule, index, sep: char });
                    break;
                case undefined:
                    captureLeaf();
                    dispatch('close');
                    break;
                case ';':
                    captureLeaf();
                    dispatch('inParam', { rule, index });
                    break;
                default:
                    dispatch('error');
                    break;
            };
        };
        const inParam = ({ rule, index, sep, open }, { dispatch }) => {
            const char = rule[index];
            index++;
            switch (char) {
                case sep:
                    captureProp(char);
                    dispatch('betwParam', { rule, index });
                    break;
                case '\'':
                case '"':
                    if (open) {
                        captureSymb(char);
                        dispatch('inParam', { rule, index, sep, open });
                    } else {
                        dispatch('inParam', { rule, index, sep: char, open: true });
                    }
                    break;
                case ' ':
                    if (open) {
                        captureSymb(char);
                        dispatch('inParam', { rule, index, sep, open });
                    } else {
                        captureProp();
                        dispatch('inParam', { rule, index });
                    }
                    break;
                case ';':
                    if (open) {
                        captureSymb(char);
                        dispatch('inParam', { rule, index, sep, open });
                    } else {
                        captureProp();
                        captureLeaf();
                        dispatch('inParam', { rule, index });
                    }
                    break;
                case undefined:
                    if (open) {
                        dispatch('error');
                    } else {
                        captureProp();
                        captureLeaf();
                        dispatch('close');
                    }
                    break;
                default:
                    captureSymb(char);
                    dispatch('inParam', { rule, index, sep, open });
                    break;
            }
        }
        const close = () => { };
        const error = () => { };

        const transitions = {
            init: {
                inParam
            },
            betwParam: {
                inParam,
                close,
                error
            },
            inParam: {
                inParam,
                betwParam,
                error,
                close
            },
        };

        const machine = new StateMachine('init', transitions);
        machine.dispatch('inParam', { rule, index: 0 });

        if (machine.state === 'close') {
            return tree.map(props => {
                const name = 'abp-' + props[0];
                const args = props.splice(1);
                return { name: name, args: args };
            });
        }
    }

})(adguard.rules);
