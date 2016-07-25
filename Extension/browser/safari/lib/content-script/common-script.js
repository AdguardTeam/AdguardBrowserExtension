/* global SafariBrowserTab */
/* global BrowserTab */
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
var BaseEvent, OnMessageEvent, SendMessageFunction, I18NSupport;

(function () {

	// Safari variable may be undefined in a frame
	(function () {
		if (typeof safari === "undefined" && typeof chrome === "undefined") {
			var w = window;
			while (w.safari === undefined && w !== window.top) {
				w = w.parent;
			}
			window.safari = w.safari;
		}
	})();

	// Event implementation
	BaseEvent = function (target, eventName, capture) {

		this.eventListeners = [];
		this.specialEventListeners = [];

		this.eventTarget = target;
		this.eventName = eventName;
		this.eventCapture = capture;
	};
	BaseEvent.prototype = {

		addListener: function (listener) {

			var specialListener = this.specifyListener(listener);
			this.eventListeners.push(listener);
			this.specialEventListeners.push(specialListener);

			this.eventTarget.addEventListener(this.eventName, specialListener, this.eventCapture);
		},

		removeListener: function (listener) {
			var index = this.eventListeners.indexOf(listener);
			if (index >= 0) {
				this.eventTarget.removeEventListener(this.eventName, this.specialEventListeners[index], this.eventCapture);
				this.eventListeners.splice(index, 1);
				this.specialEventListeners.splice(index, 1);
			}
		}
	};

	// OnMessage event implementation
	OnMessageEvent = function (target) {
		BaseEvent.call(this, target, "message", false);
	};

	Object.setPrototypeOf(OnMessageEvent.prototype, BaseEvent.prototype);
	OnMessageEvent.prototype.specifyListener = function (listener) {
		return function (event) {

			if (event.name.indexOf("request-") != 0) {
				return;
			}

			var sender = {};
			var dispatcher;

			if ("BrowserTab" in window && "SafariBrowserTab" in window &&
					event.target instanceof SafariBrowserTab) {

				dispatcher = event.target.page;
				sender.tab = new BrowserTab(event.target);
			} else {
				dispatcher = event.target.tab;
				sender.tab = null;
			}

			listener(event.message, sender, function (message) {
				dispatcher.dispatchMessage("response-" + event.name.substr(8), message);
			});
		};
	};


	// Messaging implementation
	var nextRequestNumber = 0;

	SendMessageFunction = function (message, responseCallback) {
		var requestId = ++nextRequestNumber;
		if (responseCallback) {
			var eventTarget = this._eventTarget;
			var responseListener = function (event) {
				if (event.name == "response-" + requestId) {
					eventTarget.removeEventListener("message", responseListener, false);
					responseCallback(event.message);
				}
			};
			eventTarget.addEventListener("message", responseListener, false);
		}
		this._messageDispatcher.dispatchMessage("request-" + requestId, message);
	};

	// I18n implementation
	var I18n = function () {
		this._uiLocale = this._getLocale();
		this._messages = null;
		this._defaultMessages = null;
	};

	I18n.prototype = {

		defaultLocale: 'en',

		supportedLocales: ['ru', 'en', 'tr', 'uk', 'de', 'pl', 'pt_BR', 'pt_PT', 'ko', 'zh_CN', 'sr', 'fr', 'sk', 'hy', 'es', 'es_419', 'it', 'id'],

		_getLocale: function () {
			var prefix = navigator.language;
			var parts = prefix.replace('-', '_').split('_');
			var locale = parts[0].toLowerCase();
			if (parts[1]) {
				locale += '_' + parts[1].toUpperCase();
			}
			if (this.supportedLocales.indexOf(locale) < 0) {
				locale = parts[0];
			}
			if (this.supportedLocales.indexOf(locale) < 0) {
				locale = "en";
			}
			return locale;
		},

		_getMessages: function (locale) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", this._getMessageFile(locale), false);
			try {
				xhr.send();
			} catch (e) {
				return Object.create(null);
			}
			return JSON.parse(xhr.responseText);
		},

		_getMessageFile: function (locale) {
			return safari.extension.baseURI + "_locales/" + locale + "/messages.json";
		},

		getMessage: function (msgId, substitutions) {

			if (msgId == "@@ui_locale") {
				return this.getUILanguage();
			}

			if (!this._messages) {
				this._messages = this._getMessages(this._uiLocale);
				if (this._uiLocale == this.defaultLocale) {
					this._defaultMessages = this._messages;
				}
			}

			// Load messages for default locale
			if (!this._defaultMessages) {
				this._defaultMessages = this._getMessages(this.defaultLocale);
			}

			return this._getI18nMessage(msgId, substitutions);
		},
		
		getUILanguage: function() {
			return this._uiLocale;
		},

		_getI18nMessage: function (msgId, substitutions) {

			var msg = this._messages[msgId] || this._defaultMessages[msgId];
			if (!msg) {
				return "";
			}

			var msgstr = msg.message;
			if (!msgstr) {
				return "";
			}

			if (substitutions && substitutions.length > 0) {
				msgstr = msgstr.replace(/\$(\d+)/g, function (match, number) {
					return typeof substitutions[number - 1] != "undefined" ? substitutions[number - 1] : match;
				});
			}
			return msgstr;
		}
	};

	I18NSupport = I18n;
})();
