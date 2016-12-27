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

/* global Cu, Services */

/**
 * Object that manages mobile menu rendering.
 */
var MobileMenu = {

    nativeMenuIds: Object.create(null),

    init: function () {

        adguard.windowsImpl.onUpdated.addListener(function (adgWin, domWin, event) {
            if (event === 'ChromeWindowLoad') {
                this.applyToWindow(domWin);
            }
        }.bind(this));

        adguard.windowsImpl.onRemoved.addListener(function (windowId, domWin) {
            this.removeFromWindow(domWin);
        }.bind(this));

        this.observe = this.observe.bind(this);

        Services.obs.addObserver(this, 'after-viewport-change', true);

        adguard.unload.when(function () {
            this.unregister();
        }.bind(this));
    },

    unregister: function () {
        Services.obs.removeObserver(this, 'after-viewport-change');
    },

    /**
     * 'after-viewport-change' event observer
     * @param subject Object
     * @param type Event type
     */
    observe: function (subject, type) {
        if (type === 'after-viewport-change') {
            this.handleNativeMenuState();
        }
    },

    createSubMenus: function (window, menuId) {

        var toggleWhiteListItem = this.createSubMenu(window, menuId, function () {

            adguard.tabs.getActive(function (tab) {
                var tabInfo = adguard.frames.getFrameInfo(tab);
                if (tabInfo.userWhiteListed) {
                    adguard.ui.unWhiteListTab(tab);
                } else {
                    adguard.ui.whiteListTab(tab);
                }
                adguard.windowsImpl.getLastFocused(function (winId, domWin) {
                    domWin.NativeWindow.menu.update(toggleWhiteListItem, {checked: tabInfo.userWhiteListed});
                });
            }.bind(this));

        }.bind(this), adguard.i18n.getMessage("popup_site_filtering_state"), true);

        var toggleFilteringEnabledItem = this.createSubMenu(window, menuId, function () {

            adguard.tabs.getActive(function (tab) {
                var tabInfo = adguard.frames.getFrameInfo(tab);
                adguard.ui.changeApplicationFilteringDisabled(!tabInfo.applicationFilteringDisabled);

                adguard.windowsImpl.getLastFocused(function (winId, domWin) {
                    domWin.NativeWindow.menu.update(toggleFilteringEnabledItem, {checked: tabInfo.applicationFilteringDisabled});
                });
            }.bind(this));

        }.bind(this), adguard.i18n.getMessage('popup_site_protection_disabled_android'), true);

        var siteExceptionItem = this.createSubMenu(window, menuId, null, adguard.i18n.getMessage('popup_in_white_list_android'), false, false);

        var blockAdsItem = this.createSubMenu(window, menuId, function () {
            adguard.ui.openAssistant();
        }.bind(this), adguard.i18n.getMessage("popup_block_site_ads_android"));

        var reportSiteItem = this.createSubMenu(window, menuId, function () {
            adguard.tabs.getActive(function (tab) {
                adguard.ui.openSiteReportTab(tab.url);
            });
        }.bind(this), adguard.i18n.getMessage("popup_security_report_android"));

        var filteringLogItem = this.createSubMenu(window, menuId, function () {
            adguard.ui.openFilteringLog();
        }.bind(this), adguard.i18n.getMessage('popup_open_log_android'));

        //show settings menu ever
        this.createSubMenu(window, menuId, function () {
            adguard.ui.openSettingsTab();
        }, adguard.i18n.getMessage("popup_open_settings"));

        this.nativeMenuIds[window] = {
            main: menuId,
            //settingsSubMenu enabled all time
            items: {
                toggleWhiteListItem: toggleWhiteListItem,
                toggleFilteringEnabledItem: toggleFilteringEnabledItem,
                siteExceptionItem: siteExceptionItem,
                reportSiteItem: reportSiteItem,
                blockAdsItem: blockAdsItem,
                filteringLogItem: filteringLogItem
            }
        };
    },

    createSubMenu: function (window, parentId, onClick, name, checkable, visible) {
        if (typeof (checkable) === 'undefined') {
            checkable = false;
        }
        return window.NativeWindow.menu.add({
            name: name,
            icon: null,
            parent: parentId,
            callback: onClick,
            checkable: checkable,
            visible: visible
        });
    },

    handleNativeMenuState: function () {
        adguard.tabs.getActive(function (tab) {
            var tabInfo = adguard.frames.getFrameInfo(tab);
            try {
                adguard.windowsImpl.getLastFocused(function (winId, domWin) {

                    var menuItems = this.nativeMenuIds[domWin].items;
                    var nativeMenu = domWin.NativeWindow.menu;

                    for (var item in menuItems) {
                        nativeMenu.update(menuItems[item], {visible: false});
                    }

                    if (tabInfo.applicationFilteringDisabled) {
                        nativeMenu.update(menuItems.toggleFilteringEnabledItem, {visible: true, checked: true});
                    } else if (tabInfo.urlFilteringDisabled) { // jshint ignore:line
                        //do nothing, already not visible
                    } else {
                        nativeMenu.update(menuItems.toggleFilteringEnabledItem, {visible: true, checked: false});
                        if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                            nativeMenu.update(menuItems.siteExceptionItem, {visible: true});
                        } else if (tabInfo.canAddRemoveRule) {
                            nativeMenu.update(menuItems.toggleWhiteListItem, {
                                visible: true,
                                checked: !tabInfo.userWhiteListed
                            });
                        }
                        if (!tabInfo.documentWhiteListed) {
                            nativeMenu.update(menuItems.blockAdsItem, {visible: true});
                        }
                        nativeMenu.update(menuItems.filteringLogItem, {visible: true});
                        nativeMenu.update(menuItems.reportSiteItem, {visible: true});
                    }
                }.bind(this));
            } catch (ex) {
                Cu.reportError(ex);
            }
        }, true);
    },

    /**
     * @param window
     */
    applyToWindow: function (window) {
        var menuID = window.NativeWindow.menu.add({
            name: "Adguard",
            icon: null
        });
        this.createSubMenus(window, menuID);
    },

    /**
     * @param window
     */
    removeFromWindow: function (window) {
        if (window in this.nativeMenuIds) {
            var menuId = this.nativeMenuIds[window].main;
            window.NativeWindow.menu.remove(menuId);
        }
    }
};