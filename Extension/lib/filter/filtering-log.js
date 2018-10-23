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

    const backgroundTabId = adguard.BACKGROUND_TAB_ID;
    const backgroundTab = {
        tabId: backgroundTabId,
        title: adguard.i18n.getMessage('background_tab_title')
    };

    var tabsInfoMap = Object.create(null);
    var openedFilteringLogsPage = 0;

    var extensionURL = adguard.getURL('');

    // Force to add background tab if it's defined
    if (adguard.prefs.features.hasBackgroundTab) {
        tabsInfoMap[backgroundTabId] = backgroundTab;
    }

    /**
     * Updates tab info (title and url)
     * @param tab
     */
    function updateTabInfo(tab) {
        var tabInfo = tabsInfoMap[tab.tabId] || Object.create(null);
        tabInfo.tabId = tab.tabId;
        tabInfo.title = tab.title;
        tabInfo.isExtensionTab = tab.url && tab.url.indexOf(extensionURL) === 0;
        tabsInfoMap[tab.tabId] = tabInfo;
        return tabInfo;
    }

    /**
     * Adds tab
     * @param tab
     */
    function addTab(tab) {

        // Background tab can't be added
        if (tab.tabId == backgroundTabId) {
            return;
        }

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

        // Background tab can't be removed
        if (tabId == backgroundTabId) {
            return;
        }

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

        // Background tab can't be updated
        if (tab.tabId == backgroundTabId) {
            return;
        }

        var tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            adguard.listeners.notifyListeners(adguard.listeners.TAB_UPDATE, tabInfo);
        }
    }

    /**
     * Writes to filtering event some useful properties from the request rule
     * @param filteringEvent
     * @param requestRule
     */
    function addRuleToFilteringEvent(filteringEvent, requestRule) {
        filteringEvent.requestRule = Object.create(null);
        filteringEvent.requestRule.filterId = requestRule.filterId;
        filteringEvent.requestRule.ruleText = requestRule.ruleText;
        if (requestRule instanceof adguard.rules.ContentFilterRule) {
            filteringEvent.requestRule.contentRule = true;
        } else if (requestRule instanceof adguard.rules.CssFilterRule) {
            filteringEvent.requestRule.cssRule = true;
        } else if (requestRule instanceof adguard.rules.UrlFilterRule) {
            filteringEvent.requestRule.whiteListRule = requestRule.whiteListRule;
            filteringEvent.requestRule.cspRule = requestRule.isCspRule();
            filteringEvent.requestRule.cspDirective = requestRule.cspDirective;
        }
    }

    /**
     * Serialize HTML element
     * @param element
     */
    function elementToString(element) {
        var s = [];
        s.push('<');
        s.push(element.localName);
        var attributes = element.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];
            s.push(' ');
            s.push(attr.name);
            s.push('="');
            var value = attr.value === null ? '' : attr.value.replace(/"/g, '\\"');
            s.push(value);
            s.push('"');
        }
        s.push('>');
        return s.join('');
    }

    /**
     * Adds filtering event to log
     * @param tabInfo Tab
     * @param filteringEvent Event to add
     */
    function pushFilteringEvent(tabInfo, filteringEvent) {
        if (!tabInfo.filteringEvents) {
            tabInfo.filteringEvents = [];
        }

        var requestId = filteringEvent.requestId;

        if (requestId) {
            for (var i = 0; i < tabInfo.filteringEvents.length; i += 1) {
                var pushedRequestId = tabInfo.filteringEvents[i].requestId;
                if (pushedRequestId && requestId === pushedRequestId) {
                    return;
                }
            }
        }

        tabInfo.filteringEvents.push(filteringEvent);

        if (tabInfo.filteringEvents.length > REQUESTS_SIZE_PER_TAB) {
            // don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }

        adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_ADDED, tabInfo, filteringEvent);
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
     * @param requestId
     */
    var addHttpRequestEvent = function (tab, requestUrl, frameUrl, requestType, requestRule, requestId) {

        if (openedFilteringLogsPage === 0) {
            return;
        }

        var tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        var requestDomain = adguard.utils.url.getDomainName(requestUrl);
        var frameDomain = adguard.utils.url.getDomainName(frameUrl);

        var filteringEvent = {
            requestId: requestId,
            requestUrl: requestUrl,
            requestDomain: requestDomain,
            frameUrl: frameUrl,
            frameDomain: frameDomain,
            requestType: requestType,
            requestThirdParty: adguard.utils.url.isThirdPartyRequest(requestUrl, frameUrl),
        };

        if (requestRule) {
            // Copy useful properties
            addRuleToFilteringEvent(filteringEvent, requestRule);
        }

        pushFilteringEvent(tabInfo, filteringEvent);
    };

    /**
     * Add event to log with the corresponding rule
     * @param {{tabId: Number}} tab - Tab object with one of properties tabId
     * @param {(string|Element)} element - String presentation of element or NodeElement
     * @param {String} frameUrl - Frame url
     * @param {String} requestType - Request type
     * @param {{ruleText: String, filterId: Number, isInjectRule: Boolean}} requestRule - Request rule
     */
    var addCosmeticEvent = function (tab, element, frameUrl, requestType, requestRule) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        if (!requestRule) {
            return;
        }

        var tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        var frameDomain = adguard.utils.url.getDomainName(frameUrl);
        var filteringEvent = {
            element: typeof element === 'string' ? element : elementToString(element),
            frameUrl: frameUrl,
            frameDomain: frameDomain,
            requestType: requestType,
        };
        if (requestRule) {
            // Copy useful properties
            addRuleToFilteringEvent(filteringEvent, requestRule);
        }

        pushFilteringEvent(tabInfo, filteringEvent);
    };

    /**
     * Some rules are fired after the event was added (e.g. for replace rule)
     * We should find event for this rule and update in log UI
     * @param tab
     * @param requestRule
     * @param requestId
     */
    var bindRuleToHttpRequestEvent = function (tab, requestRule, requestId) {

        if (openedFilteringLogsPage === 0) {
            return;
        }

        var tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        var events = tabInfo.filteringEvents;
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (event.requestId === requestId) {
                addRuleToFilteringEvent(event, requestRule);
                adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_UPDATED, tabInfo, event);
                break;
            }
        }
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

    var isOpen = function () {
        return openedFilteringLogsPage > 0;
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
        addHttpRequestEvent: addHttpRequestEvent,
        bindRuleToHttpRequestEvent: bindRuleToHttpRequestEvent,
        addCosmeticEvent: addCosmeticEvent,
        clearEventsByTabId: clearEventsByTabId,

        isOpen: isOpen,
        onOpenFilteringLogPage: onOpenFilteringLogPage,
        onCloseFilteringLogPage: onCloseFilteringLogPage,
    };
})(adguard);
