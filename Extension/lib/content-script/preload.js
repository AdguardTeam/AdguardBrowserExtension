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

    AG_HIDDEN_ATTRIBUTE: "adg-hidden",

    requestTypeMap: {
        "img": "IMAGE",
        "input": "IMAGE",
        "audio": "OBJECT",
        "video": "OBJECT",
        "object": "OBJECT",
        "frame": "SUBDOCUMENT",
        "iframe": "SUBDOCUMENT"
    },

    collapseRequests: Object.create(null),
    collapseRequestId: 1,
    collapseAllElements: false,

    /**
     * Initializing content script
     */
    init: function () {

        if (!(document instanceof HTMLDocument)) {
            return;
        }

        if (window !== window.top) {
            // Do not inject CSS into small frames
            var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            if ((height * width) < 100000) {//near 240*400 px
                return;
            }
        }

        var userAgent = navigator.userAgent.toLowerCase();
        this.isFirefox = userAgent.indexOf('firefox') > -1;
        this.isOpera = userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1;

        this._initCollapse();
        this.tryLoadCssAndScripts();
    },

    /**
     * Loads CSS and JS injections
     */
    tryLoadCssAndScripts: function () {
        ext.backgroundPage.sendMessage(
            {
                type: 'get-selectors-and-scripts',
                documentUrl: window.location.href
            },
            this.processCssAndScriptsResponse.bind(this)
        )
    },

    /**
     * Processes response from the background page containing CSS and JS injections
     * @param response
     */
    processCssAndScriptsResponse: function (response) {
        if (!response || response.requestFilterReady === false) {
            // This flag means that requestFilter is not yet initialized
            // This is possible only on browser startup.
            // In this case we'll delay injections until extension is fully initialized.
            var loadCssAndScripts = this.tryLoadCssAndScripts.bind(this);
            setTimeout(function () {
                loadCssAndScripts();
            }, 100);
            // Request filter not yet ready, delay elements collapse
            this.collapseAllElements = true;
        } else {
            this._applySelectors(response.selectors);
            this._applyScripts(response.scripts);
            if (this.collapseAllElements) {
                // This flag means that we're on browser startup
                // In this case we'll check all page elements and collapse them if needed.
                // Why? On browser startup we can't block some ad/tracking requests
                // because extension is not yet initialized when these requests are executed.
                // At least we could hide these elements.
                this._initCollapseMany();
            }
        }
    },

    /**
     * Applies CSS selectors
     * @param selectors Array with CSS stylesheets
     * @private
     */
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

    /**
     * Applies JS injections.
     *
     * @param scripts Array with JS scripts and scriptSource ('remote' or 'local')
     * @private
     */
    _applyScripts: function (scripts) {

        if (!scripts || scripts.length == 0) {
            return;
        }

        var scriptsToApply = [];

        for (var i = 0; i < scripts.length; i++) {
            var scriptRule = scripts[i];
            switch (scriptRule.scriptSource) {
                case 'local':
                    scriptsToApply.push(scriptRule.rule);
                    break;
                case 'remote':
                    /**
                     * Note (!) (Firefox, Opera):
                     * In case of Firefox and Opera add-ons, JS filtering rules are hardcoded into add-on code.
                     * Look at WorkaroundUtils.getScriptSource to learn more.
                     */
                    if (!this.isFirefox && !this.isOpera) {
                        scriptsToApply.push(scriptRule.rule);
                    }
                    break;
            }
        }

        /**
         * JS injections are created by JS filtering rules:
         * http://adguard.com/en/filterrules.html#javascriptInjection
         *
         */
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        scriptsToApply.unshift("try {");
        scriptsToApply.push("} catch (ex) { console.error('Error executing AG js: ' + ex); }");
        script.textContent = scriptsToApply.join("\r\n");
        (document.head || document.documentElement).appendChild(script);
    },

    /**
     * Init listeners for error and load events.
     * We will then check loaded elements if they are blocked by our extension.
     * In this case we'll hide these blocked elements.
     * @private
     */
    _initCollapse: function () {
        document.addEventListener("error", this._checkShouldCollapse.bind(this), true);

        // We need to listen for load events to hide blocked iframes (they don't raise error event)
        document.addEventListener("load", this._checkShouldCollapse.bind(this), true);
    },

    /**
     * Checks if loaded element is blocked by AG and should be hidden
     * @param event Load or error event
     * @private
     */
    _checkShouldCollapse: function (event) {

        var element = event.target;
        var eventType = event.type;
        var tagName = element.tagName.toLowerCase();

        var requestType = this.requestTypeMap[tagName];
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

        if (eventType == "error") {
            // Hide elements with "error" type right now
            this._hideElement(element, tagName);
        }

        ext.backgroundPage.sendMessage({
                type: 'process-should-collapse',
                elementUrl: elementUrl,
                documentUrl: document.URL,
                requestType: requestType,
                requestId: requestId
            },
            this._onProcessShouldCollapseResponse.bind(this)
        )
    },

    _onProcessShouldCollapseResponse: function (response) {

        if (!response) {
            return
        }

        var collapseRequest = this.collapseRequests[response.requestId];
        if (!collapseRequest) {
            return;
        }
        delete this.collapseRequests[response.requestId];

        if (response.collapse !== true) {
            // Return element visibility in case of it should not be collapsed
            this._toggleElement(collapseRequest.element);
            return;
        }

        var element = collapseRequest.element;
        var tagName = collapseRequest.tagName;
        this._hideElement(element, tagName);
    },

    _initCollapseMany: function () {
        if (document.readyState === 'complete' ||
            document.readyState === 'loaded' ||
            document.readyState === 'interactive') {
            this._checkShouldCollapseMany();
        } else {
            document.addEventListener('DOMContentLoaded', this._checkShouldCollapseMany.bind(this));
        }
    },

    /**
     * Collects all elements from the page and check if we should hide them
     * @private
     */
    _checkShouldCollapseMany: function () {

        var requests = [];

        for (var tagName in this.requestTypeMap) {

            var requestType = this.requestTypeMap[tagName];

            var elements = document.getElementsByTagName(tagName);
            for (var j = 0; j < elements.length; j++) {

                var element = elements[j];
                var elementUrl = element.src || element.data;
                if (!elementUrl || elementUrl.indexOf('http') != 0) {
                    continue;
                }

                var requestId = this.collapseRequestId++;
                requests.push({
                    elementUrl: elementUrl,
                    requestType: requestType,
                    requestId: requestId,
                    tagName: tagName
                });
                this.collapseRequests[requestId] = {
                    element: element,
                    tagName: tagName
                };
            }
        }

        ext.backgroundPage.sendMessage({
                type: 'process-should-collapse-many',
                requests: requests,
                documentUrl: document.URL
            },
            this._onProcessShouldCollapseManyResponse.bind(this)
        );
    },

    /**
     * Processes response from background page
     *
     * @param response Response from bg page
     * @private
     */
    _onProcessShouldCollapseManyResponse: function (response) {

        if (!response) {
            return;
        }

        var requests = response.requests;
        for (var i = 0; i < requests.length; i++) {
            var collapseRequest = requests[i];
            this._onProcessShouldCollapseResponse(collapseRequest);
        }
    },

    /**
     * Hides specified element.
     *
     * @param element Element
     * @param tagName Element tag name
     * @private
     */
    _hideElement: function (element, tagName) {

        var cssProperty = "display";
        var cssValue = "none";
        var cssPriority = "important";

        if (tagName == "frame") {
            cssProperty = "visibility";
            cssValue = "hidden";
        }

        var elementStyle = element.style;
        var elCssValue = elementStyle.getPropertyValue(cssProperty);
        var elCssPriority = elementStyle.getPropertyPriority(cssProperty);
        if (elCssValue != cssValue || elCssPriority != cssPriority) {

            elementStyle.setProperty(cssProperty, cssValue, cssPriority);

            var originalCss = cssProperty + ';' + (elCssValue ? elCssValue : '') + ';' + (elCssPriority ? elCssPriority : '');
            element.setAttribute(PreloadHelper.AG_HIDDEN_ATTRIBUTE, originalCss);
        }
    },

    /**
     * Toggles element visibility back
     *
     * @param element Element to show
     * @private
     */
    _toggleElement: function (element) {

        if (element.hasAttribute(PreloadHelper.AG_HIDDEN_ATTRIBUTE)) {

            var originalCssParts = element.getAttribute(PreloadHelper.AG_HIDDEN_ATTRIBUTE).split(';');

            var cssProperty = originalCssParts[0];
            var elCssValue = originalCssParts[1];
            var elCssPriority = originalCssParts[2];

            if (elCssValue) {
                // Revert to original style
                element.style.setProperty(cssProperty, elCssValue, elCssPriority);
            } else {
                element.style.removeProperty(cssProperty);
            }

            element.removeAttribute(PreloadHelper.AG_HIDDEN_ATTRIBUTE);
        }
    }
};

PreloadHelper.init();
