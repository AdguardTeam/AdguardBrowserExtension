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
/* global i18n */

/**
 * UI entry point.
 *
 * Inits toolbar button and context menu.
 * Contains methods managing browser tabs (open/close tabs).
 */
var UI = {

    init: function (SdkPanel, SdkContextMenu, SdkButton) {

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
                framesMap.recordFrame(tab, 0, tab.url, RequestTypes.DOCUMENT);
                this._updatePopupButtonState(tab);
            }
        }.bind(this));

        //close all page on unload
        unload.when(UI.closeAllPages);
    },

    resetBlockedAdsCount: function () {
        framesMap.resetBlockedAdsCount();
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
            var tabInfo = filteringLog.getTabInfo(tab);
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
            cssLink: adguard.extension.url("content/content-script/assistant/css/assistant.css")
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

        var tabInfo = framesMap.getFrameInfo(tab);
        antiBannerService.whiteListFrame(tabInfo);

        if (framesMap.isTabAdguardDetected(tab)) {
            var domain = UrlUtils.getHost(tab.url);
            adguardApplication.addRuleToApp("@@//" + domain + "^$document", function () {
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

        var tabInfo = framesMap.getFrameInfo(tab);
        antiBannerService.unWhiteListFrame(tabInfo);

        if (framesMap.isTabAdguardDetected(tab)) {
            var rule = framesMap.getTabAdguardUserWhiteListRule(tab);
            if (rule) {
                adguardApplication.removeRuleFromApp(rule.ruleText, function () {
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
        antiBannerService.changeApplicationFilteringDisabled(disabled);
        this.updateCurrentTabButtonState();
    },

    getCurrentTabInfo: function (callback, reloadFrameData) {
        adguard.tabs.getActive(function (tab) {
            if (reloadFrameData) {
                framesMap.reloadFrameData(tab);
            }
            callback(framesMap.getFrameInfo(tab));
        }.bind(this));
    },

    getTabInfo: function (tab, reloadFrameData) {
        if (reloadFrameData) {
            framesMap.reloadFrameData(tab);
        }
        return framesMap.getFrameInfo(tab);
    },

    getTabFilteringInfo: function (tab) {
        return filteringLog.getTabInfo(tab);
    },

    isCurrentTabAdguardDetected: function (callback) {
        adguard.tabs.getActive(function (tab) {
            callback(framesMap.isTabAdguardDetected(tab));
        }.bind(this));
    },

    checkAntiBannerFiltersUpdate: function () {
        antiBannerService.checkAntiBannerFiltersUpdate(true, function (updatedFilters) {
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
        this.abusePanelSupported = SdkPanel && typeof SdkPanel === 'function';
        if (!this.abusePanelSupported) {
            return;
        }
        this.abusePanel = SdkPanel({ // jshint ignore:line
            width: 552,
            height: 345,
            contentURL: adguard.extension.url('content/content-script/abuse.html'),
            contentScriptOptions: contentScripts.getContentScriptOptions(),
            contentScriptFile: [
                adguard.extension.url('content/libs/jquery-1.8.3.min.js'),
                adguard.extension.url('content/content-script/content-script.js'),
                adguard.extension.url('content/content-script/i18n-helper.js'),
                adguard.extension.url('content/pages/i18n.js'),
                adguard.extension.url('content/content-script/abuse.js')
            ]
        });

        contentScripts.addContentScriptMessageListener(this.abusePanel, function (message) {
            switch (message.type) {
                case 'sendFeedback':
                    adguard.tabs.getActive(function (tab) {
                        var url = tab.url;
                        antiBannerService.sendFeedback(url, message.topic, message.comment);
                    }.bind(this));
                    break;
                case 'closeAbusePanel':
                    this.abusePanel.hide();
                    break;
            }
        }.bind(this));
    },

    _initContextMenu: function (SdkContextMenu) {
        if (SdkContextMenu) {
            ContextMenu.init(this, SdkContextMenu);
        }
    },

    _getURL: function (url) {
        return "chrome://adguard/content/" + url;
    },

    _initEventListener: function () {

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

            if (blockedAds === null || Prefs.mobile || !userSettings.showPageStatistic()) {
                return;
            }

            this._updateBadgeAsync(tab.tabId, blockedAds.toString());

        }.bind(this));

        var updateTabIcon = function (tab) {
            this._updatePopupButtonState(tab, true);
        }.bind(this);

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
            framesMap.reloadFrameData(tab);
        }

        var disabled, blocked;

        var tabInfo = framesMap.getFrameInfo(tab);

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