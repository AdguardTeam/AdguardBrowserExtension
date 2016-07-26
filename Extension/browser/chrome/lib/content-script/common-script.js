/* global BrowserTab, chrome, browser */
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
var BaseEvent, OnMessageEvent, SendMessageFunction;

(function () {

	function detectExtensionOnMessage() {
		if (typeof browser != 'undefined' && browser.runtime && browser.runtime.onMessage) {
			// Edge, Firefox WebExtensions
			return browser.runtime.onMessage;
		} if (chrome.runtime && chrome.runtime.onMessage) {
			// Chromium
			return chrome.runtime.onMessage;
		} else if (chrome.extension.onMessage) {
			// Old Chromium
			return chrome.extension.onMessage;
		} else {
			// Old Chromium
			return chrome.extension.onRequest;
		}
	}

	function detectExtensionSendMessage() {
		if (typeof browser != 'undefined' && browser.runtime && browser.runtime.sendMessage) {
			// Edge, Firefox WebExtensions
			return browser.runtime.sendMessage;
		} if (chrome.runtime && chrome.runtime.sendMessage) {
			// Chromium
			return chrome.runtime.sendMessage;
		} else if (chrome.extension.sendMessage) {
			// Old Chromium
			return chrome.extension.sendMessage;
		} else {
			// Old Chromium
			return chrome.extension.sendRequest;
		}
	}

	BaseEvent = function (target) {
		this.eventTarget = target;
		this.eventListeners = [];
		this.specialEventListeners = [];
	};

	BaseEvent.prototype = {

		addListener: function (listener) {

			var specialListener = this.specifyListener(listener);
			this.eventListeners.push(listener);
			this.specialEventListeners.push(specialListener);

			var extraInfoSpec = Array.prototype.slice.call(arguments, 1);
			extraInfoSpec = this.getOptExtraInfoSpec.apply(this, extraInfoSpec);

			var args = [specialListener].concat(extraInfoSpec || []);
			this.eventTarget.addListener.apply(this.eventTarget, args);
		},

		removeListener: function (listener) {
			var index = this.eventListeners.indexOf(listener);
			if (index > 0) {
				this.eventTarget.removeListener(this.specialEventListeners[index]);
				this.eventListeners.splice(index, 1);
				this.specialEventListeners.splice(index, 1);
			}
		},

		getOptExtraInfoSpec: function () {
			return [];
		}
	};

	OnMessageEvent = function () {
		BaseEvent.call(this, detectExtensionOnMessage());
	};

    LanguageUtils.inherit(OnMessageEvent, BaseEvent);
	OnMessageEvent.prototype.specifyListener = function (listener) {
        return function (message, sender, sendResponse) {
            if ("BrowserTab" in window && sender.tab && sender.tab.id >= 0) {
                sender.tab = new BrowserTab(sender.tab);
            }
            return listener(message, sender, sendResponse);
        };
	};

	SendMessageFunction = detectExtensionSendMessage();
})();