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
 * Object that contains info about every browser tab.
 */
adguard.frames = (function (adguard) {
    'use strict';

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
        const frame = adguard.tabs.getTabFrame(tab.tabId, frameId);

        let previousUrl = '';
        if (type === adguard.RequestTypes.DOCUMENT) {
            adguard.tabs.clearTabFrames(tab.tabId);
            adguard.tabs.clearTabMetadata(tab.tabId);
            if (frame) {
                previousUrl = frame.url;
            }
        }

        adguard.tabs.recordTabFrame(tab.tabId, frameId, url, adguard.utils.url.getDomainName(url));

        if (type === adguard.RequestTypes.DOCUMENT) {
            adguard.tabs.updateTabMetadata(tab.tabId, { previousUrl });
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
        if (type !== adguard.RequestTypes.DOCUMENT) {
            return;
        }

        const { tabId } = tab;

        const frame = adguard.tabs.getTabFrame(tabId, frameId);

        // If no main_frame in tab, than we consider this as a new page load
        if (!frame) {
            adguard.tabs.recordTabFrame(tabId, frameId, url, adguard.utils.url.getDomainName(url));
            reloadFrameData(tab);
            return;
        }

        // if frame has different rule, then we consider this as a new page load
        let previousUrl = '';
        if (frame && frame.url !== url) {
            previousUrl = frame.url;
            adguard.tabs.clearTabFrames(tabId);
            adguard.tabs.clearTabMetadata(tabId);
            adguard.tabs.recordTabFrame(tabId, frameId, url, adguard.utils.url.getDomainName(url));
            adguard.tabs.updateTabMetadata(tabId, { previousUrl });
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
        const frame = adguard.tabs.getTabFrame(tab.tabId, frameId);
        return frame ? frame.url : null;
    };

    /**
     * Gets main frame URL
     *
     * @param tab    Tab
     * @returns Frame URL
     */
    const getMainFrameUrl = function (tab) {
        return getFrameUrl(tab, adguard.MAIN_FRAME_ID);
    };

    /**
     * Gets frame Domain
     *
     * @param tab       Tab
     * @returns Frame Domain
     */
    const getFrameDomain = function (tab) {
        const frame = adguard.tabs.getTabFrame(tab.tabId, 0);
        return frame ? frame.domainName : null;
    };

    /**
     * @param tab Tab
     * @returns true if Tab have white list rule
     */
    const isTabWhiteListed = function (tab) {
        const frameWhiteListRule = adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
        return frameWhiteListRule && frameWhiteListRule.isDocumentWhiteList();
    };

    /**
     * @param tab Tab
     * @returns true if Tab have white list rule and white list isn't invert
     */
    const isTabWhiteListedForSafebrowsing = function (tab) {
        return isTabWhiteListed(tab) && adguard.whitelist.isDefaultMode();
    };

    /**
     * @param tab Tab
     * @returns true if protection is paused
     */
    const isTabProtectionDisabled = function (tab) {
        return adguard.tabs.getTabMetadata(tab.tabId, 'applicationFilteringDisabled');
    };

    /**
     * Returns true if tab is in white list
     *
     * @param tab Tab
     * @returns true if Adguard for Windows/Android/Mac is detected and tab in white list
     */
    const isTabAdguardWhiteListed = function (tab) {
        return adguard.tabs.getTabMetadata(tab.tabId, 'adguardDocumentWhiteListed');
    };

    /**
     * @param tab   Tab
     * @returns Adguard whitelist rule in user filter associated with this tab
     */
    const getTabAdguardUserWhiteListRule = function (tab) {
        const adguardUserWhiteListed = adguard.tabs.getTabMetadata(tab.tabId, 'adguardUserWhiteListed');
        if (adguardUserWhiteListed) {
            return adguard.tabs.getTabMetadata(tab.tabId, 'adguardWhiteListRule');
        }
        return null;
    };

    /**
     * Gets whitelist rule for the specified tab
     * @param tab Tab to check
     * @returns whitelist rule applied to that tab (if any)
     */
    const getFrameWhiteListRule = function (tab) {
        return adguard.tabs.getTabMetadata(tab.tabId, 'frameWhiteListRule');
    };

    /**
     * Reloads tab data (checks whitelist and filtering status)
     *
     * @param tab Tab to reload
     */
    var reloadFrameData = function (tab) {
        const frame = adguard.tabs.getTabFrame(tab.tabId, 0);
        if (frame) {
            const applicationFilteringDisabled = adguard.settings.isFilteringDisabled();
            let frameWhiteListRule = null;
            if (!applicationFilteringDisabled) {
                const { url } = frame;
                frameWhiteListRule = adguard.whitelist.findWhiteListRule(url);
                if (!frameWhiteListRule) {
                    frameWhiteListRule = adguard.requestFilter.findWhiteListRule(url, url, adguard.RequestTypes.DOCUMENT);
                }
            }
            adguard.tabs.updateTabMetadata(tab.tabId, {
                frameWhiteListRule,
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
        adguard.tabs.updateTabMetadata(tab.tabId, { referrerUrl });
    };

    /**
     * Gets main frame data
     *
     * @param tab Tab
     * @returns frame data
     */
    const getFrameInfo = function (tab) {
        const { tabId } = tab;
        const frame = adguard.tabs.getTabFrame(tabId);

        let { url } = tab;
        if (!url && frame) {
            url = frame.url;
        }

        const localStorageInitialized = adguard.localStorage.isInitialized();
        const urlFilteringDisabled = !adguard.utils.url.isHttpRequest(url);

        // application is available for tabs where url is with http schema
        // and when localstorage is initialized
        const applicationAvailable = localStorageInitialized && !urlFilteringDisabled;
        let documentWhiteListed = false;
        let userWhiteListed = false;
        let canAddRemoveRule = false;
        let frameRule;

        const adguardProductName = '';

        const totalBlocked = adguard.pageStats.getTotalBlocked() || 0;
        const totalBlockedTab = adguard.tabs.getTabMetadata(tabId, 'blocked') || 0;
        const applicationFilteringDisabled = adguard.settings.isFilteringDisabled();

        if (applicationAvailable) {
            documentWhiteListed = isTabWhiteListed(tab);
            if (documentWhiteListed) {
                const rule = getFrameWhiteListRule(tab);
                userWhiteListed = adguard.utils.filters.isWhiteListFilterRule(rule)
                        || adguard.utils.filters.isUserFilterRule(rule);
                frameRule = {
                    filterId: rule.filterId,
                    ruleText: rule.ruleText,
                };
            }
            // It means site in exception
            canAddRemoveRule = !(documentWhiteListed && !userWhiteListed);
        }

        const domainName = getFrameDomain(tab);

        return {
            url,
            applicationAvailable,
            domainName,
            applicationFilteringDisabled,
            urlFilteringDisabled,
            documentWhiteListed,
            userWhiteListed,
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
        adguard.pageStats.updateTotalBlocked(blocked);

        blocked = (adguard.tabs.getTabMetadata(tab.tabId, 'blocked') || 0) + blocked;
        adguard.tabs.updateTabMetadata(tab.tabId, { blocked });

        return blocked;
    };

    /**
     * Reset count of blocked requests for tab or overall stats
     * @param tab - Tab (optional)
     */
    const resetBlockedAdsCount = function (tab) {
        if (tab) {
            adguard.tabs.updateTabMetadata(tab.tabId, { blocked: 0 });
        } else {
            adguard.pageStats.resetStats();
        }
    };

    /**
     * Is tab in incognito mode?
     * @param tab Tab
     */
    const isIncognitoTab = function (tab) {
        return adguard.tabs.isIncognito(tab.tabId);
    };

    /**
     * Checks if we should process request further
     * @param {object} tab
     * @returns {boolean}
     */
    const shouldStopRequestProcess = tab => isTabProtectionDisabled(tab) || isTabWhiteListed(tab);

    // Records frames on application initialization
    adguard.listeners.addListener((event) => {
        if (event === adguard.listeners.APPLICATION_INITIALIZED) {
            adguard.tabs.forEach((tab) => {
                recordFrame(tab, 0, tab.url, adguard.RequestTypes.DOCUMENT);
            });
        }
    });

    return {
        recordFrame,
        getFrameUrl,
        getMainFrameUrl,
        getFrameDomain,
        isTabWhiteListed,
        isTabWhiteListedForSafebrowsing,
        isTabProtectionDisabled,
        isTabAdguardWhiteListed,
        getTabAdguardUserWhiteListRule,
        getFrameWhiteListRule,
        reloadFrameData,
        recordFrameReferrerHeader,
        getFrameInfo,
        updateBlockedAdsCount,
        resetBlockedAdsCount,
        isIncognitoTab,
        shouldStopRequestProcess,
        checkAndRecordMainFrame,
    };
})(adguard);
