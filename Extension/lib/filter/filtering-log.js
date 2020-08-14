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

/* global TSUrlFilter */

/**
 * Object for log http requests
 */
adguard.filteringLog = (function (adguard) {
    'use strict';

    const REQUESTS_SIZE_PER_TAB = 1000;

    const backgroundTabId = adguard.BACKGROUND_TAB_ID;
    const backgroundTab = {
        tabId: backgroundTabId,
        title: adguard.i18n.getMessage('background_tab_title'),
    };

    const tabsInfoMap = Object.create(null);
    let openedFilteringLogsPage = 0;

    // Force to add background tab if it's defined
    if (adguard.prefs.features.hasBackgroundTab) {
        tabsInfoMap[backgroundTabId] = backgroundTab;
    }

    /**
     * Updates tab info (title and url)
     * @param tab
     */
    function updateTabInfo(tab) {
        const tabInfo = tabsInfoMap[tab.tabId] || Object.create(null);
        tabInfo.tabId = tab.tabId;
        tabInfo.title = tab.title;
        tabInfo.isExtensionTab = tab.url && tab.url.indexOf(adguard.app.getExtensionUrl()) === 0;
        tabsInfoMap[tab.tabId] = tabInfo;
        return tabInfo;
    }

    /**
     * Adds tab
     * @param tab
     */
    function addTab(tab) {
        // Background tab can't be added
        // Synthetic tabs are used to send initial requests from new tab in chrome
        if (tab.tabId === backgroundTabId || tab.synthetic) {
            return;
        }

        const tabInfo = updateTabInfo(tab);
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
        if (tabId === backgroundTabId) {
            return;
        }

        const tabInfo = tabsInfoMap[tabId];
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
        if (tab.tabId === backgroundTabId) {
            return;
        }

        const tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            adguard.listeners.notifyListeners(adguard.listeners.TAB_UPDATE, tabInfo);
        }
    }

    /**
     * Copy some properties from source rule to destination rule
     * @param destinationRuleDTO
     * @param sourceRule
     */
    const appendProperties = (destinationRuleDTO, sourceRule) => {
        if (!destinationRuleDTO || !sourceRule) {
            return;
        }

        destinationRuleDTO.filterId = sourceRule.getFilterListId();
        destinationRuleDTO.ruleText = sourceRule.getText();

        if (sourceRule instanceof TSUrlFilter.NetworkRule) {
            if (sourceRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Important)) {
                destinationRuleDTO.isImportant = true;
            }
            if (sourceRule.isDocumentWhitelistRule()) {
                destinationRuleDTO.documentLevelRule = true;
            }

            destinationRuleDTO.whiteListRule = sourceRule.isWhitelist();
            destinationRuleDTO.cspRule = sourceRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Csp);
            destinationRuleDTO.cspDirective = sourceRule.getAdvancedModifierValue();
            destinationRuleDTO.cookieRule = sourceRule.isOptionEnabled(TSUrlFilter.NetworkRuleOption.Cookie);
        } else if (sourceRule instanceof TSUrlFilter.CosmeticRule) {
            const ruleType = sourceRule.getType();
            if (ruleType === TSUrlFilter.CosmeticRuleType.Html) {
                destinationRuleDTO.contentRule = true;
                // eslint-disable-next-line max-len
            } else if (ruleType === TSUrlFilter.CosmeticRuleType.ElementHiding || ruleType === TSUrlFilter.CosmeticRuleType.Css) {
                destinationRuleDTO.cssRule = true;
            } else if (ruleType === TSUrlFilter.CosmeticRuleType.Js) {
                destinationRuleDTO.scriptRule = true;
            }
        }
    };

    /**
     * Writes to filtering event some useful properties from the request rule
     * @param filteringEvent
     * @param requestRule
     */
    function addRuleToFilteringEvent(filteringEvent, requestRule) {
        filteringEvent.requestRule = {};
        appendProperties(filteringEvent.requestRule, requestRule);
    }

    /**
     * Writes to filtering event some useful properties from the replace rules
     * @param filteringEvent
     * @param replaceRules
     */
    const addReplaceRulesToFilteringEvent = (filteringEvent, replaceRules) => {
        // only replace rules can be applied together
        filteringEvent.requestRule = {};
        filteringEvent.requestRule.replaceRule = true;
        filteringEvent.replaceRules = [];
        replaceRules.forEach((replaceRule) => {
            const tempRule = {};
            appendProperties(tempRule, replaceRule);
            filteringEvent.replaceRules.push(tempRule);
        });
    };

    /**
     * Adds filtering event to log
     * @param tabInfo Tab
     * @param filteringEvent Event to add
     */
    function pushFilteringEvent(tabInfo, filteringEvent) {
        if (!tabInfo.filteringEvents) {
            tabInfo.filteringEvents = [];
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
    const getFilteringInfoByTabId = function (tabId) {
        return tabsInfoMap[tabId];
    };

    /**
     * Add request to log
     * @param tab
     * @param requestUrl
     * @param frameUrl
     * @param requestType
     * @param requestRule
     * @param eventId
     */
    const addHttpRequestEvent = function (tab, requestUrl, frameUrl, requestType, requestRule, eventId) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const requestDomain = adguard.utils.url.getDomainName(requestUrl);
        const frameDomain = adguard.utils.url.getDomainName(frameUrl);

        const filteringEvent = {
            eventId,
            requestUrl,
            requestDomain,
            frameUrl,
            frameDomain,
            requestType,
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
    const addCosmeticEvent = function (tab, element, frameUrl, requestType, requestRule) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        if (!requestRule) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const frameDomain = adguard.utils.url.getDomainName(frameUrl);
        const filteringEvent = {
            element: typeof element === 'string' ? element : adguard.utils.strings.elementToString(element),
            frameUrl,
            frameDomain,
            requestType,
        };
        if (requestRule) {
            // Copy useful properties
            addRuleToFilteringEvent(filteringEvent, requestRule);
        }

        pushFilteringEvent(tabInfo, filteringEvent);
    };

    /**
     * Add script event to log with the corresponding rule
     * @param {{tabId: Number}} tab - Tab object with one of properties tabId
     * @param {String} frameUrl - Frame url
     * @param {String} requestType - Request type
     * @param {Object} rule - script rule
     */
    const addScriptInjectionEvent = (tab, frameUrl, requestType, rule) => {
        if (openedFilteringLogsPage === 0 || !rule) {
            return;
        }
        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }
        const frameDomain = adguard.utils.url.getDomainName(frameUrl);
        const filteringEvent = {
            script: true,
            requestUrl: frameUrl,
            frameUrl,
            frameDomain,
            requestType,
        };
        addRuleToFilteringEvent(filteringEvent, rule);
        pushFilteringEvent(tabInfo, filteringEvent);
    };

    /**
     * Binds rule to HTTP request
     * @param tab Tab
     * @param requestRule Request rule
     * @param eventId Event identifier
     */
    const bindRuleToHttpRequestEvent = function (tab, requestRule, eventId) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    addRuleToFilteringEvent(event, requestRule);
                    adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_UPDATED, tabInfo, event);
                    break;
                }
            }
        }
    };

    /**
     * Replace rules are fired after the event was added
     * We should find event for this rule and update in log UI
     * @param tab
     * @param replaceRules
     * @param eventId
     */
    const bindReplaceRulesToHttpRequestEvent = function (tab, replaceRules, eventId) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    addReplaceRulesToFilteringEvent(event, replaceRules);
                    adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_UPDATED, tabInfo, event);
                    break;
                }
            }
        }
    };

    /**
     *
     * @param {object} tab
     * @param {string} cookieName
     * @param {string} cookieValue
     * @param {string} cookieDomain
     * @param {string} requestType
     * @param {object} cookieRule
     * @param {boolean} isModifyingCookieRule
     * @param {boolean} thirdParty
     */
    const addCookieEvent = function (
        tab, cookieName, cookieValue, cookieDomain, requestType, cookieRule, isModifyingCookieRule, thirdParty
    ) {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const filteringEvent = {
            frameDomain: cookieDomain,
            requestType,
            requestThirdParty: thirdParty,
            cookieName,
            cookieValue,
        };

        if (cookieRule) {
            // Copy useful properties
            addRuleToFilteringEvent(filteringEvent, cookieRule);
            filteringEvent.requestRule.isModifyingCookieRule = isModifyingCookieRule;
            if (cookieRule.stealthActions) {
                filteringEvent.stealthActions = cookieRule.stealthActions;
            }
        }

        pushFilteringEvent(tabInfo, filteringEvent);
    };

    /**
     * Binds applied stealth actions to HTTP request
     *
     * @param {object} tab Request tab
     * @param {number} actions Applied actions
     * @param {number} eventId Event identifier
     */
    const bindStealthActionsToHttpRequestEvent = (tab, actions, eventId) => {
        if (openedFilteringLogsPage === 0) {
            return;
        }

        const tabInfo = tabsInfoMap[tab.tabId];
        if (!tabInfo) {
            return;
        }

        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    event.stealthActions = actions;
                    adguard.listeners.notifyListeners(adguard.listeners.LOG_EVENT_UPDATED, tabInfo, event);
                    break;
                }
            }
        }
    };

    /**
     * Remove log requests for tab
     * @param tabId
     */
    const clearEventsByTabId = function (tabId) {
        const tabInfo = tabsInfoMap[tabId];
        if (tabInfo) {
            delete tabInfo.filteringEvents;
            adguard.listeners.notifyListeners(adguard.listeners.TAB_RESET, tabInfo);
        }
    };

    /**
     * Synchronize currently opened tabs with out state
     * @param callback
     */
    const synchronizeOpenTabs = function (callback) {
        adguard.tabs.getAll((tabs) => {
            // As Object.keys() returns strings we convert them to integers,
            // because tabId is integer in extension API
            const tabIdsToRemove = Object.keys(tabsInfoMap).map(id => parseInt(id, 10));
            for (let i = 0; i < tabs.length; i++) {
                const openTab = tabs[i];
                const tabInfo = tabsInfoMap[openTab.tabId];
                if (!tabInfo) {
                    // add tab
                    addTab(openTab);
                } else {
                    // update tab
                    updateTab(openTab);
                }
                const index = tabIdsToRemove.indexOf(openTab.tabId);
                if (index >= 0) {
                    tabIdsToRemove.splice(index, 1);
                }
            }
            for (let j = 0; j < tabIdsToRemove.length; j++) {
                removeTabById(tabIdsToRemove[j]);
            }
            if (typeof callback === 'function') {
                const syncTabs = [];
                for (const tabId in tabsInfoMap) { // jshint ignore:line
                    syncTabs.push(tabsInfoMap[tabId]);
                }
                callback(syncTabs);
            }
        });
    };

    /**
     * We collect filtering events if opened at least one page of log
     */
    const onOpenFilteringLogPage = function () {
        openedFilteringLogsPage++;
    };

    /**
     * Cleanup when last page of log closes
     */
    const onCloseFilteringLogPage = function () {
        openedFilteringLogsPage = Math.max(openedFilteringLogsPage - 1, 0);
        if (openedFilteringLogsPage === 0) {
            // Clear events
            for (const tabId in tabsInfoMap) { // jshint ignore:line
                const tabInfo = tabsInfoMap[tabId];
                delete tabInfo.filteringEvents;
            }
        }
    };

    const isOpen = function () {
        return openedFilteringLogsPage > 0;
    };

    /**
     * We should synchronize open tabs and add listeners to the tabs after application
     * is initialized. Otherwise updating tabs can return wrong stats values and
     * overwrite them with wrong data
     */
    const init = () => {
        // Initialize filtering log
        synchronizeOpenTabs();

        // Bind to tab events
        adguard.tabs.onCreated.addListener(addTab);
        adguard.tabs.onUpdated.addListener(updateTab);
        adguard.tabs.onRemoved.addListener((tab) => {
            removeTabById(tab.tabId);
        });
    };

    return {

        synchronizeOpenTabs,
        init,

        getFilteringInfoByTabId,
        addHttpRequestEvent,
        bindRuleToHttpRequestEvent,
        bindReplaceRulesToHttpRequestEvent,
        addCosmeticEvent,
        addCookieEvent,
        addScriptInjectionEvent,
        bindStealthActionsToHttpRequestEvent,
        clearEventsByTabId,


        isOpen,
        onOpenFilteringLogPage,
        onCloseFilteringLogPage,
    };
})(adguard);
