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

	if (window.top == window) {
		safari.self.tab.dispatchMessage("loading", document.location.href);
	}

	////Background page proxy for Safari implementation

	var SafariProxy = {

		objects: [],
		callbacks: [],

		send: function (message) {
			var evt = document.createEvent("Event");
			evt.initEvent("beforeload");
			return safari.self.tab.canLoad(evt, {type: "safariProxy", data: message});
		},

		deserializeResult: function (result) {
			this.checkResponse(result);
			return this.deserialize(result.result);
		},

		serialize: function (obj, memo) {

			var objectId = this.objects.indexOf(obj);
			if (objectId >= 0) {
				return {type: "lookupSavedObject", objectId: objectId};
			}

			if (typeof obj == "function") {

				var callbackId = this.callbacks.indexOf(obj);

				if (callbackId < 0) {
					callbackId = this.callbacks.push(obj) - 1;
					safari.self.addEventListener("message", function (event) {
						if (event.name != "safariProxyCallback") {
							return;
						}
						if (event.message.callbackId == callbackId) {
							var context = this.getObject(event.message.contextId);
							var args = this.deserializeSequence(event.message.args);
							obj.apply(context, args);
						}
					}.bind(this));
				}

				return {type: "callback", callbackId: callbackId};
			}

			if (typeof obj == "object" && obj != null && obj.constructor != Date && obj.constructor != RegExp) {

				memo = memo || {specs: [], objects: []};

				var index = memo.objects.indexOf(obj);
				if (index > 0) {
					return memo.specs[index];
				}

				var spec = {};
				memo.specs.push(spec);
				memo.objects.push(obj);

				if (obj.constructor == Array) {
					spec.type = "array";
					spec.items = [];

					for (var i = 0; i < obj.length; i++) {
						spec.items.push(this.serialize(obj[i], memo));
					}
				} else {

					spec.type = "object";
					spec.properties = {};

					for (var k in obj) {
						spec.properties[k] = this.serialize(obj[k], memo);
					}
				}

				return spec;
			}

			return {type: "value", value: obj};
		},

		deserializeSequence: function (specs, array, memo) {

			array = array || [];
			memo = memo || {specs: [], arrays: []};

			for (var i = 0; i < specs.length; i++) {
				array.push(this.deserialize(specs[i], memo));
			}
			return array;
		},

		deserialize: function (spec, memo) {
			switch (spec.type) {
				case "value":
					return spec.value;
				case "object":
					return this.getObject(spec.objectId);
				case "array":

					memo = memo || {specs: [], arrays: []};

					var index = memo.specs.indexOf(spec);
					if (index >= 0) {
						return memo.arrays[index];
					}

					var array = [];
					memo.specs.push(spec);
					memo.arrays.push(array);

					return this.deserializeSequence(spec.items, array, memo);
			}
		},

		getObjectId: function (obj) {
			return this.objects.indexOf(obj);
		},

		getProperty: function (objectId, property) {
			var result = this.send({
				type: "getProperty",
				objectId: objectId,
				property: property
			});
			return this.deserializeResult(result);
		},

		createProperty: function (property, enumerable) {
			var self = this;
			return {
				get: function () {
					return self.getProperty(self.getObjectId(this), property);
				},
				set: function (value) {
					var result = self.send({
						type: "setProperty",
						objectId: self.getObjectId(this),
						property: property,
						value: self.serialize(value)
					});
					self.checkResponse(result);
				},
				enumerable: enumerable,
				configurable: true
			};
		},

		createFunction: function (objectId) {
			var self = this;
			return function () {
				var args = Array.prototype.slice.call(arguments);
				var result = self.send({
					type: "callFunction",
					functionId: objectId,
					contextId: self.getObjectId(this),
					args: args.map(function (arg) {
						return self.serialize(arg);
					})
				});
				return self.deserializeResult(result);
			};
		},

		checkResponse: function (result) {
			if (!result.successResponse) {
				throw result.errorResponse;
			}
		},

		getObject: function (objectId) {

			var lookupResult = this.send({
				type: "lookupObject",
				objectId: objectId
			});

			var obj = this.objects[objectId];
			if (obj) {
				Object.getOwnPropertyNames(obj).forEach(function (prop) {
					delete obj[prop];
				});
			} else {
				obj = lookupResult.isFunction ? this.createFunction(objectId) : {};
				this.objects[objectId] = obj;
			}

			var skipped = [];
			if ("prototypeType" in lookupResult) {

				var prototype = window[lookupResult.prototypeType].prototype;

				skipped = Object.getOwnPropertyNames(prototype);
				skipped.splice(skipped.indexOf("constructor"), 1);

				obj.__proto__ = prototype;

			} else {

				if (lookupResult.isFunction) {
					skipped = Object.getOwnPropertyNames(function () {
					});
				} else {
					skipped = [];
				}
				if ("prototypeId" in lookupResult) {
					obj.__proto__ = this.getObject(lookupResult.prototypeId);
				} else {
					obj.__proto__ = null;
				}
			}

			for (var property in lookupResult.properties) {
				if (skipped.indexOf(property) < 0) {
					var desc = this.createProperty(property, lookupResult.properties[property].enumerable);
					Object.defineProperty(obj, property, desc);
				}
			}
			if (lookupResult.isFunction) {
				obj.prototype = this.getProperty(objectId, "prototype");
			}
			return obj;
		}
	};

	//Content script API implementation

	ext.backgroundPage = {

		_eventTarget: safari.self,
		_messageDispatcher: safari.self.tab,

		sendMessage: sendMessage,

		getWindow: function () {
			return SafariProxy.getObject(0);
		}
	};

	ext.onMessage = new OnMessageEvent(safari.self);

	if (window.top === window) {

		function createMainFrameEvent(type) {
			var data = {
				url: document.location.href,
				type: "main_frame",
				frameId: 0
			};
			var evt = document.createEvent("Event");
			evt.initEvent("beforeload");
			safari.self.tab.canLoad(evt, {type: type, data: data});
		}

		createMainFrameEvent("safariWebRequest");
		createMainFrameEvent("safariHeadersRequest");
	}

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

})();
