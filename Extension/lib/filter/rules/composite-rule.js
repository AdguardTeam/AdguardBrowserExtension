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
     * This rule may contain a list of rules generated from one complex ruleText
     * @constructor
     *
     * @example
     * input
     * ABP snippet rule
     * `example.org#$#hide-if-has-and-matches-style someSelector; hide-if-contains someSelector2`
     *
     * output
     * Adguard scriptlet rules
     * `example.org#%#//scriptlet("hide-if-has-and-matches-style", "someSelector")`
     * `example.org#%#//scriptlet("hide-if-contains", "someSelector2")`
     *
     */
    function CompositeRule(ruleText, rules) {
        this.ruleText = ruleText;
        this.rules = rules;
    }

    /**
     * @static ScriptletRule
     */
    api.CompositeRule = CompositeRule;
})(adguard.rules);
