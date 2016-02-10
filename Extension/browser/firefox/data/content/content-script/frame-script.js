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

(function (context) {

    'use strict';

    /**
     * This script is registered by "loadFrameScript" everywhere.
     * It decides whether we should load our content scripts to the loaded DOMWindow.
     */
    var {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
    var Services = Cu.import("resource://gre/modules/Services.jsm", {}).Services;

    // Used for sandbox creation
    var nextSandboxId = 0;

    var registeredScripts = [];
    var i18nMessages = Object.create(null);

    var addChromeMessageListener = (function () {

        var contentListeners = [];

        var onMessageFromChrome = function (message) {
            for (var i = 0; i < contentListeners.length; i++) {
                contentListeners[i](JSON.stringify(message.data));
            }
        };
        context.addMessageListener('Adguard:on-message-channel', onMessageFromChrome);

        return {
            addListener: function (listener) {
                contentListeners.push(listener);
            },
            unload: function () {
                context.removeMessageListener('Adguard:on-message-channel', onMessageFromChrome);
            }
        };

    })();

    var sendMessageToChrome = (function () {

        var callbackId = 0;
        var callbacks = Object.create(null);

        var onMessageFromChrome = function (response) {
            var message = response.data;
            var callback = callbacks[message.callbackId];
            if (callback) {
                callback(JSON.stringify(message));
                delete callbacks[message.callbackId];
            }
        };
        context.addMessageListener('Adguard:send-message-channel', onMessageFromChrome);

        function sendMessage(message, callback) {
            if (callback) {
                callbackId++;
                callbacks[callbackId] = callback;
                message.callbackId = callbackId;
            }
            context.sendAsyncMessage('Adguard:send-message-channel', message);
        }

        return {
            sendMessage: sendMessage,
            unload: function () {
                context.removeMessageListener('Adguard:send-message-channel', onMessageFromChrome);
            }
        };

    })();

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

    var injectScripts = function (runAt, win) {

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

        var scripts = registeredScripts.filter(filter);
        if (scripts.length == 0) {
            return;
        }

        var sandbox = createSandbox(win, url);

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            runScriptInSandbox(script, sandbox);
        }
    };

    /**
     * Creates sandbox object which will be a principal object for the content scripts.
     *
     * @param win Window to be sandboxed
     * @param url Window URL
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

        sandbox.addChromeMessageListener = addChromeMessageListener.addListener;
        sandbox.sendMessageToChrome = sendMessageToChrome.sendMessage;

        // Expose localization API
        sandbox.i18nMessageApi = function (messageId) {
            return i18nMessages[messageId];
        };

        return sandbox;
    };

    var runScriptInSandbox = function (script, sandbox) {
        var files = script.files;
        for (var i = 0; i < files.length; i++) {
            var file = script.files[i];
            Services.scriptloader.loadSubScript(file, sandbox, 'UTF-8');
        }
    };

    var onDocumentEnd = function (event) {

        //TODO: implement

        var contentWin = event.target.defaultView;

        // Remove event listeners
        contentWin.removeEventListener('DOMContentLoaded', onDocumentEnd, true);

        injectScripts('document_end', contentWin);
    };

    var onDocumentStart = function (win) {

        win.addEventListener('DOMContentLoaded', onDocumentEnd, true);

        injectScripts('document_start', win);
    };

    var documentObserver = (function () {

        var TOPIC = 'document-element-inserted';
        var callbacks = new WeakMap();

        var contentObserver = {
            observe: function (subject, topic) {

                switch (topic) {
                    case TOPIC:
                        var doc = subject;
                        var win = doc && doc.defaultView;
                        if (!doc || !win) return;
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

        Services.obs.addObserver(contentObserver, TOPIC, false);

        return {
            onNewDocument: function (topWindow, callback) {
                callbacks.set(topWindow, callback);
            },
            unload: function () {
                Services.obs.removeObserver(contentObserver, TOPIC);
            }
        };

    })();

    var onWindowCreated = function () {
        documentObserver.onNewDocument(context.content, onDocumentStart);
    };

    /**
     * Fires when the frame script environment is shut down, i.e. when a tab gets closed.
     */
    var onUnload = function (ev) {
        console.log('unload');
        if (ev.target !== context) {
            return;
        }
        // TODO: Clean up
        documentObserver.unload();
        addChromeMessageListener.unload();
        sendMessageToChrome.unload();
        console.log('unload done');
    };

    /**
     * Entry point
     */
    var initFrameScript = function () {

        var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsISyncMessageSender);
        registeredScripts = cpmm.sendSyncMessage('adguard:update-content-scripts')[0];
        i18nMessages = cpmm.sendSyncMessage('adguard:get-i18n-messages')[0];

        context.addEventListener('DOMWindowCreated', onWindowCreated);

        // Clean up on frame script unload
        context.addEventListener('unload', onUnload);
    };

    initFrameScript();

})(this);