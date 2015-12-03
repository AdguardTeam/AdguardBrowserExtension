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
var userSettings = require('utils/user-settings').userSettings;
var EventNotifier = require('utils/notifier').EventNotifier;
var Utils = require('utils/browser-utils').Utils;
var Prefs = require('prefs').Prefs;

var EventNotifierTypes = require('utils/common').EventNotifierTypes;
var AntiBannerFiltersId = require('utils/common').AntiBannerFiltersId;
var LogEvents = require('utils/common').LogEvents;
var WorkaroundUtils = require('utils/workaround').WorkaroundUtils;

var ContentMessageHandler = exports.ContentMessageHandler = function () {
    this.handleMessage = this.handleMessage.bind(this);
};

ContentMessageHandler.prototype = {

    eventListeners: Object.create(null),
    sendMessageToSender: null,

    init: function (antiBannerService, webRequestService, framesMap, adguardApplication, filteringLog, UI) {
        this.antiBannerService = antiBannerService;
        this.webRequestService = webRequestService;
        this.framesMap = framesMap;
        this.adguardApplication = adguardApplication;
        this.filteringLog = filteringLog;
        this.UI = UI;
    },

    setSendMessageToSender: function (sendMessageToSender) {
        this.sendMessageToSender = sendMessageToSender;
    },

    handleMessage: function (message, sender, callback) {
        switch (message.type) {
            case 'unWhiteListFrame':
                this.antiBannerService.unWhiteListFrame(message.frameInfo);
                callback({});
                break;
            case 'addRuleToApp':
                this.adguardApplication.addRuleToApp(message.ruleText);
                callback({});
                break;
            case 'removeRuleFromApp':
                this.adguardApplication.removeRuleFromApp(message.ruleText);
                callback({});
                break;
            case 'addEventListener':
                var listenerInfo = this._processAddEventListener(message, sender);
                callback(listenerInfo);
                break;
            case 'removeListener':
                var listenerId = message.listenerId;
                EventNotifier.removeListener(listenerId);
                delete this.eventListeners[listenerId];
                callback({});
                break;
            case 'initializeFrameScript':
                var response = this._processInitializeFrameScriptRequest();
                callback(response);
                break;
            case 'changeUserSetting':
                userSettings.setProperty(message.key, message.value);
                callback({});
                break;
            case 'initializeFiltersOnInstall':
                this.antiBannerService.initializeFiltersOnInstall(function (enabledFilterIds) {
                    callback({enabledFilterIds: enabledFilterIds});
                });
                return true; // Async
            case 'addAndEnableFilter':
                this.antiBannerService.addAndEnableFilter(message.filterId);
                callback({});
                break;
            case 'removeAntiBannerFilter':
                this.antiBannerService.removeAntiBannerFilter(message.filterId);
                callback({});
                break;
            case 'enableAntiBannerFilter':
                this.antiBannerService.enableAntiBannerFilter(message.filterId);
                callback({});
                break;
            case 'disableAntiBannerFilter':
                this.antiBannerService.disableAntiBannerFilter(message.filterId);
                callback({});
                break;
            case 'getWhiteListDomains':
                var whiteListDomains = this.antiBannerService.getWhiteListDomains(message.offset, message.limit, message.text);
                callback({rules: whiteListDomains});
                break;
            case 'getUserFilters':
                var userFilters = this.antiBannerService.getUserFilters(message.offset, message.limit, message.text);
                callback({rules: userFilters});
                break;
            case 'checkAntiBannerFiltersUpdate':
                this.UI.checkAntiBannerFiltersUpdate();
                callback({});
                break;
            case 'getAntiBannerFiltersForOptionsPage':
                var renderedFilters = this.antiBannerService.getAntiBannerFiltersForOptionsPage();
                callback({filters: renderedFilters});
                break;
            case 'changeDefaultWhiteListMode':
                this.antiBannerService.changeDefaultWhiteListMode(message.enabled);
                callback({});
                break;
            case 'clearUserFilter':
                this.antiBannerService.clearUserFilter();
                callback({});
                break;
            case 'clearWhiteListFilter':
                this.antiBannerService.clearWhiteListFilter();
                callback({});
                break;
            case 'addWhiteListDomain':
                this.antiBannerService.addWhiteListDomain(message.text);
                callback({});
                break;
            case 'removeWhiteListDomain':
                this.antiBannerService.removeWhiteListDomain(message.text);
                callback({});
                break;
            case 'addUserFilterRule':
                this.antiBannerService.addUserFilterRule(message.text);
                callback({});
                break;
            case 'removeUserFilter':
                this.antiBannerService.removeUserFilter(message.text);
                callback({});
                break;
            case 'addUserFilterRules':
                this.antiBannerService.addUserFilterRules(message.rules);
                callback({});
                break;
            case 'addWhiteListDomains':
                this.antiBannerService.addWhiteListDomains(message.domains);
                callback({});
                break;
            case 'onFiltersSubscriptionChange':
                this.antiBannerService.onFiltersSubscriptionChange(message.filterIds);
                callback({});
                break;
            case 'getFiltersMetadata':
                var metadataResponse = this._processGetFiltersMetadata();
                callback(metadataResponse);
                break;
            case 'openThankYouPage':
                this.UI.openThankYouPage();
                return true;
            case 'openExtensionStore':
                this.UI.openExtensionStore();
                return true;
            case 'openFilteringLog':
                this.UI.openFilteringLog();
                return true;
            case 'openExportRulesTab':
                this.UI.openExportRulesTab(message.whitelist);
                return true;
            case 'openSafebrowsingTrusted':
                this.antiBannerService.getRequestFilter().addToSafebrowsingTrusted(message.url);
                this.UI.reloadCurrentTab(message.url);
                return true;
            case 'openTab':
                this.UI.openTab(message.url, message.options);
                return true;
            case 'resetBlockedAdsCount':
                this.framesMap.resetBlockedAdsCount();
                return true;
            case 'getSelectorsAndScripts':
                if (WorkaroundUtils.isFacebookIframe(message.documentUrl)) {
                    callback({});
                    return;
                }
                var cssAndScripts = this.webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl);
                callback(cssAndScripts || {});
                break;
            case 'processShouldCollapse':
                /**
                 * In case of e10s we use the same way as in Chromium - blocked elements are collapsed in content script.
                 * In single process mode blocked elements are collapsed by content policy.
                 */
                if (Prefs.platform == 'firefox' && !WorkaroundUtils.isMultiProcessFirefoxMode()) {
                    // Collapsed by content policy
                    callback({collapse: false, requestId: message.requestId});
                } else {
                    var collapse = this.webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                    callback({
                        collapse: collapse,
                        requestId: message.requestId
                    });
                }
                break;
            case 'processShouldCollapseMany':
                var requests = this.webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                callback({
                    requests: requests
                });
                break;
            case 'loadAssistant':
                var options = this._processLoadAssistant();
                callback(options);
                break;
            case 'addUserRule':
                this.antiBannerService.addUserFilterRule(message.ruleText);
                if (this.framesMap.isTabAdguardDetected(sender.tab)) {
                    this.adguardApplication.addRuleToApp(message.ruleText);
                }
                callback({});
                break;
            case 'onOpenFilteringLogPage':
                this.filteringLog.onOpenFilteringLogPage();
                callback({});
                break;
            case 'onCloseFilteringLogPage':
                this.filteringLog.onCloseFilteringLogPage();
                callback({});
                break;
            case 'reloadTabById':
                this.filteringLog.reloadTabById(message.tabId);
                callback({});
                break;
            case 'clearEventsByTabId':
                this.filteringLog.clearEventsByTabId(message.tabId);
                callback({});
                break;
            case 'getTabFrameInfoById':
                var frameInfo = this.filteringLog.getTabFrameInfoById(message.tabId);
                callback({frameInfo: frameInfo});
                break;
            case 'getTabInfoById':
                var tabInfo = this.filteringLog.getTabInfoById(message.tabId);
                callback({tabInfo: this.filteringLog.serializeTabInfo(tabInfo)});
                break;
            case 'synchronizeOpenTabs':
                this.filteringLog.synchronizeOpenTabs(function () {
                    callback({});
                });
                return true;
            case 'checkSubscriptionUrl':
                var filterMetadata = this.antiBannerService.findFilterMetadataBySubscriptionUrl(message.url);
                var confirmText;
                if (filterMetadata) {
                    //ok, filter found
                    confirmText = i18n.getMessage('abp_subscribe_confirm_enable', [filterMetadata.name]);
                } else {
                    //filter not found
                    confirmText = i18n.getMessage('abp_subscribe_confirm_import', [message.title]);
                }
                callback({confirmText: confirmText});
                break;
            case 'enableSubscription':
                this.antiBannerService.processAbpSubscriptionUrl(message.url, function (rulesAddedCount) {
                    callback({
                        title: i18n.getMessage('abp_subscribe_confirm_import_finished_title'),
                        text: i18n.getMessage('abp_subscribe_confirm_import_finished_text', [rulesAddedCount])
                    });
                });
                return true; // Async
            default :
                callback({});
                break;
        }
    },

    _processInitializeFrameScriptRequest: function () {

        var enabledFilters = Object.create(null);

        for (var key in AntiBannerFiltersId) {
            if (AntiBannerFiltersId.hasOwnProperty(key)) {
                var filterId = AntiBannerFiltersId[key];
                var enabled = this.antiBannerService.isAntiBannerFilterEnabled(filterId);
                if (enabled) {
                    enabledFilters[filterId] = true;
                }
            }
        }

        return {
            userSettings: userSettings.getAllSettings(),
            enabledFilters: enabledFilters,
            filtersMetadata: this.antiBannerService.getFiltersMetadata(),
            rulesCount: this.antiBannerService.getRulesCount(),
            environmentOptions: {
                isMacOs: Utils.isMacOs(),
                isSafariBrowser: Utils.isSafariBrowser(),
                isContentBlockerEnabled: Utils.isContentBlockerEnabled(),
                Prefs: {
                    locale: Prefs.locale,
                    mobile: Prefs.mobile
                }
            },
            constants: {
                AntiBannerFiltersId: AntiBannerFiltersId,
                EventNotifierTypes: EventNotifierTypes,
                LogEvents: LogEvents
            }
        };
    },

    _processAddEventListener: function (message, sender) {
        var self = this;
        var listenerId = EventNotifier.addSpecifiedListener(message.events, function () {
            var sender = self.eventListeners[listenerId];
            if (sender) {
                self.sendMessageToSender(sender, {
                    type: 'notifyListeners',
                    args: Array.prototype.slice.call(arguments)
                });
            }
        });
        this.eventListeners[listenerId] = sender;
        return {listenerId: listenerId};
    },

    _processGetFiltersMetadata: function () {
        var groupsMeta = this.antiBannerService.getGroupsMetadata();
        var filtersMeta = Object.create(null);
        var enabledFilters = Object.create(null);
        var installedFilters = Object.create(null);
        for (var i = 0; i < groupsMeta.length; i++) {
            var groupId = groupsMeta[i].groupId;
            var filters = filtersMeta[groupId] = this.antiBannerService.getFiltersMetadataForGroup(groupId);
            for (var j = 0; j < filters.length; j++) {
                var filter = filters[j];
                var installed = this.antiBannerService.isAntiBannerFilterInstalled(filter.filterId);
                var enabled = this.antiBannerService.isAntiBannerFilterEnabled(filter.filterId);
                if (installed) {
                    installedFilters[filter.filterId] = true;
                }
                if (enabled) {
                    enabledFilters[filter.filterId] = true;
                }
            }
        }
        return {
            groups: groupsMeta,
            filters: filtersMeta,
            enabledFilters: enabledFilters,
            installedFilters: installedFilters
        };
    },

    _processLoadAssistant: function () {
        var options = this.UI.getAssistantCssOptions();
        var ids = [
            'assistant_select_element',
            'assistant_select_element_ext',
            'assistant_select_element_cancel',
            'assistant_block_element',
            'assistant_block_element_explain',
            'assistant_slider_explain',
            'assistant_slider_min',
            'assistant_slider_max',
            'assistant_extended_settings',
            'assistant_rule_parameters',
            'assistant_apply_rule_to_all_sites',
            'assistant_block_by_reference',
            'assistant_block_similar',
            'assistant_block',
            'assistant_another_element',
            'assistant_preview',
            'assistant_preview_end',
            'assistant_preview_start'
        ];
        options.localization = this._getLocalization(ids);
        return options;
    },

    _getLocalization: function (ids) {
        var result = {};
        for (var id in ids) {
            if (ids.hasOwnProperty(id)) {
                var current = ids[id];
                result[current] = i18n.getMessage(current);
            }
        }
        return result;
    }
};