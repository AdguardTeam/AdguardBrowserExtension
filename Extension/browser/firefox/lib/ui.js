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
/* global adguard, require */

var self = require('sdk/self');
var unload = require('sdk/system/unload');

var Prefs = require('./prefs').Prefs;
var ContextMenu = require('./contextMenu').ContextMenu;
var PopupButton = require('./popupButton').PopupButton;
var MobileMenu = require('./mobileMenu').MobileMenu;
var UrlUtils = require('./utils/url').UrlUtils;
var Utils = require('./utils/browser-utils').Utils;
var EventNotifier = require('./utils/notifier').EventNotifier;
var EventNotifierTypes = require('./utils/common').EventNotifierTypes;
var RequestTypes = require('./utils/common').RequestTypes;
var userSettings = require('./utils/user-settings').userSettings;
var contentScripts = require('./contentScripts').contentScripts;

/**
 * UI entry point.
 *
 * Inits toolbar button and context menu.
 * Contains methods managing browser tabs (open/close tabs).
 */
var UI = exports.UI = {

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

        // Record frame and update popup button if needed
        adguard.tabs.getAll(function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                this.framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
                this._updatePopupButtonState(tab);
            }
        }.bind(this));

        //close all page on unload
        unload.when(UI.closeAllPages);
    },

    resetBlockedAdsCount: function () {
        this.framesMap.resetBlockedAdsCount();
    },

    openTab: function (url, options, callback) {

        var activateSameTab, inNewWindow, type, inBackground;
        if (options) {
            activateSameTab = options.activateSameTab;
            inNewWindow = options.inNewWindow;
            type = options.type;
        }

        function onTabFound(tab) {
            if (tab.url !== url) {
                adguard.tabs.reload(tab.tabId, url);
            }
            if (!inBackground) {
                adguard.tabs.activate(tab.tabId);
            }
            if (callback) {
                callback(tab);
            }
        }

        UI.getAllOpenedTabs(function (tabs) {
            //try to find between opened tabs
            if (activateSameTab) {
                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    if (UrlUtils.urlEquals(tab.url, url)) {
                        onTabFound(tab);
                        return;
                    }
                }
            }
            adguard.tabs.create({
                url: url,
                type: type || 'normal',
                inNewWindow: inNewWindow,
                active: true
            }, callback);
        });
    },

    getAllOpenedTabs: function (callback) {
        adguard.tabs.getAll(callback);
    },

    openSiteReportTab: function (url) {
        var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
        if (domain) {
            UI.openTab("https://adguard.com/site.html?domain=" + encodeURIComponent(domain) + "&utm_source=extension&aid=16593");
        }
    },

    openAbusePanel: function () {
        contentScripts.sendMessageToWorker(this.abusePanel, {type: 'initAbusePanel'});
        this.abusePanel.show();
    },

    openFilteringLog: function (tabId) {
        UI.openTab(UI._getURL("log.html") + (tabId ? "?tabId=" + tabId : ""), {
            activateSameTab: true,
            type: "popup"
        });
    },

    openCurrentTabFilteringLog: function () {
        adguard.tabs.getActive(function (tab) {
            var tabInfo = this.filteringLog.getTabInfo(tab);
            var tabId = tabInfo ? tabInfo.tabId : null;
            this.openFilteringLog(tabId);
        }.bind(this));
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

        adguard.tabs.getAll(function (tabs) {

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                var url = tab.url;
                if (url === filtersDownloadUrl || url === thankyouUrl) {
                    if (url !== thankyouUrl) {
                        adguard.tabs.reload(tab.tabId, thankyouUrl);
                    }
                    return;
                }
            }

            UI.openTab(thankyouUrl);
        });
    },

    openExtensionStore: function () {
        var url = Utils.getExtensionStoreLink();
        UI.openTab(url);
    },

    closeAllPages: function () {
        adguard.tabs.getAll(function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.url.indexOf(UI._getURL('')) >= 0) {
                    adguard.tabs.remove(tab.tabId);
                }
            }
        });
    },

    openExportRulesTab: function (whitelist) {
        UI.openTab(UI._getURL("export.html" + (whitelist ? '#wl' : '')));
    },

    reloadCurrentTab: function (url) {
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.reload(tab.tabId, url);
        });
    },

    openAssistant: function (assistantOptions) {
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'initAssistant',
                options: {cssSelector: assistantOptions ? assistantOptions.cssSelector : null}
            });
        });
        //contentScripts.sendMessageToTab(tabs.activeTab, {
        //    type: 'initAssistant',
        //    options: {cssSelector: assistantOptions ? assistantOptions.cssSelector : null}
        //});
    },

    getAssistantCssOptions: function () {
        return {
            cssLink: self.data.url("content/content-script/assistant/css/assistant.css")
        };
    },

    resizePopup: function (width, height) {
        PopupButton.resizePopup(width, height);
    },

    closePopup: function () {
        PopupButton.closePopup();
    },

    updateCurrentTabButtonState: function () {
        adguard.tabs.getActive(function (tab) {
            this._updatePopupButtonState(tab, true);
        }.bind(this));
    },

    whiteListTab: function (tab) {

        var tabInfo = this.framesMap.getFrameInfo(tab);
        this.antiBannerService.whiteListFrame(tabInfo);

        if (this.framesMap.isTabAdguardDetected(tab)) {
            var domain = UrlUtils.getHost(tab.url);
            this.adguardApplication.addRuleToApp("@@//" + domain + "^$document", function () {
                this._reloadWithoutCache(tab);
            }.bind(this));
        } else {
            this.updateCurrentTabButtonState();
        }
    },

    whiteListCurrentTab: function () {
        adguard.tabs.getActive(function (tab) {
            this.whiteListTab(tab);
        }.bind(this));
    },

    unWhiteListTab: function (tab) {

        var tabInfo = this.framesMap.getFrameInfo(tab);
        this.antiBannerService.unWhiteListFrame(tabInfo);

        if (this.framesMap.isTabAdguardDetected(tab)) {
            var rule = this.framesMap.getTabAdguardUserWhiteListRule(tab);
            if (rule) {
                this.adguardApplication.removeRuleFromApp(rule.ruleText, function () {
                    this._reloadWithoutCache(tab);
                }.bind(this));
            }
        } else {
            this.updateCurrentTabButtonState();
        }
    },

    unWhiteListCurrentTab: function () {
        adguard.tabs.getActive(function (tab) {
            this.unWhiteListTab(tab);
        }.bind(this));
    },

    changeApplicationFilteringDisabled: function (disabled) {
        this.antiBannerService.changeApplicationFilteringDisabled(disabled);
        this.updateCurrentTabButtonState();
    },

    getCurrentTabInfo: function (callback, reloadFrameData) {
        adguard.tabs.getActive(function (tab) {
            if (reloadFrameData) {
                this.framesMap.reloadFrameData(tab);
            }
            callback(this.framesMap.getFrameInfo(tab));
        }.bind(this));
    },

    getTabInfo: function (tab, reloadFrameData) {
        if (reloadFrameData) {
            this.framesMap.reloadFrameData(tab);
        }
        return this.framesMap.getFrameInfo(tab);
    },

    getTabFilteringInfo: function (tab) {
        return this.filteringLog.getTabInfo(tab);
    },

    isCurrentTabAdguardDetected: function (callback) {
        adguard.tabs.getActive(function (tab) {
            callback(this.framesMap.isTabAdguardDetected(tab));
        }.bind(this));
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

    showAlertMessagePopup: function (title, text) {
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.sendMessage(tab.tabId, {type: 'show-alert-popup', title: title, text: text});
        });
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
            contentScriptOptions: contentScripts.getContentScriptOptions(),
            contentScriptFile: [
                self.data.url('content/libs/jquery-1.8.3.min.js'),
                self.data.url('content/content-script/content-script.js'),
                self.data.url('content/content-script/i18n-helper.js'),
                self.data.url('content/pages/i18n.js'),
                self.data.url('content/content-script/abuse.js')
            ]
        });

        contentScripts.addContentScriptMessageListener(this.abusePanel, function (message) {
            switch (message.type) {
                case 'sendFeedback':
                    adguard.tabs.getActive(function (tab) {
                        var url = tab.url;
                        this.antiBannerService.sendFeedback(url, message.topic, message.comment);
                    }.bind(this));
                    //var url = sdkTabs.activeTab.url;
                    //this.antiBannerService.sendFeedback(url, message.topic, message.comment);
                    break;
                case 'closeAbusePanel':
                    this.abusePanel.hide();
                    break;
            }
        }.bind(this));
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

            if (event !== EventNotifierTypes.UPDATE_TAB_BUTTON_STATE || !tab) {
                return;
            }

            if (Prefs.mobile) {
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

            if (event !== EventNotifierTypes.ADS_BLOCKED || !tab) {
                return;
            }

            var blockedAds = framesMap.updateBlockedAdsCount(tab, blocked);

            if (blockedAds == null || Prefs.mobile || !userSettings.showPageStatistic()) {
                return;
            }

            this._updateBadgeAsync(tab.tabId, blockedAds.toString());

        }.bind(this));

        var updateTabIcon = function (tab) {
            this._updatePopupButtonState(tab, true);
        }.bind(this);

        ////tab events
        //tabs.on('activate', updateActiveTabIcon);
        //tabs.on('pageshow', updateActiveTabIcon);
        //tabs.on('load', updateActiveTabIcon);
        //tabs.on('ready', updateActiveTabIcon);
        ////on focus change
        //sdkWindows.on('activate', function () {
        //    var activeTab = this.getActiveTab();
        //    this._updatePopupButtonState(activeTab, true);
        //}.bind(this));

        adguard.tabs.onUpdated.addListener(updateTabIcon);
        adguard.tabs.onActivated.addListener(updateTabIcon);
    },

    _updateBadgeAsync: Utils.debounce(function (tabId, number) {
        adguard.tabs.getActive(function (tab) {
            if (tabId !== tab.tabId) {
                return;
            }
            PopupButton.updateBadgeText(number);
        });
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

    _reloadWithoutCache: function (tab) {
        adguard.tabs.sendMessage(tab.tabId, {type: 'no-cache-reload'});
    }
};
