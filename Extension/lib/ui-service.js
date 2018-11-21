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

adguard.ui = (function (adguard) { // jshint ignore:line

    var browserActionTitle = adguard.i18n.getMessage('name');

    var contextMenuCallbackMappings = {
        'context_block_site_ads': function () {
            openAssistant();
        },
        'context_block_site_element': function () {
            openAssistant(true);
        },
        'context_security_report': function () {
            adguard.tabs.getActive(function (tab) {
                openSiteReportTab(tab.url);
            });
        },
        'context_site_filtering_on': function () {
            adguard.tabs.getActive(unWhiteListTab);
        },
        'context_site_filtering_off': function () {
            adguard.tabs.getActive(whiteListTab);
        },
        'context_enable_protection': function () {
            changeApplicationFilteringDisabled(false);
        },
        'context_disable_protection': function () {
            changeApplicationFilteringDisabled(true);
        },
        'context_open_settings': function () {
            openSettingsTab();
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
            openFilteringLog();
        },
        'context_update_antibanner_filters': function () {
            checkFiltersUpdates();
        },
        'context_ads_has_been_removed_by_adguard': function () {
            openIntegrationModeInfo();
        }
    };

    var nextMenuId = 0;

    var extensionStoreLink = (function () {

        var urlBuilder = ["https://adguard.com/extension-page.html"];
        urlBuilder.push("?browser=");
        if (adguard.utils.browser.isOperaBrowser()) {
            urlBuilder.push("opera");
        } else if (adguard.utils.browser.isFirefoxBrowser()) {
            urlBuilder.push("firefox");
        } else if (adguard.utils.browser.isYaBrowser()) {
            urlBuilder.push("yabrowser");
        } else if (adguard.utils.browser.isSafariBrowser()) {
            urlBuilder.push("safari");
        } else if (adguard.utils.browser.isEdgeBrowser()) {
            urlBuilder.push("edge");
        } else {
            urlBuilder.push("chrome");
        }

        return urlBuilder.join("");
    })();

    var THANKYOU_PAGE_URL = 'https://welcome.adguard.com/v2/thankyou.html';

    /**
     * Update icon for tab
     * @param tab Tab
     * @param options Options for icon or badge values
     */

    function updateTabIcon(tab, options) {
        let icon;
        let badge;
        let badgeColor = '#555';

        try {
            if (options) {
                icon = options.icon;
                badge = options.badge;
            } else {
                var blocked;
                var disabled;

                var tabInfo = adguard.frames.getFrameInfo(tab);
                if (tabInfo.adguardDetected) {
                    disabled = tabInfo.documentWhiteListed;
                    blocked = '';
                } else {
                    disabled = tabInfo.applicationFilteringDisabled;
                    disabled = disabled || tabInfo.urlFilteringDisabled;
                    disabled = disabled || tabInfo.documentWhiteListed;

                    if (!disabled && adguard.settings.showPageStatistic()) {
                        blocked = tabInfo.totalBlockedTab.toString();
                    } else {
                        blocked = '0';
                    }
                }

                if (disabled) {
                    icon = adguard.prefs.ICONS.ICON_GRAY;
                } else if (tabInfo.adguardDetected) {
                    icon = adguard.prefs.ICONS.ICON_BLUE;
                } else {
                    icon = adguard.prefs.ICONS.ICON_GREEN;
                }

                badge = adguard.utils.workaround.getBlockedCountText(blocked);

                // If there's an active notification, indicate it on the badge
                var notification = adguard.notifications.getCurrentNotification();
                if (notification && !tabInfo.adguardDetected) {
                    badge = notification.badgeText;
                    badgeColor = notification.badgeBgColor;
                }
            }

            adguard.browserAction.setBrowserAction(tab, icon, badge, badgeColor, browserActionTitle);
        } catch (ex) {
            adguard.console.error('Error while updating icon for tab {0}: {1}', tab.tabId, new Error(ex));
        }
    }

    var updateTabIconAsync = adguard.utils.concurrent.debounce(function (tab) {
        updateTabIcon(tab);
    }, 250);

    /**
     * Creates context menu item
     * @param title Title id
     * @param options Create options
     */
    function addMenu(title, options) {
        var createProperties = {
            contexts: ["all"],
            title: adguard.i18n.getMessage(title)
        };
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
            if ('checkable' in options) {
                createProperties.checkable = options.checkable;
            }
            if ('checked' in options) {
                createProperties.checked = options.checked;
            }
        }
        var callback;
        if (options && options.action) {
            callback = contextMenuCallbackMappings[options.action];
        } else {
            callback = contextMenuCallbackMappings[title];
        }
        if (typeof callback === 'function') {
            createProperties.onclick = callback;
        }
        adguard.contextMenus.create(createProperties);
    }

    function customizeContextMenu(tab) {

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

        var tabInfo = adguard.frames.getFrameInfo(tab);

        if (tabInfo.applicationFilteringDisabled) {
            addMenu('context_site_protection_disabled');
            addSeparator();
            addMenu('context_open_log');
            addSettingsSubMenu();
            addMenu('context_enable_protection');
        } else if (tabInfo.urlFilteringDisabled) {
            addMenu('context_site_filtering_disabled');
            addSeparator();
            addMenu('context_open_log');
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

    function customizeMobileContextMenu(tab) {

        var tabInfo = adguard.frames.getFrameInfo(tab);

        if (tabInfo.applicationFilteringDisabled) {
            addMenu('popup_site_protection_disabled_android', {
                action: 'context_enable_protection',
                checked: true,
                checkable: true,
            });
            addMenu('popup_open_log_android', { action: 'context_open_log' });
            addMenu('popup_open_settings', { action: 'context_open_settings' });
        } else if (tabInfo.urlFilteringDisabled) {
            addMenu('context_site_filtering_disabled');
            addMenu('popup_open_log_android', { action: 'context_open_log' });
            addMenu('popup_open_settings', { action: 'context_open_settings' });
            addMenu('context_update_antibanner_filters');
        } else {
            addMenu('popup_site_protection_disabled_android', {
                action: 'context_disable_protection',
                checked: false,
                checkable: true
            });
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                addMenu('popup_in_white_list_android');
            } else if (tabInfo.canAddRemoveRule) {
                if (tabInfo.documentWhiteListed) {
                    addMenu('popup_site_filtering_state', {
                        action: 'context_site_filtering_on',
                        checkable: true,
                        checked: false
                    });
                } else {
                    addMenu('popup_site_filtering_state', {
                        action: 'context_site_filtering_off',
                        checkable: true,
                        checked: true
                    });
                }
            }

            if (!tabInfo.documentWhiteListed) {
                addMenu('popup_block_site_ads_android', {action: 'context_block_site_ads'});
            }
            addMenu('popup_open_log_android', {action: 'context_open_log'});
            addMenu('popup_security_report_android', {action: 'context_security_report'});
            addMenu('popup_open_settings', {action: 'context_open_settings'});
            addMenu('context_update_antibanner_filters');
        }
    }

    /**
     * Update context menu for tab
     * @param tab Tab
     */
    function updateTabContextMenu(tab) {
        // Isn't supported by Android WebExt
        if (!adguard.contextMenus) {
            return;
        }
        adguard.contextMenus.removeAll();
        if (adguard.settings.showContextMenu()) {
            if (adguard.prefs.mobile) {
                customizeMobileContextMenu(tab);
            } else {
                customizeContextMenu(tab);
            }
            if (typeof adguard.contextMenus.render === 'function') {
                // In some case we need to manually render context menu
                adguard.contextMenus.render();
            }
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
            if (!showForAdguardTab && adguard.frames.isTabAdguardDetected(tab)) {
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

    function getFiltersUpdateResultMessage(success, updatedFilters) {
        var title = adguard.i18n.getMessage("options_popup_update_title");
        var text = [];
        if (success) {
            if (updatedFilters.length === 0) {
                text.push(adguard.i18n.getMessage("options_popup_update_not_found"));
            } else {
                updatedFilters.sort(function (a, b) {
                    return a.displayNumber - b.displayNumber;
                });
                for (var i = 0; i < updatedFilters.length; i++) {
                    var filter = updatedFilters[i];
                    text.push(adguard.i18n.getMessage("options_popup_update_updated", [filter.name, filter.version]).replace("$1", filter.name).replace("$2", filter.version));
                }
            }
        } else {
            text.push(adguard.i18n.getMessage("options_popup_update_error"));
        }

        return {
            title: title,
            text: text
        };
    }

    function getFiltersEnabledResultMessage(enabledFilters) {
        var title = adguard.i18n.getMessage("alert_popup_filter_enabled_title");
        var text = [];
        enabledFilters.sort(function (a, b) {
            return a.displayNumber - b.displayNumber;
        });
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            text.push(adguard.i18n.getMessage("alert_popup_filter_enabled_text", [filter.name]).replace("$1", filter.name));
        }
        return {
            title: title,
            text: text
        };
    }

    var updateTabIconAndContextMenu = function (tab, reloadFrameData) {
        if (reloadFrameData) {
            adguard.frames.reloadFrameData(tab);
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
        var domain = adguard.utils.url.toPunyCode(adguard.utils.url.getDomainName(url));
        if (domain) {
            openTab("https://adguard.com/site.html?domain=" + encodeURIComponent(domain) + "&utm_source=extension&aid=16593");
        }
    };

    /**
     * Opens site complaint report tab
     *
     * @param url
     */
    var openAbuseTab = function (url) {
        var browser;
        var browserDetails;

        var supportedBrowsers = ['Chrome', 'Firefox', 'Opera', 'Safari', 'IE', 'Edge'];
        if (supportedBrowsers.indexOf(adguard.prefs.browser) >= 0) {
            browser = adguard.prefs.browser;
        } else {
            browser = 'Other';
            browserDetails = adguard.prefs.browser;
        }

        var filters = [];
        var enabledFilters = adguard.filters.getEnabledFilters();
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            filters.push(filter.filterId);
        }

        openTab("https://reports.adguard.com/new_issue.html?product_type=Ext&product_version=" + encodeURIComponent(adguard.app.getVersion()) +
            "&browser=" + encodeURIComponent(browser) +
            (browserDetails ? '&browser_detail=' + encodeURIComponent(browserDetails) : '') +
            "&url=" + encodeURIComponent(url) +
            "&filters=" + encodeURIComponent(filters.join('.')));
    };

    var openFilteringLog = function (tabId) {
        var options = {activateSameTab: true, type: "popup"};
        if (!tabId) {
            adguard.tabs.getActive(function (tab) {
                var tabId = tab.tabId;
                openTab(getPageUrl('log.html') + (tabId ? "#" + tabId : ""), options);
            });
            return;
        }
        openTab(getPageUrl('log.html') + (tabId ? "#" + tabId : ""), options);
    };

    var openThankYouPage = function () {
        var params = adguard.utils.browser.getExtensionParams();
        params.push('_locale=' + encodeURIComponent(adguard.app.getLocale()));
        var thankyouUrl = THANKYOU_PAGE_URL + '?' + params.join('&');

        var filtersDownloadUrl = getPageUrl('filter-download.html');

        adguard.tabs.getAll(function (tabs) {
            // Finds the filter-download page and reload it within the thank-you page URL
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.url === filtersDownloadUrl) {
                    // In YaBrowser don't activate found page
                    if (!adguard.utils.browser.isYaBrowser()) {
                        adguard.tabs.activate(tab.tabId);
                    }
                    adguard.tabs.reload(tab.tabId, thankyouUrl);
                    return;
                }
            }
            openTab(thankyouUrl);
        });
    };

    var openIntegrationModeInfo = function () {
        openTab('https://adguard.com/adguard-adblock-browser-extension/integration-mode.html?utm_source=extension&aid=16593#integrationMode');
    };

    var openExtensionStore = function () {
        openTab(extensionStoreLink);
    };

    var openFiltersDownloadPage = function () {
        openTab(getPageUrl('filter-download.html'), {inBackground: adguard.utils.browser.isYaBrowser()});
    };

    var whiteListTab = function (tab) {
        var tabInfo = adguard.frames.getFrameInfo(tab);
        adguard.whitelist.whiteListUrl(tabInfo.url);

        if (adguard.frames.isTabAdguardDetected(tab)) {
            var domain = adguard.utils.url.getHost(tab.url);
            adguard.integration.addRuleToApp("@@//" + domain + "^$document", function () {
                adguard.tabs.sendMessage(tab.tabId, {type: 'no-cache-reload'});
            });
        } else {
            updateTabIconAndContextMenu(tab, true);
        }
    };

    var unWhiteListTab = function (tab) {
        var tabInfo = adguard.frames.getFrameInfo(tab);
        adguard.userrules.unWhiteListFrame(tabInfo);

        if (adguard.frames.isTabAdguardDetected(tab)) {
            var rule = adguard.frames.getTabAdguardUserWhiteListRule(tab);
            if (rule) {
                adguard.integration.removeRuleFromApp(rule.ruleText, function () {
                    adguard.tabs.sendMessage(tab.tabId, {type: 'no-cache-reload'});
                });
            }
        } else {
            updateTabIconAndContextMenu(tab, true);
        }
    };

    var changeApplicationFilteringDisabled = function (disabled) {
        adguard.settings.changeFilteringDisabled(disabled);
        adguard.tabs.getActive(function (tab) {
            updateTabIconAndContextMenu(tab, true);
        });
    };

    var checkFiltersUpdates = function () {
        adguard.filters.checkFiltersUpdates(function (updatedFilters) {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTERS_SHOW_POPUP, true, updatedFilters);
        }, function () {
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_FILTERS_SHOW_POPUP, false);
        });
    };

    var initAssistant = function (selectElement) {
        var options = {
            addRuleCallbackName: 'addUserRule',
            selectElement: selectElement
        };

        // init assistant
        adguard.tabs.getActive(function (tab) {
            adguard.tabs.sendMessage(tab.tabId, {
                type: 'initAssistant',
                options: options
            });
        });
    };

    /*
     * The `openAssistant` function uses the `tabs.executeScript` function to inject the Assistant code into a page without using messaging.
     * We do it dynamically and not include assistant file into the default content scripts in order to reduce the overall memory usage.
     *
     * Browsers that do not support `tabs.executeScript` function use Assistant from the manifest file manually (Safari for instance).
     * After executing the Assistant code in callback the `initAssistant` function is called.
     * It sends messages to current tab and runs Assistant. Other browsers call `initAssistant` function manually.
     *
     * @param {boolean} selectElement - if true select the element on which the Mousedown event was
     */
    var openAssistant = function (selectElement) {
        if (adguard.tabs.executeScriptFile) {

            // Load Assistant code to the activate tab immediately
            adguard.tabs.executeScriptFile(null, "/lib/content-script/assistant/js/assistant.js", function() {
                initAssistant(selectElement);
            });
        } else {
            // Mannualy start assistant in safari and legacy firefox
            initAssistant(selectElement);
        }
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

        url = adguard.utils.strings.contains(url, "://") ? url : adguard.getURL(url);
        adguard.tabs.getAll(function (tabs) {
            //try to find between opened tabs
            if (activateSameTab) {
                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    if (adguard.utils.url.urlEquals(tab.url, url)) {
                        onTabFound(tab);
                        return;
                    }
                }
            }
            adguard.tabs.create({
                url: url,
                type: type || 'normal',
                active: !inBackground,
                inNewWindow: inNewWindow,
            }, callback);
        });
    };

    // update icon on event received
    adguard.listeners.addListener(function (event, tab, reset) {
        if (event !== adguard.listeners.UPDATE_TAB_BUTTON_STATE || !tab) {
            return;
        }

        var options;
        if (reset) {
            options = { icon: adguard.prefs.ICONS.ICON_GRAY, badge: '' };
        }

        updateTabIcon(tab, options);
    });

    // Update icon on ads blocked
    adguard.listeners.addListener(function (event, rule, tab, blocked) {

        if (event !== adguard.listeners.ADS_BLOCKED || !tab) {
            return;
        }

        var tabBlocked = adguard.frames.updateBlockedAdsCount(tab, blocked);
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

    // Update tab icon and context menu while loading
    adguard.tabs.onUpdated.addListener(function (tab) {
        var tabId = tab.tabId;
        // BrowserAction is set separately for each tab
        updateTabIcon(tab);
        adguard.tabs.getActive(function (aTab) {
            if (aTab.tabId !== tabId) {
                return;
            }
            // ContextMenu is set for all tabs, so update it only for current tab
            updateTabContextMenu(aTab);
        });
    });

    // Update tab icon and context menu on active tab changed
    adguard.tabs.onActivated.addListener(function (tab) {
        updateTabIconAndContextMenu(tab, true);
    });

    // Update tab icon and context menu on application initialization
    adguard.listeners.addListener(function (event) {
        if (event === adguard.listeners.APPLICATION_INITIALIZED) {
            adguard.tabs.getActive(updateTabIconAndContextMenu);
        }
    });

    //on filter auto-enabled event
    adguard.listeners.addListener(function (event, enabledFilters) {
        if (event === adguard.listeners.ENABLE_FILTER_SHOW_POPUP) {
            var result = getFiltersEnabledResultMessage(enabledFilters);
            showAlertMessagePopup(result.title, result.text);
        }
    });

    //on filters updated event
    adguard.listeners.addListener(function (event, success, updatedFilters) {
        if (event === adguard.listeners.UPDATE_FILTERS_SHOW_POPUP) {
            var result = getFiltersUpdateResultMessage(success, updatedFilters);
            showAlertMessagePopup(result.title, result.text);
        }
    });

    //close all page on unload
    adguard.unload.when(closeAllPages);

    return {
        openExportRulesTab: openExportRulesTab,
        openSettingsTab: openSettingsTab,
        openSiteReportTab: openSiteReportTab,
        openFilteringLog: openFilteringLog,
        openThankYouPage: openThankYouPage,
        openExtensionStore: openExtensionStore,
        openFiltersDownloadPage: openFiltersDownloadPage,
        openAbuseTab: openAbuseTab,

        updateTabIconAndContextMenu: updateTabIconAndContextMenu,

        whiteListTab: whiteListTab,
        unWhiteListTab: unWhiteListTab,

        changeApplicationFilteringDisabled: changeApplicationFilteringDisabled,
        checkFiltersUpdates: checkFiltersUpdates,
        openAssistant: openAssistant,
        openTab: openTab,

        showAlertMessagePopup: showAlertMessagePopup
    };

})(adguard);
