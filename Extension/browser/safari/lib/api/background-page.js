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

/* global safari, SafariBrowserTab */

(function (adguard) {

	'use strict';

	var emptyListener = {
		addListener: function () {
			// Empty
		}
	};

	adguard.runtime = (function (adguard) {

		var onMessage = {

			addListener: function (callback) {

				adguard.runtimeImpl.onMessage.addListener(safari.application, function (event) {

					var safariTab = event.target;
					if (safariTab instanceof SafariBrowserTab) {

						var dispatcher = safariTab.page;
						var sender = {tab: adguard.tabsImpl.fromSafariTab(safariTab)};

						var sendResponse = function (message) {
							dispatcher.dispatchMessage("response-" + event.name.substr(8), message);
                        };
                        var response = callback(event.message, sender, sendResponse);
						var async = response === true;
						// If async sendResponse will be invoked later
						if (!async) {
							sendResponse(response);
						}
					}
				});
			}
		};

		return {
			onMessage: onMessage
		};

	})(adguard);

	// Web Request Blocking implementation
	function getRequestDetails(message, safariTab) {

		var requestType;
		switch (message.type) {
			case "main_frame":
				requestType = adguard.RequestTypes.DOCUMENT;
				break;
			case "sub_frame":
				requestType = adguard.RequestTypes.SUBDOCUMENT;
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
	adguard.webRequest = {

		onBeforeRequest: {

			requestListeners: [],

			processMessage: function (message, safariTab) {

				var requestDetails = getRequestDetails(message, safariTab);

				for (var i = 0; i < this.requestListeners.length; i++) {

					var requestListener = this.requestListeners[i];

					var response = requestListener(requestDetails);
					if (response && (response.cancel || response.redirectUrl)) {
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
				messageHandler = adguard.webRequest.onBeforeRequest;
				break;
			case "safariHeadersRequest":
				messageHandler = adguard.webRequest.onHeadersReceived;
				break;
			case "useContentBlockerAPI":
				// checking useOldSafariAPI setting
				event.message = adguard.utils.browser.isContentBlockerEnabled();
				return;
		}
		event.message = messageHandler.processMessage(event.message.data, event.target);
	}, true);

	adguard.getURL = function (path) {
		return safari.extension.baseURI + path;
	};

    /**
	 * Parses bundleId from baseURI
	 * safari-extension://com.adguard.safaridev-N33TQXN8C7
     */
    var bundleId = (function () {
        var uri = safari.extension.baseURI;
        var prefix = 'safari-extension://';
        var index1 = uri.indexOf(prefix);
        if (index1 < 0) {
            return safari.extension.baseURI;
        }
        uri = uri.substring(index1 + prefix.length);
        var index2 = uri.indexOf('-');
        if (index2 < 0) {
            return safari.extension.baseURI;
        }
        return uri.substring(0, index2);
    })();

	adguard.app = {
		/**
		 * Extension ID
		 */
		getId: function () {
			return bundleId;
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
			return adguard.i18n.getUILanguage();
		}
	};

	adguard.backgroundPage = {
		getWindow: function () {
			return safari.extension.globalPage.contentWindow;
		}
	};

	adguard.webNavigation = {
		onCreatedNavigationTarget: emptyListener,
		onCommitted: emptyListener
	};


	/* Browser actions */
	adguard.browserAction = (function (adguard) {

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
			},
			setPopup: function () {
				// Do nothing. Popup is already installed in manifest file
			},
            resize: function () {
                // Do nothing
            },
            close: function () {
                // Do nothing
            }
		};

	})(adguard);

	adguard.contextMenus = {
		removeAll: function () {
			// Empty
		},
		create: function () {
			// Empty
		}
	};

	// Adds content scripts for welcome.adguard.com/v2/thankyou.html
    var domains = ['http://*.adguard.com/*/thankyou.html', 'https://*.adguard.com/*/thankyou.html'];
    safari.extension.addContentScriptFromURL(adguard.getURL("lib/libs/jquery-2.2.4.min.js"), domains, [], false);
    safari.extension.addContentScriptFromURL(adguard.getURL("lib/pages/thankyou.js"), domains, [], false);

})(adguard);
