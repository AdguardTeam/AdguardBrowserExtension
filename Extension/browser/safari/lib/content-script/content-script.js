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

(function () {

	var isSafariNew = function () {
		var parseSafariVersion = function () {
			var userAgent = navigator.userAgent;
			var i = userAgent.indexOf("Version/");
			if (i == 0) return "";

			var end = userAgent.indexOf(" ", i);
			return userAgent.substring(i + 8, end > 0 ? end : userAgent.length);
		};

		var isGreaterOrEqualsVersion = function (leftVersion, rightVersion) {
			var Version = function (version) {

				this.version = Object.create(null);

				var parts = (version || "").split(".");

				function parseVersionPart(part) {
					if (isNaN(part)) {
						return 0;
					}
					return Math.max(part - 0, 0);
				}

				for (var i = 3; i >= 0; i--) {
					this.version[i] = parseVersionPart(parts[i]);
				}
			};

			Version.prototype.compare = function (o) {
				for (var i = 0; i < 4; i++) {
					if (this.version[i] > o.version[i]) {
						return 1;
					} else if (this.version[i] < o.version[i]) {
						return -1;
					}
				}
				return 0;
			};

			var left = new Version(leftVersion);
			var right = new Version(rightVersion);
			return left.compare(right) >= 0;
		};

		var version = parseSafariVersion();
		return isGreaterOrEqualsVersion(version, "9.0");
	};
	var isContentBlockerEnabled = isSafariNew();

	if (window.top === window) {

		safari.self.tab.dispatchMessage("loading", document.location.href);

		function createMainFrameEvent(type) {
			var data = {
				url: document.location.href,
				type: "main_frame",
				frameId: 0
			};

			if (isContentBlockerEnabled) {
				safari.self.tab.dispatchMessage('canLoad', {
					type: type,
					data: data
				});
			} else {
				var evt = document.createEvent("Event");
				evt.initEvent("beforeload");
				safari.self.tab.canLoad(evt, {type: type, data: data});
			}

		};

		createMainFrameEvent("safariWebRequest");
		createMainFrameEvent("safariHeadersRequest");
	}

	if (!isContentBlockerEnabled) {

		var contentScriptId = Date.now() + Math.random().toString(10).slice(2);

		var absoluteUrlHelper = document.createElement("a");

		var onFirstLoadOccurred = false;

		var execTmpScript = function () {
			var tmpJS = document.createElement("script");
			tmpJS.textContent = '(function () {\
									var block = function (url, type) {\
										var event = new CustomEvent("' + contentScriptId + '", {\
											detail: {\
												url: url,\
												type: type\
											},\
											bubbles: false\
										});\
										document.dispatchEvent(event);\
										return event.detail.url === false;\
									};\
									var _emptyFunc = function () {\
									};\
									var xmlHttpRequestOpen = XMLHttpRequest.prototype.open;\
									XMLHttpRequest.prototype.open = function (method, url) {\
										if (block(url, "xmlhttprequest")) {\
											return {send: _emptyFunc}\
										} else {\
											return xmlHttpRequestOpen.apply(this, arguments);\
										}\
									}\
								})();';
			document.documentElement.removeChild(document.documentElement.appendChild(tmpJS));
		};

		var canLoadRequest = function (url, type, frameId) {
			return safari.self.tab.canLoad(event, {
				type: "safariWebRequest", data: {
					url: url,
					type: type,
					frameId: frameId,
					requestFrameId: 0
				}
			});
		};

		var onBeforeLoad = function (event) {

			if (!onFirstLoadOccurred) {
				onFirstLoad();
			}

			absoluteUrlHelper.href = event.url;
			var url = absoluteUrlHelper.href;

			if (!/^https?:/.test(url)) {
				return;
			}

			var type;
			switch (event.target.localName) {
				case "link":
					if (/(^|\s)stylesheet($|\s)/i.test(event.target.rel)) {
						type = "stylesheet";
						break;
					}
				case "img":
					type = "image";
					break;
				case "frame":
				case "iframe":
					type = "sub_frame";
					break;
				case "object":
				case "embed":
					type = "object";
					break;
				case "script":
					type = "script";
					break;
				default:
					type = "other";
					break;
			}

			var frameId;
			if (type == "sub_frame") {
				frameId = Math.random();
			}

			if (!canLoadRequest(url, type, frameId)) {

				event.preventDefault();

				if (type != "sub_frame") {
					setTimeout(function () {
						var evt = document.createEvent("Event");
						evt.initEvent("error");
						event.target.dispatchEvent(evt);
					}, 0);
				}
			}

		};
		document.addEventListener("beforeload", onBeforeLoad, true);

		var onFirstLoad = function () {
			document.removeEventListener("DOMContentLoaded", onFirstLoad, true);
			onFirstLoadOccurred = true;
			document.addEventListener(contentScriptId, function (e) {
				absoluteUrlHelper.href = e.detail.url;
				if (!canLoadRequest(absoluteUrlHelper.href, e.detail.type)) {
					e.detail.url = false;
				}
			});
			execTmpScript();
		};
		document.addEventListener("DOMContentLoaded", onFirstLoad, true);
	}

})();

//Content script API implementation
var contentPage = {
	_eventTarget: safari.self,
	_messageDispatcher: safari.self.tab,
	sendMessage: SendMessageFunction,
	onMessage: new OnMessageEvent(safari.self)
};

var i18n = new I18NSupport();