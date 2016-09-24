/* global adguard, UrlUtils */
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

adguard.tabsImpl = adguard.tabsImpl || (function () {

		'use strict';

		function noOpFunc() {
			throw new Error('Not implemented');
		}

		return {

			onCreated: noOpFunc,	// callback(tab)
			onRemoved: noOpFunc,	// callback(tabId)
			onUpdated: noOpFunc,	// callback(tab)
			onActivated: noOpFunc, 	// callback(tabId)

			create: noOpFunc,		// callback(tab)
			remove: noOpFunc,		// callback(tabId)
			activate: noOpFunc,		// callback(tabId)
			reload: noOpFunc,
			sendMessage: noOpFunc,
			getAll: noOpFunc,		// callback(tabs)
			getActive: noOpFunc		// callback(tabId)
		};

	})();

adguard.tabs = (function (tabsImpl) {

	'use strict';

	var AdguardTab = {
		tabId: 1,
		url: 'url',
		title: 'Title',
		incognito: false,
		status: null,   // 'loading' or 'complete'
		frames: null,   // Collection of frames inside tab
		metadata: null  // Contains info about integration, white list rule is applied to tab.
	};

	var AdguardTabFrame = {
		frameId: 1,
		url: 'url',
		domainName: 'domainName'
	};

	function noOpFunc() {
	}

	var tabs = Object.create(null);

	// --------- Events ---------

	var eventListeners = Object.create(null);

	function callEventListeners(eventName, arg) {
		var listeners = eventListeners[eventName];
		if (listeners) {
			for (var i = 0; i < listeners.length; i++) {
				listeners[i](arg);
			}
		}
	}

	function addEventListener(eventName, callback) {
		var listeners = eventListeners[eventName];
		if (listeners === undefined) {
			eventListeners[eventName] = listeners = [];
		}
		listeners.push(callback);
	}

	// Synchronize opened tabs
	tabsImpl.getAll(function (aTabs) {
		for (var i = 0; i < aTabs.length; i++) {
			var aTab = aTabs[i];
			tabs[aTab.tabId] = aTab;
		}
	});

	tabsImpl.onCreated(function (aTab) {
		tabs[aTab.tabId] = aTab;
		callEventListeners('create', aTab);
	});

	tabsImpl.onRemoved(function (tabId) {
		var tab = tabs[tabId];
		if (tab) {
			callEventListeners('remove', tab);
			delete tabs[tabId];
		}
	});

	tabsImpl.onUpdated(function (aTab) {
		var tab = tabs[aTab.tabId];
		if (tab) {
			tab.url = aTab.url;
			tab.title = aTab.title;
			tab.status = aTab.status;
			callEventListeners('update', tab);
		}
	});

	tabsImpl.onActivated(function (tabId) {
		var tab = tabs[tabId];
		if (tab) {
			callEventListeners('activate', tab);
		}
	});

	// Fired when a tab is created. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events to be notified when a URL is set.
	var onCreated = {
		addListener: function (callback) {
			addEventListener('create', callback);
		}
	};

	// Fired when a tab is closed.
	var onRemoved = {
		addListener: function (callback) {
			addEventListener('remove', callback);
		}
	};

	// Fired when a tab is updated.
	var onUpdated = {
		addListener: function (callback) {
			addEventListener('update', callback);
		}
	};

	// Fires when the active tab in a window changes.
	var onActivated = {
		addListener: function (callback) {
			addEventListener('activate', callback);
		}
	};

	// --------- Actions ---------

	// Creates a new tab.
	var create = function (details, callback) {
		tabsImpl.create(details, callback || noOpFunc);
	};

	// Closes tab.
	var remove = function (tabId, callback) {
		tabsImpl.remove(tabId, callback || noOpFunc);
	};

	// Activates tab (Also makes tab's window in focus).
	var activate = function (tabId, callback) {
		tabsImpl.activate(tabId, callback || noOpFunc);
	};

	// Reloads tab.
	var reload = function (tabId, url) {
		tabsImpl.reload(tabId, url);
	};

	// Sends message to tab
	var sendMessage = function (tabId, message, responseCallback) {
		tabsImpl.sendMessage(tabId, message, responseCallback);
	};

	// Gets all opened tabs
	var getAll = function (callback) {
		tabsImpl.getAll(function (aTabs) {
			var result = [];
			for (var i = 0; i < aTabs.length; i++) {
				var aTab = aTabs[i];
				var tab = tabs[aTab.tabId];
				if (!tab) {
					// Synchronize state
					tabs[aTab.tabId] = tab = aTab;
				}
				result.push(tab);
			}
			callback(result);
		});
	};

	// Gets active tab
	var getActive = function (callback) {
		tabsImpl.getActive(function (tabId) {
			var tab = tabs[tabId];
			if (tab) {
				callback(tab);
			}
		});
	};

	var isIncoginito = function (tabId) {
		var tab = tabs[tabId];
		return tab && tab.incognito === true;
	};

	// Records tab's frame
	var recordTabFrame = function (tabId, frameId, url) {
		var tab = tabs[tabId];
		if (tab) {
			if (!tab.frames) {
				tab.frames = Object.create(null);
			}
			tab.frames[frameId] = {
				url: url,
				domainName: UrlUtils.getDomainName(url)
			};
		}
	};

	var clearTabFrames = function (tabId) {
		var tab = tabs[tabId];
		if (tab) {
			tab.frames = null;
		}
	};

	// Gets tab's frame by id
	var getTabFrame = function (tabId, frameId) {
		var tab = tabs[tabId];
		if (tab && tab.frames) {
			return tab.frames[frameId || 0];
		}
		return null;
	};

	// Update tab metadata
	var updateTabMetadata = function (tabId, values) {
		var tab = tabs[tabId];
		if (tab) {
			if (!tab.metadata) {
				tab.metadata = Object.create(null);
			}
			for (var key in values) {
				if (values.hasOwnProperty && values.hasOwnProperty(key)) {
					tab.metadata[key] = values[key];
				}
			}
		}
	};

	// Gets tab metadata
	var getTabMetadata = function (tabId, key) {
		var tab = tabs[tabId];
		if (tab && tab.metadata) {
			return tab.metadata[key];
		}
		return null;
	};

	var clearTabMetadata = function (tabId) {
		var tab = tabs[tabId];
		if (tab) {
			tab.metadata = null;
		}
	};

	return {

		// Events
		onCreated: onCreated,
		onRemoved: onRemoved,
		onUpdated: onUpdated,
		onActivated: onActivated,

		// Actions
		create: create,
		remove: remove,
		activate: activate,
		reload: reload,
		sendMessage: sendMessage,
		getAll: getAll,
		getActive: getActive,
		isIncognito: isIncoginito,

		// Frames
		recordTabFrame: recordTabFrame,
		clearTabFrames: clearTabFrames,
		getTabFrame: getTabFrame,

		// Other
		updateTabMetadata: updateTabMetadata,
		getTabMetadata: getTabMetadata,
		clearTabMetadata: clearTabMetadata
	};

})(adguard.tabsImpl);
