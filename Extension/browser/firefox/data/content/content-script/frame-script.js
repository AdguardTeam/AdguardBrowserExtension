/* global Components, XPCOMUtils */
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
 * Adguard's frame script.
 * 
 * This script implements our "content scripts" logic.
 * 1. Injects content scripts to common web pages and to our add-on pages.
 * 2. Manages communication between "chrome" process and content scripts.
 * 
 * Note that frame script is not the same as a content script in Chromium.
 * Frame script works in context of a browser tab, not a "document" or "window".
 * 
 * https://developer.mozilla.org/ru/Firefox/Multiprocess_Firefox/Technical_overview#Frame_scripts
 * https://developer.mozilla.org/ru/Firefox/Multiprocess_Firefox/Limitations_of_frame_scripts
 */
(function (context) {
    'use strict';

    /**
     * This script is registered by "loadFrameScript" everywhere.
     * It decides whether we should load our content scripts to the loaded DOMWindow.
     */
    var {classes: Cc, interfaces: Ci, utils: Cu} = Components;
    var Services = Cu.import("resource://gre/modules/Services.jsm", {}).Services;

    // Used for sandbox creation
    var nextSandboxId = 0;

    // List of registered scripts
    var registeredScripts = [];
    // Helper object containing add-on translation
    var i18nMessages = Object.create(null);

    /**
     * Object that manages communication FROM the chrome process TO a content script.
     */
    var chromeMessageListener = (function () {

        var listeners = new WeakMap();

        var onMessageFromChrome = function (message) {
            var winListeners = listeners.get(message.target.content);
            if (winListeners) {
                for (var i = 0; i < winListeners.length; i++) {
                    winListeners[i](JSON.stringify(message.data));
                }
            }
        };
        context.addMessageListener('Adguard:on-message-channel', onMessageFromChrome);

        return {
            
            /**
             * Adds event listener. This function is exposed to a content script.
             * 
             * @param win       DOM window
             * @param listener  Listener for events sent from the chrome process
             */
            addListener: function (win, listener) {
                var winListeners = listeners.get(win);
                if (!winListeners) {
                    winListeners = [];
                    listeners.set(win, winListeners);
                }
                winListeners.push(listener);
            },
            
            /**
             * Called on window unload
             * 
             * @param win DOM window
             */
            onWindowUnload: function (win) {
                if (listeners) {
                    listeners.delete(win);
                }
            },
            
            /**
             * Called on frame script unload
             */
            unload: function () {
                context.removeMessageListener('Adguard:on-message-channel', onMessageFromChrome);
                listeners = null;
            }
        };
    })();

    /**
     * Object that manages communication FROM a content script TO the chrome process.  
     */
    var contentScriptMessageListener = (function () {

        var MSG_CHANNEL = 'Adguard:send-message-channel';

        var uniqueCallbackId = 1;
        var callbacks = Object.create(null);

        var bindResponseCallback = function (message, callback) {
            if (callback) {
                var callbackId = uniqueCallbackId++;
                callbacks[callbackId] = callback;
                message.callbackId = callbackId;
            }
        };

        var processResponse = function (response) {
            if (!response) {
                return;
            }
            var callbackId = response.callbackId;
            var callback = callbacks[callbackId];
            if (callback) {
                var json = null;
                if (response.result !== undefined) {
                    json = JSON.stringify(response.result);
                }
                callback(json);
            }
        };

        // Listen for messages from the chrome process
        context.addMessageListener(MSG_CHANNEL, function (message) {
            processResponse(message.data);
        });

        /**
         * Sends a message to the chrome process
         * 
         * @param message   Message to send
         * @param callback  (optional) Method to be called when response is received
         */
        function sendMessage(message, callback) {
            bindResponseCallback(message, callback);
            
            // For debug purposes (we now use synchronous messages only)
            if (message.async === true) {
                context.sendAsyncMessage(MSG_CHANNEL, message);
            } else {
                var response = context.sendSyncMessage(MSG_CHANNEL, message)[0];
                // In case of async processing on background page, response may be undefined
                // We will be received message later via MSG_CHANNEL
                if (response) {
                    processResponse(response);
                }
            }
        }

        return {
            
            /**
             * This function will be exposed to a content script
             */
            sendMessage: sendMessage,
            
            /**
             * Called on specific window unload
             */
            onWindowUnload: function () {
                // Do nothing
            },
            
            /**
             * Called on frame script unload
             */
            unload: function () {
                context.removeMessageListener(MSG_CHANNEL, processResponse);
                callbacks = null;
            }
        };
    })();

    /**
     * Injects content scripts to the specified window
     * 
     * @param runAt     When to run the specified script. Can be document_start or document_end.
     * @param win       DOM window
     */
    var injectScripts = function (runAt, win) {

        var location = win.document.location;
        if (!location) {
            return;
        }

        var isTopWin = win === win.top;
        var scheme = location.protocol;
        var domain = location.hostname;
        var url = [scheme, '//', domain, location.pathname].join('');

        var filter = function (script) {
            if (script.runAt !== runAt) {
                return false;
            }
            if (!script.allFrames && !isTopWin) {
                return false;
            }
            if (script.schemes.indexOf(scheme) < 0) {
                return false;
            }
            if (script.url && url !== script.url) {
                return false;
            }
            var domains = script.domains;
            if (domains && domains.length > 0) {
                for (var i = 0; i < domains.length; i++) {
                    if (domain.endsWith(domains[i])) {
                        return true;
                    }
                }
                return false;
            }
            return true;
        };

        var scripts = registeredScripts.filter(filter);
        if (scripts.length === 0) {
            return;
        }

        var sandbox = createSandbox(win, url);

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            runScriptInSandbox(script, sandbox);
        }
    };

    /**
     * Creates a sandbox object which will be a principal object for the content scripts.
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
        var isTop = win.top === win;
        var sandboxName = '[' + (nextSandboxId++) + ']' + '[' + url + '][' + isTop + ']';

        // "content" is a DOM window here
        // Creating "expanded" sandbox from it: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.Sandbox#Expanded_principal
        var sandbox = Cu.Sandbox(win, {
            sandboxName: sandboxName,
            sameZoneAs: win,
            sandboxPrototype: win,
            wantComponents: false
        });

        // Expose frame script API to the content scripts
        sandbox.addChromeMessageListener = chromeMessageListener.addListener;
        sandbox.sendMessageToChrome = contentScriptMessageListener.sendMessage;

        // Expose localization API
        sandbox.i18nMessageApi = function (messageId) {
            return i18nMessages[messageId];
        };

        return sandbox;
    };

    /**
     * Runs the content script inside the specified sandbox
     * 
     * @param script    Content script object (contains a list of different scripts)
     * @param sandbox   Sandbox for an actual window
     */
    var runScriptInSandbox = function (script, sandbox) {
        var files = script.files;
        for (var i = 0; i < files.length; i++) {
            var file = script.files[i];
            Services.scriptloader.loadSubScript(file, sandbox, 'UTF-8');
        }
    };

    /**
     * Called on "DOMContentLoaded" event.
     * When it happens we inject "document-end" content scripts.
     */
    var onDocumentEnd = function (event) {

        var win = event.target.defaultView;

        // Remove event listeners
        win.removeEventListener('DOMContentLoaded', onDocumentEnd, true);
        injectScripts('document_end', win);
    };

    /**
     * Called on "document-element-inserted" event."
     * 
     * @param win DOM window
     */
    var onDocumentStart = function (win) {
        win.addEventListener('DOMContentLoaded', onDocumentEnd, true);
        win.addEventListener('unload', onWindowUnload, true);

        injectScripts('document_start', win);
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

        Services.obs.addObserver(contentObserver, OBS_TOPIC, false);

        return {
            /**
             * Called when new document element was just created
             * 
             * @param topWindow Top window object
             * @param callback  Method called when document element was just created
             */
            onNewDocument: function (topWindow, callback) {
                callbacks.set(topWindow, callback);
            },
            
            /**
             * Called on frame script unload
             */
            unload: function () {
                Services.obs.removeObserver(contentObserver, OBS_TOPIC);
            }
        };

    })();

    /**
     * Called on DOMWindowCreated event.
     */
    var onWindowCreated = function () {
        
        // Registering a callback when DOM window was just created.
        documentObserver.onNewDocument(context.content, onDocumentStart);
    };

    /**
     * Called on "unload" event and used to clean up resources.
     */
    var onWindowUnload = function (e) {
        var win = e.target.defaultView;
        if (win) {
            chromeMessageListener.onWindowUnload(win);
            contentScriptMessageListener.onWindowUnload(win);
        }
    };

    /**
     * Fires when the frame script environment is shutting down, i.e. when a tab gets closed.
     */
    var onUnload = function (e) {
        if (e.target !== context) {
            return;
        }
        documentObserver.unload();
        chromeMessageListener.unload();
        contentScriptMessageListener.unload();
    };

    /**
     * Entry point
     */
    var initFrameScript = function () {

        // Note that we request for nsISyncMessageSender implementation as now we use sendSyncMessage method
        var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsISyncMessageSender);        
        if (typeof cpmm.sendRpcMessage === 'function') {
            registeredScripts = cpmm.sendRpcMessage('Adguard:get-content-scripts')[0];
            i18nMessages = cpmm.sendRpcMessage('Adguard:get-i18n-messages')[0];
        } else {
            // Compatibility with older FF versions and PaleMoon
            registeredScripts = cpmm.sendSyncMessage('Adguard:get-content-scripts')[0];
            i18nMessages = cpmm.sendSyncMessage('Adguard:get-i18n-messages')[0];
        }        
        context.addEventListener('DOMWindowCreated', onWindowCreated);

        // Prepare to clean up on frame script unload
        context.addEventListener('unload', onUnload);
    };

    initFrameScript();
})(this);