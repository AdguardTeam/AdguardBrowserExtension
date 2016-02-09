/* global sendSyncMessage */
/* global addMessageListener */
/* global Components */
/* global content */
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

/**
 * This script is registered by "loadFrameScript" everywhere.
 * It decides whether we should load our content scripts to the loaded DOMWindow.
 */
var {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
var Services = Cu.import("resource://gre/modules/Services.jsm", {}).Services;
var console = Cu.import('resource://gre/modules/devtools/Console.jsm', {}).console;

// Used for sandbox creation
var nextSandboxId = 0;

// Map object for pages scripts
var pagesScriptsMap = Object.create(null);

// Logger
var Log = {
    debug: function (message) {
        var now = new Date();
        console.error(now.toISOString() + ": " + message);
    }
};

var registeredScripts = [];
// JSON for localized strings (look at initI18n method)
var i18nMessages = Object.create(null);

(function () {
    var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsISyncMessageSender);
    registeredScripts = cpmm.sendSyncMessage('adguard:update-content-scripts')[0];
    i18nMessages = cpmm.sendSyncMessage('adguard:get-i18n-messages')[0];
})();

//var registerChromeContentScript = function (url, paths) {
//    pagesScriptsMap[url] = paths;
//};

//var registerPageScripts = function () {
//    registerChromeContentScript('chrome://adguard/content/filter-download.html', [
//        'libs/jquery-1.8.3.js',
//        'libs/nprogress.patched.js',
//        'pages/i18n.js',
//        'pages/script.js',
//        'pages/filter-download.js'
//    ]);
//
//    //registerChromeContentScript('chrome://adguard/content/thankyou.html', [
//    //    'libs/jquery-1.8.3.min.js',
//    //    'pages/i18n.js',
//    //    'pages/script.js',
//    //    'pages/thankyou.js'
//    //]);
//
//    //TODO: Add other pages
//};

//TODO: move to another file
var onNewDocument = (function () {

    var callbacks = new WeakMap();

    var OBSERVED_TOPIC = 'document-element-inserted';

    var contentObserver = {

        observe: function (subject, topic) {

            switch (topic) {
                case OBSERVED_TOPIC:
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
        }
    };

    Services.obs.addObserver(contentObserver, OBSERVED_TOPIC, false);

    return function (topWindow, callback) {
        callbacks.set(topWindow, callback);
    }

})();

var runScripts = (function () {

    function schemeForWin(aContentWin) {
        return aContentWin.document.location.protocol;
    }

    function urlForWin(aContentWin) {
        // See #1970
        // When content does (e.g.) history.replacestate() in an inline script,
        // the location.href changes between document-start and document-end time.
        // But the content can call replacestate() much later, too.  The only way to
        // be consistent is to ignore it.  Luckily, the  document.documentURI does
        // _not_ change, so always use it when deciding whether to run scripts.
        return aContentWin.document.documentURI;
        // But ( #1631 ) ignore user/pass in the URL.
        //return url.replace(gStripUserPassRegexp, '$1');
    }

    function windowIsTop(aContentWin) {
        try {
            aContentWin.QueryInterface(Ci.nsIDOMWindow);
            if (aContentWin.frameElement) return false;
        } catch (e) {
            var url = 'unknown';
            try {
                url = aContentWin.location.href;
            } catch (e) {
            }
            // Ignore non-DOM-windows.
            dump('Could not QI window to nsIDOMWindow at\n' + url + ' ?!\n');
        }
        return true;
    }

    function injectScripts(runAt, scripts, win) {

        var url = urlForWin(win);
        var isTopWin = windowIsTop(win);
        var scheme = schemeForWin(win);

        var filter = function (script) {
            if (script.runAt != runAt) {
                return false;
            }
            if (!script.allFrames && !isTopWin) {
                return false;
            }
            if (script.schemes.indexOf(scheme) < 0) {
                return false;
            }
            //TODO: fix urls match with parameters
            if (script.url && url != script.url) {
                return false;
            }
            return true;
        };

        scripts = scripts.filter(filter);
        console.log(scripts);

        if (scripts.length == 0) {
            return;
        }

        var sandbox = createSandbox(win, url);

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (isTopWin && script.allFrames) {
                continue;
            }
            runScriptInSandbox(script, sandbox);
        }
    }

    return function (runAt, win) {
        injectScripts(runAt, registeredScripts, win);
    }
})();

/**
 * The DOMWindowCreated event is executed when a Window object has been created.
 * @param event DOMWindowCreated event https://developer.mozilla.org/en-US/docs/Web/Events/DOMWindowCreated
 */
var onDomWindowCreated = function () {
    onNewDocument(content, contentObserver);
};

var contentLoaded = function (event) {

    //TODO: implement

    var contentWin = event.target.defaultView;

    // Remove event listeners
    contentWin.removeEventListener('DOMContentLoaded', contentLoaded, true);
    contentWin.removeEventListener('load', contentLoaded, true);

    runScripts('document_end', contentWin);
};

var contentObserver = function (win) {

    var doc = win.document;
    var url = doc.documentURI;

    win.addEventListener('DOMContentLoaded', contentLoaded, true);
    win.addEventListener('load', contentLoaded, true);

    runScripts('document_start', win);

    ////var window = content;
    //var document = event.target;
    //console.log(document);
    //if (!document || !document.defaultView) {
    //    return;
    //}
    //
    //var window = document.defaultView;
    //
    ////console.log(window);
    ////console.log(window.document);
    ////console.log(window.document.documentElement);
    //
    //if (!window || !window.location) {
    //    return;
    //}
    //
    //var location = window.location;
    //if (!location || !location.href) {
    //    return;
    //}
    //
    //if (location.protocol == 'http:' || location.protocol == 'https:') {
    //    //attachContentScripts(window, ['content-script/preload.js']);
    //    // TODO: Add other scripts
    //} else if (location.protocol == 'chrome:') {
    //    attachContentScripts(window, pagesScriptsMap[location.href]);
    //}
};

/**
 * Fires when the frame script environment is shut down, i.e. when a tab gets closed.
 */
var onUnload = function () {
    // TODO: Clean up
};

var onMessageApi = (function () {

    var contentListeners = [];

    var onMessageFromChrome = function (message) {
        for (var i = 0; i < contentListeners.length; i++) {
            contentListeners[i](message.data);
        }
    };
    addMessageListener('adguard:on-message-channel', onMessageFromChrome);

    return {
        addListener: function (listener) {
            contentListeners.push(listener);
        }
    }
})();

var sendMessageApi = (function () {

    var callbackId = 0;
    var callbacks = Object.create(null);

    var onMessageFromChrome = function (response) {
        var message = response.data;
        var callback = callbacks[message.callbackId];
        if (callback) {
            callback(message);
            delete callbacks[message.callbackId];
        }
        console.log('Received message from chrome');
        console.log(message);
    };
    addMessageListener('adguard:send-message-channel', onMessageFromChrome);

    function sendMessageImpl(message, callback) {
        if (callback) {
            callbackId++;
            callbacks[callbackId] = callback;
            message.callbackId = callbackId;
        }
        console.log('Send message to chrome');
        console.log(message);
        sendAsyncMessage('adguard:send-message-channel', message);
    }

    return sendMessageImpl;

})();


/**
 * Creates sandbox object which will be a principal object for the content scripts.
 *
 * @param win Window to be sandboxed
 */
var createSandbox = function (win, url) {

    /**
     * A string value which identifies the sandbox in about:memory (and possibly other places in the future).
     *
     * This property is optional, but very useful for tracking memory usage of add-ons and other JavaScript compartments.
     * A recommended value for this property is an absolute path to the script responsible for creating the sandbox.
     * As of Gecko 13 (Firefox 13.0 / Thunderbird 13.0 / SeaMonkey 2.10), if you don't specify a sandbox name it
     * will default to the caller's filename.
     */
    //var isIframe = win.top != win;
    var sandboxName = '[' + (nextSandboxId++) + ']' + url;

    // "content" is a DOM window here 
    // Creating "expanded" sandbox from it: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.Sandbox#Expanded_principal
    var sandbox = Cu.Sandbox(win, {
        sandboxName: sandboxName,
        sameZoneAs: win,
        sandboxPrototype: win,
        wantComponents: false
    });

    //// Expose messaging API
    //sandbox.addFrameEventListener = function (name, listener) {
    //    Log.debug(name + ': addFrameEventListener');
    //    addMessageListener(name, listener);
    //};
    //sandbox.sendFrameEvent = function (name, message) {
    //    Log.debug(name + ': sendFrameEvent ' + message);
    //    sendAsyncMessage(name, message);
    //};

    sandbox.onMessageApi = onMessageApi;
    sandbox.sendMessageApi = sendMessageApi;

    // Expose localization API
    sandbox.i18nMessageApi = function (messageId) {
        return i18nMessages[messageId];
    };

    Log.debug('Attaching content scripts to ' + sandboxName);

    return sandbox;
};

var runScriptInSandbox = function (script, sandbox) {
    var files = script.files;
    for (var i = 0; i < files.length; i++) {
        var file = script.files[i];
        Services.scriptloader.loadSubScript(file, sandbox, 'UTF-8');
    }
};

/**
 * Attaches specified content scripts to the current DOM window.
 *
 * @param window  Window to attach to
 * @param scripts Array with scripts relative path
 */
//var attachContentScripts = function (window, scripts) {
//    if (!scripts || scripts.length == 0) {
//        return;
//    }
//
//    try {
//
//        // Creating sandbox wrapper for window object
//        var sandbox = createSandbox(window);
//
//        console.log('Loading content scripts..');
//        // Executing i18n-helper.js and content-script.js for every content script.
//        // These two scripts contains helper functions for messaging and localization.
//        Services.scriptloader.loadSubScript('chrome://adguard/content/content-script/i18n-helper.js', sandbox);
//        Services.scriptloader.loadSubScript('chrome://adguard/content/content-script/content-script.js', sandbox);
//
//        console.log('Loading additional content scripts..' + scripts.length);
//
//        // Executing content scripts specified in "scripts" parameter
//        for (var i = 0; i < scripts.length; i++) {
//            var scriptPath = 'chrome://adguard/content/' + scripts[i];
//            console.log('Attaching script:' + scriptPath);
//            Services.scriptloader.loadSubScript(scriptPath, sandbox);
//        }
//
//        console.log('All content scripts loaded.');
//    } catch (ex) {
//        console.error(ex);
//    }
//};

///**
// * Initialize a JSON object with translations
// */
//var initI18n = function () {
//    // Randomize URI to work around bug 719376
//    var stringBundle = Services.strings.createBundle('chrome://adguard/locale/messages.properties?' + Math.random());
//
//    // MDN says getSimpleEnumeration returns nsIPropertyElement // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle#getSimpleEnumeration%28%29
//    var props = stringBundle.getSimpleEnumeration();
//
//    var msgCount = 0;
//    while (props.hasMoreElements()) {
//        var prop = props.getNext();
//        var propEl = prop.QueryInterface(Ci.nsIPropertyElement);
//        var key = propEl.key;
//        i18nMessages[key] = propEl.value;
//        msgCount++;
//    }
//
//    Log.debug('Initialized with ' + msgCount + ' messages');
//};

/**
 * Entry point
 */
var initFrameScript = function () {

    //// First of all, init translation
    //initI18n();

    // Register page scripts
    //registerPageScripts();

    addEventListener('DOMWindowCreated', onDomWindowCreated);
    if (content) {
        onDomWindowCreated();
    }

    //// Listen to DOMWindowCreated and execute content scripts for newly created windows
    //addEventListener('DOMWindowCreated', function (event) {
    //    onDomWindowCreated(event);
    //});

    // Clean up on frame script unload
    addEventListener('unload', function () {
        onUnload();
    });
};

initFrameScript();