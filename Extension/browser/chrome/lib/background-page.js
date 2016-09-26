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

/* global chrome, adguard, Prefs, Log, RequestTypes, Utils */

var ext;
var browser = browser || chrome;

(function () {

	'use strict';

	adguard.runtime = (function () {

		var onMessage = {
			addListener: function (callback) {
				// https://developer.chrome.com/extensions/runtime#event-onMessage
				adguard.runtimeImpl.onMessage.addListener(function (message, sender, sendResponse) {
					var senderOverride = Object.create(null);
					if (sender.tab) {
						senderOverride.tab = adguard.tabsImpl.fromChromeTab(sender.tab);
					}
					// Don't forget return callback result for asynchronous message passing
					return callback(message, senderOverride, sendResponse);
				});
			}
		};

		return {
			onMessage: onMessage
		};
	})();

	var linkHelper = document.createElement('a');

	/**
	 * Fixing request type:
	 * https://code.google.com/p/chromium/issues/detail?id=410382
	 *
	 * @param url Request url
	 * @returns String Fixed object type
	 */
	function parseRequestTypeFromUrl(url) {
		linkHelper.href = url;
		var path = linkHelper.pathname;
		var requestType = Utils.parseContentTypeFromUrlPath(path);
		if (requestType === null) {
			// https://code.google.com/p/chromium/issues/detail?id=410382
			requestType = RequestTypes.OBJECT;
		}
		return requestType;
	}

	function getRequestDetails(details) {

		var tab = {tabId: details.tabId};

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
				requestType = RequestTypes.DOCUMENT;
				break;
			case "sub_frame":
				frameId = details.frameId;
				requestFrameId = details.parentFrameId; //for sub_frame use parentFrameId as id of frame that wraps this frame
				requestType = RequestTypes.SUBDOCUMENT;
				break;
			default:
				requestFrameId = details.frameId;
				requestType = details.type.toUpperCase();
				break;
		}

		//relate request to main_frame
		if (requestFrameId === -1) {
			requestFrameId = 0;
		}

		if (requestType === RequestTypes.OTHER) {
			requestType = parseRequestTypeFromUrl(details.url);
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

	var onBeforeRequest = {

		addListener: function (callback, urls) {

			// https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
			browser.webRequest.onBeforeRequest.addListener(function (details) {

				if (details.tabId === -1) {
					return;
				}

				var requestDetails = getRequestDetails(details);
				var skip = callback(requestDetails);
				return {
					cancel: skip === false
				};

			}, urls ? {urls: urls} : {}, ["blocking"]);
		}
	};

	var onHeadersReceived = {

		addListener: function (callback, urls) {

			browser.webRequest.onHeadersReceived.addListener(function (details) {

				if (details.tabId === -1) {
					return;
				}

				var requestDetails = getRequestDetails(details);
				return callback(requestDetails);

			}, urls ? {urls: urls} : {}, ["responseHeaders", "blocking"]);
		}
	};

	var onBeforeSendHeaders = {

		addListener: function (callback, urls) {

			browser.webRequest.onBeforeSendHeaders.addListener(function (details) {

				if (details.tabId === -1) {
					return;
				}

				var requestDetails = getRequestDetails(details);
				return callback(requestDetails);

			}, urls ? {urls: urls} : {}, ["requestHeaders", "blocking"]);
		}
	};

	/**
	 * Common API for all platforms
	 */
	ext = {};
	/**
	 * Gets URL of a file that belongs to our extension
	 */
	ext.getURL = browser.extension.getURL;

	ext.i18n = browser.i18n;

	ext.backgroundPage = {};
	ext.backgroundPage.getWindow = function () {
		return browser.extension.getBackgroundPage();
	};

	ext.app = {

		/**
		 * Extension ID
		 */
		getId: function () {
			return browser.runtime.id;
		},

		/**
		 * Gets extension scheme
		 * @returns "chrome-extension" for Chrome," ms-browser-extension" for Edge
		 */
		getUrlScheme: function () {
			var url = ext.getURL('test.html');
			var index = url.indexOf('://');
			return url.substring(0, index);
		},

		/**
		 * Extension version
		 */
		getVersion: function () {
			return browser.runtime.getManifest().version;
		},

		/**
		 * Extension UI locale
		 */
		getLocale: function () {
			return browser.i18n.getUILanguage();
		}
	};

	ext.webRequest = {
		onBeforeRequest: onBeforeRequest,
		handlerBehaviorChanged: browser.webRequest.handlerBehaviorChanged,
		onCompleted: browser.webRequest.onCompleted,
		onErrorOccurred: browser.webRequest.onErrorOccurred,
		onHeadersReceived: onHeadersReceived,
		onBeforeSendHeaders: onBeforeSendHeaders
	};

	var onCreatedNavigationTarget = {

		addListener: function (callback) {

			browser.webNavigation.onCreatedNavigationTarget.addListener(function (details) {

				if (details.tabId === -1) {
					return;
				}

				callback({
					tabId: details.tabId,
					sourceTabId: details.sourceTabId,
					url: details.url
				});
			});
		}
	};

	ext.webNavigation = {
		onCreatedNavigationTarget: onCreatedNavigationTarget
	};

	//noinspection JSUnusedLocalSymbols
	ext.browserAction = {
		setBrowserAction: function (tab, icon, badge, badgeColor, title) {

			var tabId = tab.tabId;

			var onIconReady = function () {
				if (browser.runtime.lastError) {
					return;
				}
				browser.browserAction.setBadgeText({tabId: tabId, text: badge});

				if (browser.runtime.lastError) {
					return;
				}
				if (badge) {
					browser.browserAction.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
				}

				//title setup via manifest.json file
				//chrome.browserAction.setTitle({tabId: tabId, title: title});
			};

			/**
			 * Workaround for MS Edge.
			 * For some reason Edge changes the inner state of the "icon" object and adds a tabId property inside.
			 */
			delete icon.tabId;

			if (browser.runtime.lastError) {
				return;
			}

			browser.browserAction.setIcon({tabId: tabId, path: icon}, onIconReady);
		}
	};

	ext.contextMenus = browser.contextMenus;

})();