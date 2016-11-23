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

/* global Log, UrlUtils, Utils, WorkaroundUtils, StringUtils, Prefs, unload, antiBannerService, framesMap, adguardApplication, filteringLog, EventNotifier, EventNotifierTypes */

var uiService = (function () { // jshint ignore:line

    var browserActionTitle = adguard.i18n.getMessage('name');

    var nextMenuId = 0;

    /**
     * Update icon for tab
     * @param tab Tab
     * @param options Options for icon or badge values
     */
    function updateTabIcon(tab, options) {

        try {
            var icon, badge;

            if (options) {

                icon = options.icon;
                badge = options.badge;

            } else {

                var blocked;
                var disabled;

                var tabInfo = framesMap.getFrameInfo(tab);
                if (tabInfo.adguardDetected) {
                    disabled = tabInfo.documentWhiteListed;
                    blocked = "";
                } else {
                    disabled = tabInfo.applicationFilteringDisabled;
                    disabled = disabled || tabInfo.urlFilteringDisabled;
                    disabled = disabled || tabInfo.documentWhiteListed;

                    if (!disabled && adguard.settings.showPageStatistic()) {
                        blocked = tabInfo.totalBlockedTab.toString();
                    } else {
                        blocked = "0";
                    }
                }

                badge = WorkaroundUtils.getBlockedCountText(blocked);

                if (disabled) {
                    icon = Prefs.ICONS.ICON_GRAY;
                } else if (tabInfo.adguardDetected) {
                    icon = Prefs.ICONS.ICON_BLUE;
                } else {
                    icon = Prefs.ICONS.ICON_GREEN;
                }
            }

            adguard.browserAction.setBrowserAction(tab, icon, badge, "#555", browserActionTitle);
        } catch (ex) {
            Log.error('Error while updating icon for tab {0}: {1}', tab.tabId, new Error(ex));
        }
    }

    var updateTabIconAsync = Utils.debounce(function (tab) {
        updateTabIcon(tab);
    }, 250);

    function customizeContextMenu(tab) {

        var callbackMappings = {
            'context_block_site_ads': function () {
                openAssistant();
            },
            'context_block_site_element': function () {
                openAssistant({selectElement: true});
            },
            'context_security_report': function () {
                openSiteReportTab(tab.url);
            },
            'context_site_filtering_on': function () {
                unWhiteListCurrentTab();
            },
            'context_site_filtering_off': function () {
                whiteListCurrentTab();
            },
            'context_enable_protection': function () {
                changeApplicationFilteringDisabled(false);
            },
            'context_disable_protection': function () {
                changeApplicationFilteringDisabled(true);
            },
            'context_general_settings': function () {
                openSettingsTab('general-settings');
            },
            'context_antibanner': function () {
                openSettingsTab('antibanner');
            },
            'context_safebrowsing': function () {
                openSettingsTab('safebrowsing');
            },
            'context_whitelist': function () {
                openSettingsTab('whitelist');
            },
            'context_userfilter': function () {
                openSettingsTab('userfilter');
            },
            'context_miscellaneous_settings': function () {
                openSettingsTab('miscellaneous-settings');
            },
            'context_open_log': function () {
                openCurrentTabFilteringLog();
            },
            'context_update_antibanner_filters': checkAntiBannerFiltersUpdate
        };

        function addMenu(title, options) {
            var createProperties = {
                contexts: ["all"],
                title: adguard.i18n.getMessage(title)
            };
            var callbackTitle;
            if (options) {
                if (options.id) {
                    createProperties.id = options.id;
                }
                if (options.parentId) {
                    createProperties.parentId = options.parentId;
                }
                if (options.disabled) {
                    createProperties.enabled = false;
                }
                if (options.messageArgs) {
                    createProperties.title = adguard.i18n.getMessage(title, options.messageArgs);
                }
                if (options.contexts) {
                    createProperties.contexts = options.contexts;
                }
                callbackTitle = options.callbackTitle;
            }
            var callback = callbackMappings[callbackTitle || title];
            if (callback) {
                createProperties.onclick = callback;
            }
            adguard.contextMenus.create(createProperties);
        }

        function addSeparator() {
            adguard.contextMenus.create({
                type: 'separator'
            });
        }

        function addSettingsSubMenu() {
            nextMenuId += 1;
            var menuId = 'adguard-settings-context-menu-' + nextMenuId;
            addMenu('context_open_settings', {id: menuId});
            addMenu('context_general_settings', {parentId: menuId});
            addMenu('context_antibanner', {parentId: menuId});
            addMenu('context_safebrowsing', {parentId: menuId});
            addMenu('context_whitelist', {parentId: menuId});
            addMenu('context_userfilter', {parentId: menuId});
            addMenu('context_miscellaneous_settings', {parentId: menuId});
        }

        var tabInfo = framesMap.getFrameInfo(tab);

        if (tabInfo.applicationFilteringDisabled) {
            addMenu('context_site_protection_disabled');
            addSeparator();
            addSettingsSubMenu();
            addMenu('context_enable_protection');
        } else if (tabInfo.urlFilteringDisabled) {
            addMenu('context_site_filtering_disabled');
            addSeparator();
            addSettingsSubMenu();
            addMenu('context_update_antibanner_filters');
        } else {
            if (tabInfo.adguardDetected) {
                if (tabInfo.adguardProductName) {
                    addMenu('context_ads_has_been_removed_by_adguard', {messageArgs: [tabInfo.adguardProductName]});
                } else {
                    addMenu('context_ads_has_been_removed');
                }
                addSeparator();
            }
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                addMenu('context_site_exception');
            } else if (tabInfo.canAddRemoveRule) {
                if (tabInfo.documentWhiteListed) {
                    addMenu('context_site_filtering_on');
                } else {
                    addMenu('context_site_filtering_off');
                }
            }
            addSeparator();

            if (!tabInfo.documentWhiteListed) {
                addMenu('context_block_site_ads');
                addMenu('context_block_site_element', {contexts: ["image", "video", "audio"]});
            }
            addMenu('context_open_log');
            addMenu('context_security_report');
            if (!tabInfo.adguardDetected) {
                addSeparator();
                addSettingsSubMenu();
                addMenu('context_update_antibanner_filters');
                addMenu('context_disable_protection');
            }
        }
    }

    /**
     * Update context menu for tab
     * @param tab Tab
     */
    function updateTabContextMenu(tab) {
        adguard.contextMenus.removeAll();
        if (adguard.settings.showContextMenu()) {
            customizeContextMenu(tab);
        }
    }

    function closeAllPages() {
        adguard.tabs.forEach(function (tab) {
            if (tab.url.indexOf(adguard.getURL('')) >= 0) {
                adguard.tabs.remove(tab.tabId);
            }
        });
    }

    function getPageUrl(page) {
        return adguard.getURL('pages/' + page);
    }

    function showAlertMessagePopup(title, text, showForAdguardTab) {
        adguard.tabs.getActive(function (tab) {
            if (!showForAdguardTab && framesMap.isTabAdguardDetected(tab)) {
                return;
            }
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'show-alert-popup',
                title: title,
                text: text
            });
        });

        adguard.tabs.getActive(function (tab) {
            adguard.tabs.sendMessage(tab.tabId, {type: 'show-alert-popup', title: title, text: text});
        });
    }

    var updateTabIconAndContextMenu = function (tab, reloadFrameData) {
        if (reloadFrameData) {
            framesMap.reloadFrameData(tab);
        }
        updateTabIcon(tab);
        updateTabContextMenu(tab);
    };

    var openExportRulesTab = function (whitelist) {
        openTab(getPageUrl('export.html' + (whitelist ? '#wl' : '')));
    };

    var openSettingsTab = function (anchor) {
        openTab(getPageUrl('options.html') + (anchor ? '#' + anchor : ''), {activateSameTab: true});
    };

    var openSiteReportTab = function (url) {
        var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
        if (domain) {
            openTab("https://adguard.com/site.html?domain=" + encodeURIComponent(domain) + "&utm_source=extension&aid=16593");
        }
    };

    var openFilteringLog = function (tabId) {
        openTab(getPageUrl('log.html') + (tabId ? "?tabId=" + tabId : ""), {
            activateSameTab: true,
            type: "popup"
        });
    };

    var openCurrentTabFilteringLog = function () {
        adguard.tabs.getActive(function (tab) {
            var tabInfo = filteringLog.getTabInfo(tab);
            var tabId = tabInfo ? tabInfo.tabId : null;
            openFilteringLog(tabId);
        });
    };

    var openThankYouPage = function () {

        var filtersDownloadUrl = getPageUrl('filter-download.html');
        var thankyouUrl = getPageUrl('thankyou.html');

        adguard.tabs.getAll(function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.url === filtersDownloadUrl || tab.url === thankyouUrl) {
                    adguard.tabs.activate(tab.tabId);
                    if (tab.url !== thankyouUrl) {
                        adguard.tabs.reload(tab.tabId, thankyouUrl);
                    }
                    return;
                }
            }
            openTab(thankyouUrl);
        });
    };

    var openExtensionStore = function () {
        var url = Utils.getExtensionStoreLink();
        openTab(url);
    };

    var openFiltersDownloadPage = function () {
        openTab(getPageUrl('filter-download.html'), {inBackground: Utils.isYaBrowser()});
    };

    var whiteListTab = function (tab) {

        var tabInfo = framesMap.getFrameInfo(tab);
        antiBannerService.whiteListFrame(tabInfo);

        if (framesMap.isTabAdguardDetected(tab)) {
            var domain = UrlUtils.getHost(tab.url);
            adguardApplication.addRuleToApp("@@//" + domain + "^$document", function () {
                adguard.tabs.sendMessage(tab.tabId, {type: 'no-cache-reload'});
                adguard.browserAction.close();
            });
        } else {
            updateTabIconAndContextMenu(tab, true);
        }
    };

    var whiteListCurrentTab = function () {
        adguard.tabs.getActive(whiteListTab);
    };

    var unWhiteListTab = function (tab) {

        var tabInfo = framesMap.getFrameInfo(tab);
        antiBannerService.unWhiteListFrame(tabInfo);

        if (framesMap.isTabAdguardDetected(tab)) {
            var rule = framesMap.getTabAdguardUserWhiteListRule(tab);
            if (rule) {
                adguardApplication.removeRuleFromApp(rule.ruleText, function () {
                    adguard.tabs.sendMessage(tab.tabId, {type: 'no-cache-reload'});
                    adguard.browserAction.close();
                });
            }
        } else {
            updateTabIconAndContextMenu(tab, true);
        }
    };

    var unWhiteListCurrentTab = function () {
        adguard.tabs.getActive(unWhiteListTab);
    };

    var reloadCurrentTab = function (url) {
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.reload(tab.tabId, url);
        });
    };

    var changeApplicationFilteringDisabled = function (disabled) {
        adguard.settings.changeFilteringDisabled(disabled);
        adguard.tabs.getActive(function (tab) {
            updateTabIconAndContextMenu(tab, true);
        });
    };

    var checkAntiBannerFiltersUpdate = function () {
        antiBannerService.checkAntiBannerFiltersUpdate(true, function (updatedFilters) {
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, true, updatedFilters);
        }, function () {
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, false);
        });
    };

    var openAssistant = function (options) {
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'initAssistant',
                options: options || {}
            });
        });
    };

    var openTab = function (url, options, callback) {

        var activateSameTab, inNewWindow, type, inBackground;
        if (options) {
            activateSameTab = options.activateSameTab;
            inBackground = options.inBackground;
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

        url = StringUtils.contains(url, "://") ? url : adguard.getURL(url);
        adguard.tabs.getAll(function (tabs) {
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
                active: !inBackground,
                inNewWindow: inNewWindow
            }, callback);
        });

    };

    //update icon on event received
    EventNotifier.addListener(function (event, tab, reset) {

        if (event !== EventNotifierTypes.UPDATE_TAB_BUTTON_STATE || !tab) {
            return;
        }

        var options;
        if (reset) {
            options = {icon: Prefs.ICONS.ICON_GRAY, badge: ''};
        }

        updateTabIcon(tab, options);
    });

    // Update icon on ads blocked
    EventNotifier.addListener(function (event, rule, tab, blocked) {

        if (event !== EventNotifierTypes.ADS_BLOCKED || !tab) {
            return;
        }

        var tabBlocked = framesMap.updateBlockedAdsCount(tab, blocked);
        if (tabBlocked === null) {
            return;
        }
        updateTabIconAsync(tab);
    });

    // Update context menu on change user settings
    adguard.settings.onUpdated.addListener(function (setting) {
        if (setting === adguard.settings.DISABLE_SHOW_CONTEXT_MENU) {
            adguard.tabs.getActive(function (tab) {
                updateTabContextMenu(tab);
            });
        }
    });

    // Update tab icon while loading
    adguard.tabs.onUpdated.addListener(function (tab) {
        updateTabIconAndContextMenu(tab);
    });
    // Update tab icon on active tab change
    adguard.tabs.onActivated.addListener(function (tab) {
        updateTabIconAndContextMenu(tab, true);
    });

    //on filter auto-enabled event
    EventNotifier.addListener(function (event, enabledFilters) {
        if (event === EventNotifierTypes.ENABLE_FILTER_SHOW_POPUP) {
            var result = Utils.getFiltersEnabledResultMessage(enabledFilters);
            showAlertMessagePopup(result.title, result.text);
        }
    });

    //on filters updated event
    EventNotifier.addListener(function (event, success, updatedFilters) {
        if (event === EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP) {
            var result = Utils.getFiltersUpdateResultMessage(success, updatedFilters);
            showAlertMessagePopup(result.title, result.text);
        }
    });


    //close all page on unload
    unload.when(closeAllPages);

    return {
        openExportRulesTab: openExportRulesTab,
        openSettingsTab: openSettingsTab,
        openSiteReportTab: openSiteReportTab,
        openFilteringLog: openFilteringLog,
        openCurrentTabFilteringLog: openCurrentTabFilteringLog,
        openThankYouPage: openThankYouPage,
        openExtensionStore: openExtensionStore,
        openFiltersDownloadPage: openFiltersDownloadPage,

        updateTabIconAndContextMenu: updateTabIconAndContextMenu,

        whiteListTab: whiteListTab,
        whiteListCurrentTab: whiteListCurrentTab,
        unWhiteListTab: unWhiteListTab,
        unWhiteListCurrentTab: unWhiteListCurrentTab,
        reloadCurrentTab: reloadCurrentTab,

        changeApplicationFilteringDisabled: changeApplicationFilteringDisabled,
        checkAntiBannerFiltersUpdate: checkAntiBannerFiltersUpdate,
        openAssistant: openAssistant,
        openTab: openTab
    };

})();