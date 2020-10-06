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

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { tabsApi } from '../../tabs/tabs-api';
import { BACKGROUND_TAB_ID, utils } from '../../utils/common';
import { backgroundPage } from '../../extension-api/background-page';
import { prefs } from '../../prefs';
import { listeners } from '../../notifier';

/**
 * Object for log http requests
 */
const browsersFilteringLog = (function () {
    const REQUESTS_SIZE_PER_TAB = 1000;

    const backgroundTabId = BACKGROUND_TAB_ID;

    const backgroundTab = {
        tabId: backgroundTabId,
        title: backgroundPage.i18n.getMessage('background_tab_title'),
    };

    const tabsInfoMap = Object.create(null);
    let openedFilteringLogsPage = 0;

    // Force to add background tab if it's defined
    if (prefs.features.hasBackgroundTab) {
        tabsInfoMap[backgroundTabId] = backgroundTab;
    }

    /**
     * Checks if filtering log page is open
     * @return {boolean}
     */
    const isOpen = function () {
        return openedFilteringLogsPage > 0;
    };

    /**
     * We collect filtering events if opened at least one page of log
     */
    const onOpenFilteringLogPage = function () {
        openedFilteringLogsPage += 1;
    };

    /**
     * Cleanup when last page of log closes
     */
    const onCloseFilteringLogPage = function () {
        openedFilteringLogsPage = Math.max(openedFilteringLogsPage - 1, 0);
        if (openedFilteringLogsPage === 0) {
            // Clear events
            Object.keys(tabsInfoMap).forEach((tabId) => {
                const tabInfo = tabsInfoMap[tabId];
                delete tabInfo.filteringEvents;
            });
        }
    };

    /**
     * Get filtering info for tab
     * @param tabId
     */
    const getFilteringInfoByTabId = tabId => tabsInfoMap[tabId];

    /**
     * Updates tab info (title and url)
     * @param tab
     */
    const updateTabInfo = (tab) => {
        const tabInfo = tabsInfoMap[tab.tabId] || Object.create(null);
        tabInfo.tabId = tab.tabId;
        tabInfo.title = tab.title;
        tabInfo.isExtensionTab = tab.url && tab.url.indexOf(backgroundPage.app.getExtensionUrl()) === 0;
        tabsInfoMap[tab.tabId] = tabInfo;
        return tabInfo;
    };

    /**
     * Adds tab
     * @param tab
     */
    const addTab = (tab) => {
        // Background tab can't be added
        // Synthetic tabs are used to send initial requests from new tab in chrome
        if (tab.tabId === backgroundTabId || tab.synthetic) {
            return;
        }

        const tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            listeners.notifyListeners(listeners.TAB_ADDED, tabInfo);
        }
    };

    /**
     * Removes tab
     * @param tabId
     */
    const removeTabById = (tabId) => {
        // Background tab can't be removed
        if (tabId === backgroundTabId) {
            return;
        }

        const tabInfo = tabsInfoMap[tabId];
        if (tabInfo) {
            listeners.notifyListeners(listeners.TAB_CLOSE, tabInfo);
        }
        delete tabsInfoMap[tabId];
    };

    /**
     * Updates tab
     * @param tab
     */
    const updateTab = (tab) => {
        // Background tab can't be updated
        if (tab.tabId === backgroundTabId) {
            return;
        }

        const tabInfo = updateTabInfo(tab);
        if (tabInfo) {
            listeners.notifyListeners(listeners.TAB_UPDATE, tabInfo);
        }
    };

    /**
     * Copy some properties from source rule to destination rule
     * @param destinationRuleDTO
     * @param sourceRule
     */
    const copyRuleProperties = (destinationRuleDTO, sourceRule) => {
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
     * Checks if event can be added
     * @param tab
     */
    const canAddEvent = (tab) => {
        if (!isOpen()) {
            return false;
        }

        return !!getFilteringInfoByTabId(tab.tabId);
    };

    /**
     * Writes to filtering event some useful properties from the request rule
     * @param filteringEvent
     * @param rule
     */
    const addRuleToFilteringEvent = (filteringEvent, rule) => {
        if (!rule) {
            return;
        }

        filteringEvent.requestRule = {};
        copyRuleProperties(filteringEvent.requestRule, rule);
    };

    /**
     * Adds filtering event to log
     * @param tab Tab
     * @param filteringEvent Event to add
     */
    const pushFilteringEvent = (tab, filteringEvent) => {
        const tabInfo = getFilteringInfoByTabId(tab.tabId);
        if (!tabInfo) {
            return;
        }

        if (!tabInfo.filteringEvents) {
            tabInfo.filteringEvents = [];
        }

        tabInfo.filteringEvents.push(filteringEvent);

        if (tabInfo.filteringEvents.length > REQUESTS_SIZE_PER_TAB) {
            // don't remove first item, cause it's request to main frame
            tabInfo.filteringEvents.splice(1, 1);
        }

        listeners.notifyListeners(listeners.LOG_EVENT_ADDED, tabInfo, filteringEvent);
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
        if (!canAddEvent(tab)) {
            return;
        }

        const requestDomain = utils.url.getDomainName(requestUrl);
        const frameDomain = utils.url.getDomainName(frameUrl);

        const filteringEvent = {
            eventId,
            requestUrl,
            requestDomain,
            frameUrl,
            frameDomain,
            requestType,
            requestThirdParty: utils.url.isThirdPartyRequest(requestUrl, frameUrl),
        };

        addRuleToFilteringEvent(filteringEvent, requestRule);
        pushFilteringEvent(tab, filteringEvent);
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
        if (!requestRule || !canAddEvent(tab)) {
            return;
        }

        const frameDomain = utils.url.getDomainName(frameUrl);
        const filteringEvent = {
            element: typeof element === 'string' ? element : utils.strings.elementToString(element),
            frameUrl,
            frameDomain,
            requestType,
        };

        addRuleToFilteringEvent(filteringEvent, requestRule);
        pushFilteringEvent(tab, filteringEvent);
    };

    /**
     * Add script event to log with the corresponding rule
     * @param {{tabId: Number}} tab - Tab object with one of properties tabId
     * @param {String} frameUrl - Frame url
     * @param {String} requestType - Request type
     * @param {Object} rule - script rule
     */
    const addScriptInjectionEvent = (tab, frameUrl, requestType, rule) => {
        if (!rule || !canAddEvent(tab)) {
            return;
        }

        const frameDomain = utils.url.getDomainName(frameUrl);
        const filteringEvent = {
            script: true,
            requestUrl: frameUrl,
            frameUrl,
            frameDomain,
            requestType,
        };

        addRuleToFilteringEvent(filteringEvent, rule);
        pushFilteringEvent(tab, filteringEvent);
    };

    /**
     * Adds remove query parameters event to log with the corresponding rule
     *
     * @param {{tabId: Number}} tab - Tab object with one of properties tabId
     * @param {String} frameUrl - Frame url
     * @param {String} requestType - Request type
     * @param {Object} rule - removeparam rule
     */
    const addRemoveParamEvent = (tab, frameUrl, requestType, rule) => {
        if (!rule || !canAddEvent(tab)) {
            return;
        }

        const frameDomain = utils.url.getDomainName(frameUrl);
        const filteringEvent = {
            removeParam: true,
            requestUrl: frameUrl,
            frameUrl,
            frameDomain,
            requestType,
        };

        addRuleToFilteringEvent(filteringEvent, rule);
        pushFilteringEvent(tab, filteringEvent);
    };

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
            const ruleDTO = {};
            copyRuleProperties(ruleDTO, replaceRule);
            filteringEvent.replaceRules.push(ruleDTO);
        });
    };

    /**
     * Adds cookie rule event
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
        tab, cookieName, cookieValue, cookieDomain, requestType, cookieRule, isModifyingCookieRule, thirdParty,
    ) {
        if (!canAddEvent(tab)) {
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

        pushFilteringEvent(tab, filteringEvent);
    };

    /**
     * Binds rule to HTTP request
     * @param tab Tab
     * @param requestRule Request rule
     * @param eventId Event identifier
     */
    const bindRuleToHttpRequestEvent = function (tab, requestRule, eventId) {
        if (!canAddEvent(tab)) {
            return;
        }

        const tabInfo = getFilteringInfoByTabId(tab.tabId);
        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    addRuleToFilteringEvent(event, requestRule);
                    listeners.notifyListeners(listeners.LOG_EVENT_UPDATED, tabInfo, event);
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
        if (!canAddEvent(tab)) {
            return;
        }

        const tabInfo = getFilteringInfoByTabId(tab.tabId);
        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    addReplaceRulesToFilteringEvent(event, replaceRules);
                    listeners.notifyListeners(listeners.LOG_EVENT_UPDATED, tabInfo, event);
                    break;
                }
            }
        }
    };

    /**
     * Binds applied stealth actions to HTTP request
     *
     * @param {object} tab Request tab
     * @param {number} actions Applied actions
     * @param {number} eventId Event identifier
     */
    const bindStealthActionsToHttpRequestEvent = (tab, actions, eventId) => {
        if (!canAddEvent(tab)) {
            return;
        }

        const tabInfo = getFilteringInfoByTabId(tab.tabId);
        const events = tabInfo.filteringEvents;
        if (events) {
            for (let i = events.length - 1; i >= 0; i -= 1) {
                const event = events[i];
                if (event.eventId === eventId) {
                    event.stealthActions = actions;
                    listeners.notifyListeners(listeners.LOG_EVENT_UPDATED, tabInfo, event);
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
            listeners.notifyListeners(listeners.TAB_RESET, tabInfo);
        }
    };

    /**
     * Synchronize currently opened tabs with out state
     */
    const synchronizeOpenTabs = async function () {
        const tabs = await tabsApi.getAll();
        // As Object.keys() returns strings we convert them to integers,
        // because tabId is integer in extension API
        const tabIdsToRemove = Object.keys(tabsInfoMap).map(id => parseInt(id, 10));
        for (let i = 0; i < tabs.length; i += 1) {
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
        for (let j = 0; j < tabIdsToRemove.length; j += 1) {
            removeTabById(tabIdsToRemove[j]);
        }

        const syncTabs = [];

        Object.keys(tabsInfoMap).forEach((tabId) => {
            syncTabs.push(tabsInfoMap[tabId]);
        });

        return syncTabs;
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
        tabsApi.onCreated.addListener(addTab);
        tabsApi.onUpdated.addListener(updateTab);
        tabsApi.onRemoved.addListener((tab) => {
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
        addRemoveParamEvent,
        addScriptInjectionEvent,
        bindStealthActionsToHttpRequestEvent,
        clearEventsByTabId,

        isOpen,
        onOpenFilteringLogPage,
        onCloseFilteringLogPage,
    };
})();

export default browsersFilteringLog;
