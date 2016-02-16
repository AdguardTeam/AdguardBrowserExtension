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
            addListener: function (win, listener) {
                var winListeners = listeners.get(win);
                if (!winListeners) {
                    winListeners = [];
                    listeners.set(win, winListeners);
                }
                winListeners.push(listener);
            },
            onWindowUnload: function (win) {
                if (listeners) {
                    listeners.delete(win);
                }
            },
            unload: function () {
                context.removeMessageListener('Adguard:on-message-channel', onMessageFromChrome);
                listeners = null;
            }
        };

    })();

    var sendMessageToChrome = (function () {

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

        context.addMessageListener(MSG_CHANNEL, function (message) {
            processResponse(message.data);
        });

        function sendMessage(message, callback) {
            bindResponseCallback(message, callback);
            // For debug purposes
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
            sendMessage: sendMessage,
            onWindowUnload: function () {
                // Do nothing
            },
            unload: function () {
                context.removeMessageListener(MSG_CHANNEL, processResponse);
                callbacks = null;
            }
        };

    })();

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
            if (script.runAt != runAt) {
                return false;
            }
            if (!script.allFrames && !isTopWin) {
                return false;
            }
            if (script.schemes.indexOf(scheme) < 0) {
                return false;
            }
            if (script.url && url != script.url) {
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

        var win = event.target.defaultView;

        // Remove event listeners
        win.removeEventListener('DOMContentLoaded', onDocumentEnd, true);

        injectScripts('document_end', win);
    };

    var onDocumentStart = function (win) {

        win.addEventListener('DOMContentLoaded', onDocumentEnd, true);
        win.addEventListener('unload', onWindowUnload, true);

        injectScripts('document_start', win);
    };

    var documentObserver = (function () {

        var OBS_TOPIC = 'document-element-inserted';
        var callbacks = new WeakMap();

        var contentObserver = {
            observe: function (subject, topic) {

                switch (topic) {
                    case OBS_TOPIC:
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

        Services.obs.addObserver(contentObserver, OBS_TOPIC, false);

        return {
            onNewDocument: function (topWindow, callback) {
                callbacks.set(topWindow, callback);
            },
            unload: function () {
                Services.obs.removeObserver(contentObserver, OBS_TOPIC);
            }
        };

    })();

    var onWindowCreated = function () {
        documentObserver.onNewDocument(context.content, onDocumentStart);
    };

    var onWindowUnload = function (e) {
        var win = e.target.defaultView;
        if (win) {
            addChromeMessageListener.onWindowUnload(win);
            sendMessageToChrome.onWindowUnload(win);
        }
    };

    /**
     * Fires when the frame script environment is shut down, i.e. when a tab gets closed.
     */
    var onUnload = function (e) {
        if (e.target !== context) {
            return;
        }
        documentObserver.unload();
        addChromeMessageListener.unload();
        sendMessageToChrome.unload();
    };

    /**
     * Entry point
     */
    var initFrameScript = function () {

        var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsISyncMessageSender);
        registeredScripts = cpmm.sendSyncMessage('Adguard:get-content-scripts')[0];
        i18nMessages = cpmm.sendSyncMessage('Adguard:get-i18n-messages')[0];

        context.addEventListener('DOMWindowCreated', onWindowCreated);

        // Clean up on frame script unload
        context.addEventListener('unload', onUnload);
    };

    initFrameScript();

})(this);