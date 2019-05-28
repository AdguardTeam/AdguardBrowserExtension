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
     * 1. Pre-compile all current JS rules to the add-on and mark them as 'local'.
     * Other JS rules (new not pre-compiled) are marked as 'remote'.
     * 2. Also we mark as 'local' rules from the "User Filter" (local filter which user can edit)
     * 3. In case of Firefox and Opera we apply only 'local'
     * JS rules and ignore all marked as 'remote'
     * Note: LocalScriptRulesService may be undefined, in this case, we mark all rules as remote.
     */
    function getScriptSource(filterId, ruleText) {
        return filterId === adguard.utils.filters.USER_FILTER_ID
        || (api.LocalScriptRulesService && api.LocalScriptRulesService.isLocal(ruleText))
            ? 'local'
            : 'remote';
    }

    /**
     * JS injection rule:
     * http://adguard.com/en/filterrules.html#javascriptInjection
     */
    const ScriptFilterRule = function (rule, filterId) {
        api.FilterRule.call(this, rule, filterId);

        this.script = null;
        this.whiteListRule = adguard.utils.strings.contains(
            rule,
            api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE
        );
        const mask = this.whiteListRule
            ? api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE
            : api.FilterRule.MASK_SCRIPT_RULE;

        const indexOfMask = rule.indexOf(mask);
        if (indexOfMask > 0) {
            // domains are specified, parsing
            const domains = rule.substring(0, indexOfMask);
            this.loadDomains(domains);
        }

        this.script = rule.substring(indexOfMask + mask.length);

        this.scriptSource = getScriptSource(filterId, rule);
    };

    function getScript() {
        return this.script;
    }

    /**
     * returns rule content after mask
     * e.g. example.org#%#window.AG_onLoad = function(func) {} ->
     * -> #%#window.AG_onLoad = function(func) {}
     * @return {string}
     */
    function getRuleContent() {
        return this.script;
    }

    ScriptFilterRule.prototype = Object.create(api.FilterRule.prototype);

    ScriptFilterRule.prototype.getScript = getScript;

    ScriptFilterRule.prototype.getRuleContent = getRuleContent;

    /**
     * All content rules markers start with this character
     */
    ScriptFilterRule.RULE_MARKER_FIRST_CHAR = '#';

    /**
     * Content rule markers
     */
    ScriptFilterRule.RULE_MARKERS = [
        api.FilterRule.MASK_SCRIPT_EXCEPTION_RULE,
        api.FilterRule.MASK_SCRIPT_RULE,
    ];

    api.ScriptFilterRule = ScriptFilterRule;
})(adguard, adguard.rules);
