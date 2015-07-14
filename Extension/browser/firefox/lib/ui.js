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
var {Cc, Ci, Cu, Cm, components} = require('chrome');
var self = require('sdk/self');
var tabs = require('sdk/tabs');
var l10n = require('sdk/l10n');
var unload = require('sdk/system/unload');
var tabUtils = require('sdk/tabs/utils');
var sdkWindows = require('sdk/windows').browserWindows;

var Prefs = require('prefs').Prefs;
var ContextMenu = require('contextMenu').ContextMenu;
var PopupButton = require('popupButton').PopupButton;
var MobileMenu = require('mobileMenu').MobileMenu;
var UrlUtils = require('utils/url').UrlUtils;
var Utils = require('utils/common').Utils;
var StringUtils = require('utils/common').StringUtils;
var EventNotifier = require('utils/notifier').EventNotifier;
var EventNotifierTypes = require('utils/common').EventNotifierTypes;
var RequestTypes = require('utils/common').RequestTypes;
var userSettings = require('utils/user-settings').userSettings;
var UiUtils = require('uiUtils').UiUtils;
var Log = require('utils/log').Log;

var i18n = (function () {

    function getText(text, args) {
        if (!text) {
            return "";
        }
        if (args && args.length > 0) {
            text = text.replace(/\$(\d+)/g, function (match, number) {
                return typeof args[number - 1] != "undefined" ? args[number - 1] : match;
            });
        }
        return text;
    }

    return {
        getMessage: function (key, args) {
            return getText(l10n.get(key), args);
        }
    };
})();

/**
 * UI entry point.
 *
 * Inits toolbar button and context menu.
 * Contains methods managing browser tabs (open/close tabs).
 */
var UI = exports.UI = {

    tabsWorkers: Object.create(null),

    init: function (antiBannerService, framesMap, filteringLog, adguardApplication, SdkPanel, SdkContextMenu, SdkButton) {

        this.antiBannerService = antiBannerService;
        this.framesMap = framesMap;
        this.filteringLog = filteringLog;
        this.adguardApplication = adguardApplication;

        this._initContextMenu(SdkContextMenu);
        this._initAbusePanel(SdkPanel);
        this._initEventListener();

        if (Prefs.mobile) {
            MobileMenu.init(this);
        } else {
            PopupButton.init(this, SdkPanel, SdkButton);
        }

        //record frame and update popup button if needed
        for each(var tab in this._getAllTabs()) {
            this.framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
            this.framesMap.checkTabIncognitoMode(tab);
            this._updatePopupButtonState(tab);
        }

        //cleanup active worker assistant on tab close
        tabs.on('close', function (tab) {
            delete this.tabsWorkers[tab.id];
        }.bind(this));

        //close all page on unload
        unload.when(UI.closeAllPages);
    },

    resetBlockedAdsCount: function () {
        this.framesMap.resetBlockedAdsCount();
    },

    openTab: function (url, options) {
        var activateSameTab, inNewWindow, tabType;
        if (options) {
            activateSameTab = options.activateSameTab;
            inNewWindow = options.inNewWindow;
            tabType = options.tabType;
        }
        try {
            if (activateSameTab) {
                for each (var tab in this._getAllTabs()) {
                    if (UrlUtils.urlEquals(tab.url, url)) {
                        if (tab.window) {
                            tab.window.activate();
                        }
                        if (tab.url != url) {
                            tab.url = url;
                        }
                        tab.activate();
                        return;
                    }
                }
            }
        } catch (ex) {
            //fennec catch
            Log.error("Error open tab, cause {0}", ex);
        }
        if (tabType == "popup" && !Prefs.mobile) {
            if (this.popupWindow && this.popupWindow.closed) {
                this.popupWindow = null;
            }
            if (this.popupWindow) {
                this.popupWindow.document.location.href = url;
                this.popupWindow.focus();
                return;
            }
            this.popupWindow = UiUtils.getMostRecentWindow().open(url, "_blank", "width=1130,height=630,menubar=0,status=no,toolbar=no,scrollbars=yes,resizable=yes");
        } else {
            tabs.open({
                url: url,
                inNewWindow: inNewWindow
            });
        }
    },

    getAllOpenedTabs: function (callback) {
        callback(this._getAllTabs());
    },

    openSiteReportTab: function (url) {
        var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
        if (domain) {
            UI.openTab("https://adguard.com/site.html?domain=" + encodeURIComponent(domain) + "&utm_source=extension&aid=16593");
        }
    },

    openAbusePanel: function () {
        this.abusePanel.port.emit('initAbusePanel');
        this.abusePanel.show();
    },

    openFilteringLog: function (tabId) {
        UI.openTab(UI._getURL("log.html") + (tabId ? "?tabId=" + tabId : ""), {activateSameTab: true, tabType: "popup"});
    },

    openCurrentTabFilteringLog: function () {
        var tabInfo = this.filteringLog.getTabInfo(this._getActiveTab());
        var tabId = tabInfo ? tabInfo.tabId : null;
        UI.openFilteringLog(tabId);
    },

    openSettingsTab: function (anchor) {
        UI.openTab(UI._getURL("options.html" + (anchor ? '#' + anchor : '')), {activateSameTab: true});
    },

    openFiltersDownloadPage: function () {
        UI.openTab(UI._getURL("filter-download.html"));
    },

    openThankYouPage: function () {

        var filtersDownloadUrl = UI._getURL("filter-download.html");
        var thankyouUrl = UI._getURL("thankyou.html");

        var windows = tabUtils.getAllTabContentWindows();
        for each (var win in windows) {
            if (!win.location) {
                continue;
            }
            if (win.location.href == filtersDownloadUrl || win.location.href == thankyouUrl) {
                if (win.location.href != thankyouUrl) {
                    win.location.href = thankyouUrl;
                }
                return;
            }
        }

        UI.openTab(thankyouUrl);
    },

    openExtensionStore: function () {
        var url = Utils.getExtensionStoreLink();
        UI.openTab(url);
    },

    closeAllPages: function () {
        try {
            var windows = tabUtils.getAllTabContentWindows();
            for each (var win in windows) {
                if (win.location && win.location.href.indexOf(UI._getURL('')) > -1) {
                    win.close();
                }
            }
        } catch (ex) {
            //ignore
        }
    },

    openExportRulesTab: function (whitelist) {
        UI.openTab(UI._getURL("export.html" + (whitelist ? '#wl' : '')));
    },

    openSafebrowsingTrusted: function (url) {
        UI.antiBannerService.getRequestFilter().addToSafebrowsingTrusted(url);
        tabs.activeTab.url = url;
    },

    openAssistant: function (assistantOptions) {

        var getActiveWorker = function () {
            return this.tabsWorkers[tabs.activeTab.id];
        }.bind(this);

        var getAssistantLocalization = function (localizations) {
            var activeWorker = getActiveWorker();
            if (!activeWorker) {
                return;
            }
            var result = Object.create(null);
            for (var i = 0; i < localizations.length; i++) {
                var currentId = localizations[i];
                result[currentId] = l10n.get(currentId);
            }
            activeWorker.port.emit('set-assistant-localization', result);
        }.bind(this);

        var onLoadAssistantIframe = function () {
            var activeWorker = getActiveWorker();
            if (!activeWorker) {
                return;
            }
            var cssContent = self.data.load("content/content-script/assistant/css/assistant.css");
            activeWorker.port.emit('load-assistant-iframe', {cssContent: cssContent});
        }.bind(this);

        var addUserRule = function (message) {
            if (this.framesMap.isTabAdguardDetected(this._getActiveTab())) {
                this.adguardApplication.addRuleToApp(message.ruleText, function () {
                });
            } else {
                this.antiBannerService.addUserFilterRule(message.ruleText);
            }
        }.bind(this);

        var removeWorker = function (worker) {
            for (var tabId in this.tabsWorkers) {
                if (this.tabsWorkers[tabId] === worker) {
                    delete this.tabsWorkers[tabId];
                }
            }
        }.bind(this);

        var activeTab = this._getActiveTab();
        var activeTabId = activeTab.id;

        var activeWorker = this.tabsWorkers[activeTabId];
        if (activeWorker) {
            activeWorker.port.emit('destroyAssistant');
        }

        activeWorker = activeTab.attach({
            contentScriptWhen: 'ready',
            contentScriptFile: [
                self.data.url("content/libs/jquery-1.8.3.min.js"),
                self.data.url("content/libs/jquery-ui.min.js"),
                self.data.url("content/libs/diff_match_patch.js"),
                self.data.url("content/libs/dom.js"),
                self.data.url('content/pages/i18n-helper.js'),
                self.data.url("content/content-script/content-script.js"),
                self.data.url("content/content-script/assistant/js/start-assistant.js"),
                self.data.url("content/content-script/assistant/js/tools.js"),
                self.data.url("content/content-script/assistant/js/selector.js"),
                self.data.url("content/content-script/assistant/js/assistant.js")
            ]
        });
        this.tabsWorkers[activeTabId] = activeWorker;

        activeWorker.port.emit('initAssistant', assistantOptions);
        activeWorker.port.once('get-assistant-localization', getAssistantLocalization);
        activeWorker.port.once('load-assistant-iframe', onLoadAssistantIframe);
        activeWorker.port.once('add-user-rule', addUserRule);

        //cleanup workers
        activeWorker.on('detach', function () {
            removeWorker(activeWorker);
        });
        activeWorker.on('pagehide', function () {
            removeWorker(activeWorker);
        });
    },

    resizePopup: function (width, height) {
        PopupButton.resizePopup(width, height);
    },

    closePopup: function () {
        PopupButton.closePopup();
    },

    bindLocalizationToContentObject: function (contentObject) {
        contentObject.port.on('localizeContentFile', function (message) {
            var messageIds = message.messageIds;
            var messages = Object.create(null);
            for (var i = 0; i < messageIds.length; i++) {
                var messageId = messageIds[i];
                if (messageId) {
                    messages[messageId] = l10n.get(messageId);
                }
            }
            contentObject.port.emit('localizeContentFile', {messages: messages});
        });
        contentObject.port.on('localizeContentElement', function (message) {
            contentObject.port.emit('localizeContentElement', {
                messageId: message.messageId,
                message: l10n.get(message.messageId),
                elementId: message.elementId
            });
        });
    },

    updateCurrentTabButtonState: function () {
        var currentTab = this._getActiveTab();
        if (currentTab) {
            this._updatePopupButtonState(currentTab, true);
        }
    },

    whiteListCurrentTab: function () {
        var tab = this._getActiveTab();
        if (this.framesMap.isTabAdguardDetected(tab)) {
            var domain = UrlUtils.getHost(tab.url);
            this.adguardApplication.addRuleToApp("@@//" + domain + "^$document", function () {
                this._reloadWithoutCache(tab);
            }.bind(this));
        } else {
            var tabInfo = this.framesMap.getFrameInfo(tab);
            this.antiBannerService.whiteListFrame(tabInfo);
            this.updateCurrentTabButtonState();
        }
    },

    unWhiteListCurrentTab: function () {
        var tab = this._getActiveTab();
        if (this.framesMap.isTabAdguardDetected(tab)) {
            var rule = this.framesMap.getTabAdguardUserWhiteListRule(tab);
            if (rule) {
                this.adguardApplication.removeRuleFromApp(rule.ruleText, function () {
                    this._reloadWithoutCache(tab);
                }.bind(this));
            }
        } else {
            var tabInfo = this.framesMap.getFrameInfo(tab);
            this.antiBannerService.unWhiteListFrame(tabInfo);
            this.updateCurrentTabButtonState();
        }
    },

    changeApplicationFilteringDisabled: function (disabled) {
        this.antiBannerService.changeApplicationFilteringDisabled(disabled);
        this.updateCurrentTabButtonState();
    },

    getCurrentTabInfo: function (reloadFrameData) {
        var currentTab = this._getActiveTab();
        if (reloadFrameData) {
            this.framesMap.reloadFrameData(currentTab);
        }
        return this.framesMap.getFrameInfo(currentTab);
    },

    getCurrentTabFilteringInfo: function () {
        var currentTab = this._getActiveTab();
        return this.filteringLog.getTabInfo(currentTab);
    },

    isCurrentTabAdguardDetected: function () {
        var currentTab = this._getActiveTab();
        return this.framesMap.isTabAdguardDetected(currentTab);
    },

    checkAntiBannerFiltersUpdate: function () {
        this.antiBannerService.checkAntiBannerFiltersUpdate(true, function (updatedFilters) {
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, true, updatedFilters);
        }, function () {
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, false);
        });
    },

    getLocalizedMessage: function (messageId, args) {
        return i18n.getMessage(messageId, args);
    },

    getFiltersUpdateResultInfo: function (success, updatedFilters) {
        return Utils.getFiltersUpdateResultMessage(l10n.get.bind(l10n), success, updatedFilters);
    },

    _initAbusePanel: function (SdkPanel) {
        this.abusePanelSupported = SdkPanel != null && typeof SdkPanel == 'function';
        if (!this.abusePanelSupported) {
            return;
        }
        this.abusePanel = SdkPanel({
            width: 552,
            height: 345,
            contentURL: self.data.url('content/content-script/abuse.html'),
            contentScriptFile: [
                self.data.url('content/libs/jquery-1.8.3.min.js'),
                self.data.url('content/pages/i18n-helper.js'),
                self.data.url('content/content-script/content-i18n.js'),
                self.data.url('content/content-script/abuse.js')
            ]
        });
        this.abusePanel.port.on('sendFeedback', function (message) {
            var url = tabs.activeTab.url;
            this.antiBannerService.sendFeedback(url, message.topic, message.comment);
        }.bind(this));
        this.abusePanel.port.on('closeAbusePanel', function () {
            this.abusePanel.hide()
        }.bind(this));
        this.bindLocalizationToContentObject(this.abusePanel);
    },

    _initContextMenu: function (SdkContextMenu) {
        if (SdkContextMenu != null) {
            ContextMenu.init(this, SdkContextMenu);
        }
    },

    _getURL: function (url) {
        return "chrome://adguard/content/" + url;
    },

    _initEventListener: function () {

        var framesMap = this.framesMap;

        EventNotifier.addListener(function (event, tab, reset) {

            if (event != EventNotifierTypes.UPDATE_TAB_BUTTON_STATE || !tab) {
                return;
            }

            if (Prefs.mobile) {
                return;
            }

            var activeTab = this._getActiveTab();
            if (tab.id != activeTab.id) {
                return;
            }

            if (reset) {
                PopupButton.updateBadgeText("0");
                PopupButton.updateIconState({disabled: true});
            } else {
                UI._updatePopupButtonState(tab);
            }

        }.bind(this));

        EventNotifier.addListener(function (event, rule, tab, blocked) {

            if (event != EventNotifierTypes.ADS_BLOCKED || !tab) {
                return;
            }

            var blockedAds = framesMap.updateBlockedAdsCount(tab, blocked);

            if (blockedAds == null || Prefs.mobile || !userSettings.showPageStatistic()) {
                return;
            }

            this._updateBadgeAsync(tab.id, blockedAds.toString());

        }.bind(this));

        var updateActiveTabIcon = function (tab) {
            var activeTab = this._getActiveTab();
            if (!tab.id || tab.id == activeTab.id) {
                this._updatePopupButtonState(activeTab, true);
            }
        }.bind(this);
        //tab events
        tabs.on('activate', updateActiveTabIcon);
        tabs.on('pageshow', updateActiveTabIcon);
        tabs.on('load', updateActiveTabIcon);
        tabs.on('ready', updateActiveTabIcon);
        //on focus change
        sdkWindows.on('activate', function () {
            var activeTab = this._getActiveTab();
            this._updatePopupButtonState(activeTab, true);
        }.bind(this));
    },

    _updateBadgeAsync: Utils.debounce(function (tabId, number) {
        var activeTab = UI._getActiveTab();
        if (tabId != activeTab.id) {
            return;
        }
        PopupButton.updateBadgeText(number);
    }, 250),

    _updatePopupButtonState: function (tab, reloadFrameData) {

        //in mobile version no sdk button
        if (Prefs.mobile) {
            return;
        }

        if (reloadFrameData) {
            this.framesMap.reloadFrameData(tab);
        }

        var disabled, blocked;

        var tabInfo = this.framesMap.getFrameInfo(tab);

        if (tabInfo.adguardDetected) {
            blocked = "";
            disabled = tabInfo.documentWhiteListed;
        } else {
            disabled = tabInfo.applicationFilteringDisabled;
            disabled = disabled || tabInfo.urlFilteringDisabled;
            disabled = disabled || tabInfo.documentWhiteListed;

            if (!disabled && userSettings.showPageStatistic()) {
                blocked = tabInfo.totalBlockedTab.toString();
            } else {
                blocked = "0";
            }
        }

        PopupButton.updateBadgeText(blocked);
        PopupButton.updateIconState({
            disabled: disabled,
            adguardDetected: tabInfo.adguardDetected
        });
    },

    _getAllTabs: function () {
        var result = [];
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            //fennec case (tab maybe undefined)
            if (tab) {
                result.push(tab);
            }
        }
        return result;
    },

    _getActiveTab: function () {
        var tab = tabs.activeTab;
        if (tab.id && tab.url) {
            return tab;
        }
        //https://bugzilla.mozilla.org/show_bug.cgi?id=942511
        var win = UiUtils.getMostRecentWindow();
        var xulTab = tabUtils.getActiveTab(win);
        var tabId = tabUtils.getTabId(xulTab);
        return {id: tabId};
    },

    _reloadWithoutCache: function (tab) {
        //reload page without cache via content script
        var worker = tab.attach({
            contentScriptFile: [
                self.data.url('content/content-script/content-script.js'),
                self.data.url('content/content-script/content-utils.js')]
        });
        worker.port.emit('no-cache-reload');
    }
};
