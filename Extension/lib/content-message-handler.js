/* global require, exports, i18n */
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
var userSettings = require('./utils/user-settings').userSettings;
var EventNotifier = require('./utils/notifier').EventNotifier;
var Utils = require('./utils/browser-utils').Utils;
var Prefs = require('./prefs').Prefs;

var EventNotifierTypes = require('./utils/common').EventNotifierTypes;
var AntiBannerFiltersId = require('./utils/common').AntiBannerFiltersId;
var LogEvents = require('./utils/common').LogEvents;
var WorkaroundUtils = require('./utils/workaround').WorkaroundUtils;

var ContentMessageHandler = exports.ContentMessageHandler = function () {
    this.handleMessage = this.handleMessage.bind(this);
};

ContentMessageHandler.prototype = {

    eventListeners: Object.create(null),
    
    /**
     * Function that allows to send a message back to sender (either content script or SDK worker).
     * This function implementation is specific to browser.
     */
    sendMessageToSender: null,

    init: function (antiBannerService, webRequestService, framesMap, adguardApplication, filteringLog, UI) {
        this.antiBannerService = antiBannerService;
        this.webRequestService = webRequestService;
        this.framesMap = framesMap;
        this.adguardApplication = adguardApplication;
        this.filteringLog = filteringLog;
        this.UI = UI;
    },
    
    /**
     * Sets sendMessageToSender function implementation
     */
    setSendMessageToSender: function (sendMessageToSender) {
        this.sendMessageToSender = sendMessageToSender;
    },

    handleMessage: function (message, sender, callback) {
        switch (message.type) {
            case 'unWhiteListFrame':
                this.antiBannerService.unWhiteListFrame(message.frameInfo);
                break;
            case 'addRuleToApp':
                this.adguardApplication.addRuleToApp(message.ruleText);
                break;
            case 'removeRuleFromApp':
                this.adguardApplication.removeRuleFromApp(message.ruleText);
                break;
            case 'addEventListener':
                return this._processAddEventListener(message, sender);
            case 'removeListener':
                var listenerId = message.listenerId;
                EventNotifier.removeListener(listenerId);
                delete this.eventListeners[listenerId];
                break;
            case 'initializeFrameScript':
                return this._processInitializeFrameScriptRequest();
            case 'changeUserSetting':
                userSettings.setProperty(message.key, message.value);
                break;
            case 'initializeFiltersOnInstall':
                this.antiBannerService.initializeFiltersOnInstall(function (enabledFilterIds) {
                    callback({enabledFilterIds: enabledFilterIds});
                });
                return true; // Async
            case 'addAndEnableFilter':
                this.antiBannerService.addAndEnableFilter(message.filterId);
                break;
            case 'removeAntiBannerFilter':
                this.antiBannerService.removeAntiBannerFilter(message.filterId);
                break;
            case 'enableAntiBannerFilter':
                this.antiBannerService.enableAntiBannerFilter(message.filterId);
                break;
            case 'disableAntiBannerFilter':
                this.antiBannerService.disableAntiBannerFilter(message.filterId);
                break;
            case 'getWhiteListDomains':
                var whiteListDomains = this.antiBannerService.getWhiteListDomains(message.offset, message.limit, message.text);
                return {rules: whiteListDomains};
            case 'getUserFilters':
                var userFilters = this.antiBannerService.getUserFilters(message.offset, message.limit, message.text);
                return {rules: userFilters};
            case 'checkAntiBannerFiltersUpdate':
                this.UI.checkAntiBannerFiltersUpdate();
                break;
            case 'getAntiBannerFiltersForOptionsPage':
                var renderedFilters = this.antiBannerService.getAntiBannerFiltersForOptionsPage();
                return {filters: renderedFilters};
            case 'changeDefaultWhiteListMode':
                this.antiBannerService.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'clearUserFilter':
                this.antiBannerService.clearUserFilter();
                break;
            case 'clearWhiteListFilter':
                this.antiBannerService.clearWhiteListFilter();
                break;
            case 'addWhiteListDomain':
                this.antiBannerService.addWhiteListDomain(message.text);
                break;
            case 'removeWhiteListDomain':
                this.antiBannerService.removeWhiteListDomain(message.text);
                break;
            case 'addUserFilterRule':
                this.antiBannerService.addUserFilterRule(message.text);
                break;
            case 'removeUserFilter':
                this.antiBannerService.removeUserFilter(message.text);
                break;
            case 'addUserFilterRules':
                this.antiBannerService.addUserFilterRules(message.rules);
                break;
            case 'addWhiteListDomains':
                this.antiBannerService.addWhiteListDomains(message.domains);
                break;
            case 'onFiltersSubscriptionChange':
                this.antiBannerService.onFiltersSubscriptionChange(message.filterIds);
                break;
            case 'getFiltersMetadata':
                return this._processGetFiltersMetadata();
            case 'openThankYouPage':
                this.UI.openThankYouPage();
                break;
            case 'openExtensionStore':
                this.UI.openExtensionStore();
                break;
            case 'openFilteringLog':
                this.UI.openFilteringLog();
                break;
            case 'openExportRulesTab':
                this.UI.openExportRulesTab(message.whitelist);
                break;
            case 'openSafebrowsingTrusted':
                this.antiBannerService.getRequestFilter().addToSafebrowsingTrusted(message.url);
                this.UI.reloadCurrentTab(message.url);
                break;
            case 'openTab':
                this.UI.openTab(message.url, message.options);
                break;
            case 'resetBlockedAdsCount':
                this.framesMap.resetBlockedAdsCount();
                break;
            case 'getSelectorsAndScripts':
                if (WorkaroundUtils.isFacebookIframe(message.documentUrl)) {
                    return {};
                }
                var cssAndScripts = this.webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl, message.loadTruncatedCss);
                return cssAndScripts || {};
            case 'checkWebSocketRequest':
                var block = this.webRequestService.checkWebSocketRequest(sender.tab, message.elementUrl, message.documentUrl);
                return {block: block, requestId: message.requestId};
            case 'processShouldCollapse':
                var collapse = this.webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return {collapse: collapse, requestId: message.requestId};
            case 'processShouldCollapseMany':
                var requests = this.webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                return {requests: requests};
            case 'loadAssistant':
                return this._processLoadAssistant();
            case 'addUserRule':
                this.antiBannerService.addUserFilterRule(message.ruleText);
                if (this.framesMap.isTabAdguardDetected(sender.tab)) {
                    this.adguardApplication.addRuleToApp(message.ruleText);
                }
                break;
            case 'onOpenFilteringLogPage':
                this.filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                this.filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                this.filteringLog.reloadTabById(message.tabId);
                break;
            case 'clearEventsByTabId':
                this.filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById':
                var frameInfo = this.filteringLog.getTabFrameInfoById(message.tabId);
                return {frameInfo: frameInfo};
            case 'getTabInfoById':
                var tabInfo = this.filteringLog.getTabInfoById(message.tabId);
                return {tabInfo: this.filteringLog.serializeTabInfo(tabInfo)};
            case 'synchronizeOpenTabs':
                this.filteringLog.synchronizeOpenTabs(function () {
                    callback({});
                });
                return true; // Async
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
                return {confirmText: confirmText};
            case 'enableSubscription':
                this.antiBannerService.processAbpSubscriptionUrl(message.url, function (rulesAddedCount) {
                    callback({
                        title: i18n.getMessage('abp_subscribe_confirm_import_finished_title'),
                        text: i18n.getMessage('abp_subscribe_confirm_import_finished_text', [rulesAddedCount])
                    });
                });
                return true; // Async
            default :
                throw 'Unknown message: ' + message;
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
            requestFilterInfo: this.antiBannerService.getRequestFilterInfo(),
            contentBlockerInfo: this.antiBannerService.getContentBlockerInfo(),
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
            'assistant_slider_if_hide',
            'assistant_slider_min',
            'assistant_slider_max',
            'assistant_extended_settings',
            'assistant_apply_rule_to_all_sites',
            'assistant_block_by_reference',
            'assistant_block_similar',
            'assistant_block',
            'assistant_another_element',
            'assistant_preview',
            'assistant_preview_header',
            'assistant_preview_header_info',
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