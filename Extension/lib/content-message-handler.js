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
        return {listenerId: listenerId};
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
            contentBlockerInfo: adguard.requestFilter.getContentBlockerInfo(),
            syncStatusInfo: adguard.sync.syncService.getSyncStatus(),
            environmentOptions: {
                isMacOs: adguard.utils.browser.isMacOs(),
                isSafariBrowser: adguard.utils.browser.isSafariBrowser(),
                isContentBlockerEnabled: adguard.utils.browser.isContentBlockerEnabled(),
                Prefs: {
                    locale: adguard.app.getLocale(),
                    mobile: adguard.prefs.mobile || false
                }
            },
            constants: {
                AntiBannerFiltersId: adguard.utils.filters.ids,
                EventNotifierTypes: adguard.listeners.events
            }
        };
    }

    /**
     * Searches for whitelisted domains.
     *
     * @param offset Offset
     * @param limit Limit
     * @param text Search string
     * @returns {Array} Domains found
     */
    function searchWhiteListDomains(offset, limit, text) {
        var domains = adguard.whitelist.getWhiteListDomains();
        var result = [];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            if (!text || adguard.utils.strings.containsIgnoreCase(domain, text)) {
                result.push(domain);
            }
        }
        return limit ? result.slice(offset, offset + limit) : result;
    }

    /**
     * Saves css hits from content-script.
     * Message includes stats field. [{filterId: 1, ruleText: 'rule1'}, {filterId: 2, ruleText: 'rule2'}...]
     * @param tab
     * @param stats
     */
    function processSaveCssHitStats(tab, stats) {
        if (!adguard.settings.collectHitsCount()) {
            return;
        }
        if (adguard.frames.isIncognitoTab(tab)) {
            return;
        }
        var domain = adguard.frames.getFrameDomain(tab);
        for (var i = 0; i < stats.length; i++) {
            var stat = stats[i];
            adguard.hitStats.addRuleHit(domain, stat.ruleText, stat.filterId);
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
                return {ready: adguard.requestFilter.isReady()};
            case 'addAndEnableFilter':
                adguard.filters.addAndEnableFilters([message.filterId]);
                break;
            case 'disableAntiBannerFilter':
                if (message.remove) {
                    adguard.filters.removeFilters([message.filterId]);
                } else {
                    adguard.filters.disableFilters([message.filterId]);
                }
                break;
            case 'addAndEnableFiltersByTagId':
                adguard.tags.addAndEnableFiltersByTagId(message.tagId);
                break;
            case 'disableAntiBannerFiltersByTagId':
                adguard.tags.disableAntiBannerFiltersByTagId(message.tagId);
                break;
            case 'getWhiteListDomains':
                var whiteListDomains = searchWhiteListDomains(message.offset, message.limit, message.text);
                return {rules: whiteListDomains};
            case 'getUserRules':
                adguard.userrules.getUserRulesText(function (content) {
                    callback({content: content});
                });
                return true;
            case 'saveUserRules':
                adguard.userrules.updateUserRulesText(message.content);
                break;
            case 'checkAntiBannerFiltersUpdate':
                adguard.ui.checkFiltersUpdates();
                break;
            case 'addCustomFilter':
                adguard.ui.addCustomFilter(message.url);
                break;
            case 'changeDefaultWhiteListMode':
                adguard.whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'clearUserFilter':
                adguard.userrules.clearRules();
                break;
            case 'clearWhiteListFilter':
                adguard.whitelist.clearWhiteList();
                break;
            case 'addWhiteListDomains':
                adguard.whitelist.addToWhiteListArray(message.domains);
                break;
            case 'removeWhiteListDomain':
                adguard.whitelist.removeFromWhiteList(message.text);
                break;
            case 'addUserFilterRules':
                adguard.userrules.addRules(message.rules);
                break;
            case 'getFiltersMetadata':
                return adguard.tags.getFiltersMetadata();
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
                adguard.ui.openExportRulesTab(message.whitelist);
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
            case 'getSelectorsAndScripts':
                if (adguard.utils.workaround.isFacebookIframe(message.documentUrl)) {
                    return {};
                }
                var cssAndScripts = adguard.webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl, message.options);
                return cssAndScripts || {};
            case 'checkPageScriptWrapperRequest':
                var block = adguard.webRequestService.checkPageScriptWrapperRequest(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return {block: block, requestId: message.requestId};
            case 'processShouldCollapse':
                var collapse = adguard.webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return {collapse: collapse, requestId: message.requestId};
            case 'processShouldCollapseMany':
                var requests = adguard.webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                return {requests: requests};
            case 'addUserRule':
                adguard.userrules.addRules([message.ruleText]);
                if (message.adguardDetected || adguard.frames.isTabAdguardDetected(sender.tab)) {
                    adguard.integration.addRuleToApp(message.ruleText);
                }
                break;
            case 'removeUserRule':
                adguard.userrules.removeRule(message.ruleText);
                if (message.adguardDetected || adguard.frames.isTabAdguardDetected(sender.tab)) {
                    adguard.integration.removeRuleFromApp(message.ruleText);
                }
                break;
            case 'onOpenFilteringLogPage':
                adguard.filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                adguard.filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                adguard.tabs.reload(message.tabId);
                break;
            case 'clearEventsByTabId':
                adguard.filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById':
                if (message.tabId) {
                    var frameInfo = adguard.frames.getFrameInfo({tabId: message.tabId});
                    return {frameInfo: frameInfo};
                } else {
                    adguard.tabs.getActive(function (tab) {
                        var frameInfo = adguard.frames.getFrameInfo(tab);
                        callback({frameInfo: frameInfo});
                    });
                    return true; // Async
                }
                break;
            case 'getFilteringInfoByTabId':
                var filteringInfo = adguard.filteringLog.getFilteringInfoByTabId(message.tabId);
                return {filteringInfo: filteringInfo};
            case 'synchronizeOpenTabs':
                adguard.filteringLog.synchronizeOpenTabs(function (tabs) {
                    callback({tabs: tabs});
                });
                return true; // Async
            case 'checkSubscriptionUrl':
                var filterMetadata = adguard.filters.findFilterMetadataBySubscriptionUrl(message.url);
                var confirmText;
                if (filterMetadata) {
                    //ok, filter found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_enable', [filterMetadata.name]);
                } else {
                    //filter not found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_import', [message.title]);
                }
                return {confirmText: confirmText};
            case 'enableSubscription':
                adguard.filters.processAbpSubscriptionUrl(message.url, function (rulesAddedCount) {
                    var title = adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_title');
                    var text = adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_text', [String(rulesAddedCount)]);
                    adguard.ui.showAlertMessagePopup(title, text);
                });
                return true; // Async
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
            case 'openSettingsTab':
                adguard.ui.openSettingsTab();
                break;
            case 'openAssistant':
                adguard.ui.openAssistant();
                break;
            case 'getTabInfoForPopup':
                adguard.tabs.getActive(function (tab) {
                    var frameInfo = adguard.frames.getFrameInfo(tab);
                    callback({
                        frameInfo: frameInfo,
                        options: {
                            showStatsSupported: !adguard.utils.browser.isContentBlockerEnabled(),
                            isSafariBrowser: adguard.utils.browser.isSafariBrowser(),
                            isFirefoxBrowser: adguard.utils.browser.isFirefoxBrowser(),
                            isMacOs: adguard.utils.browser.isMacOs()
                        }
                    });
                });
                return true; // Async
            case 'getStatisticsData':
                callback({
                    stats: adguard.pageStats.getStatisticsData()
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
            // Sync messages
            case 'setSyncProvider':
                adguard.sync.syncService.setSyncProvider(message.provider);
                break;
            case 'setOAuthToken':
                if (adguard.sync.oauthService.setToken(message.provider, message.token, message.csrfState, message.expires)) {
                    adguard.sync.syncService.setSyncProvider(message.provider);
                    adguard.tabs.remove(sender.tab.tabId);
                }
                break;
            case 'getSyncStatus':
                return adguard.sync.syncService.getSyncStatus();
            case 'authSync':
                adguard.sync.oauthService.authorize(message.provider);
                break;
            case 'dropAuthSync':
                adguard.listeners.notifyListeners(adguard.listeners.SYNC_BAD_OR_EXPIRED_TOKEN, message.provider);
                break;
            case 'toggleSync':
                adguard.sync.syncService.toggleSyncStatus();
                break;
            case 'syncNow':
                adguard.listeners.notifyListeners(adguard.listeners.SYNC_REQUIRED, {force: true});
                break;
            case 'setSyncOptions':
                adguard.sync.syncService.setSyncOptions(message.options);
                break;
            case 'syncChangeDeviceName':
                adguard.sync.syncService.changeDeviceName(message.deviceName);
                break;
            case 'loadSettingsJson':
                adguard.sync.settingsProvider.loadSettingsBackup(callback);
                return true; // Async
            case 'applySettingsJson':
                adguard.sync.settingsProvider.applySettingsBackup(message.json, callback);
                return true; // Async
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

