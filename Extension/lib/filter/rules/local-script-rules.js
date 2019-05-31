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

/**
 * By the rules of AMO and addons.opera.com we cannot use remote scripts
 * (and our JS injection rules could be counted as remote scripts).
 *
 * So what we do:
 * 1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object
 * 2. We disable JS rules got from remote server
 * 3. We allow only custom rules got from the User filter (which user creates manually)
 *    or from this DEFAULT_SCRIPT_RULES object
 */

(function (api) {
    let DEFAULT_SCRIPT_RULES = Object.create(null);

    /**
     * Saves local script rules to object
     * @param json JSON object loaded from the filters/local_script_rules.json file
     */
    const setLocalScriptRules = function (json) {
        DEFAULT_SCRIPT_RULES = Object.create(null);

        const rules = json.rules;
        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            const { domains, script } = rule;
            let ruleText = '';
            if (domains !== '<any>') {
                ruleText = domains;
            }
            ruleText += api.FilterRule.MASK_SCRIPT_RULE + script;
            DEFAULT_SCRIPT_RULES[ruleText] = true;
        }
    };

    /**
     * Checks js rule is local
     * @param ruleText Rule text
     * @returns {boolean}
     */
    const isLocal = function (ruleText) {
        return ruleText in DEFAULT_SCRIPT_RULES;
    };

    api.LocalScriptRulesService = {
        setLocalScriptRules,
        isLocal,
    };
})(adguard.rules);
