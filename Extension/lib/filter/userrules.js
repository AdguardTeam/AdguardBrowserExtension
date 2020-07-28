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
     * Synthetic user filter
     */
    const userFilter = { filterId: adguard.utils.filters.USER_FILTER_ID };

    /**
     * Adds list of rules to the user filter
     *
     * @param rulesText List of rules to add
     */
    const addRules = function (rulesText) {
        adguard.listeners.notifyListeners(adguard.listeners.ADD_RULES, userFilter, rulesText);
        adguard.listeners.notifyListeners(
            adguard.listeners.UPDATE_USER_FILTER_RULES, adguard.antiBannerService.getRequestFilterInfo()
        );
    };

    /**
     * Removes all user's custom rules
     */
    const clearRules = function () {
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, userFilter, []);
        adguard.listeners.notifyListeners(
            adguard.listeners.UPDATE_USER_FILTER_RULES, adguard.antiBannerService.getRequestFilterInfo()
        );
    };

    /**
     * Removes user's custom rule
     *
     * @param ruleText Rule text
     */
    const removeRule = function (ruleText) {
        adguard.listeners.notifyListeners(adguard.listeners.REMOVE_RULE, userFilter, [ruleText]);
    };

    /**
     * Save user rules text to storage
     * @param content Rules text
     */
    const updateUserRulesText = function (content) {
        const lines = content.length > 0 ? content.split(/\n/) : [];
        adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTER_RULES, userFilter, lines);
        adguard.listeners.notifyListeners(
            adguard.listeners.UPDATE_USER_FILTER_RULES, adguard.antiBannerService.getRequestFilterInfo()
        );
    };

    /**
     * Loads user rules text from storage
     * @param callback Callback function
     */
    const getUserRulesText = function (callback) {
        adguard.rulesStorage.read(adguard.utils.filters.USER_FILTER_ID, (rulesText) => {
            const content = (rulesText || []).join('\n');
            callback(content);
        });
    };

    const unWhiteListFrame = function (frameInfo) {
        if (frameInfo.frameRule) {
            if (frameInfo.frameRule.filterId === adguard.utils.filters.WHITE_LIST_FILTER_ID) {
                adguard.whitelist.unWhiteListUrl(frameInfo.url);
            } else {
                removeRule(frameInfo.frameRule.ruleText);
            }
        }
    };

    return {
        addRules,
        clearRules,
        removeRule,
        updateUserRulesText,
        getUserRulesText,
        unWhiteListFrame,
    };
})(adguard);
