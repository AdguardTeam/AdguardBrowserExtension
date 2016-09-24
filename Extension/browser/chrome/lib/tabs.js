/* global chrome, adguard, Log, Prefs */

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

adguard.tabsImpl = (function () {

	'use strict';

	var browser = browser || chrome;

	function checkLastError() {
		var ex = browser.runtime.lastError;
		if (ex) {
			Log.error("Error while executing operation: {0}", ex);
		}
		return ex;
	}

	// https://developer.chrome.com/extensions/tabs#type-Tab
	function toTabFromChromeTab(chromeTab) {
		return {
			tabId: chromeTab.id,
			url: chromeTab.url,
			title: chromeTab.title,
			incognito: chromeTab.incognito,
			status: chromeTab.status
		};
	}

	var onCreated = function (callback) {
		// https://developer.chrome.com/extensions/tabs#event-onCreated
		browser.tabs.onCreated.addListener(function (chromeTab) {
			callback(toTabFromChromeTab(chromeTab));
		});
	};

	var onRemoved = function (callback) {
		// https://developer.chrome.com/extensions/tabs#event-onCreated
		browser.tabs.onRemoved.addListener(function (tabId) {
			callback(tabId);
		});
	};

	var onUpdated = function (callback) {
		// https://developer.chrome.com/extensions/tabs#event-onUpdated
		browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
			callback(toTabFromChromeTab(tab));
		});
	};

	var onActivated = function (callback) {

		// https://developer.chrome.com/extensions/tabs#event-onActivated
		browser.tabs.onActivated.addListener(function (activeInfo) {
			callback(activeInfo.tabId);
		});

		// https://developer.chrome.com/extensions/windows#event-onFocusChanged
		browser.windows.onFocusChanged.addListener(function (windowId) {

			if (windowId === browser.windows.WINDOW_ID_NONE) {
				return;
			}

			getActive(callback);
		});
	};

	var create = function (createData, callback) {

		var url = createData.url;
		var active = createData.active === true;

		if (createData.type === 'popup') {
			// https://developer.chrome.com/extensions/windows#method-create
			browser.windows.create({
				url: url,
				type: 'popup',
				focused: active,
				width: 1230,
				height: 630
			}, callback);
			return;
		}

		var isHttp = url.indexOf('http') === 0;

		function onWindowFound(win) {
			// https://developer.chrome.com/extensions/tabs#method-create
			browser.tabs.create({
				windowId: win.id,
				url: url,
				active: active
			}, function (chromeTab) {
				callback(toTabFromChromeTab(chromeTab));
			});
		}

		function isAppropriateWindow(win) {
			// We can't open not-http (e.g. 'chrome-extension://') urls in incognito mode
			return win.type === 'normal' && (isHttp || !win.incognito);
		}

		// https://developer.chrome.com/extensions/windows#method-create
		// https://developer.chrome.com/extensions/windows#method-getLastFocused

		browser.windows.getLastFocused(function (win) {

			if (isAppropriateWindow(win)) {
				onWindowFound(win);
				return;
			}

			browser.windows.getAll(function (wins) {

				for (var i = 0; i < wins.length; i++) {
					var win = wins[i];
					if (isAppropriateWindow(win)) {
						onWindowFound(win);
						return;
					}
				}

				// Create new window
				browser.windows.create({}, onWindowFound);
			});
		});
	};

	var remove = function (tabId, callback) {
		// https://developer.chrome.com/extensions/tabs#method-remove
		browser.tabs.remove(tabId, function () {
			if (checkLastError()) {
				return;
			}
			callback(tabId);
		});
	};

	var activate = function (tabId, callback) {
		browser.tabs.update(tabId, {active: true}, function (tab) {
			if (checkLastError()) {
				return;
			}
			// Focus window
			browser.windows.update(tab.windowId, {focused: true}, function () {
				if (checkLastError()) {
					return;
				}
				callback(tabId);
			});
		});
	};

	var reload = function (tabId, url) {
		if (url) {
			if (Prefs.getBrowser() === "Edge") {
				/**
				 * For security reasons, in Firefox and Edge, this may not be a privileged URL.
				 * So passing any of the following URLs will fail, with runtime.lastError being set to an error message:
				 * chrome: URLs
				 * javascript: URLs
				 * data: URLs
				 * privileged about: URLs (for example, about:config, about:addons, about:debugging).
				 *
				 * Non-privileged URLs (about:home, about:newtab, about:blank) are allowed.
				 *
				 * So we use a content script instead.
				 */
				sendMessage(tabId, {type: 'update-tab-url', url: url});
			} else {
				browser.tabs.update(tabId, {url: url}, checkLastError);
			}
		} else {
			// https://developer.chrome.com/extensions/tabs#method-reload
			if (browser.tabs.reload) {
				browser.tabs.reload(tabId, {bypassCache: true}, checkLastError);
			} else {
				// Reload page without cache via content script
				sendMessage(tabId, {type: 'no-cache-reload'});
			}
		}
	};

	var sendMessage = function (tabId, message, responseCallback) {
		// https://developer.chrome.com/extensions/tabs#method-sendMessage
		(browser.tabs.sendMessage || browser.tabs.sendRequest)(tabId, message, responseCallback);
	};

	var getAll = function (callback) {
		// https://developer.chrome.com/extensions/tabs#method-query
		browser.tabs.query({}, function (chromeTabs) {
			var result = [];
			for (var i = 0; i < chromeTabs.length; i++) {
				var chromeTab = chromeTabs[i];
				result.push(toTabFromChromeTab(chromeTab));
			}
			callback(result);
		});
	};

	var getActive = function (callback) {
		browser.tabs.query({lastFocusedWindow: true, active: true}, function (tabs) {
			if (tabs && tabs.length > 0) {
				callback(tabs[0].id);
			}
		});
	};

	return {

		onCreated: onCreated,
		onRemoved: onRemoved,
		onUpdated: onUpdated,
		onActivated: onActivated,

		create: create,
		remove: remove,
		activate: activate,
		reload: reload,
		sendMessage: sendMessage,
		getAll: getAll,
		getActive: getActive,

		fromChromeTab: toTabFromChromeTab
	};

})();