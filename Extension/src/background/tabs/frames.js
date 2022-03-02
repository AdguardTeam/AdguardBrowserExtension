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

import { tabsApi } from './tabs-api';
import { MAIN_FRAME_ID, utils } from '../utils/common';
import { allowlist } from '../filter/allowlist';
import { settings } from '../settings/user-settings';
import { pageStats } from '../filter/page-stats';
import { localStorage } from '../storage';

/**
 * Object that contains info about every browser tab.
 */
export const frames = (function () {
    /**
     * Gets frame URL
     *
     * @param tab       Tab
     * @param frameId   Frame ID
     * @returns Frame URL
     */
    const getFrameUrl = function (tab, frameId) {
        const frame = tabsApi.getTabFrame(tab.tabId, frameId);
        return frame ? frame.url : null;
    };

    /**
     * Gets main frame URL
     *
     * @param tab    Tab
     * @returns Frame URL
     */
    const getMainFrameUrl = function (tab) {
        return getFrameUrl(tab, MAIN_FRAME_ID);
    };

    /**
     * Gets frame Domain
     *
     * @param tab       Tab
     * @returns Frame Domain
     */
    const getFrameDomain = function (tab) {
        const frame = tabsApi.getTabFrame(tab.tabId, 0);
        return frame ? frame.domainName : null;
    };

    /**
     * @param tab Tab
     * @returns true if Tab have allowlist rule
     */
    const isTabAllowlisted = function (tab) {
        const frameRule = tabsApi.getTabMetadata(tab.tabId, 'frameRule');
        return frameRule && frameRule.isDocumentAllowlistRule();
    };

    /**
     * @param tab Tab
     * @returns true if Tab have allowlist rule and allowlist isn't invert
     */
    const isTabAllowlistedForSafebrowsing = function (tab) {
        return isTabAllowlisted(tab) && allowlist.isDefaultMode();
    };

    /**
     * @param tab Tab
     * @returns true if protection is paused
     */
    const isTabProtectionDisabled = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'applicationFilteringDisabled');
    };

    /**
     * Returns true if tab is in allowlist
     *
     * @param tab Tab
     * @returns true if Adguard for Windows/Android/Mac is detected and tab in allowlist
     */
    const isTabAdguardAllowlisted = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'adguardDocumentAllowlisted');
    };

    /**
     * @param tab   Tab
     * @returns Adguard allowlist rule in user filter associated with this tab
     */
    const getTabAdguardUserAllowlistRule = function (tab) {
        const adguardUserAllowlisted = tabsApi.getTabMetadata(tab.tabId, 'adguardUserAllowlisted');
        if (adguardUserAllowlisted) {
            return tabsApi.getTabMetadata(tab.tabId, 'adguardAllowlistRule');
        }
        return null;
    };

    /**
     * Gets allowlist rule for the specified tab
     * @param tab Tab to check
     * @returns allowlist rule applied to that tab (if any)
     */
    const getFrameRule = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'frameRule');
    };

    /**
     * Attach referrer url to the tab's main frame object.
     * This referrer is then used on safebrowsing "Access Denied" for proper "Go Back" behavior.
     *
     * @param tab Tab
     * @param referrerUrl Referrer to record
     */
    const recordFrameReferrerHeader = function (tab, referrerUrl) {
        tabsApi.updateTabMetadata(tab.tabId, { referrerUrl });
    };

    /**
     * Gets main frame data
     *
     * @param tab Tab
     * @returns {*} frame data
     */
    const getFrameInfo = function (tab) {
        const { tabId } = tab;
        const frame = tabsApi.getTabFrame(tabId);

        let { url } = tab;
        if (!url && frame) {
            url = frame.url;
        }

        const localStorageInitialized = localStorage.isInitialized();
        const urlFilteringDisabled = !utils.url.isHttpRequest(url);

        // application is available for tabs where url is with http schema
        // and when localstorage is initialized
        const applicationAvailable = localStorageInitialized && !urlFilteringDisabled;
        let documentAllowlisted = false;
        let userAllowlisted = false;
        let canAddRemoveRule = false;
        let frameRule;

        const adguardProductName = '';

        const totalBlocked = pageStats.getTotalBlocked() || 0;
        const totalBlockedTab = tabsApi.getTabMetadata(tabId, 'blocked') || 0;
        const applicationFilteringDisabled = settings.isFilteringDisabled();

        if (applicationAvailable) {
            documentAllowlisted = isTabAllowlisted(tab);
            if (documentAllowlisted) {
                const rule = getFrameRule(tab);
                userAllowlisted = utils.filters.isAllowlistFilterRule(rule)
                        || utils.filters.isUserFilterRule(rule);
                frameRule = {
                    filterId: rule.getFilterListId(),
                    ruleText: rule.getText(),
                };
            }
            // It means site in exception
            canAddRemoveRule = !(documentAllowlisted && !userAllowlisted);
        }

        const domainName = getFrameDomain(tab);

        return {
            url,
            applicationAvailable,
            domainName,
            applicationFilteringDisabled,
            urlFilteringDisabled,
            documentAllowlisted,
            userAllowlisted,
            canAddRemoveRule,
            frameRule,
            adguardProductName,
            totalBlockedTab,
            totalBlocked,
        };
    };

    /**
     * Update count of blocked requests
     *
     * @param tab - Tab
     * @param blocked - count of blocked requests
     * @returns  updated count of blocked requests
     */
    const updateBlockedAdsCount = function (tab, blocked) {
        pageStats.updateTotalBlocked(blocked);

        blocked = (tabsApi.getTabMetadata(tab.tabId, 'blocked') || 0) + blocked;
        tabsApi.updateTabMetadata(tab.tabId, { blocked });

        return blocked;
    };

    /**
     * Reset count of blocked requests for tab or overall stats
     * @param tab - Tab (optional)
     */
    const resetBlockedAdsCount = function (tab) {
        if (tab) {
            tabsApi.updateTabMetadata(tab.tabId, { blocked: 0 });
        } else {
            pageStats.resetStats();
        }
    };

    /**
     * Is tab in incognito mode?
     * @param tab Tab
     */
    const isIncognitoTab = function (tab) {
        return tabsApi.isIncognito(tab.tabId);
    };

    /**
     * Checks if we should process request further
     * @param {object} tab
     * @returns {boolean}
     */
    const shouldStopRequestProcess = tab => isTabProtectionDisabled(tab) || isTabAllowlisted(tab);

    return {
        getFrameUrl,
        getMainFrameUrl,
        getFrameDomain,
        isTabAllowlisted,
        isTabAllowlistedForSafebrowsing,
        isTabProtectionDisabled,
        isTabAdguardAllowlisted,
        getTabAdguardUserAllowlistRule,
        getFrameRule,
        recordFrameReferrerHeader,
        getFrameInfo,
        updateBlockedAdsCount,
        resetBlockedAdsCount,
        isIncognitoTab,
        shouldStopRequestProcess,
    };
})();
