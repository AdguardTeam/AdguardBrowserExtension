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
 * Object for log http requests
 */
adguard.filteringLog = (function (adguard) {

    'use strict';

    var REQUESTS_SIZE_PER_TAB = 1000;

    var tabsInfoMap = Object.create(null);
    var openedFilteringLogsPage = 0;

    /**
     * Updates tab info (title and url)
     * @param tab
     */
    function updateTabInfo(tab) {
        var tabInfo = tabsInfoMap[tab.tabId] || Object.create(null);
        tabInfo.tabId = tab.tabId;
        tabInfo.title = tab.title;
        tabInfo.isHttp = adguard.utils.url.isHttpRequest(tab.url);
        tabsInfoMap[tab.tabId] = tabInfo;
        return tabInfo;
    }

    /**
     * Adds tab
     * @param tab
     */
    function addTab(tab) {
        var tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            adguard.listeners.notifyListeners(adguard.listeners.TAB_ADDED, tabInfo);
        }
    }

    /**
     * Removes tab
     * @param tabId
     */
    function removeTabById(tabId) {
        var tabInfo = tabsInfoMap[tabId];
        if (tabInfo) {
            adguard.listeners.notifyListeners(adguard.listeners.TAB_CLOSE, tabInfo);
        }
        delete tabsInfoMap[tabId];
    }

    /**
     * Updates tab
     * @param tab
     */
    function updateTab(tab) {
        var tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            adguard.listeners.notifyListeners(adguard.listeners.TAB_UPDATE, tabInfo);
        }
    }

    /**
     * Get filtering info for tab
     * @param tabId
     */
    var getFilteringInfoByTabId = function (tabId) {
        return tabsInfoMap[tabId];
    };

    /**
     * Add request to log
     * @param tab
     * @param requestUrl
     * @param frameUrl
     * @param requestType
     * @param requestRule
     */
    var addEvent = function (tab, requestUrl, frameUrl, requestType, requestRule) {

        if (openedFilteringLogsPage === 0) {
            return;
        }

        var tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        if (!tabInfo.filteringEvents) {
            tabInfo.filteringEvents = [];
        }

        var requestDomain = adguard.utils.url.getDomainName(requestUrl);
        var frameDomain = adguard.utils.url.getDomainName(frameUrl);

        var filteringEvent = {
            requestUrl: requestUrl,
            requestDomain: requestDomain,
            frameUrl: frameUrl,
            frameDomain: frameDomain,
            requestType: requestType,
            requestThirdParty: adguard.utils.url.isThirdPartyRequest(requestUrl, frameUrl),
            requestRule: requestRule
        };
        if (requestRule) {
            // Copy useful properties
            filteringEvent.requestRule = Object.create(null);
            filteringEvent.requestRule.filterId = requestRule.filterId;
            filteringEvent.requestRule.ruleText = requestRule.ruleText;
            filteringEvent.requestRule.whiteListRule = requestRule.whiteListRule;
            filteringEvent.requestRule.cspRule = requestRule.cspRule;
            filteringEvent.requestRule.cspDirective = requestRule.cspDirective;
        }
        tabInfo.filteringEvents.push(filteringEvent);

        if (tabInfo.filteringEvents.length > REQUESTS_SIZE_PER_TAB) {
            //don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }

        adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_ADDED, tabInfo, filteringEvent);
    };

    /**
     * Remove log requests for tab
     * @param tabId
     */
    var clearEventsByTabId = function (tabId) {
        var tabInfo = tabsInfoMap[tabId];
        if (tabInfo) {
            delete tabInfo.filteringEvents;
            adguard.listeners.notifyListeners(adguard.listeners.TAB_RESET, tabInfo);
        }
    };

    /**
     * Synchronize currently opened tabs with out state
     * @param callback
     */
    var synchronizeOpenTabs = function (callback) {
        adguard.tabs.getAll(function (tabs) {
            var tabIdsToRemove = Object.keys(tabsInfoMap);
            for (var i = 0; i < tabs.length; i++) {
                var openTab = tabs[i];
                var tabInfo = tabsInfoMap[openTab.tabId];
                if (!tabInfo) {
                    //add tab
                    addTab(openTab);
                } else {
                    //update tab
                    updateTab(openTab);
                }
                var index = tabIdsToRemove.indexOf(String(openTab.tabId));
                if (index >= 0) {
                    tabIdsToRemove.splice(index, 1);
                }
            }
            for (var j = 0; j < tabIdsToRemove.length; j++) {
                removeTabById(tabIdsToRemove[j]);
            }
            if (typeof callback === 'function') {
                var syncTabs = [];
                for (var tabId in tabsInfoMap) { // jshint ignore:line
                    syncTabs.push(tabsInfoMap[tabId]);
                }
                callback(syncTabs);
            }
        });
    };

    /**
     * We collect filtering events if opened at least one page of log
     */
    var onOpenFilteringLogPage = function () {
        openedFilteringLogsPage++;
    };

    /**
     * Cleanup when last page of log closes
     */
    var onCloseFilteringLogPage = function () {
        openedFilteringLogsPage = Math.max(openedFilteringLogsPage - 1, 0);
        if (openedFilteringLogsPage === 0) {
            // Clear events
            for (var tabId in tabsInfoMap) { // jshint ignore:line
                var tabInfo = tabsInfoMap[tabId];
                delete tabInfo.filteringEvents;
            }
        }
    };

    // Initialize filtering log
    synchronizeOpenTabs();

    // Bind to tab events
    adguard.tabs.onCreated.addListener(addTab);
    adguard.tabs.onUpdated.addListener(updateTab);
    adguard.tabs.onRemoved.addListener(function (tab) {
        removeTabById(tab.tabId);
    });

    return {

        synchronizeOpenTabs: synchronizeOpenTabs,

        getFilteringInfoByTabId: getFilteringInfoByTabId,
        addEvent: addEvent,
        clearEventsByTabId: clearEventsByTabId,

        onOpenFilteringLogPage: onOpenFilteringLogPage,
        onCloseFilteringLogPage: onCloseFilteringLogPage
    };

})(adguard);
