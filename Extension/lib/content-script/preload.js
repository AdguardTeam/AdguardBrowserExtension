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
/* global contentPage, ExtendedCss, HTMLDocument, XMLDocument */
(function() {

    var requestTypeMap = {
        "img": "IMAGE",
        "input": "IMAGE",
        "audio": "MEDIA",
        "video": "MEDIA",
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
        // First check if it's available already, chrome shows warning message in case of we try to create an additional root.
        shadowRoot = document.documentElement.shadowRoot;
        if (!shadowRoot) {
            if ("createShadowRoot" in document.documentElement && shadowDomExceptions.indexOf(document.domain) == -1) {
                shadowRoot = document.documentElement.createShadowRoot();
                shadowRoot.appendChild(document.createElement("shadow"));
            }
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
        // This is chrome-specific feature for blocking WebSocket connections
        // overrideWebSocket function is not defined in case of other browsers
        if (typeof overrideWebSocket !== 'function') {
            return;
        }

        // Only for dynamically created frames and http/https documents.
        if (!isHtml() && 
            window.location.href !== "about:blank") {
            return;
        }

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
        
        if (userAgent.indexOf('firefox') >= 0) {
            // Explicit check, we must not go further in case of Firefox
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/379
            return;
        }

        initPageMessageListener();

        var content = "try {\n";
        content += '(' + overrideWebSocket.toString() + ')();';
        content += "\n} catch (ex) { console.error('Error executing AG js: ' + ex); }";

        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.textContent = content;

        (document.head || document.documentElement).appendChild(script);
    };

    /**
     * The main purpose of this function is to prevent blocked iframes "flickering".
     * So, we do two things:
     * 1. Add a temporary display:none style for all frames (which is removed on DOMContentLoaded event)
     * 2. Use a MutationObserver to react on dynamically added iframe
     *
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/301
     */
    var addIframeHidingStyle = function () {
        if (window !== window.top) {
            // Do nothing for frames
            return;
        }

        var iframeHidingSelector = "iframe[src]";
        ElementCollapser.hideBySelector(iframeHidingSelector, null, shadowRoot);

        /**
         * For iframes with changed source we check if it should be collapsed
         *
         * @param mutations
         */
        var handleIframeSrcChanged = function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var iframe = mutations[i].target;
                if (iframe) {
                    checkShouldCollapseElement(iframe);
                }
            }
        };

        var iframeObserver = new MutationObserver(handleIframeSrcChanged);
        var iframeObserverOptions = {
            attributes: true,
            attributeFilter: [ 'src' ]
        };

        /**
         * Dynamically added frames handler
         *
         * @param mutations
         */
        var handleDomChanged = function(mutations) {
            var iframes = [];
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                var addedNodes = mutation.addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.localName === "iframe") {
                        iframes.push(node);
                    }
                }
            }

            if (iframes.length > 0) {
                var iIframes = iframes.length;
                while (iIframes--) {
                    var iframe = iframes[iIframes];
                    checkShouldCollapseElement(iframe);
                    iframeObserver.observe(iframe, iframeObserverOptions);                    
                }
            }
        };

        /**
         * Removes iframes hide style and initiates should-collapse check for iframes
         */
        var onDocumentReady = function() {
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                checkShouldCollapseElement(iframes[i]);
            }

            ElementCollapser.unhideBySelector(iframeHidingSelector);

            if (document.body) {
                // Handle dynamically added frames
                var domObserver = new MutationObserver(handleDomChanged);
                domObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        };

        //Document can already be loaded
        if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
            onDocumentReady();
        } else {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
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

            return;
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
            applyScripts(response.scripts, response.applyAllScripts);
        }

        if (response && response.selectors && response.selectors.css && response.selectors.css.length > 0) {
            addIframeHidingStyle();
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
     * Applies CSS and extended CSS stylesheets
     * 
     * @param selectors     Object with the stylesheets got from the background page.
     * @param useShadowDom  If true - add styles to shadow DOM instead of normal DOM. 
     */
    var applySelectors = function (selectors, useShadowDom) {
        if (!selectors) {
            return;
        }

        applyCss(selectors.css, useShadowDom);
        applyExtendedCss(selectors.extendedCss);
    };

    /**
     * Applies CSS stylesheets
     * 
     * @param css Array with CSS stylesheets
     */
    var applyCss = function (css, useShadowDom) {
        if (!css || css.length === 0) {
            return;
        }

        for (var i = 0; i < css.length; i++) {
            var styleEl = document.createElement("style");
            styleEl.setAttribute("type", "text/css");
            setStyleContent(styleEl, css[i], useShadowDom);

            if (useShadowDom && shadowRoot) {
                shadowRoot.appendChild(styleEl);
            } else {
                (document.head || document.documentElement).appendChild(styleEl);                
            }
        }
    };

    /**
     * Applies Extended Css stylesheet
     *
     * @param extendedCss Array with ExtendedCss stylesheets
     */
    var applyExtendedCss = function (extendedCss) {
        if (!extendedCss || !extendedCss.length) {
            return;
        }

        // https://github.com/AdguardTeam/ExtendedCss
        new ExtendedCss(extendedCss.join("\n")).apply();
    };
    
    /**
     * Applies JS injections.
     *
     * @param scripts           Array with JS scripts and scriptSource ('remote' or 'local')
     * @param applyAllScripts   Flag to apply all loaded scripts
     */
    var applyScripts = function(scripts, applyAllScripts) {
        if (!scripts || scripts.length === 0) {
            return;
        }

        var scriptsToApply = [];

        for (var i = 0; i < scripts.length; i++) {
            var scriptRule = scripts[i];
            if (applyAllScripts || scriptRule.scriptSource === "local") {
                scriptsToApply.push(scriptRule.rule);
            } else {
                /**
                 * Note (!) (Firefox, Opera):
                 * In case of Firefox and Opera add-ons, JS filtering rules are hardcoded into add-on code.
                 * Look at WorkaroundUtils.getScriptSource to learn more.
                 */
                if (!isFirefox && !isOpera) {
                    scriptsToApply.push(scriptRule.rule);
                }
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

        var expectedEventType = (tagName == "iframe" || tagName == "frame") ? "load" : "error";
        if (eventType != expectedEventType) {
            return;
        }

        checkShouldCollapseElement(element);
    };

    /**
     * Checks if element is blocked by AG and should be hidden
     *
     * @param element
     */
    var checkShouldCollapseElement = function (element) {
        var tagName = element.tagName.toLowerCase();

        var requestType = requestTypeMap[tagName];
        if (!requestType) {
            return;
        }

        var elementUrl = element.src || element.data;
        if (!elementUrl || elementUrl.indexOf('http') !== 0) {
            return;
        }

        // Save request to a map (it will be used in response callback)
        var requestId = collapseRequestId++;
        collapseRequests[requestId] = {
            element: element,
            tagName: tagName
        };

        // Hide element temporary
        ElementCollapser.hideElement(element, shadowRoot);

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

        if (!response) {
            return;
        }
        
        // Get original collapse request
        var collapseRequest = collapseRequests[response.requestId];
        if (!collapseRequest) {
            return;
        }
        delete collapseRequests[response.requestId];

        if (response.collapse === true) {
            var element = collapseRequest.element;
            ElementCollapser.collapseElement(element, shadowRoot);
        }

        // In any case we should remove hiding style
        ElementCollapser.unhideElement(collapseRequest.element);
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
        for (var tagName in requestTypeMap) { // jshint ignore:line
            var requestType = requestTypeMap[tagName];

            var elements = document.getElementsByTagName(tagName);
            for (var j = 0; j < elements.length; j++) {

                var element = elements[j];
                var elementUrl = element.src || element.data;
                if (!elementUrl || elementUrl.indexOf('http') !== 0) {
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
     * Called when document become visible.
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/159
     */
    var onVisibilityChange = function() {

        if (document.hidden === false) {
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