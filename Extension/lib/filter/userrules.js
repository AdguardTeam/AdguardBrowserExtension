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
 * Class for manage user rules
 */
adguard.userrules = (function (adguard) {

    'use strict';

    /**
     * Wraps access to getter. AntiBannerService hasn't been defined yet.
     * @returns {*}
     */
    function getAntiBannerService() {
        return adguard.antiBannerService;
    }

    /**
     * Adds list of rules to the user filter
     *
     * @param rulesText List of rules to add
     */
    var addRules = function (rulesText) {
        return getAntiBannerService().addUserFilterRules(rulesText);
    };

    /**
     * Removes all user's custom rules
     */
    var clearRules = function () {
        getAntiBannerService().updateUserFilterRules([]);
    };

    /**
     * Removes user's custom rule
     *
     * @param ruleText Rule text
     */
    var removeRule = function (ruleText) {
        getAntiBannerService().removeUserFilterRule(ruleText);
    };

    /**
     * Save user rules text to storage
     * @param content Rules text
     */
    var updateUserRulesText = function (content) {
        var lines = content.split(/[\r\n]+/) || [];
        getAntiBannerService().updateUserFilterRules(lines);
    };

    /**
     * Loads user rules text from storage
     * @param callback Callback function
     */
    var getUserRulesText = function (callback) {
        adguard.rulesStorage.read(adguard.utils.filters.USER_FILTER_ID, function (rulesText) {
            var content = (rulesText || []).join('\n');
            callback(content);
        });
    };

    var unWhiteListFrame = function (frameInfo) {
        if (frameInfo.frameRule) {
            if (frameInfo.frameRule.filterId === adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                adguard.whitelist.unWhiteListUrl(frameInfo.url);
            } else {
                removeRule(frameInfo.frameRule.ruleText);
            }
        }
    };

    return {
        //setRules: setRules,
        addRules: addRules,
        clearRules: clearRules,
        removeRule: removeRule,
        updateUserRulesText: updateUserRulesText,
        getUserRulesText: getUserRulesText,
        //TODO: fix
        unWhiteListFrame: unWhiteListFrame
    };

})(adguard);