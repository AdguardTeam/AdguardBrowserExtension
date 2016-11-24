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
/* global XPCOMUtils, Services, Cc, Ci, Cr, components */

var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);

/**
 * Helper object to work with web requests.
 */
var WebRequestHelper = {

    ACCEPT: Ci.nsIContentPolicy.ACCEPT,
    REJECT: Ci.nsIContentPolicy.REJECT_REQUEST,

    contentTypes: {
        TYPE_OTHER: 1,
        TYPE_SCRIPT: 2,
        TYPE_IMAGE: 3,
        TYPE_STYLESHEET: 4,
        TYPE_OBJECT: 5,
        TYPE_DOCUMENT: 6,
        TYPE_SUBDOCUMENT: 7,
        TYPE_REFRESH: 8,
        TYPE_XBL: 9,
        TYPE_PING: 10,
        TYPE_XMLHTTPREQUEST: 11,
        TYPE_OBJECT_SUBREQUEST: 12,
        TYPE_DTD: 13,
        TYPE_FONT: 14,
        TYPE_MEDIA: 15,
        TYPE_WEBSOCKET: 16
    },

    /**
     * Gets request type string representation
     *
     * @param contentType   Request content type
     * @param URI           Request URI
     */
    getRequestType: function (contentType, URI) {

        var t = WebRequestHelper.contentTypes;
        switch (contentType) {
            case t.TYPE_DOCUMENT:
                return RequestTypes.DOCUMENT;
            case t.TYPE_SCRIPT:
                return RequestTypes.SCRIPT;
            case t.TYPE_IMAGE:
                return RequestTypes.IMAGE;
            case t.TYPE_STYLESHEET:
                return RequestTypes.STYLESHEET;
            case t.TYPE_OBJECT:
                return RequestTypes.OBJECT;
            case t.TYPE_SUBDOCUMENT:
                return RequestTypes.SUBDOCUMENT;
            case t.TYPE_XMLHTTPREQUEST:
                return RequestTypes.XMLHTTPREQUEST;
            case t.TYPE_OBJECT_SUBREQUEST:
                return RequestTypes.OBJECT_SUBREQUEST;
            case t.TYPE_FONT:
                return RequestTypes.FONT;
            case t.TYPE_MEDIA:
                return RequestTypes.MEDIA;
            case t.TYPE_WEBSOCKET:
                return RequestTypes.WEBSOCKET;
            default:
                return Utils.parseContentTypeFromUrlPath(URI.path) || RequestTypes.OTHER;
        }
    },

    getRequestHeaders: function (request) {
        var requestHeaders = [];
        request.visitRequestHeaders(function (header, value) {
            requestHeaders.push({name: header, value: value});
        });
        return requestHeaders;
    },

    getResponseHeaders: function (request) {
        var responseHeaders = [];
        request.visitResponseHeaders(function (header, value) {
            responseHeaders.push({name: header, value: value});
        });
        return responseHeaders;
    },

    /**
     * Gets tab by node
     *
     * @param context       Node   True if request content type is TYPE_DOCUMENT
     * @returns Tab data
     */
    getTabForContext: function (context) {

        // If it is the main frame
        if (context._contentWindow instanceof Ci.nsIDOMWindow) {
            return adguard.tabsImpl.getTabForContentWindow(context._contentWindow.top);
        }

        if (!(context instanceof Ci.nsIDOMWindow)) {
            // If this is an element, get the corresponding document
            if (context instanceof Ci.nsIDOMNode && context.ownerDocument) {
                context = context.ownerDocument;
            }

            // Now we should have a document, get its window
            if (context instanceof Ci.nsIDOMDocument) {
                context = context.defaultView;
            } else {
                return null;
            }
        }

        // If we have a window now - get the tab
        if (context && context instanceof Ci.nsIDOMWindow) {
            //http://jira.performix.ru/browse/AG-7285
            if ("" + context === "[object ChromeWindow]") {
                return null;
            }
            return adguard.tabsImpl.getTabForContentWindow(context.top);
        }
        return null;
    },

    getTabIdForChannel: function (channel) {

        var contextData = this.getChannelContextData(channel);

        if (contextData && contextData.tab) {
            return adguard.tabsImpl.getTabIdForTab(contextData.tab);
        }

        if (contextData && contextData.browser) {
            var browser = contextData.browser;
            var xulTab = adguard.tabsImpl.getTabForBrowser(browser);

            // getTabForBrowser() returns null for FF 38 ESR
            if (!xulTab) {
                // TODO: temporary fix
                // If browser.docShell returns null then browser.contentWindow throws exception: this.docShell is null
                if (browser.docShell && browser.contentWindow) {
                    xulTab = adguard.tabsImpl.getTabForContentWindow(browser.contentWindow);
                }
                if (!xulTab) {
                    return null;
                }
            }

            return adguard.tabsImpl.getTabIdForTab(xulTab);
        }
        return null;
    },

    /**
     * Gets load context from given nsIChannel
     * @param channel nsIChannel implementation
     * @private
     */
    _getLoadContext: function (channel) {
        var loadContext;
        try {
            loadContext = channel.notificationCallbacks.getInterface(Ci.nsILoadContext);
        } catch (e) {
        }

        if (!loadContext) {
            try {
                loadContext = channel.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext);
            } catch (e) {
                // Lots of requests have no notificationCallbacks, mostly background
                // ones like OCSP checks or smart browsing fetches.
                Log.debug("_getLoadContext: no loadContext for " + channel.URI.spec);
                return null;
            }
        }

        return loadContext;
    },

    /**
     * Gets XUL browser for given nsIChannel.
     *
     * We've used a method from HTTPS Everywhere to fix e10s incompatibility:
     * https://github.com/pde/https-everywhere/blob/1afa2d65874403c7c89ce8af320bbd79b0827823/src/components/https-everywhere.js
     *
     * Returns an instance of https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/browser.
     * Also returns DOMWindow, tab and contentWindow if possible.
     *
     * @param channel nsIChannel implementation
     * @returns {*}
     */
    getChannelContextData: function (channel) {
        var topFrameElement, associatedWindow;
        var spec = channel.URI.spec;
        var loadContext = this._getLoadContext(channel);

        if (loadContext) {
            topFrameElement = loadContext.topFrameElement;
            try {
                // If loadContext is an nsDocShell, associatedWindow is present.
                // Otherwise, if it's just a LoadContext, accessing it will throw
                // NS_ERROR_UNEXPECTED.
                associatedWindow = loadContext.associatedWindow;
            } catch (e) {
                // Ignore
            }
        }

        // On e10s (multiprocess, aka electrolysis) Firefox,
        // loadContext.topFrameElement gives us a reference to the XUL <browser>
        // element we need. However, on non-e10s Firefox, topFrameElement is null.

        // More details here:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1113294
        // https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Limitations_of_chrome_scripts#HTTP_requests
        if (topFrameElement) {
            return {
                browser: topFrameElement
            };
        } else if (associatedWindow) {
            // For non-e10s Firefox, get the XUL <browser> element using this rather
            // magical / opaque code cribbed from
            // https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Tabbed_browser#Getting_the_browser_that_fires_the_http-on-modify-request_notification_(example_code_updated_for_loadContext)

            // this is the HTML DOM window of the page that just loaded
            var contentWindow = loadContext.associatedWindow;
            // aDOMWindow this is the firefox window holding the tab
            var aDOMWindow = contentWindow.top.QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIWebNavigation)
                .QueryInterface(Ci.nsIDocShellTreeItem)
                .rootTreeItem
                .QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIDOMWindow);
            // this is the gBrowser object of the firefox window this tab is in
            var gBrowser = aDOMWindow.gBrowser;
            if (gBrowser && gBrowser._getTabForContentWindow) {
                var aTab = gBrowser._getTabForContentWindow(contentWindow.top);

                // this is the clickable tab xul element, the one found in the tab strip
                // of the firefox window, aTab.linkedBrowser is same as browser var above
                // this is the browser within the tab
                if (aTab) {
                    return {
                        tab: aTab,
                        browser: aTab.linkedBrowser,
                        DOMWindow: aDOMWindow,
                        contentWindow: contentWindow
                    };
                } else {
                    Log.debug("getChannelContextData: aTab was null for " + spec);
                    return null;
                }
            } else if (aDOMWindow.BrowserApp) {

                // gBrowser is unavailable in Firefox for Android, and in some desktop
                // contexts, like the fetches for new tab tiles (which have an
                // associatedWindow, but no gBrowser)?
                // If available, try using the BrowserApp API:
                // https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/API/BrowserApp
                // TODO: We don't get the toolbar icon on android. Probably need to fix the gBrowser reference in toolbar_button.js.
                // Also TODO: Where are these log messages going? They don't show up in remote debug console.
                var mTab = aDOMWindow.BrowserApp.getTabForWindow(contentWindow.top);
                if (mTab) {
                    return {
                        tab: mTab,
                        browser: mTab.browser,
                        DOMWindow: aDOMWindow,
                        contentWindow: contentWindow
                    };
                } else {
                    Log.error("getChannelContextData: mTab was null for " + spec);
                    return null;
                }
            } else {
                Log.error("getChannelContextData: No gBrowser and no BrowserApp for " + spec);
                return null;
            }
        } else {
            Log.debug("getChannelContextData: No loadContext for " + spec);
            return null;
        }
    },

    /**
     * Attaches request properties to the http channel.
     * We get these
     *
     * @param request nsIHttpChannel
     * @param requestProperties Contains
     */
    attachRequestProperties: function (request, requestProperties) {
        if (request instanceof Ci.nsIWritablePropertyBag) {
            request.setProperty("requestProperties", requestProperties);
        }
    },

    /**
     * Gets request properties from http channel.
     * This property is attached in http-on-opening-request handler.
     *
     * @param request nsIHttpChannel
     * @returns Request properties or null
     */
    retrieveRequestProperties: function (request) {
        var requestProperties = null;
        if (request instanceof Ci.nsIPropertyBag) {
            try {
                requestProperties = request.getProperty("requestProperties");
            } catch (ex) {
                // Property doesn't exist, ignore exception
            }
        }

        return requestProperties;
    }
};

/**
 * This objects manages HTTP requests filtering.
 *
 * It implements nsIContentPolicy and so it can block requests.
 * It also subscribes to the following events:
 * http-on-examine-response, http-on-examine-cached-response, http-on-examine-merged-response, http-on-opening-request
 */
var WebRequestImpl = {

    classDescription: "Adguard content policy",
    classID: components.ID("f5d18a88-c4b8-40ed-85cc-6cb3fd02268e"),
    contractID: "@adguard.com/adg/policy;1",
    xpcom_categories: ["content-policy", "net-channel-event-sinks"],

    /**
     * Initialize WebRequest filtering, register is as events listener
     */
    init: function () {

        Log.info('Adguard addon: Initializing webRequest...');

        var registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
        registrar.registerFactory(this.classID, this.classDescription, this.contractID, this);
        for (var i = 0; i < this.xpcom_categories.length; i++) {
            var category = this.xpcom_categories[i];
            categoryManager.addCategoryEntry(category, this.contractID, this.contractID, false, true);
        }

        this.observe = this.observe.bind(this);

        Services.obs.addObserver(this, "http-on-examine-response", true);
        Services.obs.addObserver(this, "http-on-examine-cached-response", true);
        Services.obs.addObserver(this, "http-on-examine-merged-response", true);
        Services.obs.addObserver(this, "http-on-opening-request", true);

        unload.when(function () {
            this.unregister();
        }.bind(this));
    },

    unregister: function () {

        Services.obs.removeObserver(this, "http-on-examine-response");
        Services.obs.removeObserver(this, "http-on-examine-cached-response");
        Services.obs.removeObserver(this, "http-on-examine-merged-response");
        Services.obs.removeObserver(this, "http-on-opening-request");

        var registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
        for (var i = 0; i < WebRequestImpl.xpcom_categories.length; i++) {
            var category = WebRequestImpl.xpcom_categories[i];
            categoryManager.deleteCategoryEntry(category, this.contractID, false);
        }
        registrar.unregisterFactory(WebRequestImpl.classID, this);
    },

    /**
     * nsIContentPolicy interface implementation
     *
     * Read here for details:
     * https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPolicy
     *
     * @param contentType       The type of content being tested. This will be one one of the TYPE_* constants.
     * @param contentLocation   The location of the content being checked; must not be null.
     * @param requestOrigin     OPTIONAL. The location of the resource that initiated this load request; can be null if inapplicable.
     * @param aContext          OPTIONAL. The nsIDOMNode or nsIDOMWindow that initiated the request, or something that can Query Interface to one of those; can be null if inapplicable.
     *                          Note: aContext is the new tab/window when a user uses the context menu to open a link in a new tab/window or cmd/ctrl + clicks the link (i.e., aContext is not the tab which the link was on in these cases).
     * @param mimeTypeGuess     OPTIONAL. a guess for the requested content's MIME type, based on information available to the request initiator
     *                              (e.g., an OBJECT's type attribute); does not reliably reflect the actual MIME type of the requested content.
     * @param extra             An OPTIONAL argument, pass-through for non-Gecko callers to pass extra data to callees.
     * @param aRequestPrincipal OPTIONAL. defines the principal that caused the load. This is optional only for non-gecko code:
     *                          all gecko code should set this argument. For navigation events, this is the principal of the page
     *                          that caused this load.
     * @returns ACCEPT or REJECT_*
     */
    shouldLoad: function (contentType, contentLocation, requestOrigin, aContext, mimeTypeGuess, extra, aRequestPrincipal) {
        var tab;
        if (aContext) {
            var xulTab = WebRequestHelper.getTabForContext(aContext);
            if (xulTab) {
                tab = {id: tabUtils.getTabId(xulTab)};
            }
        }

        if (!tab && contentType !== WebRequestHelper.contentTypes.TYPE_WEBSOCKET) {
            // We handle null-tab requests only of websocket type
            return WebRequestHelper.ACCEPT;
        }

        var tabUrl;
        if (!tab && requestOrigin) {
            //In case of websocket requests tab could be empty
            tabUrl = requestOrigin.asciiSpec;
        } else {
            tabUrl = this.framesMap.getFrameUrl(tab, 0);
        }

        var requestUrl = contentLocation.asciiSpec;
        var requestType = WebRequestHelper.getRequestType(contentType, contentLocation);

        var result = this._shouldBlockRequest(tab, requestUrl, tabUrl, requestType, aContext);

        Log.debug('shouldLoad: {0} {1}. Result: {2}', requestUrl, requestType, result.blocked);
        this._saveLastRequestProperties(requestUrl, requestType, result, aContext);
        return result.blocked ? WebRequestHelper.REJECT : WebRequestHelper.ACCEPT;
    },

    /**
     * nsIContentPolicy method
     */
    shouldProcess: function () {
        return WebRequestHelper.ACCEPT;
    },

    /**
     * nsIChannelEventSink interface implementation
     * We use this method to block redirect requests because in this case shouldLoad is not called.
     *
     * @param oldChannel
     * @param newChannel
     * @param flags
     * @param callback
     */
    asyncOnChannelRedirect: function (oldChannel, newChannel, flags, callback) {
        var result = Cr.NS_OK;
        try {
            var requestProperties = WebRequestHelper.retrieveRequestProperties(oldChannel);
            if (!requestProperties) {
                // Empty requestProperties means that this request was not processed by shouldLoad.
                // We should ignore such requests.
                return;
            }

            var tabId = WebRequestHelper.getTabIdForChannel(newChannel);
            if (!tabId) {
                return;
            }

            var tab = {tabId: tabId};
            var requestUrl = newChannel.URI.asciiSpec;
            var tabUrl = this.framesMap.getFrameUrl(tab, 0);
            var shouldBlockResult = this._shouldBlockRequest(tab, requestUrl, tabUrl, requestProperties.requestType, null);

            Log.debug('asyncOnChannelRedirect: {0} {1}. Blocked={2}', requestUrl, requestProperties.requestType, shouldBlockResult.blocked);
            if (shouldBlockResult.blocked) {
                result = Cr.NS_BINDING_ABORTED;
            }
        } catch (ex) {
            // Don't throw exception further
            Log.error('asyncOnChannelRedirect: Error while processing redirect: {0}', ex);
        } finally {
            callback.onRedirectVerifyCallback(result);
        }
    },

    /**
     * nsIObserver interface implementation.
     * Learn more here:
     * https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/Intercepting_Page_Loads#HTTP_Observers
     *
     * @param channel - http channel
     * @param type - event type
     */
    observe: function (channel, type) {
        try {
            switch (type) {
                case "http-on-examine-response":
                case "http-on-examine-cached-response":
                case "http-on-examine-merged-response":
                    this._httpOnExamineResponse(channel);
                    break;
                case "http-on-opening-request":
                    this._httpOnOpeningRequest(channel);
                    break;
            }
        } catch (ex) {
            // Don't throw exception further
            Log.error('observe: Error while handling event: {0}', ex);
        }
    },

    /**
     * Handler for http-on-examine-response and such.
     *
     * @param subject nsIHttpChannel
     * @private
     */
    _httpOnExamineResponse: function (subject) {

        if (!(subject instanceof Ci.nsIHttpChannel)) {
            return;
        }

        var tabId = WebRequestHelper.getTabIdForChannel(subject);
        if (!tabId) {
            return;
        }

        var tab = {tabId: tabId};
        var requestUrl = subject.URI.asciiSpec;
        var responseHeaders = WebRequestHelper.getResponseHeaders(subject);

        // Get content type
        var isDocument = (subject.loadFlags & subject.LOAD_DOCUMENT_URI);
        var requestProperties = WebRequestHelper.retrieveRequestProperties(subject);
        var requestType = !!requestProperties ? requestProperties.requestType : null;

        if (!requestType && isDocument) {
            requestType = RequestTypes.DOCUMENT;
        } else if (!requestType) {
            requestType = RequestTypes.OTHER;
        }
        var isMainFrame = (requestType == RequestTypes.DOCUMENT);

        // We record frame data here because shouldLoad is not always called (shouldLoad issue)
        if (isMainFrame) {
            //record frame
            framesMap.recordFrame(tab, 0, requestUrl, requestType);
        }

        // Retrieve referrer URL
        var referrerUrl = framesMap.getFrameUrl(tab, 0);

        if (!!requestProperties) {
            // Calling postProcessRequest only for requests which were previously processed by "shouldLoad"
            var filteringRule = requestProperties.shouldLoadResult.rule;
            adguard.webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, filteringRule);
        }
        adguard.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        if (isMainFrame) {
            //update tab button state
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, false);
            //save ref header
            var headers = WebRequestHelper.getRequestHeaders(subject);
            var refHeader = Utils.findHeaderByName(headers, 'Referer');
            if (refHeader) {
                framesMap.recordFrameReferrerHeader(tab, refHeader.value);
            }
        }

        if (isMainFrame) {
            // Do safebrowsing check
            this._filterSafebrowsing(requestUrl, tab);
        }
    },

    /**
     * Handler for http-on-opening-request.
     *
     * @param subject nsIHttpChannel
     * @private
     */
    _httpOnOpeningRequest: function (subject) {

        if (!(subject instanceof Ci.nsIHttpChannel)) {
            return;
        }

        // Set authorization headers for requests to desktop AG
        if (adguard.integration.isIntegrationRequest(subject.URI.asciiSpec)) {
            var authHeaders = adguard.integration.getAuthorizationHeaders();
            for (var i = 0; i < authHeaders.length; i++) {
                subject.setRequestHeader(authHeaders[i].headerName, authHeaders[i].headerValue, false);
            }
            return;
        }

        var tabId;
        try {
            tabId = WebRequestHelper.getTabIdForChannel(subject);
        } catch (ex) {
            //Sometimes FF throws an exception here.
            Log.debug('Error getting tabId for xulTab: {0}', ex);
            return;
        }
        if (!tabId) {
            return;
        }

        var openerTab;
        if (this.lastRequestProperties && subject.URI.asciiSpec === this.lastRequestProperties.requestUrl) {
            /**
             * Stores requestProperties, it is then used in asyncOnChannelRedirect
             * and httpOnExamineResponse callback methods
             */
            WebRequestHelper.attachRequestProperties(subject, this.lastRequestProperties);
            openerTab = this.lastRequestProperties.openerTab;
            this.lastRequestProperties = null;
        }

        // Check for opener
        if (openerTab && this._checkPopupRule(subject.URI.asciiSpec, openerTab)) {
            subject.cancel(Cr.NS_BINDING_ABORTED);
            adguard.tabs.remove(tabId);
            return;
        }

        /**
         * Override request referrer in integration mode
         */
        var tab = {tabId: tabId};
        if (adguard.integration.shouldOverrideReferrer(tab)) {
            // Retrieve main frame url
            var frameUrl = framesMap.getFrameUrl(tab, 0);
            subject.setRequestHeader('Referer', frameUrl, false);
        }
    },

    /**
     * Checks if request should be blocked
     *
     * @param tab           Browser tab or null
     * @param requestUrl    Request url
     * @param tabUrl        Tab url
     * @param requestType   Request type
     * @param node          DOM node or null
     * @returns {*} object with two properties: "blocked" and "rule"
     * @private
     */
    _shouldBlockRequest: function (tab, requestUrl, tabUrl, requestType, node) {

        var result = {
            blocked: false,
            rule: null
        };

        if (requestType === RequestTypes.DOCUMENT) {
            return result;
        }

        if (!UrlUtils.isHttpOrWsRequest(requestUrl)) {
            return result;
        }

        result.rule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, tabUrl, requestType);
        result.blocked = adguard.webRequestService.isRequestBlockedByRule(result.rule);

        if (result.blocked || requestType === RequestTypes.WEBSOCKET) {
            this._collapseElement(node, requestType);

            // Usually we call this method in _httpOnExamineResponse callback
            // But it won't be called if request is blocked here
            // Also it won't be called for WEBSOCKET requests
            adguard.webRequestService.postProcessRequest(tab, requestUrl, tabUrl, requestType, result.rule);
        }

        return result;
    },

    /**
     * Save request properties to be reused further in http-on-opening-request method.
     * This is ugly, but I have not found a better solution to pass requestType and shouldLoadResult
     * NOTE: Hi, AMO reviewer! Maybe you know a better solution?:)
     *
     * @param requestUrl        Request URL
     * @param requestType       Request content type
     * @param shouldLoadResult  Result of the "shouldLoad" call
     * @param aContext          aContext from the "shouldLoad"" call
     */
    _saveLastRequestProperties: function (requestUrl, requestType, shouldLoadResult, aContext) {
        this.lastRequestProperties = {
            requestUrl: requestUrl,
            requestType: requestType,
            shouldLoadResult: shouldLoadResult
        };

        // Also check if window has an "opener" and save it to request properties
        if (requestType !== RequestTypes.DOCUMENT) {
            return;
        }

        var window = aContext.contentWindow || aContext;
        if (window.top === window && window.opener && window.opener !== window) {
            var openerXulTab = WebRequestHelper.getTabForContext(window.opener);
            if (openerXulTab) {
                var tabId = adguard.tabsImpl.getTabIdForTab(openerXulTab);
                this.lastRequestProperties.openerTab = {tabId: tabId};
            }
        }
    },

    /**
     * Checks if request should be blocked with $popup rule
     *
     * @param requestUrl Request URL
     * @param sourceTab Source tab
     * @private
     */
    _checkPopupRule: function (requestUrl, sourceTab) {

        if (!UrlUtils.isHttpRequest(requestUrl)) {
            return false;
        }

        var tabUrl = framesMap.getFrameUrl(sourceTab, 0);

        var requestRule = adguard.webRequestService.getRuleForRequest(sourceTab, requestUrl, tabUrl, RequestTypes.POPUP);
        var requestBlocked = adguard.webRequestService.isRequestBlockedByRule(requestRule);
        if (requestBlocked) {
            //add log event and fix log event type from POPUP to DOCUMENT
            adguard.webRequestService.postProcessRequest(sourceTab, requestUrl, tabUrl, RequestTypes.DOCUMENT, requestRule);
        }

        return requestBlocked;
    },

    /**
     * nsIFactory implementation
     *
     * @param outer
     * @param iid
     * @returns {*}
     */
    createInstance: function (outer, iid) {
        if (outer) {
            throw Cr.NS_ERROR_NO_AGGREGATION;
        }
        return this.QueryInterface(iid);
    },

    /**
     * In case if request is blocked by SafebrowsingFilter we redirect user to Access Denied page.
     *
     * @param requestUrl    Request URL
     * @param tab           Tab
     * @private
     */
    _filterSafebrowsing: function (requestUrl, tab) {

        //TODO: check for not http
        if (framesMap.isTabAdguardDetected(tab) ||
            framesMap.isTabProtectionDisabled(tab) ||
            framesMap.isTabWhiteListedForSafebrowsing(tab)) {
            return;
        }

        // Firefox review doesn't allow to send information about visited HTTPS URLs to remote servers
        if (requestUrl && requestUrl.indexOf("https://") === 0) {
            return;
        }

        var referrerUrl = Utils.getSafebrowsingBackUrl(tab);
        var incognitoTab = framesMap.isIncognitoTab(tab);

        antiBannerService.checkSafebrowsingFilter(requestUrl, referrerUrl, function (safebrowsingUrl) {
            adguard.tabs.reload(tab.tabId, safebrowsingUrl);
        }, incognitoTab);
    },

    /**
     * Blocking rule found. Collapsing the element.
     *
     * @param node Node to collapse
     * @param requestType Request type (got from nsIHttpChannel)
     * @private
     */
    _collapseElement: function (node, requestType) {
        if (node && node.ownerDocument && RequestTypes.isVisual(requestType)) {
            //ElemHide.collapseNode(node);
        }
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIObserver, Ci.nsIChannelEventSink, Ci.nsIFactory, Ci.nsISupportsWeakReference])
};