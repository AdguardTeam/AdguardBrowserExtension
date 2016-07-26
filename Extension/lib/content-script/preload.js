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
/* global contentPage */
(function() {
    var AG_HIDDEN_ATTRIBUTE = "adg-hidden";
    var AG_FRAMES_STYLE = "adguard-frames-style";

    var requestTypeMap = {
        "img": "IMAGE",
        "input": "IMAGE",
        "audio": "OBJECT",
        "video": "OBJECT",
        "object": "OBJECT",
        "frame": "SUBDOCUMENT",
        "iframe": "SUBDOCUMENT"
    };
    
    /**
     * Do not use shadow DOM on some websites
     * https://code.google.com/p/chromium/issues/detail?id=496055
     */
    var shadowDomExceptions = [
        'mail.google.com',
        'inbox.google.com',
        'productforums.google.com'
    ];
    
    var collapseRequests = Object.create(null);
    var collapseRequestId = 1;
    var isFirefox = false;
    var isOpera = false;
    var shadowRoot = null;
    var loadTruncatedCss = false;
    
    /**
     * Initializing content script
     */
    var init = function () {
        initWebSocketWrapper();

        if (!isHtml()) {
            return;
        }

        // We use shadow DOM when it's available to minimize our impact on web page DOM tree.
        // According to ABP issue #452, creating a shadow root breaks running CSS transitions.
        // Because of this, we create shadow root right after content script is initialized.
        if ("createShadowRoot" in document.documentElement && shadowDomExceptions.indexOf(document.domain) == -1) {
            shadowRoot = document.documentElement.createShadowRoot();
            shadowRoot.appendChild(document.createElement("shadow"));
        }

        var userAgent = navigator.userAgent.toLowerCase();
        isFirefox = userAgent.indexOf('firefox') > -1;
        isOpera = userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1;

        if (window !== window.top) {
            var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            // Load only small set of css for small frames.
            // We hide all generic css rules in this case.
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/223
            loadTruncatedCss = (height * width) < 100000;
        }

        initCollapseEventListeners();
        tryLoadCssAndScripts();

        addIframeHidingStyle();
    };

    /**
     * Checks if it is html document
     *
     * @returns {boolean}
     */
    var isHtml = function () {
        return (document instanceof HTMLDocument) ||
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/233
            ((document instanceof XMLDocument) && (document.createElement('div') instanceof HTMLDivElement));
    };

    /**
     * Overrides window.WebSocket running the function from websocket.js
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/203
     */
    /*global initPageMessageListener, overrideWebSocket*/
    var initWebSocketWrapper = function () {
        // WebSockets are broken in old versions of chrome
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/273
        var userAgent = navigator.userAgent.toLowerCase();
        var cIndex = userAgent.indexOf('chrome/');
        if (cIndex > 0) {
            var version = userAgent.substring(cIndex + 7);
            if (Number.parseInt(version.substring(0, version.indexOf('.'))) < 47) {
                return;
            }
        }

        // Only for dynamically created frames and http/https documents.
        if (!isHtml()
            && window.location.href !== "about:blank") {
            return;
        }

        if (typeof overrideWebSocket == 'function') {
            initPageMessageListener();

            var content = "try {\n";
            content += '(' + overrideWebSocket.toString() + ')();';
            content += "\n} catch (ex) { console.error('Error executing AG js: ' + ex); }";

            var script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.textContent = content;

            (document.head || document.documentElement).appendChild(script);
        }
    };

    /**
     * To prevent iframes flickering we add a temporarly display-none style for all iframes
     *
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/301
     */
    var addIframeHidingStyle = function () {
        var styleFrame = document.createElement("style");
        styleFrame.id = AG_FRAMES_STYLE;
        styleFrame.setAttribute("type", "text/css");
        styleFrame.textContent = 'iframe[src] { display: none !important; }';
        (document.head || document.documentElement).appendChild(styleFrame);
    };

    var removeIframeHidingStyle = function () {
        var framesStyle = document.getElementById(AG_FRAMES_STYLE);
        if (framesStyle) {
            framesStyle.parentNode.removeChild(framesStyle);
        }
    };

    /**
     * Loads CSS and JS injections
     */
    var tryLoadCssAndScripts = function () {
        var message = {
            type: 'getSelectorsAndScripts',
            documentUrl: window.location.href,
            loadTruncatedCss: loadTruncatedCss
        };

        /**
         * Sending message to background page and passing a callback function
         */
        contentPage.sendMessage(message, processCssAndScriptsResponse);
    };
    
    /**
     * Processes response from the background page containing CSS and JS injections
     *
     * @param response Response from the background page
     */
    var processCssAndScriptsResponse = function(response) {
        if (!response || response.requestFilterReady === false) {
            /**
             * This flag (requestFilterReady) means that we should wait for a while, because the 
             * request filter is not ready yet. This is possible only on browser startup. 
             * In this case we'll delay injections until extension is fully initialized.
             */
            setTimeout(function () {
                tryLoadCssAndScripts();
            }, 100);
        } else if (response.collapseAllElements) {
            
            /**
             * This flag (collapseAllElements) means that we should check all page elements 
             * and collapse them if needed. Why? On browser startup we can't block some 
             * ad/tracking requests because extension is not yet initialized when 
             * these requests are executed. At least we could hide these elements.
             */
            applySelectors(response.selectors, response.useShadowDom);
            applyScripts(response.scripts);
            initBatchCollapse();
        } else {
            applySelectors(response.selectors, response.useShadowDom);
            applyScripts(response.scripts);
        }
    };
    
    /**
     * Sets "style" DOM element content.
     * 
     * @param styleEl       "style" DOM element
     * @param cssContent    CSS content to set
     * @param useShadowDom  true if we want to use shadow DOM
     */
    var setStyleContent = function(styleEl, cssContent, useShadowDom) {
        
        if (useShadowDom && !shadowRoot) {
            // Despite our will to use shadow DOM we cannot
            // It is rare case, but anyway: https://code.google.com/p/chromium/issues/detail?id=496055
            // The only thing we can do is to append styles to document root
            // We should remove ::content pseudo-element first
            cssContent = cssContent.replace(new RegExp('::content ', 'g'), '');
        }
        
        styleEl.textContent = cssContent;
    };
    
    /**
     * Applies CSS selectors
     * 
     * @param selectors     Array with CSS stylesheets.
     * @param useShadowDom  If true - add styles to shadow DOM instead of normal DOM. 
     */
    var applySelectors = function (selectors, useShadowDom) {
        if (!selectors || selectors.length == 0) {
            return;
        }

        for (var i = 0; i < selectors.length; i++) {
            var styleEl = document.createElement("style");
            styleEl.setAttribute("type", "text/css");
            setStyleContent(styleEl, selectors[i], useShadowDom);

            if (useShadowDom && shadowRoot) {
                shadowRoot.appendChild(styleEl);
            } else {
                (document.head || document.documentElement).appendChild(styleEl);                
            }
        }
    };
    
    /**
     * Applies JS injections.
     *
     * @param scripts Array with JS scripts and scriptSource ('remote' or 'local')
     */
    var applyScripts = function(scripts) {
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
                    if (!isFirefox && !isOpera) {
                        scriptsToApply.push(scriptRule.rule);
                    }
                    break;
            }
        }

        /**
         * JS injections are created by JS filtering rules:
         * http://adguard.com/en/filterrules.html#javascriptInjection
         */
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        scriptsToApply.unshift("try {");
        scriptsToApply.push("} catch (ex) { console.error('Error executing AG js: ' + ex); }");
        script.textContent = scriptsToApply.join("\r\n");
        (document.head || document.documentElement).appendChild(script);
    };
    
    /**
     * Init listeners for error and load events.
     * We will then check loaded elements if they are blocked by our extension.
     * In this case we'll hide these blocked elements.
     */
    var initCollapseEventListeners = function() {
        document.addEventListener("error", checkShouldCollapse, true);

        // We need to listen for load events to hide blocked iframes (they don't raise error event)
        document.addEventListener("load", checkShouldCollapse, true);
    };
    
    /**
     * Checks if loaded element is blocked by AG and should be hidden
     * 
     * @param event Load or error event
     */
    var checkShouldCollapse = function(event) {

        var element = event.target;
        var eventType = event.type;
        var tagName = element.tagName.toLowerCase();

        var requestType = requestTypeMap[tagName];
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

        // Save request to a map (it will be used in response callback)
        var requestId = collapseRequestId++;
        collapseRequests[requestId] = {
            element: element,
            tagName: tagName
        };

        if (eventType == "error") {
            // Hide elements with "error" type right now
            // We will roll it back if element should not be collapsed
            collapseElement(element, tagName);
        }
        
        // Send a message to the background page to check if the element really should be collapsed
        var message = {
            type: 'processShouldCollapse',
            elementUrl: elementUrl,
            documentUrl: document.URL,
            requestType: requestType,
            requestId: requestId
        };

        contentPage.sendMessage(message, onProcessShouldCollapseResponse);
    };
    
    /**
     * Response callback for "processShouldCollapse" message.
     * 
     * @param response Response got from the background page
     */
    var onProcessShouldCollapseResponse = function (response) {

        // Removing added iframes-hiding style
        // We do it here, cause otherwise it's not working properly
        removeIframeHidingStyle();

        if (!response) {
            return;
        }
        
        // Get original collapse request
        var collapseRequest = collapseRequests[response.requestId];
        if (!collapseRequest) {
            return;
        }
        delete collapseRequests[response.requestId];

        if (response.collapse !== true) {
            // Return element visibility in case if it should not be collapsed
            toggleElement(collapseRequest.element);
            return;
        }

        var element = collapseRequest.element;
        var tagName = collapseRequest.tagName;
        collapseElement(element, tagName);
    };
    
    /**
     * This method is used when we need to check all page elements with collapse rules.
     * We need this when the browser is just started and add-on is not yet initialized.
     * In this case content scripts waits for add-on initialization and the
     * checks all page elements.  
     */
    var initBatchCollapse = function() {
        if (document.readyState === 'complete' ||
            document.readyState === 'loaded' ||
            document.readyState === 'interactive') {
            checkBatchShouldCollapse();
        } else {
            document.addEventListener('DOMContentLoaded', checkBatchShouldCollapse);
        }
    };
    
    /**
     * Collects all elements from the page and checks if we should hide them.
     */
    var checkBatchShouldCollapse = function() {
        var requests = [];

        // Collect collapse requests
        for (var tagName in requestTypeMap) {
            var requestType = requestTypeMap[tagName];

            var elements = document.getElementsByTagName(tagName);
            for (var j = 0; j < elements.length; j++) {

                var element = elements[j];
                var elementUrl = element.src || element.data;
                if (!elementUrl || elementUrl.indexOf('http') != 0) {
                    continue;
                }

                var requestId = collapseRequestId++;
                requests.push({
                    elementUrl: elementUrl,
                    requestType: requestType,
                    requestId: requestId,
                    tagName: tagName
                });
                collapseRequests[requestId] = {
                    element: element,
                    tagName: tagName
                };
            }
        }

        var message = {
            type: 'processShouldCollapseMany',
            requests: requests,
            documentUrl: document.URL            
        };

        // Send all prepared requests in one message
        contentPage.sendMessage(message, onProcessShouldCollapseManyResponse);
    };
    
    /**
     * Response callback for "processShouldCollapseMany" message.
     *
     * @param response Response from bg page.
     */
    var onProcessShouldCollapseManyResponse = function(response) {

        if (!response) {
            return;
        }

        var requests = response.requests;
        for (var i = 0; i < requests.length; i++) {
            var collapseRequest = requests[i];
            onProcessShouldCollapseResponse(collapseRequest);
        }
    };
    
    /**
     * Hides specified element.
     *
     * @param element Element to hide
     * @param tagName Element's tag name
     */
    var collapseElement = function(element, tagName) {

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
            element.setAttribute(AG_HIDDEN_ATTRIBUTE, originalCss);
        }
    };
    
    /**
     * Toggles element visibility back
     *
     * @param element Element to show
     */
    var toggleElement = function(element) {

        if (element.hasAttribute(AG_HIDDEN_ATTRIBUTE)) {

            var originalCssParts = element.getAttribute(AG_HIDDEN_ATTRIBUTE).split(';');

            var cssProperty = originalCssParts[0];
            var elCssValue = originalCssParts[1];
            var elCssPriority = originalCssParts[2];

            if (elCssValue) {
                // Revert to original style
                element.style.setProperty(cssProperty, elCssValue, elCssPriority);
            } else {
                element.style.removeProperty(cssProperty);
            }

            element.removeAttribute(AG_HIDDEN_ATTRIBUTE);
        }
    };
    
    /**
     * Called when document become visible.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/159
     */
    var onVisibilityChange = function(event) {

        if (document.hidden == false) {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            init();
        }
    };
    
    /**
     * Messaging won't work when page is loaded by Safari top hits
     */        
    if (typeof safari != 'undefined' && document.hidden) {
        document.addEventListener("visibilitychange", onVisibilityChange);
        return;
    }
    
    // Start the content script
    init();
})();