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
(function (adguard) {

    if (!adguard.prefs.mobile) {
        return;
    }

    var mobilMenuItemsMap = new WeakMap();

    var Observer = {
        /**
         * 'after-viewport-change' event observer
         * @param subject Object
         * @param type Event type
         */
        observe: function (subject, type) {
            if (type === 'after-viewport-change') {
                handleNativeMenuState();
            }
        }
    };

    function createSubMenus(win, menuId) {

        var toggleWhiteListItem = createSubMenu(win, menuId, function () {

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
            });

        }, adguard.i18n.getMessage("popup_site_filtering_state"), true);

        var toggleFilteringEnabledItem = createSubMenu(win, menuId, function () {

            adguard.tabs.getActive(function (tab) {
                var tabInfo = adguard.frames.getFrameInfo(tab);
                adguard.ui.changeApplicationFilteringDisabled(!tabInfo.applicationFilteringDisabled);

                adguard.windowsImpl.getLastFocused(function (winId, domWin) {
                    domWin.NativeWindow.menu.update(toggleFilteringEnabledItem, {checked: tabInfo.applicationFilteringDisabled});
                });
            });

        }, adguard.i18n.getMessage('popup_site_protection_disabled_android'), true);

        var siteExceptionItem = createSubMenu(win, menuId, null, adguard.i18n.getMessage('popup_in_white_list_android'), false, false);

        var blockAdsItem = createSubMenu(win, menuId, function () {
            adguard.ui.openAssistant();
        }, adguard.i18n.getMessage("popup_block_site_ads_android"));

        var reportSiteItem = createSubMenu(win, menuId, function () {
            adguard.tabs.getActive(function (tab) {
                adguard.ui.openSiteReportTab(tab.url);
            });
        }, adguard.i18n.getMessage("popup_security_report_android"));

        var filteringLogItem = createSubMenu(win, menuId, function () {
            adguard.ui.openFilteringLog();
        }, adguard.i18n.getMessage('popup_open_log_android'));

        //show settings menu ever
        createSubMenu(win, menuId, function () {
            adguard.ui.openSettingsTab();
        }, adguard.i18n.getMessage("popup_open_settings"));

        var menu = {
            menuId: menuId,
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
        mobilMenuItemsMap.set(win, menu);
    }

    function createSubMenu(window, parentId, onClick, name, checkable, visible) {
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
    }

    function handleNativeMenuState() {

        adguard.tabs.getActive(function (tab) {

            var tabInfo = adguard.frames.getFrameInfo(tab);

            adguard.windowsImpl.getLastFocused(function (winId, domWin) {

                var menu = mobilMenuItemsMap.get(domWin);
                if (!menu) {
                    return;
                }

                var menuItems = menu.items;
                var nativeMenu = domWin.NativeWindow.menu;

                for (var item in menuItems) { // jshint ignore:line
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
            });

        });
    }

    function insertMobileContextMenu(win) {
        adguard.utils.concurrent.retryUntil(
            canCreateMobileContextMenu.bind(null, win),
            createMobileContextMenu.bind(null, win)
        );
    }

    function canCreateMobileContextMenu(win) {
        return !!win.NativeWindow;
    }

    /**
     * @param window
     */
    function createMobileContextMenu(window) {
        var menuID = window.NativeWindow.menu.add({
            name: "Adguard",
            icon: null
        });
        createSubMenus(window, menuID);
    }

    /**
     * @param win
     */
    function removeMobileContextMenu(win) {
        var menu = mobilMenuItemsMap.get(win);
        if (menu) {
            win.NativeWindow.menu.remove(menu.menuId);
            mobilMenuItemsMap.delete(win);
        }
    }

    adguard.windowsImpl.onUpdated.addListener(function (adgWin, domWin, event) {
        if (event === 'ChromeWindowLoad') {
            insertMobileContextMenu(domWin);
        }
    });

    adguard.windowsImpl.onRemoved.addListener(function (windowId, domWin) {
        removeMobileContextMenu(domWin);
    });

    adguard.windowsImpl.forEachNative(insertMobileContextMenu);

    Services.obs.addObserver(Observer, 'after-viewport-change', true);
    adguard.unload.when(function () {
        Services.obs.removeObserver(Observer, 'after-viewport-change');
        adguard.windowsImpl.forEachNative(removeMobileContextMenu);
    });

})(adguard);
