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
     * JS Scriplet rule from scriptlet dictionary
     * @constructor ScriptletRule
     * @param {string} rule full text of rule
     * @param {number} filterId
     */
    function ScriptletRule(scriptletData, filterId) {
        api.FilterRule.call(this, scriptletData.rule, filterId);
        this.scriptSource = 'local';
        this.scriptletData = scriptletData;
        this.whiteListRule = adguard.utils.strings.contains(scriptletData.rule, api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE);
        this.script = scriptlets && scriptlets.invoke(this.scriptletData);
        const mask = this.whiteListRule
            ? api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE
            : api.FilterRule.MASK_SCRIPT_RULE;

        const indexOfMask = scriptletData.rule.indexOf(mask);
        if (indexOfMask > 0) {
            const domains = scriptletData.rule.substring(0, indexOfMask);
            this.loadDomains(domains);
        }
    };

    /**
     * Extends BaseFilterRule
     */
    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);

    /**
     * @static ScriptletRule
     */
    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);

