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

/* global browser, framesMap, BrowserTab, UrlUtils, RequestTypes, webRequestService */
var tabsLoading = Object.create(null);

browser.webNavigation.onCreatedNavigationTarget.addListener(function (details) {

    var sourceTab = new BrowserTab({id: details.sourceTabId});

    //don't process this request
    if (framesMap.isTabAdguardDetected(sourceTab)) {
        return;
    }

    var referrerUrl = framesMap.getMainFrameUrl(sourceTab);
    if (!UrlUtils.isHttpRequest(referrerUrl)) {
        return;
    }

    tabsLoading[details.tabId] = {
        referrerUrl: referrerUrl,
        sourceTab: sourceTab
    };

    checkPopupBlockedRule(details.tabId, details.url, referrerUrl, sourceTab);
});

browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    if (!(tabId in tabsLoading)) {
        return;
    }

    if ("url" in changeInfo) {
        var tabInfo = tabsLoading[tabId];
        if (tabInfo) {
            checkPopupBlockedRule(tabId, tab.url, tabInfo.referrerUrl, tabInfo.sourceTab);
        }
    }
});

function checkPopupBlockedRule(tabId, requestUrl, referrerUrl, sourceTab) {

    //is not http request or url of tab isn't ready
    if (!UrlUtils.isHttpRequest(requestUrl)) {
        return;
    }

    delete tabsLoading[tabId];

    var requestRule = webRequestService.getRuleForRequest(sourceTab, requestUrl, referrerUrl, RequestTypes.POPUP);

    if (webRequestService.isRequestBlockedByRule(requestRule)) {
        //remove popup tab
        browser.tabs.remove(tabId);
        //append log event and fix log event type from POPUP to DOCUMENT
        webRequestService.postProcessRequest(sourceTab, requestUrl, referrerUrl, RequestTypes.DOCUMENT, requestRule);
    }
}