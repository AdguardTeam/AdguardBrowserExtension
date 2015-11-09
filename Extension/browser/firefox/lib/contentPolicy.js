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
var {Cc, Ci, Cu, Cm, Cr, components} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);

var tabUtils = require('sdk/tabs/utils');
var unload = require('sdk/system/unload');
var events = require('sdk/system/events');

var {Log} = require('utils/log');
var {EventNotifier} = require('utils/notifier');
var {EventNotifierTypes,RequestTypes} = require('utils/common');
var {UrlUtils} = require('utils/url');
var {Utils} = require('utils/common');
var {WebRequestService} = require('filter/request-blocking');
var {WorkaroundUtils} = require('utils/workaround');

/**
 * Helper object to work with web requests.
 */
var WebRequestHelper = exports.WebRequestHelper = {

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
            return tabUtils.getTabForContentWindow(context._contentWindow.top);
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
            return tabUtils.getTabForContentWindow(context.top);
        }
        return null;
    },

    /**
     * Gets tab for specified channel
     *
     * @param channel Channel
     * @returns XUL tab
     */
    getTabForChannel: function (channel) {
        var contextData = this.getChannelContextData(channel);
        if (contextData && contextData.tab) {
            return contextData.tab;
        }
        if (contextData && contextData.browser) {
            if (contextData.browser.contentWindow) {
                //getTabForBrowser() returns null for FF 38 ESR
                return tabUtils.getTabForContentWindow(contextData.browser.contentWindow);
            }

            return tabUtils.getTabForBrowser(contextData.browser);
        }
        return null;
    },

    /**
     * Gets tab id for channel
     * @param channel Channel
     * @returns XUL tab
     */
    getTabIdForChannel: function (channel) {
        var xulTab = this.getTabForChannel(channel);
        if (!xulTab) {
            return null;
        }
        return tabUtils.getTabId(xulTab);
    },

    /**
     * Gets load context from given nsIChannel
     * @param channel nsIChannel implementation
     * @private
     */
    _getLoadContext: function (channel) {
        let loadContext;
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
        let topFrameElement, associatedWindow;
        let spec = channel.URI.spec;
        let loadContext = this._getLoadContext(channel);

        if (loadContext) {
            topFrameElement = loadContext.topFrameElement;
            try {
                // If loadContext is an nsDocShell, associatedWindow is present.
                // Otherwise, if it's just a LoadContext, accessing it will throw
                // NS_ERROR_UNEXPECTED.
                associatedWindow = loadContext.associatedWindow;
            } catch (e) {
            }
        }

        // On e10s (multiprocess, aka electrolysis) Firefox,
        // loadContext.topFrameElement gives us a reference to the XUL <browser>
        // element we need. However, on non-e10s Firefox, topFrameElement is null.

        // More details here:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1113294
        // https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Limitations_of_chrome_scripts#HTTP_requests
        if (topFrameElement) {
            if (!associatedWindow) {
                WorkaroundUtils.setMultiProcessFirefoxMode(true);
            }
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
     * Attaches request type property to the http channel.
     *
     * @param request nsIHttpChannel
     * @param contentType Content type (will be transformed to requestType from RequestTypes enumeration)
     */
    attachRequestType: function (request, contentType) {
        if (request instanceof Ci.nsIWritablePropertyBag) {
            var requestType = this.getRequestType(contentType, request.URI);
            request.setProperty("lastRequestType", requestType);
        }
    },

    /**
     * Gets request type from request properties.
     * This property is attached in http-on-opening-request handler.
     *
     * @param request nsIHttpChannel
     * @returns Content type or null
     */
    retrieveRequestType: function (request) {
        var requestType;
        if (request instanceof Ci.nsIPropertyBag) {
            try {
                requestType = request.getProperty("lastRequestType");
            } catch (ex) {
                // property doesn't exist
                return null;
            }
        }
        return requestType;
    }
};

/**
 * This objects manages HTTP requests filtering.
 *
 * It implements nsIContentPolicy and so it can block requests.
 * It also subscribes to the following events:
 * http-on-examine-response, http-on-examine-cached-response, http-on-examine-merged-response, http-on-opening-request
 */
var WebRequestImpl = exports.WebRequestImpl = {

    classDescription: "Adguard content policy",
    classID: components.ID("f5d18a88-c4b8-40ed-85cc-6cb3fd02268e"),
    contractID: "@adguard.com/adg/policy;1",
    xpcom_categories: ["content-policy", "net-channel-event-sinks"],

    antiBannerService: null,
    adguardApplication: null,
    ElemHide: null,
    framesMap: null,
    filteringLog: null,
    webRequestService: null,

    /**
     * Initialize WebRequest filtering, register is as events listener
     *
     * @param antiBannerService     AntiBannerService object (implements the filtering)
     * @param adguardApplication    AdguardApplication (used for integration with Adguard for Windows/Mac/Android)
     * @param ElemHide              ElemHide object (used to apply CSS rules)
     * @param framesMap             Map with frames data
     * @param filteringLog          Service for log requests
     * @param webRequestService     Request Blocking service
     */
    init: function (antiBannerService, adguardApplication, ElemHide, framesMap, filteringLog, webRequestService) {

        Log.info('Initializing webRequest...');

        this.antiBannerService = antiBannerService;
        this.adguardApplication = adguardApplication;
        this.ElemHide = ElemHide;
        this.framesMap = framesMap;
        this.filteringLog = filteringLog;
        this.webRequestService = webRequestService;

        let registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
        registrar.registerFactory(this.classID, this.classDescription, this.contractID, this);
        for each(let category in this.xpcom_categories) {
            categoryManager.addCategoryEntry(category, this.contractID, this.contractID, false, true);
        }

        var observeListener = this.observe.bind(this);

        events.on("http-on-examine-response", observeListener, true);
        events.on("http-on-examine-cached-response", observeListener, true);
        events.on("http-on-examine-merged-response", observeListener, true);
        events.on("http-on-opening-request", observeListener, true);

        unload.when(function () {

            events.off("http-on-examine-response", observeListener);
            events.off("http-on-examine-cached-response", observeListener);
            events.off("http-on-examine-merged-response", observeListener);
            events.off("http-on-opening-request", observeListener);

            var registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
            for each(let category in WebRequestImpl.xpcom_categories) {
                categoryManager.deleteCategoryEntry(category, this.contractID, false);
            }
            registrar.unregisterFactory(WebRequestImpl.classID, this);

        }.bind(this));
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
     * @param                   node OPTIONAL. The nsIDOMNode or nsIDOMWindow that initiated the request, or something that can Query Interface to one of those; can be null if inapplicable.
     * @param mimeTypeGuess     OPTIONAL. a guess for the requested content's MIME type, based on information available to the request initiator
     *                              (e.g., an OBJECT's type attribute); does not reliably reflect the actual MIME type of the requested content.
     * @param extra             An OPTIONAL argument, pass-through for non-Gecko callers to pass extra data to callees.
     * @param aRequestPrincipal OPTIONAL. defines the principal that caused the load. This is optional only for non-gecko code:
     *                          all gecko code should set this argument. For navigation events, this is the principal of the page
     *                          that caused this load.
     * @returns ACCEPT or REJECT_*
     */
    shouldLoad: function (contentType, contentLocation, requestOrigin, node, mimeTypeGuess, extra, aRequestPrincipal) {

        // Save lastRequest so it can be reused further in http-on-opening-request method
        this.lastRequest = {URI: contentLocation, contentType: contentType};

        if (!node) {
            return WebRequestHelper.ACCEPT;
        }

        var xulTab = WebRequestHelper.getTabForContext(node);
        if (!xulTab) {
            return WebRequestHelper.ACCEPT;
        }

        var tab = {id: tabUtils.getTabId(xulTab)};
        var requestUrl = contentLocation.asciiSpec;
        var requestType = WebRequestHelper.getRequestType(contentType, contentLocation);

        if (requestType == RequestTypes.DOCUMENT) {
            var context = node.contentWindow || node;
            if (context.top === context) {
                this._saveContextOpenerTab(context);
            }
        }

        var block = this._shouldBlockRequest(tab, requestUrl, requestType, node);

        return block ? WebRequestHelper.REJECT : WebRequestHelper.ACCEPT;
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

            var requestType = WebRequestHelper.retrieveRequestType(oldChannel);
            if (!requestType) {
                return;
            }

            var xulTab = WebRequestHelper.getTabForChannel(newChannel);
            if (!xulTab) {
                return;
            }

            var tab = {id: tabUtils.getTabId(xulTab)};
            var requestUrl = newChannel.URI.asciiSpec;

            if (this._shouldBlockRequest(tab, requestUrl, requestType, null)) {
                result = Cr.NS_BINDING_ABORTED;
            }

        } catch (e) {
            // don't throw exceptions
            Log.error('asyncOnChannelRedirect: Error while processing redirect: {0}', e);
        } finally {
            callback.onRedirectVerifyCallback(result);
        }
    },

    /**
     * nsIObserver interface implementation.
     * Learn more here:
     * * https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/Intercepting_Page_Loads#HTTP_Observers
     *
     * @param event - observe event
     */
    observe: function (event) {

        var type = event.type;
        var subject = event.subject;

        switch (type) {
            case "http-on-examine-response":
            case "http-on-examine-cached-response":
            case "http-on-examine-merged-response":
                this._httpOnExamineResponse(subject);
                break;
            case "http-on-opening-request":
                this._httpOnOpeningRequest(subject);
                break;
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

        var xulTab = WebRequestHelper.getTabForChannel(subject);
        if (!xulTab) {
            return;
        }

        var tab = {id: tabUtils.getTabId(xulTab)};
        var requestUrl = subject.URI.asciiSpec;
        var responseHeaders = WebRequestHelper.getResponseHeaders(subject);

        // Get content type
        var isDocument = (subject.loadFlags & subject.LOAD_DOCUMENT_URI);
        var requestType = WebRequestHelper.retrieveRequestType(subject);

        if (!requestType && isDocument) {
            requestType = RequestTypes.DOCUMENT;
        } else if (!requestType) {
            requestType = RequestTypes.OTHER;
        }
        var isMainFrame = (requestType == RequestTypes.DOCUMENT);

        // We record frame data here because shouldLoad is not always called (shouldLoad issue)
        if (isMainFrame) {
            //record frame
            this.framesMap.recordFrame(tab, 0, requestUrl, requestType);
        }

        // Retrieve referrer
        var referrerUrl = this.framesMap.getFrameUrl(tab, 0);

        this.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        if (isMainFrame) {
            //update tab button state
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, false);
            //save ref header
            var headers = WebRequestHelper.getRequestHeaders(subject);
            var refHeader = Utils.findHeaderByName(headers, 'Referer');
            if (refHeader) {
                this.framesMap.recordFrameReferrerHeader(tab, refHeader.value);
            }
        }

        if (isMainFrame) {
            // Do safebrowsing check
            this._filterSafebrowsing(requestUrl, tab, xulTab);
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
        if (this.adguardApplication.isIntegrationRequest(subject.URI.asciiSpec)) {
            var authHeaders = this.adguardApplication.getAuthorizationHeaders();
            for (var i = 0; i < authHeaders.length; i++) {
                subject.setRequestHeader(authHeaders[i].headerName, authHeaders[i].headerValue, false);
            }
            return;
        }

        var xulTab = WebRequestHelper.getTabForChannel(subject);
        if (!xulTab) {
            return;
        }

        var openerTab;
        if (this.lastRequest && subject.URI.asciiSpec == this.lastRequest.URI.asciiSpec) {

            // Stores lastRequestType, it is then used in
            // asyncOnChannelRedirect method and other http observers
            WebRequestHelper.attachRequestType(subject, this.lastRequest.contentType);
            openerTab = this.lastRequest.openerTab;
            this.lastRequest = null;
        }

        //check for opener
        if (openerTab && this._checkPopupRule(subject.URI.asciiSpec, openerTab)) {
            subject.cancel(Cr.NS_BINDING_ABORTED);
            tabUtils.closeTab(xulTab);
            return;
        }

        /**
         * Override request referrer in integration mode
         */
        var tab = {id: tabUtils.getTabId(xulTab)};
        if (this.adguardApplication.shouldOverrideReferrer(tab)) {
            // Retrieve main frame url
            var frameUrl = this.framesMap.getFrameUrl(tab, 0);
            subject.setRequestHeader('Referer', frameUrl, false);
        }
    },

    /**
     * Checks if request should be blocked
     *
     * @param tab Browser tab
     * @param requestUrl Request url
     * @param requestType Request type
     * @param node DOM node
     * @returns {boolean} true if request should be blocked
     * @private
     */
    _shouldBlockRequest: function (tab, requestUrl, requestType, node) {

        if (requestType === RequestTypes.DOCUMENT) {
            return false;
        }

        if (!UrlUtils.isHttpRequest(requestUrl)) {
            return false;
        }

        var tabUrl = this.framesMap.getFrameUrl(tab, 0);

        var requestRule = this.webRequestService.getRuleForRequest(tab, requestUrl, tabUrl, requestType);
        var requestBlocked = this.webRequestService.isRequestBlockedByRule(requestRule);
        if (requestBlocked) {
            this._collapseElement(node, requestType);
        }
        this.webRequestService.postProcessRequest(tab, requestUrl, tabUrl, requestType, requestRule);

        return requestBlocked;
    },

    /**
     *
     * @param context contentWindow for main frame or node
     * @private
     */
    _saveContextOpenerTab: function (context) {
        if (context.opener && context.opener !== context) {
            var openerXulTab = WebRequestHelper.getTabForContext(context.opener);
            if (openerXulTab) {
                this.lastRequest.openerTab = {id: tabUtils.getTabId(openerXulTab)};
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

        var tabUrl = this.framesMap.getFrameUrl(sourceTab, 0);

        var requestRule = this.webRequestService.getRuleForRequest(sourceTab, requestUrl, tabUrl, RequestTypes.POPUP);
        var requestBlocked = this.webRequestService.isRequestBlockedByRule(requestRule);
        if (requestBlocked) {
            //add log event and fix log event type from POPUP to DOCUMENT
            this.webRequestService.postProcessRequest(sourceTab, requestUrl, tabUrl, RequestTypes.DOCUMENT, requestRule);
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
     * @param xulTab        XUL tab
     * @private
     */
    _filterSafebrowsing: function (requestUrl, tab, xulTab) {

        //TODO: check for not http
        if (this.framesMap.isTabAdguardDetected(tab) ||
            this.framesMap.isTabProtectionDisabled(tab) ||
            this.framesMap.isTabWhiteListedForSafebrowsing(tab)) {
            return;
        }

        // Firefox review doesn't allow to send information about visited HTTPS URLs to remote servers
        if (requestUrl && requestUrl.indexOf("https://") == 0) {
            return;
        }

        var frameData = this.framesMap.getMainFrame(tab);
        var referrerUrl = Utils.getSafebrowsingBackUrl(frameData);
        var incognitoTab = this.framesMap.isIncognitoTab(tab);

        this.antiBannerService.getRequestFilter().checkSafebrowsingFilter(requestUrl, referrerUrl, function (safebrowsingUrl) {
            tabUtils.setTabURL(xulTab, "chrome://adguard/content/" + safebrowsingUrl);
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
            this.ElemHide.collapseNode(node);
        }
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIObserver, Ci.nsIChannelEventSink, Ci.nsIFactory, Ci.nsISupportsWeakReference])
};


