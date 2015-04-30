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

var PageStatistic = require('utils/page-stats').PageStatistic;
var FilterUtils = require('utils/common').FilterUtils;
var UrlUtils = require('utils/url').UrlUtils;

/**
 * Map that contains info about every browser tab.
 */
var FramesMap = exports.FramesMap = function (antiBannerService, BrowserTabsClass) {

    var frames = new BrowserTabsClass();
    var pageStatistic = new PageStatistic(this);

    /**
     * Gets frame data by tab and frame id
     *
     * @param tab       Tab
     * @param frameId   Frame ID
     * @returns Frame data or null
     */
    function getFrameData(tab, frameId) {
        var framesOfTab = frames.get(tab);
        if (framesOfTab) {
            if (frameId in framesOfTab) {
                return framesOfTab[frameId];
            }
            if (frameId != -1) {
                return framesOfTab[0];
            }
        }
        return null;
    }

    /**
     * Adds frame to map. This method is called on first document request.
     * If this is a main frame and it is whitelisted - saves this info in frame data.
     *
     * @param tab       Tab
     * @param frameId   Frame ID
     * @param url       Page URL
     * @param type      Request content type (UrlFilterRule.contentTypes)
     * @returns Frame data
     */
    this.recordFrame = function (tab, frameId, url, type) {

        var framesOfTab = frames.get(tab);

        var previousUrl = '';
        if (type == "DOCUMENT" && framesOfTab) {
            previousUrl = framesOfTab[frameId].url;
        }

        if (!framesOfTab || type == "DOCUMENT") {
            frames.set(tab, (framesOfTab = Object.create(null)));
        }
        framesOfTab[frameId] = {url: url, previousUrl: previousUrl};
        if (type == "DOCUMENT") {
            framesOfTab[frameId].timeAdded = Date.now();
            this.reloadFrameData(tab);
        }
        return framesOfTab[frameId];
    };

    this.removeFrame = function (tab) {
        frames.remove(tab);
    };

    /**
     * Gets main frame for the specified tab
     *
     * @param tab   Tab
     * @returns Frame data
     */
    this.getMainFrame = function (tab) {
        return getFrameData(tab, 0);
    };

    /**
     * Gets frame URL
     *
     * @param tab       Tab
     * @param frameId   Frame ID
     * @returns Frame URL
     */
    this.getFrameUrl = function (tab, frameId) {
        var frameData = getFrameData(tab, frameId);
        return (frameData ? frameData.url : null);
    };

    /**
     * @param tab Tab
     * @returns true if Tab have white list rule
     */
    this.isTabWhiteListed = function (tab) {
        var frameData = this.getMainFrame(tab);
        return frameData && frameData.frameWhiteListRule;
    };

    /**
     * @param tab Tab
     * @returns true if protection is paused
     */
    this.isTabProtectionDisabled = function (tab) {
        var frameData = this.getMainFrame(tab);
        return frameData && frameData.applicationFilteringDisabled;
    };

    /**
     * Returns true if Adguard for Windows/Android/Mac is detected in this tab.
     *
     * @param tab   Tab
     * @returns true if Adguard for Windows/Android/Mac is detected
     */
    this.isTabAdguardDetected = function (tab) {
        var frameData = this.getMainFrame(tab);
        return frameData && frameData.adguardDetected;
    };

    /**
     * Returns true if Adguard for Windows/Android/Mac is detected in this tab and tab in white list
     *
     * @param tab Tab
     * @returns true if Adguard for Windows/Android/Mac is detected and tab in white list
     */
    this.isTabAdguardWhiteListed = function (tab) {
        var frameData = this.getMainFrame(tab);
        return frameData && frameData.adguardDetected && frameData.adguardDocumentWhiteListed;
    };

    /**
     * @param tab   Tab
     * @returns Adguard whitelist rule in user filter associated with this tab
     */
    this.getTabAdguardUserWhiteListRule = function (tab) {
        var frameData = this.getMainFrame(tab);
        if (frameData && frameData.adguardDetected && frameData.adguardUserWhiteListed) {
            return frameData.adguardWhiteListRule;
        }
        return null;
    };

    /**
     * Update tab info if Adguard for Windows/Android/Mac is detected
     *
     * @param tab                   Tab
     * @param adguardDetected       True if Adguard detected
     * @param documentWhiteListed   True if Tab whitelisted by Adguard rule
     * @param userWhiteListed       True if Adguard whitelist rule in user filter
     * @param headerWhiteListRule   Adguard whitelist rule object
     * @param adguardProductName    Adguard product name
     * @param adguardRemoveRuleNotSupported True if Adguard Api not supported remove rule
     */
    this.recordAdguardIntegrationForTab = function (tab, adguardDetected, documentWhiteListed, userWhiteListed, headerWhiteListRule, adguardProductName, adguardRemoveRuleNotSupported) {
        var frameData = this.getMainFrame(tab);
        if (frameData) {
            frameData.adguardDetected = adguardDetected;
            frameData.adguardDocumentWhiteListed = documentWhiteListed;
            frameData.adguardUserWhiteListed = userWhiteListed;
            frameData.adguardWhiteListRule = headerWhiteListRule;
            frameData.adguardProductName = adguardProductName;
            frameData.adguardRemoveRuleNotSupported = adguardRemoveRuleNotSupported;
        }
    };

    this.getFrameWhiteListRule = function (tab) {
        var frameData = this.getMainFrame(tab);
        return frameData ? frameData.frameWhiteListRule : null;
    };

    this.reloadFrameData = function (tab) {
        var frameData = this.getMainFrame(tab);
        if (frameData) {
            var url = frameData.url;
            frameData.frameWhiteListRule = antiBannerService.getRequestFilter().findWhiteListRule(url, url, "DOCUMENT");
            frameData.applicationFilteringDisabled = antiBannerService.isApplicationFilteringDisabled();
        }
    };

    /**
     * @param tab - Tab
     * @returns info about frame
     */
    this.getFrameInfo = function (tab) {

        var frameData = this.getMainFrame(tab);

        var url = tab.url;
        if (!url && frameData) {
            url = frameData.url;
        }

        var urlFilteringDisabled = !UrlUtils.isHttpRequest(url);
        var applicationFilteringDisabled;
        var documentWhiteListed = false;
        var userWhiteListed = false;
        var canAddRemoveRule = false;

        if (!urlFilteringDisabled) {

            if (frameData && frameData.adguardDetected) {

                documentWhiteListed = frameData.adguardDocumentWhiteListed;
                userWhiteListed = frameData.adguardUserWhiteListed;
                canAddRemoveRule = !frameData.adguardRemoveRuleNotSupported && !(documentWhiteListed && !userWhiteListed);
                applicationFilteringDisabled = false;

            } else {

                applicationFilteringDisabled = frameData && frameData.applicationFilteringDisabled;

                var rule = frameData ? frameData.frameWhiteListRule : null;
                documentWhiteListed = rule != null;
                if (documentWhiteListed) {
                    userWhiteListed = FilterUtils.isWhiteListFilterRule(rule);
                }
                //mean site in exception
                canAddRemoveRule = !(documentWhiteListed && !userWhiteListed);
            }
        }

        var totalBlockedTab = frameData ? frameData.blocked : 0;
        var totalBlocked = pageStatistic.getTotalBlocked();

        return {

            url: url,

            applicationFilteringDisabled: applicationFilteringDisabled,
            urlFilteringDisabled: urlFilteringDisabled,

            documentWhiteListed: documentWhiteListed,
            userWhiteListed: userWhiteListed,
            canAddRemoveRule: canAddRemoveRule,

            adguardDetected: frameData && frameData.adguardDetected,
            adguardProductName: frameData ? frameData.adguardProductName : null,

            totalBlockedTab: totalBlockedTab || 0,
            totalBlocked: totalBlocked || 0
        };
    };

    /**
     * Update count of blocked requests
     *
     * @param tab - Tab
     * @param blocked - count of blocked requests
     * @returns  updated count of blocked requests
     */
    this.updateBlockedAdsCount = function (tab, blocked) {
        var frameData = this.getMainFrame(tab);
        if (frameData) {
            //don't increase ads counter after 30 seconds since page load
            if (frameData.timeAdded + 30000 < Date.now()) {
                return null;
            }
            frameData.blocked = (frameData.blocked || 0) + blocked;
            pageStatistic.updateTotalBlocked(blocked);
            return frameData.blocked;
        }
        return null;
    };

    /**
     * Reset count of blocked requests for tab or overall stats
     * @param tab - Tab (optional)
     */
    this.resetBlockedAdsCount = function (tab) {
        if (tab) {
            var frameData = this.getMainFrame(tab);
            if (frameData) {
                frameData.blocked = 0;
            }
        } else {
            pageStatistic.resetStats();
        }
    }
};