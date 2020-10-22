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
 *  Initialize Content => BackgroundPage messaging
 */
(function (adguard) {

    'use strict';

    /**
     * Contains event listeners from content pages
     */
    var eventListeners = Object.create(null);

    /**
     * Adds event listener from content page
     * @param message
     * @param sender
     */
    function processAddEventListener(message, sender) {
        var listenerId = adguard.listeners.addSpecifiedListener(message.events, function () {
            var sender = eventListeners[listenerId];
            if (sender) {
                adguard.tabs.sendMessage(sender.tab.tabId, {
                    type: 'notifyListeners',
                    args: Array.prototype.slice.call(arguments)
                });
            }
        });
        eventListeners[listenerId] = sender;
        return { listenerId: listenerId };
    }

    /**
     * Constructs objects that uses on extension pages, like: options.html, thankyou.html etc
     */
    function processInitializeFrameScriptRequest() {

        var enabledFilters = Object.create(null);

        var AntiBannerFiltersId = adguard.utils.filters.ids;

        for (var key in AntiBannerFiltersId) {
            if (AntiBannerFiltersId.hasOwnProperty(key)) {
                var filterId = AntiBannerFiltersId[key];
                var enabled = adguard.filters.isFilterEnabled(filterId);
                if (enabled) {
                    enabledFilters[filterId] = true;
                }
            }
        }

        return {
            userSettings: adguard.settings.getAllSettings(),
            enabledFilters: enabledFilters,
            filtersMetadata: adguard.subscriptions.getFilters(),
            requestFilterInfo: adguard.requestFilter.getRequestFilterInfo(),
            environmentOptions: {
                isMacOs: adguard.utils.browser.isMacOs(),
                canBlockWebRTC: adguard.stealthService.canBlockWebRTC(),
                isChrome: adguard.utils.browser.isChromeBrowser(),
                Prefs: {
                    locale: adguard.app.getLocale(),
                    mobile: adguard.prefs.mobile || false,
                },
                appVersion: adguard.app.getVersion(),
            },
            constants: {
                AntiBannerFiltersId: adguard.utils.filters.ids,
                EventNotifierTypes: adguard.listeners.events,
            },
        };
    }

    /**
     * Saves css hits from content-script.
     * Message includes stats field. [{filterId: 1, ruleText: 'rule1'}, {filterId: 2, ruleText: 'rule2'}...]
     * @param tab
     * @param stats
     */
    function processSaveCssHitStats(tab, stats) {
        if (!adguard.webRequestService.isCollectingCosmeticRulesHits(tab)) {
            return;
        }
        var frameUrl = adguard.frames.getMainFrameUrl(tab);
        for (let i = 0; i < stats.length; i += 1) {
            const stat = stats[i];
            const rule = adguard.rules.builder.createRule(stat.ruleText, stat.filterId);
            adguard.webRequestService.recordRuleHit(tab, rule, frameUrl);
            adguard.filteringLog.addCosmeticEvent(tab, stat.element, tab.url, adguard.RequestTypes.DOCUMENT, rule);
        }
    }


    /**
     * Main function for processing messages from content-scripts
     *
     * @param message
     * @param sender
     * @param callback
     * @returns {*}
     */
    function handleMessage(message, sender, callback) {
        switch (message.type) {
            case 'unWhiteListFrame':
                adguard.userrules.unWhiteListFrame(message.frameInfo);
                break;
            case 'addEventListener':
                return processAddEventListener(message, sender);
            case 'removeListener':
                var listenerId = message.listenerId;
                adguard.listeners.removeListener(listenerId);
                delete eventListeners[listenerId];
                break;
            case 'initializeFrameScript':
                return processInitializeFrameScriptRequest();
            case 'changeUserSetting':
                adguard.settings.setProperty(message.key, message.value);
                break;
            case 'checkRequestFilterReady':
                return { ready: adguard.requestFilter.isReady() };
            case 'addAndEnableFilter':
                adguard.filters.addAndEnableFilters([message.filterId]);
                break;
            case 'disableAntiBannerFilter':
                if (message.remove) {
                    adguard.filters.uninstallFilters([message.filterId]);
                } else {
                    adguard.filters.disableFilters([message.filterId]);
                }
                break;
            case 'removeAntiBannerFilter':
                adguard.filters.removeFilter(message.filterId);
                break;
            case 'enableFiltersGroup':
                adguard.categories.enableFiltersGroup(message.groupId);
                break;
            case 'disableFiltersGroup':
                adguard.categories.disableFiltersGroup(message.groupId);
                break;
            case 'changeDefaultWhiteListMode':
                adguard.whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'getWhiteListDomains': {
                const whiteListDomains = adguard.whitelist.getWhiteListDomains();
                const appVersion = adguard.app.getVersion();
                callback({ content: whiteListDomains.join('\r\n'), appVersion });
                break;
            }
            case 'saveWhiteListDomains': {
                const domains = message.content.split(/[\r\n]+/)
                    .map(string => string.trim())
                    .filter(string => string.length > 0);
                adguard.whitelist.updateWhiteListDomains(domains);
                break;
            }
            case 'getUserRules':
                adguard.userrules.getUserRulesText((content) => {
                    const appVersion = adguard.app.getVersion();
                    callback({ content, appVersion });
                });
                return true;
            case 'saveUserRules':
                adguard.userrules.updateUserRulesText(message.content);
                break;
            case 'addUserRule':
                adguard.userrules.addRules([message.ruleText]);
                break;
            case 'removeUserRule':
                adguard.userrules.removeRule(message.ruleText);
                break;
            case 'checkAntiBannerFiltersUpdate':
                adguard.ui.checkFiltersUpdates();
                break;
            case 'loadCustomFilterInfo':
                adguard.filters.loadCustomFilterInfo(message.url, { title: message.title }, (filter) => {
                    callback({ filter });
                }, (error) => {
                    callback({ error });
                });
                return true;
            case 'subscribeToCustomFilter': {
                const { url, title, trusted } = message;
                adguard.filters.loadCustomFilter(url, { title, trusted }, (filter) => {
                    adguard.filters.addAndEnableFilters([filter.filterId], () => {
                        callback(filter);
                    });
                }, () => {
                    callback();
                });
                return true;
            }
            case 'getFiltersMetadata':
                return adguard.categories.getFiltersMetadata();
            case 'setFiltersUpdatePeriod':
                adguard.settings.setFiltersUpdatePeriod(message.updatePeriod);
                break;
            case 'openThankYouPage':
                adguard.ui.openThankYouPage();
                break;
            case 'openExtensionStore':
                adguard.ui.openExtensionStore();
                break;
            case 'openFilteringLog':
                adguard.ui.openFilteringLog(message.tabId);
                break;
            case 'openExportRulesTab':
                adguard.ui.openExportRulesTab(message.hash);
                break;
            case 'openSafebrowsingTrusted':
                adguard.safebrowsing.addToSafebrowsingTrusted(message.url);
                adguard.tabs.getActive(function (tab) {
                    adguard.tabs.reload(tab.tabId, message.url);
                });
                break;
            case 'openTab':
                adguard.ui.openTab(message.url, message.options);
                break;
            case 'resetBlockedAdsCount':
                adguard.frames.resetBlockedAdsCount();
                break;
            case 'getSelectorsAndScripts': {
                let urlForSelectors;
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1498
                // when document url for iframe is about:blank then we use tab url
                if (!adguard.utils.url.isHttpOrWsRequest(message.documentUrl) && sender.frameId !== 0) {
                    urlForSelectors = sender.tab.url;
                } else {
                    urlForSelectors = message.documentUrl;
                }
                return adguard.webRequestService.processGetSelectorsAndScripts(sender.tab, urlForSelectors) || {};
            }
            case 'checkPageScriptWrapperRequest':
                var block = adguard.webRequestService.checkPageScriptWrapperRequest(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return { block: block, requestId: message.requestId };
            case 'processShouldCollapse':
                var collapse = adguard.webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return { collapse: collapse, requestId: message.requestId };
            case 'processShouldCollapseMany':
                var requests = adguard.webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                return { requests: requests };
            case 'onOpenFilteringLogPage':
                adguard.filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                adguard.filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                if (!message.preserveLogEnabled) {
                    adguard.filteringLog.clearEventsByTabId(message.tabId);
                }
                adguard.tabs.reload(message.tabId);
                break;
            case 'clearEventsByTabId':
                adguard.filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById':
                if (message.tabId) {
                    var frameInfo = adguard.frames.getFrameInfo({ tabId: message.tabId });
                    return { frameInfo: frameInfo };
                } else {
                    adguard.tabs.getActive(function (tab) {
                        var frameInfo = adguard.frames.getFrameInfo(tab);
                        callback({ frameInfo: frameInfo });
                    });
                    return true; // Async
                }
            case 'getFilteringInfoByTabId':
                var filteringInfo = adguard.filteringLog.getFilteringInfoByTabId(message.tabId);
                return { filteringInfo: filteringInfo };
            case 'synchronizeOpenTabs':
                adguard.filteringLog.synchronizeOpenTabs(function (tabs) {
                    callback({ tabs: tabs });
                });
                return true; // Async
            case 'addFilterSubscription': {
                const { url, title } = message;
                const hashOptions = {
                    action: 'add_filter_subscription',
                    title,
                    url,
                };
                adguard.ui.openSettingsTab('antibanner0', hashOptions);
                break;
            }
            case 'showAlertMessagePopup':
                adguard.ui.showAlertMessagePopup(message.title, message.text);
                break;
            // Popup methods
            case 'addWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.whiteListTab(tab);
                });
                break;
            case 'removeWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.unWhiteListTab(tab);
                });
                break;
            case 'changeApplicationFilteringDisabled':
                adguard.ui.changeApplicationFilteringDisabled(message.disabled);
                break;
            case 'openSiteReportTab':
                adguard.ui.openSiteReportTab(message.url);
                break;
            case 'openAbuseTab':
                adguard.ui.openAbuseTab(message.url);
                break;
            case 'openSettingsTab':
                adguard.ui.openSettingsTab();
                break;
            case 'openAssistant':
                adguard.ui.openAssistant();
                break;
            case 'getTabInfoForPopup':
                adguard.tabs.getActive((tab) => {
                    const frameInfo = adguard.frames.getFrameInfo(tab);
                    callback({
                        frameInfo,
                        options: {
                            showStatsSupported: true,
                            isFirefoxBrowser: adguard.utils.browser.isFirefoxBrowser(),
                            showInfoAboutFullVersion: adguard.settings.isShowInfoAboutAdguardFullVersion(),
                            isMacOs: adguard.utils.browser.isMacOs(),
                            isEdgeBrowser: adguard.utils.browser.isEdgeBrowser()
                                || adguard.utils.browser.isEdgeChromiumBrowser(),
                            notification: adguard.notifications.getCurrentNotification(),
                            isDisableShowAdguardPromoInfo: adguard.settings.isDisableShowAdguardPromoInfo(),
                        },
                    });
                });
                return true; // Async
            case 'setNotificationViewed':
                adguard.notifications.setNotificationViewed(message.withDelay);
                break;
            case 'getStatisticsData':
                // There can't be data till localstorage is initialized
                if (!adguard.localStorage.isInitialized()) {
                    return {};
                }
                callback({
                    stats: adguard.pageStats.getStatisticsData(),
                });
                return true;
            case 'resizePanelPopup':
                adguard.browserAction.resize(message.width, message.height);
                break;
            case 'closePanelPopup':
                adguard.browserAction.close();
                break;
            case 'sendFeedback':
                adguard.backend.sendUrlReport(message.url, message.topic, message.comment);
                break;
            case 'saveCssHitStats':
                processSaveCssHitStats(sender.tab, message.stats);
                break;
            case 'loadSettingsJson': {
                const appVersion = adguard.app.getVersion();
                const settingsCb = (json) => {
                    callback({ content: json, appVersion });
                };
                adguard.sync.settingsProvider.loadSettingsBackup(settingsCb);
                return true; // Async
            }
            case 'applySettingsJson':
                adguard.sync.settingsProvider.applySettingsBackup(message.json);
                break;
            case 'disableGetPremiumNotification':
                adguard.settings.disableShowAdguardPromoInfo();
                break;
            default:
                // Unhandled message
                return true;
        }
    }

    // Add event listener from content-script messages
    adguard.runtime.onMessage.addListener(handleMessage);

    /**
     * There is no messaging in Safari popover context,
     * so we have to expose this method to keep the message-like style that is used in other browsers for communication between popup and background page.
     */
    adguard.runtime.onMessageHandler = handleMessage;

})(adguard);
