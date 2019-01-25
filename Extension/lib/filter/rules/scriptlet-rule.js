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

    /**
     * By the rules of AMO and addons.opera.com we cannot use remote scripts
     * (and our JS injection rules could be considered as remote scripts).
     *
     * So, what we do:
     * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'. Other JS rules (new not pre-compiled) are maked as 'remote'.
     * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
     * 3. In case of Firefox and Opera we apply only 'local' JS rules and ignore all marked as 'remote'
     * Note: LocalScriptRulesService may be undefined, in this case, we mark all rules as remote.
     * 
     * @param {number} filterId 
     * @param {string} ruleText 
     */
    function getScriptSource(filterId, ruleText) {
        return filterId == adguard.utils.filters.USER_FILTER_ID
            || (api.LocalScriptRulesService && api.LocalScriptRulesService.isLocal(ruleText))
            ? 'local'
            : 'remote';
    }

    /**
     * Parse rule text and returns uBO scriplet data
     * @param {string} rule 
     */
    function getUBOScriptletData(rule) {
        const match = /\s*(\+js|script\:inject)\((.+)\)$/g.exec(rule);
        const params = match[2]
            .trim()
            .split(/'/)
            .map(i => i.trim())
            .filter(i => i);
        const name = 'ubo-' + params.shift();
        const args = params.slice();

        return { name: name, args: args };
    }

    /**
     * Parse rule text and returns ABP snippet data
     * @param {string} rule 
     */
    function getABPSnippetData(rule) {
        const match = /#\$#\s*(.+)/g.exec(rule);
        const params = match[2]
            .trim()
            .filter(i => i);

        const name = 'abp-' + params.shift();
        const args = params.slice();

        return { name: name, args: args };
    }

    /**
     * Parse rule text and returns AdGuard scriplet data
     * @param {string} rule 
     */
    function getAdguardScriptletData(rule) {
        const match = /\/\/(\s*)scriptlet\(([^\)]+)\)/g.exec(rule);
        const params = match[2]
            .trim()
            .replace(/['"]/g, '')
            .split(/[,|,\s*]/)
            .filter(i => i);
        const name = params.shift();
        const args = params.slice();

        return { name: name, args: args };
    }

    /**
     * Parse rule text and return scriptlet data
     * @param {string} rule text of rule
     */
    function getScriptletData(rule) {
        if (isUBOScriptletRule(rule)) {
            return getUBOScriptletData(rule);
        }
        if (isABPSnippetRule(rule)) {
            return getABPSnippetData(rule);
        }
        if (isAdguardScriptletRule(rule)) {
            return getAdguardScriptletData(rule);
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
     * JS Scriplet rule from scriptlet dictionary
     * @constructor ScriptletRule
     * @param {string} rule full text of rule
     * @param {number} filterId
     */
    function ScriptletRule(rule, filterId) {
        api.FilterRule.call(this, rule, filterId);
        this.scriptlet = getScriptletData(rule);
        this.scriptSource = getScriptSource(filterId, rule);
        this.whiteListRule = adguard.utils.strings.contains(rule, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
        this.script = scriptlets && scriptlets.invoke(this.scriptlet);
        const mask = this.whiteListRule
            ? api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE
            : api.FilterRule.MASK_SCRIPT_RULE;

        const indexOfMask = rule.indexOf(mask);
        if (indexOfMask > 0) {
            const domains = rule.substring(0, indexOfMask);
            this.loadDomains(domains);
        }
    };

    /**
     * Extends BaseFilterRule
     */
    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);

    /**
     * @static isScriptletRule
     */
    ScriptletRule.isScriptletRule = isScriptletRule;

    /**
     * @static ScriptletRule
     */
    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);

