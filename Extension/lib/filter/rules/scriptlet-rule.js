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
     * By the rules of AMO and addons.opera.com we cannot use remote scripts
     * (and our JS injection rules could be considered as remote scripts).
     *
     * So, what we do:
     * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'. Other JS rules (new not pre-compiled) are maked as 'remote'.
     * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
     * 3. In case of Firefox and Opera we apply only 'local' JS rules and ignore all marked as 'remote'
     * Note: LocalScriptRulesService may be undefined, in this case, we mark all rules as remote.
     */
    function getScriptSource(filterId, ruleText) {
        return filterId == adguard.utils.filters.USER_FILTER_ID
            || api.LocalScriptRulesService
            && api.LocalScriptRulesService.isLocal(ruleText)
                ? 'local'
                : 'remote';
    }

    /**
     * Parse scriptlet data from script text and return
     * 
     * // Todo improve parsing and write tests
     * 
     * @param {string} script text of script
     */
    function getScriptletData(script) {
        const match = /\/\/(\s*)scriptlet\(([^\)]+)\)/g.exec(script);
        const params = match[2]
            .trim()
            .replace(/['"]/g, '')
            .split(/[,|,\s*]/)
            .filter(i => i);
        const name = params.shift();
        const args = params.slice();

        return {
            name: name,
            args: args,
            aliases: [ // todo incorrect way
                'ubo' + name + '.js',
                'abp' + name
            ],
        }
    }

    /**
     * JS Scriplet rule from scriptlet dictionary
     */
    const ScriptletRule = function (rule, filterId) {
        api.FilterRule.call(this, rule, filterId);
        this.script = null;
        this.scriptlet = getScriptletData(rule);
        this.scriptSource = getScriptSource(filterId, rule);
        this.whiteListRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);

        // Todo via adguard logger
        if (!scriptlets) {
            console.log('No scriptlets imported');
            return;
        }
        this.script = scriptlets.invoke(this.scriptlet);
    };

    /**
     * Extends BaseFilterRule
     */
    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);


    /**
     * Check is script includes `scriptlet` tag
     * 
     * Todo add unsupported scriptlet mask rule
     */
    ScriptletRule.isScriptletRule = function (text) {
        return text && /\/\/(\s*)scriptlet\(([^\)]+)\)/g.test(text);
    }

    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);

