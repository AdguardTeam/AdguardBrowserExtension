/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * By the rules of AMO we cannot use remote scripts (and our JS rules can be counted as such).
 * Because of that we use the following approach (that was accepted by AMO reviewers):
 *
 * 1. We pre-build JS rules from AdGuard filters into the add-on (see the file called "local_script_rules.json").
 * 2. At runtime we check every JS rule if it's included into "local_script_rules.json".
 *  If it is included we allow this rule to work since it's pre-built. Other rules are discarded.
 * 3. We also allow "User rules" to work since those rules are added manually by the user.
 *  This way filters maintainers can test new rules before including them in the filters.
 */
const localScriptRulesService = (function () {
    /**
     * Storage for script rule texts from the local_script_rules.json
     */
    let LOCAL_SCRIPT_RULES = Object.create(null);

    /**
     * Saves local script rules to object
     * @param json JSON object loaded from the filters/local_script_rules.json file
     */
    const setLocalScriptRules = function (json) {
        LOCAL_SCRIPT_RULES = Object.create(null);

        const { rules } = json;
        for (let i = 0; i < rules.length; i += 1) {
            const rule = rules[i];
            const { domains, script } = rule;
            let ruleText = '';
            if (domains !== '<any>') {
                ruleText = domains;
            }
            ruleText += `#%#${script}`;
            LOCAL_SCRIPT_RULES[ruleText] = true;
        }
    };

    /**
     * Checks if ruleText is in the local_script_rules
     * @param ruleText Rule text
     * @returns {boolean}
     */
    const isLocal = function (ruleText) {
        return ruleText in LOCAL_SCRIPT_RULES;
    };

    return {
        setLocalScriptRules,
        isLocal,
    };
})();

export default localScriptRulesService;
