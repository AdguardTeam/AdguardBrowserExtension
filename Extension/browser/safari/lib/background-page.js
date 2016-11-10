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

/* global safari, SafariBrowserTab, RequestTypes, Utils */

(function (global) {

	'use strict';

	var emptyListener = {
		addListener: function () {
			// Empty
		}
	};

	adguard.runtime = (function () {

		var onMessage = {

			addListener: function (callback) {

				adguard.runtimeImpl.onMessage.addListener(safari.application, function (event) {

					var safariTab = event.target;
					if (safariTab instanceof SafariBrowserTab) {

						var dispatcher = safariTab.page;
						var sender = {tab: adguard.tabsImpl.fromSafariTab(safariTab)};

						callback(event.message, sender, function (message) {
							dispatcher.dispatchMessage("response-" + event.name.substr(8), message);
						});
					}
				});
			}
		};

		return {
			onMessage: onMessage
		};

	})();

	// Web Request Blocking implementation
	function getRequestDetails(message, safariTab) {

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

		var tab = adguard.tabsImpl.fromSafariTab(safariTab);
		return {
			requestUrl: message.url,                //request url
			requestType: requestType,               //request type
			frameId: message.frameId,               //id of this frame (only for main_frame and sub_frame types)
			requestFrameId: message.requestFrameId, //id of frame where request is executed
			tab: tab 								//request tab
		};
	}

	// Extension API for background page
	var ext = global.ext = {};

	ext.webRequest = {

		onBeforeRequest: {

			requestListeners: [],

			processMessage: function (message, safariTab) {

				var requestDetails = getRequestDetails(message, safariTab);

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

			processMessage: function (message, safariTab) {

				var requestDetails = getRequestDetails(message, safariTab);

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
		if (event.name !== "canLoad") {
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
				// checking useOldSafariAPI setting
				event.message = Utils.isContentBlockerEnabled();
				return;
		}
		event.message = messageHandler.processMessage(event.message.data, event.target);
	}, true);

	ext.getURL = function (path) {
		return safari.extension.baseURI + path;
	};

	window.i18n = ext.i18n = adguard.i18n;

	ext.app = {
		/**
		 * Extension ID
		 */
		getId: function () {
			return 'not supported by Safari';
		},

		/**
		 * Extension URL scheme
		 */
		getUrlScheme: function () {
			return 'not supported by Safari';
		},

		/**
		 * Extension version
		 */
		getVersion: function () {
			return safari.extension.bundleVersion;
		},

		/**
		 * Extension UI locale
		 */
		getLocale: function () {
			return ext.i18n.getUILanguage();
		}
	};

	ext.backgroundPage = {
		getWindow: function () {
			return safari.extension.globalPage.contentWindow;
		}
	};

	ext.webNavigation = {
		onCreatedNavigationTarget: emptyListener
	};


	/* Browser actions */
	ext.browserAction = (function () {

		function setBrowserAction(safariTab, name, value) {
			var activeTab = safari.application.activeBrowserWindow.activeTab;
			var items = safari.extension.toolbarItems;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item.identifier === "AdguardOpenOptions" && safariTab === activeTab) {
					item[name] = value;
				}
			}
		}

		return {
			setBrowserAction: function (tab, icon, badge, badgeColor, title) {
				var safariTab = adguard.tabsImpl.toSafariTab(tab);
				if (safariTab) {
					//set title
					setBrowserAction(safariTab, "label", title);
					setBrowserAction(safariTab, "toolTip", title);
					//set badge
					setBrowserAction(safariTab, "badge", badge);
				}
			}
		};

	})();

	ext.contextMenus = {
		removeAll: function () {
			// Empty
		},
		create: function () {
			// Empty
		}
	};

})(window);
