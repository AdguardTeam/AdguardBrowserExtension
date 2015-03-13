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
var PreloadHelper = {

	requestTypeMap: {
		"img": "IMAGE",
		"input": "IMAGE",
		"audio": "OBJECT",
		"video": "OBJECT",
		"object": "OBJECT",
		"frame": "SUBDOCUMENT",
		"iframe": "SUBDOCUMENT"
	},

	init: function () {

		if (!document.documentElement) {
			setTimeout(PreloadHelper.init, 0);
			return;
		}

		if (!(document.documentElement instanceof HTMLElement)) {
			return;
		}
		if (window !== window.top) {
			var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
			var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
			if ((height * width) < 100000) {//near 240*400 px
				return;
			}
		}

		this._initCollapse();
		this.tryLoadCssAndScripts();
	},

	tryLoadCssAndScripts: function () {
		ext.backgroundPage.sendMessage(
			{
				type: 'get-selectors-and-scripts',
				documentUrl: window.location.href
			},
			this.processCssAndScriptsResponse.bind(this)
		)
	},

	processCssAndScriptsResponse: function (response) {
		if (!response || response.requestFilterReady === false) {
			//wait for request filter ready on browser startup
			setTimeout(this.tryLoadCssAndScripts.bind(this), 100);
		} else {
			this._applySelectors(response.selectors);
			this._applyScripts(response.scripts);
		}
	},

	_applySelectors: function (selectors) {
		if (!selectors || selectors.length == 0) {
			return;
		}

		function setSelectors(element, cssSelectors) {
			if (!element.sheet) {
				window.setTimeout(function () {
					setSelectors(element, cssSelectors);
				}, 0);
				return;
			}
			element.textContent = cssSelectors;
		}

		for (var i = 0; i < selectors.length; i++) {
			var styleEl = document.createElement("style");
			styleEl.setAttribute("type", "text/css");
			(document.head || document.documentElement).appendChild(styleEl);
			setSelectors(styleEl, selectors[i]);
		}
	},

	_applyScripts: function (scripts) {

		if (!scripts || scripts.length == 0) {
			return;
		}

		var script = document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.textContent = scripts.join("\r\n");
		(document.head || document.documentElement).appendChild(script);
	},

	_initCollapse: function () {

		this.collapseRequests = Object.create(null);
		this.collapseRequestId = 1;

		document.addEventListener("error", this._checkShouldCollapse.bind(this), true);
		document.addEventListener("load", this._checkShouldCollapse.bind(this), true);
	},

	_checkShouldCollapse: function (event) {

		var element = event.target;
		var eventType = event.type;

		var tagName = element.tagName.toLowerCase();

		var requestType = PreloadHelper.requestTypeMap[tagName];
		if (!requestType) {
			return;
		}

		var expectedEventType = (tagName == "iframe" || tagName == "frame") ? "load" : "error";
		if (eventType != expectedEventType) {
			return;
		}

		var elementUrl = element.src || element.data;
		if (!elementUrl || elementUrl.indexOf('http') != 0) {
			return;
		}

		var requestId = this.collapseRequestId++;
		this.collapseRequests[requestId] = {
			element: element,
			tagName: tagName
		};

		ext.backgroundPage.sendMessage({
				type: 'process-should-collapse',
				elementUrl: elementUrl,
				documentUrl: document.URL,
				requestType: requestType,
				requestId: requestId
			},
			this._onCheckCollapseResponse.bind(this)
		)
	},

	_onCheckCollapseResponse: function (response) {

		if (!response) {
			return
		}

		var collapseRequest = this.collapseRequests[response.requestId];
		if (!collapseRequest) {
			return;
		}
		delete this.collapseRequests[response.requestId];

		if (response.collapse !== true) {
			return;
		}

		var cssProperty = "display";
		var cssValue = "none";
		var cssPriority = "important";

		var element = collapseRequest.element;
		var elementStyle = element.style;
		var tagName = collapseRequest.tagName;

		if (tagName == "frame") {
			cssProperty = "visibility";
			cssValue = "hidden";
		}

		var elCssValue = elementStyle.getPropertyValue(cssProperty);
		var elCssPriority = elementStyle.getPropertyPriority(cssProperty);
		if (elCssValue != cssValue || elCssPriority != cssPriority) {
			elementStyle.setProperty(cssProperty, cssValue, cssPriority);
		}
	}
};

PreloadHelper.init();