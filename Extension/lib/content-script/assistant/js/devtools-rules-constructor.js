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
 * DevTools rules constructor helper
 */
var DevToolsRulesConstructorHelper = (function () { // jshint ignore:line

    var CSS_RULE_MARK = '##';
    var RULE_OPTIONS_MARK = '$';

    var linkHelper = document.createElement('a');

    var isValidUrl = function(value) {
        if (value) {
            linkHelper.href = value;
            if (linkHelper.hostname) {
                return true;
            }
        }

        return false;
    };

    // Public API
    var api = {};

    /**
     * Constructs css selector for specified rule
     *
     * @param ruleText rule text
     * @returns {string} css style selector
     */
    api.constructRuleCssSelector = function (ruleText) {
        if (!ruleText) {
            return null;
        }

        var index = ruleText.indexOf(CSS_RULE_MARK);
        var optionsIndex = ruleText.indexOf(RULE_OPTIONS_MARK);

        if (index >= 0) {
            return ruleText.substring(index + CSS_RULE_MARK.length, optionsIndex >= 0 ? optionsIndex : ruleText.length);
        }

        var s = ruleText.substring(0, optionsIndex);
        s = s.replace(/[\|]|[\^]/g, '');

        if (isValidUrl(s)) {
            return '[src*="' + s + '"]';
        }

        return null;
    };

    return api;

})();
