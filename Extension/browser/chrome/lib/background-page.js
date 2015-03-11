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
var BrowserTab, BrowserTabs, BrowserWindow;

(function () {

	var TabEvent = function () {
		BaseEvent.apply(this, arguments);
	};

	TabEvent.prototype = {
		__proto__: BaseEvent.prototype
	};
	var OnCreatedTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onCreated);
	};
	OnCreatedTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (tab) {
				listener(new BrowserTab(tab));
			};
		}
	};

	var OnLoadingTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onUpdated);
	};
	OnLoadingTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (id, info, tab) {
				if (info.status == "loading") {
					listener(new BrowserTab(tab));
				}
			};
		}
	};

	var OnCompletedTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onUpdated);
	};
	OnCompletedTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (id, info, tab) {
				if (info.status == "complete") {
					listener(new BrowserTab(tab));
				}
			};
		}
	};

	var OnUpdatedTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onUpdated);
	};
	OnUpdatedTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (id, info, tab) {
				listener(new BrowserTab(tab));
			};
		}
	};

	var OnActivatedTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onActivated);
	};
	OnActivatedTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (info) {
				chrome.tabs.get(info.tabId, function (tab) {
					if (checkLastError()) {
						return;
					}
					if (tab) {
						listener(new BrowserTab(tab));
					}
				});
			};
		}
	};

	var OnRemovedTabEvent = function () {
		TabEvent.call(this, chrome.tabs.onRemoved);
	};
	OnRemovedTabEvent.prototype = {

		__proto__: TabEvent.prototype,

		specifyListener: function (listener) {
			return function (id) {
				listener(new BrowserTab({id: id}));
			};
		}
	};

	function getRequestDetails(details) {

		var tab = new BrowserTab({id: details.tabId});

		//https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
		var requestDetails = {
			requestUrl: details.url,    //request url
			tab: tab                    //request tab
		};

		var frameId = 0;        //id of this frame (only for main_frame and sub_frame types)
		var requestFrameId = 0; //id of frame where request is executed
		var requestType;        //request type

		switch (details.type) {
			case "main_frame":
				frameId = 0;
				requestType = "DOCUMENT";
				break;
			case "sub_frame":
				frameId = details.frameId;
				requestFrameId = details.parentFrameId; //for sub_frame use parentFrameId as id of frame that wraps this frame
				requestType = "SUBDOCUMENT";
				break;
			default:
				requestFrameId = details.frameId;
				requestType = details.type.toUpperCase();
				break;
		}

		//relate request to main_frame
		if (requestFrameId == -1) {
			requestFrameId = 0;
		}

		requestDetails.frameId = frameId;
		requestDetails.requestFrameId = requestFrameId;
		requestDetails.requestType = requestType;

		if (details.requestHeaders) {
			requestDetails.requestHeaders = details.requestHeaders;
		}

		if (details.responseHeaders) {
			requestDetails.responseHeaders = details.responseHeaders;
		}

		return requestDetails;
	}

	var OnBeforeRequestEvent = function () {
		BaseEvent.call(this, chrome.webRequest.onBeforeRequest);
	};
	OnBeforeRequestEvent.prototype = {

		__proto__: BaseEvent.prototype,

		specifyListener: function (listener) {

			return function (details) {

				if (details.tabId == -1) {
					return {};
				}

				var requestDetails = getRequestDetails(details);

				var skip = listener(requestDetails);
				return {
					cancel: skip == false
				};
			};
		},

		getOptExtraInfoSpec: function (urls) {
			return [urls ? {urls: urls} : {}, ["blocking"]];
		}
	};

	var OnHeadersReceivedEvent = function () {
		BaseEvent.call(this, chrome.webRequest.onHeadersReceived);
	};

	OnHeadersReceivedEvent.prototype = {

		__proto__: BaseEvent.prototype,

		specifyListener: function (listener) {

			return function (details) {

				if (details.tabId == -1) {
					return;
				}

				var requestDetails = getRequestDetails(details);
				listener(requestDetails);
			};
		},

		getOptExtraInfoSpec: function (urls) {
			return [urls ? {urls: urls} : {}, ["responseHeaders"]];
		}
	};

	var OnBeforeSendHeadersEvent = function () {
		BaseEvent.call(this, chrome.webRequest.onBeforeSendHeaders);
	};

	OnBeforeSendHeadersEvent.prototype = {

		__proto__: BaseEvent.prototype,

		specifyListener: function (listener) {

			return function (details) {

				if (details.tabId == -1) {
					return;
				}

				var requestDetails = getRequestDetails(details);
				return listener(requestDetails);
			};
		},

		getOptExtraInfoSpec: function (urls) {
			return [urls ? {urls: urls} : {}, ["requestHeaders", "blocking"]];
		}
	};

	var checkLastError = function () {
		return chrome.runtime.lastError;
	};

	BrowserTab = function (tab) {
		this.id = tab.id;
		this.url = tab.url;
		this.active = tab.active;
		this.title = tab.title;
		this.windowId = tab.windowId;
	};
	BrowserTab.prototype = {
		close: function () {
			chrome.tabs.remove(this.id, checkLastError);
		},
		activate: function () {
			//activate tab
			chrome.tabs.update(this.id, {selected: true}, checkLastError);
			//focus window
			chrome.windows.update(this.windowId, {focused: true}, checkLastError);
		},
		sendMessage: function (message, responseCallback) {
			(chrome.tabs.sendMessage || chrome.tabs.sendRequest)(this.id, message, responseCallback);
		},
		reload: function (url) {
			if (url) {
				chrome.tabs.update(this.id, {url: url}, checkLastError);
			} else {
				chrome.tabs.reload(this.id, {}, checkLastError);
			}
		},
		executeScript: function (details, callback) {
			chrome.tabs.executeScript(this.id, details, function () {
				if (checkLastError()) {
					return;
				}
				callback();
			});
		},
		insertCSS: function (details, callback) {
			chrome.tabs.insertCSS(this.id, details, function () {
				if (checkLastError()) {
					return;
				}
				callback();
			});
		},
		equals: function (t) {
			return this.id == t.id;
		}
	};

	BrowserTabs = function (options) {
		this.tabsById = {};
		this.options = options;
		this._delete = this._delete.bind(this);
	};
	BrowserTabs.prototype = {
		get: function (tab) {
			return (this.tabsById[tab.id] || {}).value;
		},
		set: function (tab, value) {
			this.tabsById[tab.id] = {tab: tab, value: value};
		},
		has: function (tab) {
			return tab.id in this.tabsById;
		},
		clear: function () {
			for (var id in this.tabsById) {
				this._delete(this.tabsById[id].tab);
			}
		},
		collection: function () {
			var result = [];
			for (var id in this.tabsById) {
				result.push(this.tabsById[id].value);
			}
			return result;
		},
		remove: function (tab) {
			this._delete(tab);
		},
		_delete: function (tab) {
			delete this.tabsById[tab.id];
		}
	};

	BrowserWindow = function (win) {
		this.id = win.id;
		this.visible = win.state != "minimized";
	};
	BrowserWindow.prototype = {
		getAllTabs: function (callback) {
			chrome.tabs.query({
				windowId: this.id
			}, function (tabs) {
				callback(tabs.map(function (tab) {
					return new BrowserTab(tab);
				}));
			});
		},
		getActiveTab: function (callback) {
			var queryInfo = {
				windowId: this.id,
				active: true
			};
			chrome.tabs.query(queryInfo, function (tabs) {
				if (tabs && tabs.length > 0) {
					callback(new BrowserTab(tabs[0]));
				}
			});
		},
		openTab: function (url, background, callback) {
			var createProperties = {
				windowId: this.id,
				url: url,
				active: !background
			};
			chrome.tabs.create(createProperties, function (tab) {
				if (callback) {
					callback(new BrowserTab(tab));
				}
			});
		}
	};

	ext.app = {
		getDetails: chrome.app.getDetails
	};

	ext.windows = {
		getAll: function (callback) {
			chrome.windows.getAll(function (windows) {
				callback(windows.map(function (win) {
					return new BrowserWindow(win);
				}));
			});
		},
		getLastFocused: function (callback) {
			chrome.windows.getLastFocused(function (win) {
				callback(new BrowserWindow(win));
			});
		},
		getOrCreate: function (callback, isExtensionTab) {
			var isAppropriateWindow = function (wnd) {
				return wnd.type == "normal" && (!wnd.incognito || !isExtensionTab);
			};
			chrome.windows.getLastFocused(function (activeWnd) {
				//last focused window
				if (isAppropriateWindow(activeWnd)) {
					callback(new BrowserWindow(activeWnd));
					return;
				}
				//try to find appropriate window
				chrome.windows.getAll(function (windows) {
					for (var i = 0; i < windows.length; i++) {
						var wnd = windows[i];
						if (isAppropriateWindow(wnd)) {
							(function (wnd) {
								chrome.windows.update(wnd.id, {focused: true}, function () {
									if (checkLastError()) {
										return;
									}
									callback(new BrowserWindow(wnd));
								});
							})(wnd);
							return;
						}
					}
					//couldn't find window, create new
					chrome.windows.create({}, function (win) {
						callback(new BrowserWindow(win));
					});
				});
			});
		},
		onFocusChanged: {
			addListener: function (callback) {
				chrome.windows.onFocusChanged.addListener(function (windowId) {
					if (windowId != chrome.windows.WINDOW_ID_NONE) {
						callback();
					}
				});
			}
		},
		createPopup: function (url, callback) {
			chrome.windows.create({
				url: url,
				type: 'popup',
				width: 1100,
				height: 600
			}, function (win) {
				if (callback) {
					callback(new BrowserWindow(win));
				}
			});
		}
	};

	ext.tabs = {
		onCreated: new OnCreatedTabEvent(),
		onLoading: new OnLoadingTabEvent(),
		onUpdated: new OnUpdatedTabEvent(),
		onCompleted: new OnCompletedTabEvent(),
		onActivated: new OnActivatedTabEvent(),
		onRemoved: new OnRemovedTabEvent()
	};

	ext.webRequest = {
		onBeforeRequest: new OnBeforeRequestEvent(),
		handlerBehaviorChanged: chrome.webRequest.handlerBehaviorChanged,
		onCompleted: chrome.webRequest.onCompleted,
		onErrorOccurred: chrome.webRequest.onErrorOccurred,
		onHeadersReceived: new OnHeadersReceivedEvent(),
		onBeforeSendHeaders: new OnBeforeSendHeadersEvent()
	};

	ext.webNavigation = {
		onCreatedNavigationTarget: chrome.webNavigation.onCreatedNavigationTarget
	};

	//noinspection JSUnusedLocalSymbols
	ext.browserAction = {
		setBrowserAction: function (tab, icon, badge, badgeColor, title) {

			var tabId = tab.id;

			var onIconReady = function () {
				if (checkLastError()) {
					return;
				}
				chrome.tabs.get(tabId, function () {
					if (checkLastError()) {
						return;
					}
					chrome.browserAction.setBadgeText({tabId: tabId, text: badge});
					if (badge) {
						chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
					}
					//title setup via manifest.json file
					//chrome.browserAction.setTitle({tabId: tabId, title: title});
				});
			};

			chrome.browserAction.setIcon({tabId: tabId, path: icon}, onIconReady);
		}
	};

	ext.contextMenus = chrome.contextMenus;
})();