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
var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

var tabUtils = require('sdk/tabs/utils');
var unload = require('sdk/system/unload');
var events = require('sdk/system/events');

var {Log} = require('utils/log');
var {EventNotifier} = require('utils/notifier');
var {EventNotifierTypes, ConcurrentUtils} = require('utils/common');
var WebRequestService = require('filter/request-blocking').WebRequestService;

/**
 * Helper object to work with web requests.
 */
var WebRequestHelper = exports.WebRequestHelper = {

    ACCEPT: Ci.nsIContentPolicy.ACCEPT,
    REJECT: Ci.nsIContentPolicy.REJECT_REQUEST,

    nonVisualContentTypes: {
        2: true, //TYPE_SCRIPT
        4: true, //TYPE_STYLESHEET
        11: true,//TYPE_XMLHTTPREQUEST
        12: true,//TYPE_OBJECT_SUBREQUEST
        14: true //TYPE_FONT
    },

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
     * Checks if request content type is visual (image/document/object/etc)
     *
     * @param contentType Request content type
     */
    isVisualContentType: function (contentType) {
        return !(contentType in WebRequestHelper.nonVisualContentTypes);
    },

    /**
     * Gets request type string representation
     *
     * @param contentType   Request content type
     */
    getRequestType: function (contentType) {

        var t = WebRequestHelper.contentTypes;
        switch (contentType) {
            case t.TYPE_DOCUMENT:
                return "DOCUMENT";
            case t.TYPE_SCRIPT:
                return "SCRIPT";
            case t.TYPE_IMAGE:
                return "IMAGE";
            case t.TYPE_STYLESHEET:
                return "STYLESHEET";
            case t.TYPE_OBJECT:
                return "OBJECT";
            case t.TYPE_SUBDOCUMENT:
                return "SUBDOCUMENT";
            case t.TYPE_XMLHTTPREQUEST:
                return "XMLHTTPREQUEST";
            default:
                return "OTHER";
        }
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
                context = null;
            }
        }

        // If we have a window now - get the tab
        if (context && context instanceof Ci.nsIDOMWindow) {
            return tabUtils.getTabForContentWindow(context.top);
        }
        return null;
    },

    /**
     * Gets window for channel
     *
     * @param channel channel
     * @returns {*}
     */
    getWndForChannel: function (channel) {
        try {
            if (channel.notificationCallbacks) {
                return channel.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
            }
        } catch (e) {
            //ignore this error
            //TODO: fix
            Log.debug("Error retrieve associatedWindow from channel.notificationCallbacks, cause {0}", e);
        }
        try {
            if (channel.loadGroup && channel.loadGroup.notificationCallbacks) {
                return channel.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
            }
        } catch (e) {
            //ignore this error
            //TODO: fix
            Log.debug("Error retrieve associatedWindow from channel.loadGroup.notificationCallbacks, cause {0}", e);
        }
        return null;
    },

    getTabIdForChannel: function (channel) {
        var win = this.getWndForChannel(channel);
        if (!win) {
            return null;
        }
        var xulTab = this.getTabForContext(win);
        if (!xulTab) {
            return null;
        }
        return tabUtils.getTabId(xulTab);
    },

    /**
     * Gets ASCII url
     *
     * @param url   URL
     * @returns Url (ASCII)
     */
    getUrlAscii: function (url) {
        if (/^[\x00-\x7F]+$/.test(url)) {
            return url;
        }
        try {
            return ioService.newURI(url, null, null).asciiSpec;
        } catch (ex) {
            return url;
        }
    },

    assignContentTypeToRequest: function (request, contentType) {
        if (request instanceof Ci.nsIWritablePropertyBag) {
            request.setProperty("lastRequestContentType", contentType);
        }
    },

    retrieveContentTypeFromRequest: function (request) {
        var contentType;
        if (request instanceof Ci.nsIPropertyBag) {
            try {
                contentType = request.getProperty("lastRequestContentType");
            } catch (ex) {
                //property doesn't exist
                return null;
            }
        }
        return contentType;
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
     * @param contentType
     * @param contentLocation
     * @param requestOrigin
     * @param node
     * @param mimeTypeGuess
     * @param extra
     * @returns {*}
     */
    shouldLoad: function (contentType, contentLocation, requestOrigin, node, mimeTypeGuess, extra) {

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
        var requestType = WebRequestHelper.getRequestType(contentType);

        if (requestType == "DOCUMENT") {
            var context = node.contentWindow || node;
            //check is really main frame
            if (context.top === context) {
                //record frame
                this.framesMap.recordFrame(tab, 0, requestUrl, requestType);
                //reset tab button state
                EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, true);
                //save opener for popup rules
                this._saveContextOpenerTab(context);
                return WebRequestHelper.ACCEPT;
            }
        }

        var block = this._shouldBlockRequest(tab, requestUrl, requestType, node, contentType);

        return block ? WebRequestHelper.REJECT : WebRequestHelper.ACCEPT;
    },

    shouldProcess: function () {
        return WebRequestHelper.ACCEPT;
    },

    /**
     * nsIObserver interface implementation
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

    _httpOnExamineResponse: function (subject) {

        if (!(subject instanceof Ci.nsIHttpChannel)) {
            return;
        }

        var win = WebRequestHelper.getWndForChannel(subject);
        if (!win) {
            return;
        }

        var xulTab = WebRequestHelper.getTabForContext(win);
        if (!xulTab) {
            return;
        }

        var isMainFrame = (subject.loadFlags & subject.LOAD_DOCUMENT_URI) && win.parent == win;

        var tab = {id: tabUtils.getTabId(xulTab)};
        var requestUrl = subject.URI.asciiSpec;
        var responseHeaders = WebRequestHelper.getResponseHeaders(subject);
        //retrieve referrer
        var referrerUrl = this.framesMap.getFrameUrl(tab, 0);
        //retrieve request type
        var contentType = isMainFrame ? WebRequestHelper.contentTypes.TYPE_DOCUMENT : WebRequestHelper.retrieveContentTypeFromRequest(subject);
        var requestType = contentType ? WebRequestHelper.getRequestType(contentType) : null;

        // Sometimes shouldLoad is not called. (e.g. speed dial)
        if (isMainFrame && !this.framesMap.getMainFrame(tab)) {
            //record frame
            this.framesMap.recordFrame(tab, 0, requestUrl, "DOCUMENT");
        }

        this.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        if (isMainFrame) {
            //update tab button state
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, false);
        }

        if (isMainFrame) {
            //safebrowsing check
            this._filterSafebrowsing(requestUrl, tab, xulTab);
        }
    },

    _httpOnOpeningRequest: function (subject) {

        if (!(subject instanceof Ci.nsIHttpChannel)) {
            return;
        }

        var win = WebRequestHelper.getWndForChannel(subject);
        if (!win) {
            return;
        }

        var xulTab = WebRequestHelper.getTabForContext(win);
        if (!xulTab) {
            return;
        }

        var openerTab;
        if (this.lastRequest && subject.URI == this.lastRequest.URI) {
            // Stores lastRequestContentType, it is then used in asyncOnChannelRedirect method
            WebRequestHelper.assignContentTypeToRequest(subject, this.lastRequest.contentType);
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
         * If page URL is whitelisted in standalone Adguard, we should forcibly set Referrer value to this page URL.
         * The problem is that standalone Adguard looks at the page referrer to check if it should bypass this request or not.
         */
        var tab = {id: tabUtils.getTabId(xulTab)};

        if (this.framesMap.isTabAdguardWhiteListed(tab)) {
            //retrieve main frame url
            var frameUrl = this.framesMap.getFrameUrl(tab, 0);
            subject.setRequestHeader('Referer', frameUrl, false);
        }
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

            var contentType = WebRequestHelper.retrieveContentTypeFromRequest(oldChannel);
            if (!contentType) {
                return;
            }

            var win = WebRequestHelper.getWndForChannel(newChannel);
            if (!win) {
                return;
            }

            var xulTab = WebRequestHelper.getTabForContext(win);
            if (!xulTab) {
                return;
            }

            var tab = {id: tabUtils.getTabId(xulTab)};
            var requestUrl = newChannel.URI.asciiSpec;
            var requestType = WebRequestHelper.getRequestType(contentType);

            if (this._shouldBlockRequest(tab, requestUrl, requestType, win.document, contentType)) {
                result = Cr.NS_BINDING_ABORTED;
            }

        } catch (e) {
            // don't throw exceptions
            Log.error('Error processing asyncOnChannelRedirect, cause {0}', e);
        } finally {
            callback.onRedirectVerifyCallback(result);
        }
    },

    /**
     * Checks if request should be blocked
     *
     * @param tab
     * @param requestUrl
     * @param requestType
     * @param node
     * @param contentType
     * @returns {*}
     * @private
     */
    _shouldBlockRequest: function (tab, requestUrl, requestType, node, contentType) {

        var tabUrl = this.framesMap.getFrameUrl(tab, 0);

        var requestRule = this.webRequestService.getRuleForRequest(tab, requestUrl, tabUrl, requestType);
        var requestBlocked = this.webRequestService.isRequestBlockedByRule(requestRule);
        if (requestBlocked) {
            this._collapseElement(node, contentType);
        }
        this.webRequestService.postProcessRequest(tab, requestUrl, tabUrl, requestType, requestRule);

        return requestBlocked;
    },

    /**
     *
     * @param context
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
     *
     * @param requestUrl
     * @param sourceTab
     * @private
     */
    _checkPopupRule: function (requestUrl, sourceTab) {

        var tabUrl = this.framesMap.getFrameUrl(sourceTab, 0);

        var requestRule = this.webRequestService.getRuleForRequest(sourceTab, requestUrl, tabUrl, "POPUP");
        var requestBlocked = this.webRequestService.isRequestBlockedByRule(requestRule);
        if (requestBlocked) {
            //add log event and fix log event type from "POPUP" to "DOCUMENT"
            this.webRequestService.postProcessRequest(sourceTab, requestUrl, tabUrl, "DOCUMENT", requestRule);
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
        if (this.framesMap.isTabAdguardDetected(tab) || this.framesMap.isTabProtectionDisabled(tab) || this.framesMap.isTabWhiteListed(tab)) {
            return;
        }

        // Firefox review doesn't allow to send information about visited HTTPS URLs to remote servers
        if (requestUrl && requestUrl.indexOf("https://") == 0) {
            return;
        }

        this.antiBannerService.getRequestFilter().checkSafebrowsingFilter(requestUrl, function (safebrowsingUrl) {
            tabUtils.setTabURL(xulTab, "chrome://adguard/content/" + safebrowsingUrl);
        });
    },

    /**
     * Blocking rule found. Collapsing the element.
     *
     * @param node
     * @param contentType
     * @private
     */
    _collapseElement: function (node, contentType) {
        if (node && node.ownerDocument && WebRequestHelper.isVisualContentType(contentType)) {
            this.ElemHide.collapseNode(node);
        }
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIObserver, Ci.nsIChannelEventSink, Ci.nsIFactory, Ci.nsISupportsWeakReference])
};


