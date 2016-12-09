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

/* global Components, WeakMap */

var EXPORTED_SYMBOLS = [ // jshint ignore:line
    'frameScriptMetadata',
    'contentPolicyService',
    'interceptHandler',
    'LocationChangeListener',
    'documentObserver',
    'unloadModule'
];

var Ci = Components.interfaces;
var Cu = Components.utils;
var Cr = Components.results;
var Cc = Components.classes;
var Cm = Components.manager;

var Services = Cu.import("resource://gre/modules/Services.jsm").Services;
var XPCOMUtils = Cu.import('resource://gre/modules/XPCOMUtils.jsm').XPCOMUtils;

// https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Message_Manager/Process_scripts#Retrieving_the_content_frame_message_manager_for_a_content_window
function contentMMFromContentWindow(win) {
    var iface = win
        .QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIDocShell)
        .sameTypeRootTreeItem
        .QueryInterface(Ci.nsIDocShell)
        .QueryInterface(Ci.nsIInterfaceRequestor);
    return iface.getInterface(Ci.nsIContentFrameMessageManager);
}

function contentMMFromContentWindow2(aContentWindow) {
    return aContentWindow.QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIDocShell)
        .QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIContentFrameMessageManager);
}

function getMessageManager(win) {
    try {
        return contentMMFromContentWindow(win);
    } catch (ex) {
        // It appears. NS_NOINTERFACE: Component returned failure code: 0x80004002 (NS_NOINTERFACE)
        try {
            return contentMMFromContentWindow2(win);
        } catch (ex1) {
            //
        }
    }
    return null;
}

function sendMessage(messageManager, name, message) {
    if (typeof messageManager.sendRpcMessage === 'function') {
        return messageManager.sendRpcMessage(name, message);
    } else {
        return messageManager.sendSyncMessage(name, message);
    }
}

var frameScriptMetadata = (function () {

    var response = null;

    function retrieve() {
        if (response === null) {
            // Note that we request for nsISyncMessageSender implementation as now we use sendSyncMessage method
            var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsISyncMessageSender);
            if (typeof cpmm.sendRpcMessage === 'function') {
                response = cpmm.sendRpcMessage('Adguard:initialize-frame-script');
            } else {
                // Compatibility with older FF versions and PaleMoon
                response = cpmm.sendSyncMessage('Adguard:initialize-frame-script');
            }
        }
        return response[0];
    }

    var getScripts = function () {
        return retrieve().scripts;
    };

    var getI18nMessages = function () {
        return retrieve().i18nMessages;
    };

    var reset = function () {
        response = null;
    };

    return {
        getScripts: getScripts,
        getI18nMessages: getI18nMessages,
        reset: reset
    };

})();

var contentPolicyService = {

    classDescription: 'Adguard content policy',
    classID: Components.ID('a2529c29-40aa-4ce6-9d97-74e498140583'),
    contractID: '@adguard.com/adg/policy;1',

    ACCEPT: Ci.nsIContentPolicy.ACCEPT,
    REJECT: Ci.nsIContentPolicy.REJECT_REQUEST,

    TYPE_DOCUMENT: Ci.nsIContentPolicy.TYPE_DOCUMENT,
    TYPE_SUBDOCUMENT: Ci.nsIContentPolicy.TYPE_SUBDOCUMENT,
    TYPE_WEBSOCKET: Ci.nsIContentPolicy.TYPE_WEBSOCKET,

    get componentRegistrar() {
        return Cm.QueryInterface(Ci.nsIComponentRegistrar);
    },

    get categoryManager() {
        return Cc['@mozilla.org/categorymanager;1'].getService(Ci.nsICategoryManager);
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIContentPolicy, Ci.nsISupportsWeakReference]),

    createInstance: function (outer, iid) {
        if (outer) {
            throw Cr.NS_ERROR_NO_AGGREGATION;
        }
        return this.QueryInterface(iid);
    },

    register: function () {

        this.componentRegistrar.registerFactory(
            this.classID,
            this.classDescription,
            this.contractID,
            this
        );
        this.categoryManager.addCategoryEntry(
            'content-policy',
            this.contractID,
            this.contractID,
            false,
            true
        );
    },

    unregister: function () {
        this.componentRegistrar.unregisterFactory(this.classID, this);
        this.categoryManager.deleteCategoryEntry(
            'content-policy',
            this.contractID,
            false
        );
    },

    shouldLoad: function (contentType, contentLocation, requestOrigin, aContext) {

        // Sometimes global scope unexpectedly becomes uninitialized
        // It appears on extension restart
        if (Services === undefined) {
            return this.ACCEPT;
        }

        if (!aContext && contentType !== this.TYPE_WEBSOCKET) {
            // Context could be empty in case of WebSocket requests:
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/334
            return this.ACCEPT;
        }

        if (contentType === this.TYPE_DOCUMENT) {
            this.handlePopup(contentLocation, requestOrigin, aContext);
        }

        if (contentType === this.TYPE_DOCUMENT) {
            aContext = aContext.contentWindow || aContext;
        } else if (contentType === this.TYPE_SUBDOCUMENT) {
            aContext = aContext.contentWindow;
        } else {
            aContext = (aContext.ownerDocument || aContext).defaultView;
        }

        if (!aContext) {
            return this.ACCEPT;
        }

        // The context for the toolbar popup is an iframe element here,
        // so check context.top instead of context
        if (!aContext.top || !aContext.location) {
            return this.ACCEPT;
        }

        var messageManager = getMessageManager(aContext);
        if (messageManager === null) {
            return this.ACCEPT;
        }

        var isTopFrame = aContext === aContext.top;
        var parentFrameId;
        if (isTopFrame) {
            parentFrameId = -1;
        } else if (aContext.parent === aContext.top) {
            parentFrameId = 0;
        } else {
            parentFrameId = this.getFrameId(aContext.parent);
        }

        var requestDetails = {
            frameId: isTopFrame ? 0 : this.getFrameId(aContext),
            parentFrameId: parentFrameId,
            url: contentLocation.asciiSpec,
            type: contentType
        };

        // Save referrer to details
        if (requestOrigin && requestOrigin.asciiSpec && requestOrigin.asciiSpec.indexOf('http') === 0) {
            requestDetails.referrerUrl = requestOrigin.asciiSpec;
        }

        sendMessage(messageManager, 'Adguard:should-load', requestDetails);

        return this.ACCEPT;
    },

    handlePopup: function (contentLocation, requestOrigin, aContext) {

        var sourceContext = aContext.contentWindow || aContext;
        if (!sourceContext.opener || sourceContext.opener === aContext) {
            return;
        }

        var sourceUrl = null;
        try {
            var opener = sourceContext.opener.top || sourceContext.opener;
            sourceUrl = opener.location && opener.location.href;
        } catch (ex) {
        }
        // Use origin url
        if (sourceUrl === null) {
            sourceUrl = requestOrigin.asciiSpec;
        }

        var messageManager = getMessageManager(sourceContext);
        if (messageManager === null) {
            return;
        }
        var details = {
            targetUrl: contentLocation.asciiSpec,
            sourceUrl: sourceUrl
        };

        sendMessage(messageManager, 'Adguard:navigation-target-created', details);
    },

    getFrameId: function (win) {
        return win
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowUtils)
            .outerWindowID;
    }
};

var LocationChangeListener = function (docShell, webProgress) {
    var mm = docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIContentFrameMessageManager);
    if (!mm || typeof mm.sendAsyncMessage !== 'function') {
        return;
    }
    this.messageManager = mm;
    webProgress.addProgressListener(this, Ci.nsIWebProgress.NOTIFY_LOCATION);
};

LocationChangeListener.prototype.QueryInterface = XPCOMUtils.generateQI([
    'nsIWebProgressListener',
    'nsISupportsWeakReference'
]);

LocationChangeListener.prototype.onLocationChange = function (webProgress, request, location, flags) {
    if (!webProgress.isTopLevel) {
        return;
    }
    this.messageManager.sendAsyncMessage('Adguard:tab-updated', {
        url: location.asciiSpec,
        flags: flags
    });
};

/**
 * Handler that intercepts requests to about:adg-intercept.
 * Read here for details: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIAboutModule
 *
 * So this class intercepts requests to this about:adg-intercept and it replaces a channel with out implementation.
 * Inspired by ABP element hiding logic.
 */
var interceptHandler = {

    classDescription: "Adguard element hiding protocol handler",
    classID: Components.ID("{de83ff7c-38a1-49d4-95a0-518ac6b642fd}"),
    contractID: '@mozilla.org/network/protocol/about;1?what=adg-intercept',

    get principalService() {
        return Cc["@mozilla.org/systemprincipal;1"].getService(Ci.nsIPrincipal);
    },

    get componentRegistrar() {
        return Cm.QueryInterface(Ci.nsIComponentRegistrar);
    },

    /**
     * Registers handler
     */
    register: function () {

        this.componentRegistrar.registerFactory(
            this.classID,
            this.classDescription,
            this.contractID,
            this
        );
    },

    unregister: function () {
        this.componentRegistrar.unregisterFactory(this.classID, this);
    },

    getURIFlags: function () {
        return ("HIDE_FROM_ABOUTABOUT" in Ci.nsIAboutModule ? Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT : 0) | Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT; // jshint ignore:line
    },

    createInstance: function (outer, iid) {
        if (outer) {
            throw Cr.NS_ERROR_NO_AGGREGATION;
        }

        return this.QueryInterface(iid);
    },

    newChannel: function (uri, loadInfo) {
        return new HidingChannel(uri, loadInfo);
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory, Ci.nsIAboutModule])
};


function HidingChannel(uri, loadInfo) {
    this.URI = this.originalURI = uri;
    this.loadInfo = loadInfo;
}

/**
 * nsIChannel implementation which is able to hide elements blocked by CSS rules.
 * Inspired by ABP element hiding logic.
 */
HidingChannel.prototype = {

    URI: null,
    originalURI: null,
    contentCharset: "utf-8",
    contentLength: 0,
    contentType: "text/xml",
    owner: interceptHandler.principalService,
    securityInfo: null,
    notificationCallbacks: null,
    loadFlags: 0,
    loadGroup: null,
    name: null,
    status: Cr.NS_OK,

    notHideData: "<bindings xmlns='http://www.mozilla.org/xbl'><binding id='dummy' bindToUntrustedContent='true'/></bindings>",
    // The element will be collapsed because of empty binding (it does not contain dummy element which is requested by the URL)
    hideData: "<bindings xmlns='http://www.mozilla.org/xbl'/>",

    asyncOpen: function (listener, context) {
        var data = this.getBindingsContent();
        var stream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        stream.setData(data, data.length);
        try {
            listener.onStartRequest(this, context);
        } catch (e) {
            // Ignore
        }
        try {
            listener.onDataAvailable(this, context, stream, 0, stream.available());
        } catch (e) {
            // Ignore
        }
        try {
            listener.onStopRequest(this, context, Cr.NS_OK);
        } catch (e) {
            // Ignore
        }
    },

    asyncOpen2: function (listener) {
        this.checkPrincipal();
        this.asyncOpen(listener, null);
    },

    open: function () {
        //var data = this.getBindingsContent();
        //var stream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        //stream.setData(data, data.length);
        //return stream;
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },

    open2: function () {
        this.checkPrincipal();
        return this.open();
    },

    checkPrincipal: function () {
        if (!this.loadInfo.triggeringPrincipal.equals(interceptHandler.principalService)) {
            throw Cr.NS_ERROR_FAILURE;
        }
    },

    getBindingsContent: function () {
        var win = this.getOwnerWindow(this);
        if (!win) {
            return this.notHideData;
        }
        var messageManager = getMessageManager(win);
        if (!messageManager) {
            return this.notHideData;
        }
        var result = sendMessage(messageManager, 'Adguard:elemhide-interceptor', {
            path: this.URI.path
        })[0];
        return result && result.collapse === true ? this.hideData : this.notHideData;
    },

    getOwnerWindow: function (channel) {
        try {
            if (channel.notificationCallbacks) {
                return channel.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
            }
        } catch (e) {
        }
        try {
            if (channel.loadGroup && channel.loadGroup.notificationCallbacks) {
                return channel.loadGroup.notificationCallbacks.getInterface(Ci.nsILoadContext).associatedWindow;
            }
        } catch (e) {
        }

        return null;
    },

    isPending: function () {
        return false;
    },
    cancel: function () {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    suspend: function () {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },
    resume: function () {
        throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIChannel, Ci.nsIRequest])
};

/**
 * Object that wraps nsiObserver and handles observer notifications.
 *
 * We use it for handling "document-element-inserted" event:
 * https://developer.mozilla.org/en/docs/Observer_Notifications
 *
 * We can't simply use DOMWindowCreated event as all content scripts need a "document" to be executed.
 */
var documentObserver = (function () {

    var OBS_TOPIC = 'document-element-inserted';
    var callbacks = new WeakMap();

    /**
     * nsiObserver implementation: https://developer.mozilla.org/ru/docs/nsIObserver
     */
    var contentObserver = {
        observe: function (subject, topic) {

            switch (topic) {
                case OBS_TOPIC:
                    var doc = subject;
                    var win = doc && doc.defaultView;
                    if (!doc || !win) {
                        return;
                    }
                    var topWin = win.top;

                    var frameCallback = callbacks.get(topWin);
                    if (frameCallback) {
                        frameCallback(win);
                    }
                    break;
            }
        },
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver, Ci.nsISupportsWeakReference])
    };

    /**
     * Called when new document element was just created
     *
     * @param topWindow Top window object
     * @param callback  Method called when document element was just created
     */
    var onNewDocument = function (topWindow, callback) {
        callbacks.set(topWindow, callback);
    };

    /**
     * Called on frame script unload
     */
    var unregister = function () {
        Services.obs.removeObserver(contentObserver, OBS_TOPIC);
    };

    Services.obs.addObserver(contentObserver, OBS_TOPIC, false);

    return {
        onNewDocument: onNewDocument,
        unregister: unregister
    };

})();

var unloadModule = function () { // jshint ignore:line
    frameScriptMetadata.reset();
    contentPolicyService.unregister();
    interceptHandler.unregister();
    documentObserver.unregister();
};

contentPolicyService.register();
interceptHandler.register();