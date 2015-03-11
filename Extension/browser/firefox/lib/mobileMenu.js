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
var {Cu, Cc, Ci} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var self = require('sdk/self');
var system = require('sdk/system');
var tabs = require('sdk/tabs');
var l10n = require('sdk/l10n');
var events = require('sdk/system/events');
var unload = require('sdk/system/unload');

var {UiUtils, WindowObserver} = require('uiUtils');

/**
 * Object that manages mobile menu rendering.
 */
var MobileMenu = exports.MobileMenu = {

	nativeMenuIds: Object.create(null),

	init: function (UI) {

		this.UI = UI;

		this.windowObserver = new WindowObserver(this);

		var observeListener = this.observe.bind(this);

		events.on('after-viewport-change', observeListener, true);

		unload.when(function () {
			events.off('after-viewport-change', observeListener);
		}.bind(this));
	},

	/**
	 * 'after-viewport-change' event observer
	 * @param event
	 */
	observe: function (event) {
		if (event.type == 'after-viewport-change') {
			this.handleNativeMenuState();
		}
	},

	createSubMenus: function (window, menuId) {

		var toggleWhiteListItem = this.createSubMenu(window, menuId, function () {

			var tabInfo = this.UI.getCurrentTabInfo();
			if (tabInfo.userWhiteListed) {
				this.UI.removeUrlFromWhiteList(tabs.activeTab.url);
			} else {
				this.UI.addUrlToWhiteList(tabs.activeTab.url);
			}

			var window = UiUtils.getMostRecentWindow();
			window.NativeWindow.menu.update(toggleWhiteListItem, {checked: tabInfo.userWhiteListed});
		}.bind(this), l10n.get("popup_site_filtering_state"), true);

		var toggleFilteringEnabledItem = this.createSubMenu(window, menuId, function () {

			var tabInfo = this.UI.getCurrentTabInfo();
			this.UI.changeApplicationFilteringDisabled(!tabInfo.applicationFilteringDisabled);

			var window = UiUtils.getMostRecentWindow();
			window.NativeWindow.menu.update(toggleFilteringEnabledItem, {checked: tabInfo.applicationFilteringDisabled});
		}.bind(this), l10n.get('popup_site_protection_disabled_android'), true);

		var siteExceptionItem = this.createSubMenu(window, menuId, null, l10n.get('popup_in_white_list_android'), false, false);

		var blockAdsItem = this.createSubMenu(window, menuId, function () {
			this.UI.openAssistant();
		}.bind(this), l10n.get("popup_block_site_ads_android"));

		var reportSiteItem = this.createSubMenu(window, menuId, function () {
			var tab = tabs.activeTab;
			this.UI.openSiteReportTab(tab.url);
		}.bind(this), l10n.get("popup_security_report_android"));

		var filteringLogItem = this.createSubMenu(window, menuId, function () {
			this.UI.openCurrentTabFilteringLog();
		}.bind(this), l10n.get('popup_open_log_android'));

		//show settings menu ever
		this.createSubMenu(window, menuId, function () {
			this.UI.openSettingsTab();
		}.bind(this), l10n.get("popup_open_settings"));

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
		if (typeof (checkable) == 'undefined') {
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
		try {

			var tabInfo = this.UI.getCurrentTabInfo(true);

			var window = UiUtils.getMostRecentWindow();
			var menuItems = this.nativeMenuIds[window].items;
			var nativeMenu = window.NativeWindow.menu;

			for (var item in menuItems) {
				nativeMenu.update(menuItems[item], {visible: false})
			}

			if (tabInfo.applicationFilteringDisabled) {
				nativeMenu.update(menuItems.toggleFilteringEnabledItem, {visible: true, checked: true});
			} else if (tabInfo.urlFilteringDisabled) {
				//do nothing, already not visible
			} else {
				nativeMenu.update(menuItems.toggleFilteringEnabledItem, {visible: true, checked: false});
				if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
					nativeMenu.update(menuItems.siteExceptionItem, {visible: true});
				} else if (tabInfo.canAddRemoveRule) {
					nativeMenu.update(menuItems.toggleWhiteListItem, {visible: true, checked: !tabInfo.userWhiteListed});
				}
				if (!tabInfo.documentWhiteListed) {
					nativeMenu.update(menuItems.blockAdsItem, {visible: true});
				}
				nativeMenu.update(menuItems.filteringLogItem, {visible: true});
				nativeMenu.update(menuItems.reportSiteItem, {visible: true});
			}
		} catch (ex) {
			Cu.reportError(ex);
		}
	},

	/**
	 * WindowObserver method implementation
	 * @param window
	 */
	applyToWindow: function (window) {
		var menuID = window.NativeWindow.menu.add({
			name: "Adguard",
			icon: null
		});
		MobileMenu.createSubMenus(window, menuID);
	},

	/**
	 * WindowObserver method implementation
	 * @param window
	 */
	removeFromWindow: function (window) {
		if (window in MobileMenu.nativeMenuIds) {
			var menuId = MobileMenu.nativeMenuIds[window].main;
			window.NativeWindow.menu.remove(menuId);
		}
	}
};
