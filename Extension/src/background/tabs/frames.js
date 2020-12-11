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

import { tabsApi } from './tabs-api';
import { MAIN_FRAME_ID, utils } from '../utils/common';
import { RequestTypes } from '../utils/request-types';
import { listeners } from '../notifier';
import { allowlist } from '../filter/allowlist';
import { settings } from '../settings/user-settings';
import { pageStats } from '../filter/page-stats';
import { filteringApi } from '../filter/filtering-api';
import { localStorage } from '../storage';

/**
 * Object that contains info about every browser tab.
 */
export const frames = (function () {
    /**
     * Adds frame to map. This method is called on first document request.
     * If this is a main frame - saves this info in frame data.
     *
     * @param tab       Tab object
     * @param frameId   Frame ID
     * @param url       Page URL
     * @param type      Request content type (UrlFilterRule.contentTypes)
     * @returns Frame data
     */
    const recordFrame = function (tab, frameId, url, type) {
        const frame = tabsApi.getTabFrame(tab.tabId, frameId);

        let previousUrl = '';
        if (type === RequestTypes.DOCUMENT) {
            tabsApi.clearTabFrames(tab.tabId);
            tabsApi.clearTabMetadata(tab.tabId);
            if (frame) {
                previousUrl = frame.url;
            }
        }

        tabsApi.recordTabFrame(tab.tabId, frameId, url, utils.url.getDomainName(url));

        if (type === RequestTypes.DOCUMENT) {
            tabsApi.updateTabMetadata(tab.tabId, { previousUrl });
            reloadFrameData(tab);
        }
    };

    /**
     * This method reloads frame data and updates previous url if necessary
     * We use it in the webRequest.onCommit event because when website uses service worker
     * main_frame request can not fire in the webRequest events
     * @param tab
     * @param frameId
     * @param url
     * @param type
     */
    const checkAndRecordMainFrame = (tab, frameId, url, type) => {
        if (type !== RequestTypes.DOCUMENT) {
            return;
        }

        const { tabId } = tab;

        const frame = tabsApi.getTabFrame(tabId, frameId);

        // If no main_frame in tab, than we consider this as a new page load
        if (!frame) {
            tabsApi.recordTabFrame(tabId, frameId, url, utils.url.getDomainName(url));
            reloadFrameData(tab);
            return;
        }

        // if frame has different rule, then we consider this as a new page load
        let previousUrl = '';
        if (frame && frame.url !== url) {
            previousUrl = frame.url;
            tabsApi.clearTabFrames(tabId);
            tabsApi.clearTabMetadata(tabId);
            tabsApi.recordTabFrame(tabId, frameId, url, utils.url.getDomainName(url));
            tabsApi.updateTabMetadata(tabId, { previousUrl });
            reloadFrameData(tab);
        }
    };

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
     * @returns true if Tab have white list rule
     */
    const isTabWhitelisted = function (tab) {
        const frameWhitelistRule = tabsApi.getTabMetadata(tab.tabId, 'frameWhitelistRule');
        return frameWhitelistRule && frameWhitelistRule.isDocumentWhitelistRule();
    };

    /**
     * @param tab Tab
     * @returns true if Tab have white list rule and white list isn't invert
     */
    const isTabWhitelistedForSafebrowsing = function (tab) {
        return isTabWhitelisted(tab) && allowlist.isDefaultMode();
    };

    /**
     * @param tab Tab
     * @returns true if protection is paused
     */
    const isTabProtectionDisabled = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'applicationFilteringDisabled');
    };

    /**
     * Returns true if tab is in white list
     *
     * @param tab Tab
     * @returns true if Adguard for Windows/Android/Mac is detected and tab in white list
     */
    const isTabAdguardWhitelisted = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'adguardDocumentWhitelisted');
    };

    /**
     * @param tab   Tab
     * @returns Adguard whitelist rule in user filter associated with this tab
     */
    const getTabAdguardUserWhitelistRule = function (tab) {
        const adguardUserWhitelisted = tabsApi.getTabMetadata(tab.tabId, 'adguardUserWhitelisted');
        if (adguardUserWhitelisted) {
            return tabsApi.getTabMetadata(tab.tabId, 'adguardWhitelistRule');
        }
        return null;
    };

    /**
     * Gets whitelist rule for the specified tab
     * @param tab Tab to check
     * @returns allowlist rule applied to that tab (if any)
     */
    const getFrameWhitelistRule = function (tab) {
        return tabsApi.getTabMetadata(tab.tabId, 'frameWhitelistRule');
    };

    /**
     * Reloads tab data (checks whitelist and filtering status)
     *
     * @param tab Tab to reload
     */
    var reloadFrameData = function (tab) {
        const frame = tabsApi.getTabFrame(tab.tabId, 0);
        if (frame) {
            const applicationFilteringDisabled = settings.isFilteringDisabled();
            let frameWhitelistRule = null;
            if (!applicationFilteringDisabled) {
                const { url } = frame;
                frameWhitelistRule = allowlist.findAllowlistRule(url);
                if (!frameWhitelistRule) {
                    frameWhitelistRule = filteringApi.findWhitelistRule(url, url, RequestTypes.DOCUMENT);
                }
            }
            tabsApi.updateTabMetadata(tab.tabId, {
                frameWhitelistRule,
                applicationFilteringDisabled,
            });
        }
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
     * @returns frame data
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
            documentAllowlisted = isTabWhitelisted(tab);
            if (documentAllowlisted) {
                const rule = getFrameWhitelistRule(tab);
                userAllowlisted = utils.filters.isWhitelistFilterRule(rule)
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
    const shouldStopRequestProcess = tab => isTabProtectionDisabled(tab) || isTabWhitelisted(tab);

    // Records frames on application initialization
    listeners.addListener((event) => {
        if (event === listeners.APPLICATION_INITIALIZED) {
            tabsApi.forEach((tab) => {
                recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
            });
        }
    });

    return {
        recordFrame,
        getFrameUrl,
        getMainFrameUrl,
        getFrameDomain,
        isTabWhitelisted,
        isTabWhitelistedForSafebrowsing,
        isTabProtectionDisabled,
        isTabAdguardWhitelisted,
        getTabAdguardUserWhitelistRule,
        getFrameWhitelistRule,
        reloadFrameData,
        recordFrameReferrerHeader,
        getFrameInfo,
        updateBlockedAdsCount,
        resetBlockedAdsCount,
        isIncognitoTab,
        shouldStopRequestProcess,
        checkAndRecordMainFrame,
    };
})();
