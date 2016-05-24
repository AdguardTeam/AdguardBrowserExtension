/* global Log */
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
var BrowserTab, BrowserTabs;
var ext;

(function () {
    
	// Tab events implementation
	var SafariTabEvent = function () {
		BaseEvent.apply(this, arguments);
	};
	SafariTabEvent.prototype = {

		__proto__: BaseEvent.prototype,

		specifyListener: function (listener) {
			return function (event) {
				if (event.target instanceof SafariBrowserTab) {
					listener(new BrowserTab(event.target));
				}
			};
		}
	};

	var OnLoadingTabEvent = function (target) {
		BaseEvent.call(this, target, "message", false);
	};
	OnLoadingTabEvent.prototype = {

		__proto__: BaseEvent.prototype,

		specifyListener: function (listener) {
			return function (event) {
				if (event.name == "loading" && event.message == event.target.url) {
					listener(new BrowserTab(event.target));
				}
			};
		}
	};

	// Browser Tab implementation
	BrowserTab = function (tab) {
		this.safariTab = tab;
		this._eventTarget = tab;
		this._messageDispatcher = tab.page;
	};
	BrowserTab.prototype = {
		get url() {
			return this.safariTab.url;
		},
		get title() {
			return this.safariTab.title;
		},
		close: function () {
			this.safariTab.close();
		},
		activate: function () {
			this.safariTab.activate();
			this.safariTab.browserWindow.activate();
		},
		reload: function (url) {
			this.safariTab.url = (url || this.safariTab.url);
		},
		executeScript: function (details, callback) {
			callback();
		},
		insertCSS: function (details, callback) {
			callback();
		},
		get active() {
			return this.safariTab == safari.application.activeBrowserWindow.activeTab;
		},
		equals: function (t) {
			return this.safariTab == t.safariTab;
		},
		sendMessage: SendMessageFunction
	};

	// Browser Tabs collection implementation
	BrowserTabs = function () {

		this.safariTabs = [];
		this.framesInfo = [];

		this._onTabClosed = this._onTabClosed.bind(this);
	};
	BrowserTabs.prototype = {
		set: function (tab, value) {
			if (!tab) {
				return;
			}
			var index = this.safariTabs.indexOf(tab.safariTab);
			if (index < 0) {
				this.safariTabs.push(tab.safariTab);
				this.framesInfo.push(value);
			} else {
				this.framesInfo[index] = value;
			}
		},
		get: function (tab) {
			if (!tab) {
				return null;
			}
			var index = this.safariTabs.indexOf(tab.safariTab);
			return index >= 0 ? this.framesInfo[index] : null;
		},
		has: function (tab) {
			return tab && this.safariTabs.indexOf(tab.safariTab) >= 0;
		},
		clear: function () {
			while (this.safariTabs.length > 0) {
				this._delete(this.safariTabs[0]);
			}
		},
		collection: function () {
			return this.framesInfo;
		},
		checkIncognitoMode: function (tab) {
			//do nothing
		},
		isIncognito: function (tab) {
			if (tab && tab.safariTab && tab.safariTab.private != undefined) {
				return tab.safariTab.private;
			}

			return safari.application.privateBrowsing.enabled;
		},
		remove: function (tab) {
			this._delete(tab.safariTab);
		},
		_delete: function (tab) {
			var index = this.safariTabs.indexOf(tab);
			if (index >= 0) {
				this.safariTabs.splice(index, 1);
				this.framesInfo.splice(index, 1);
				tab.removeEventListener("close", this._onTabClosed, false);
			}
		},
		_onTabClosed: function (event) {
			this._delete(event.target);
		}
	};

	// Browser Window implementation
	var BrowserWindow = function (win) {
		this._win = win;
	};
	BrowserWindow.prototype = {
		get visible() {
			return this._win.visible;
		},
		getAllTabs: function (callback) {
			callback(this._win.tabs.map(function (tab) {
				return new BrowserTab(tab);
			}));
		},
		getActiveTab: function (callback) {
			callback(new BrowserTab(this._win.activeTab));
		},
		openTab: function (url, background, callback) {
			var tab = this._win.openTab();
			tab.url = url;
			if (callback) {
				callback(new BrowserTab(tab));
			}
		}
	};

	var emptyListener = {
		addListener: function () {
            // Empty
		}
	};

	// Web Request Blocking implementation
	function getRequestDetails(message, tab) {

		var requestType;
		switch (message.type) {
			case "main_frame":
				requestType = RequestTypes.DOCUMENT;
				break;
			case "sub_frame":
				requestType = RequestTypes.SUBDOCUMENT;
				break;
			default :
				requestType = message.type.toUpperCase();
				break;
		}

		return {
			requestUrl: message.url,                //request url
			requestType: requestType,               //request type
			frameId: message.frameId,               //id of this frame (only for main_frame and sub_frame types)
			requestFrameId: message.requestFrameId, //id of frame where request is executed
			tab: new BrowserTab(tab)                //request tab
		};
	}

	// Extension API for background page
	ext = {};
	ext.webRequest = {

		onBeforeRequest: {

			requestListeners: [],

			processMessage: function (message, tab) {

				var requestDetails = getRequestDetails(message, tab);

				for (var i = 0; i < this.requestListeners.length; i++) {

					var requestListener = this.requestListeners[i];

					var result = requestListener(requestDetails);
					if (result === false) {
						return false;
					}
				}

				return true;
			},

			addListener: function (listener) {
				this.requestListeners.push(listener);
			},

			removeListener: function (listener) {
				var index = this.requestListeners.indexOf(listener);
				if (index >= 0) {
					this.requestListeners.splice(index, 1);
				}
			}
		},
		handlerBehaviorChanged: function () {
            // Empty
		},
		onCompleted: emptyListener,
		onErrorOccurred: emptyListener,
		onHeadersReceived: {

			requestListeners: [],

			processMessage: function (message, tab) {

				var requestDetails = getRequestDetails(message, tab);

				for (var i = 0; i < this.requestListeners.length; i++) {
					var requestListener = this.requestListeners[i];
					requestListener(requestDetails);
				}

				return true;
			},

			addListener: function (listener) {
				this.requestListeners.push(listener);
			},

			removeListener: function (listener) {
				var index = this.requestListeners.indexOf(listener);
				if (index >= 0) {
					this.requestListeners.splice(index, 1);
				}
			}
		},
		onBeforeSendHeaders: emptyListener
	};

	// Synchronous message passing implementation
	safari.application.addEventListener("message", function (event) {
		if (event.name != "canLoad") {
			return;
		}
		var messageHandler;
		switch (event.message.type) {
			case "safariWebRequest":
				messageHandler = ext.webRequest.onBeforeRequest;
				break;
			case "safariHeadersRequest":
				messageHandler = ext.webRequest.onHeadersReceived;
				break;
            case "useContentBlockerAPI":
                event.message = Utils.isContentBlockerEnabled();
				Log.info('useContentBlockerAPI check ' + event.message);
                return;
		}
		event.message = messageHandler.processMessage(event.message.data, event.target);
	}, true);

	ext.getURL = function (path) {
		return safari.extension.baseURI + path;
	};

	ext.i18n = new I18NSupport();

	ext.app = {};
	ext.app.getDetails = function () {
		return {
			version: safari.extension.bundleVersion
		};
	};

	ext.windows = {};
	ext.windows.getAll = function (callback) {
		callback(safari.application.browserWindows.map(function (win) {
			return new BrowserWindow(win);
		}));
	};
	ext.windows.getLastFocused = function (callback) {
		callback(new BrowserWindow(safari.application.activeBrowserWindow));
	};
	ext.windows.getOrCreate = function (callback) {
		var win = safari.application.activeBrowserWindow;
		if (!win) {
			win = safari.application.openBrowserWindow();
		}
		callback(new BrowserWindow(win));
	};

	ext.tabs = {
		onLoading: new OnLoadingTabEvent(safari.application),
		onCreated: new SafariTabEvent(safari.application, "open", true),
		onCompleted: new SafariTabEvent(safari.application, "navigate", true),
		onActivated: new SafariTabEvent(safari.application, "activate", true),
		onRemoved: new SafariTabEvent(safari.application, "close", true),
		onUpdated: new SafariTabEvent(safari.application, "navigate", true),
		getLastFocused: function (callback) {
			callback(new BrowserTab(safari.application.activeBrowserWindow.activeTab));
		}
	};

	ext.backgroundPage = {
		getWindow: function () {
			return safari.extension.globalPage.contentWindow;
		}
	};

	ext.onMessage = new OnMessageEvent(safari.application);

	ext.webNavigation = {
		onCreatedNavigationTarget: emptyListener
	};

	/* Browser actions */
	function setBrowserAction(tab, name, value) {
		var items = safari.extension.toolbarItems;
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (item.identifier == "AdguardOpenOptions" && tab.safariTab == safari.application.activeBrowserWindow.activeTab) {
				item[name] = value;
			}
		}
	}

	ext.browserAction = {
		setBrowserAction: function (tab, icon, badge, badgeColor, title) {
			//set title
			setBrowserAction(tab, "label", title);
			setBrowserAction(tab, "toolTip", title);
			//set badge
			setBrowserAction(tab, "badge", badge);
		}
	};

	ext.windows.onFocusChanged = {
		addListener: function (listener) {
			safari.application.addEventListener("activate", listener, true);
		}
	};

	ext.contextMenus = {
		removeAll: function () {
            // Empty
		},
		create: function () {
            // Empty
		}
	}
})();
