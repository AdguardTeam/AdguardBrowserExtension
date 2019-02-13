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
     * AdGuard scriptlet rule mask
     */
    const ADG_SCRIPTLET_MASK_REG = /\/\/(\s*)scriptlet/;

    /**
     * JS Scriplet rule from scriptlet dictionary
     * @constructor ScriptletRule
     * @param {Object} source
     * @property {string}  source.name Scriptlets name
     * @property {Array<string>}  source.args Arguments which need to pass in scriptlet
     */
    function ScriptletRule(source, filterId) {
        // todo add info about version and engine and hit and so on
        // remove duplication scripletdata and source and properties in this
        api.FilterRule.call(this, source.rule, filterId);
        this.scriptSource = 'local';
        this.scriptletData = { ...source };
        this.script = scriptlets && scriptlets.invoke(this.scriptletData);
        this.whiteListRule = adguard.utils.strings.contains(this.scriptletData.rule, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
        const masks = this.whiteListRule
            ? [api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE]
            : [
                api.FilterRule.MASK_SCRIPT_RULE,
                api.FilterRule.MASK_UBO_RULE,
                api.FilterRule.MASK_ABP_SNIPPET_RULE,
            ];
        const mask = masks.find(mask => this.scriptletData.rule.indexOf(mask) > -1);
        const domain = adguard.utils.strings.substringBefore(this.scriptletData.rule, mask);
        domain && this.loadDomains(domain);
    };

    /**
     * Check is AdGuard scriptlet rule
     * @static
     */
    ScriptletRule.isAdguardScriptletRule = rule => ADG_SCRIPTLET_MASK_REG.test(rule);

    /**
     * Extends BaseFilterRule
     */
    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);

    /**
     * @static ScriptletRule
     */
    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);

