/* global require, Services, exports */
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
var {Cc,Ci} = require('chrome');
var tabUtils = require('sdk/tabs/utils');
var {viewFor} = require('sdk/view/core');
var winUtils = require('sdk/window/utils');

var {Log} = require('./utils/log');

var ContentScripts = function () {
};

/**
 * Object that implements our frame scripts logic.
 * 
 * Basically, we register one frame script which manages other scripts (so named content scripts).
 * Content scripts are executed inside the sandbox with "loadSubScript" calls. 
 */
ContentScripts.prototype = {

    CONTENT_TO_BACKGROUND_CHANNEL: 'content-background-channel',
    BACKGROUND_TO_CONTENT_CHANNEL: 'background-content-channel',

    /**
     * Object that is response for Chrome<->Content communication from the "Chrome" side.
     */
    contentMessageHandler: null,

    /**
     * Array or registered content scripts
     */
    scripts: [],
    
    /**
     * In order to translate UI we inject i18n messages to the page using a content script.
     */
    i18nMessages: Object.create(null),

    /**
     * Initializes ContentScripts object
     */
    init: function (contentMessageHandler) {

        this.contentMessageHandler = contentMessageHandler;
        this.i18nMessages = this._geti18nMessages();

        // Filter-download.html
        this.registerChromeContentScript('filter-download.html', [
            'libs/jquery-1.8.3.min.js',
            'libs/nprogress.patched.js',
            'content-script/content-script.js',
            'content-script/i18n-helper.js',
            'pages/i18n.js',
            'pages/script.js',
            'pages/filter-download.js'
        ]);

        // Thankyou.html
        this.registerChromeContentScript('thankyou.html', [
            'libs/jquery-1.8.3.min.js',
            'content-script/content-script.js',
            'content-script/content-utils.js',
            'content-script/i18n-helper.js',
            'pages/i18n.js',
            'pages/script.js',
            'pages/thankyou.js'
        ]);

        // Options.html
        this.registerChromeContentScript('options.html', [
            'libs/jquery-1.8.3.min.js',
            'libs/bootstrap.min.js',
            'libs/jquery.mousewheel.min.js',
            'libs/jquery.jscrollpane.min.js',
            'libs/moment-with-locales.min.js',
            'content-script/content-script.js',
            'content-script/content-utils.js',
            'content-script/i18n-helper.js',
            'pages/i18n.js',
            'pages/script.js',
            'pages/options.js'
        ]);

        // Log.html
        this.registerChromeContentScript('log.html', [
            'libs/jquery-1.8.3.min.js',
            'libs/bootstrap.min.js',
            'libs/moment-with-locales.min.js',
            'content-script/content-script.js',
            'content-script/content-utils.js',
            'content-script/i18n-helper.js',
            'pages/i18n.js',
            'pages/script.js',
            'pages/log.js'
        ]);

        // Export.html
        this.registerChromeContentScript('export.html', [
            'libs/jquery-1.8.3.min.js',
            'content-script/content-script.js',
            'pages/export.js'
        ]);

        // Sb.html
        this.registerChromeContentScript('sb.html', [
            'libs/jquery-1.8.3.min.js',
            'content-script/content-script.js',
            'content-script/i18n-helper.js',
            'pages/i18n.js',
            'pages/sb-filtered-page.js'
        ]);

        // Web pages content scripts (responsible for ad blocking)
        this.registerPageContentScript([
            'content-script/content-script.js',
            'content-script/preload.js'
        ], 'document_start', true);

        this.registerPageContentScript([
            'content-script/content-script.js', // Message passing
            'content-script/content-utils.js'   // Show alert popup and reload without cache functionality
        ], 'document_start', false);

        // Assistant
        this.registerPageContentScript([
            'libs/jquery-1.8.3.min.js',
            'libs/diff_match_patch.js',
            'libs/dom.patched.js',
            'libs/balalaika.patched.js',
            'libs/deferred.js',
            'content-script/i18n-helper.js',    // Localization placeholders
            'content-script/content-script.js', // Message passing
            'content-script/assistant/js/slider-widget.js',
            'content-script/assistant/js/start-assistant.js',
            'content-script/assistant/js/adguard-selector.js',
            'content-script/assistant/js/adguard-rules-constructor.js',
            'content-script/assistant/js/assistant.js'
        ], 'document_end', false);

        // abp:subscribe
        var subscribeIncludeDomains = [
            "abpchina.org",
            "abpindo.blogspot.com",
            "abpvn.com",
            "adblock-listefr.com",
            "adblock.gardar.net",
            "adblockplus.org",
            "adblockplus.me",
            "adguard.com",
            "certyficate.it",
            "code.google.com",
            "dajbych.net",
            "fanboy.co.nz",
            "fredfiber.no",
            "gardar.net",
            "github.com",
            "henrik.schack.dk",
            "latvian-list.site11.com",
            "liamja.co.uk",
            "malwaredomains.com",
            "margevicius.lt",
            "nauscopio.nireblog.com",
            "nireblog.com",
            "noads.it",
            "schack.dk",
            "spam404.com",
            "stanev.org",
            "void.gr",
            "yoyo.org",
            "zoso.ro"
        ];

        this.registerPageContentScript([
            'content-script/content-script.js', // message-passing
            'content-script/content-utils.js',  // showAlertPopup function
            'content-script/subscribe.js'
        ], 'document_end', false, subscribeIncludeDomains);

        this._loadFrameScript();
    },

    /**
     * Sends message to the specified content script.
     * 
     * @param worker    Either Event.target got from the frame script or SDK worker
     * @param message   Message to send
     */
    sendMessageToWorker: function(worker, message) {
        if ('port' in worker) {
            worker.port.emit(this.BACKGROUND_TO_CONTENT_CHANNEL, message);
        } else {
            worker.messageManager.sendAsyncMessage('Adguard:on-message-channel', message);
        }
    },
    
    /**
     * This method is used for attaching event listener to SDK panel
     * 
     * @param worker    SDK panel
     * @param callback  Event handler
     */
    addContentScriptMessageListener: function (worker, callback) {
        if (!('port' in worker)) {
            throw 'Unable to add port listener to ' + worker;
        }
        worker.port.on(this.CONTENT_TO_BACKGROUND_CHANNEL, function (message) {
            callback(message);
        });
    },

    /**
     * Sends message to specified tab
     * 
     * @param tab       Message receiver (SDK tab)
     * @param message   Message to send
     */
    sendMessageToTab: function (tab, message) {
        
        // Converting SDK tab to xul tab
        var lowLevelTab;
        if (typeof viewFor !== 'undefined') {
            lowLevelTab = viewFor(tab);
        } else {
            // Legacy support for PaleMoon and old Firefox versions.
            var browserWindow = winUtils.getMostRecentBrowserWindow();
            lowLevelTab = tabUtils.getTabForContentWindow(browserWindow.content);
        }
        
        // Now get the xul browser object
        var browser = tabUtils.getBrowserForTab(lowLevelTab);
        browser.messageManager.sendAsyncMessage('Adguard:on-message-channel', message);
    },

    /**
     * Content script options (used for SdkPanel initialization)
     */
    getContentScriptOptions: function () {
        return {
            i18nMessages: this.i18nMessages
        };
    },

    /**
     * Registers a content script for "chrome://" pages of our add-on.
     */
    registerChromeContentScript: function (url, paths, when) {
        var files = [];
        for (var i = 0; i < paths.length; i++) {
            files.push(this._contentUrl(paths[i]));
        }

        this.scripts.push({
            schemes: ['chrome:'],
            url: this._contentUrl(url),
            files: files,
            allFrames: false,
            runAt: when || 'document_start'
        });
    },

    /**
     * Registers a content script for http(s) pages
     */
    registerPageContentScript: function (paths, when, allFrames, domains) {
        var files = [];
        for (var i = 0; i < paths.length; i++) {
            files.push(this._contentUrl(paths[i]));
        }

        this.scripts.push({
            schemes: ['http:', 'https:'],
            files: files,
            allFrames: allFrames,
            runAt: when || 'document_start',
            domains: domains || []
        });
    },

    /**
     * Initializes our frame script and sets up a listener object.
     */
    _loadFrameScript: function () {
        
        /**
         * For some unknown reason we can't use global message messenger for handling synchronous messages from a frame script.
         * On the other hand, parent process manager allows us to receive syncrhonous messages and send immediate response.
         */ 
        var ppmm = Cc["@mozilla.org/parentprocessmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        ppmm.addMessageListener('Adguard:get-content-scripts', function () {
            return this.scripts;
        }.bind(this));
        ppmm.addMessageListener('Adguard:get-i18n-messages', function () {
            return this.i18nMessages;
        }.bind(this));
        
        /**
         * nsIMessageListener implementation
         */
        var listener = (function (contentMessageHandler) {

            function getTabFromTarget(target) {
                var tab = tabUtils.getTabForBrowser(target);
                if (!tab) {
                    // Legacy browsers support. For PaleMoon and old Firefox getTabForBrowser returns null
                    tab = tabUtils.getTabForContentWindow(target.contentWindow);
                }
                return tab;
            }

            function wrapResponseResult(result, message) {
                // Passing callbackId to response
                return {
                    type: message.data.type,
                    callbackId: message.data.callbackId,
                    result: result
                };
            }
            
            /**
             * Receives a message from the frame script
             * https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessageListener#receiveMessage()
             * 
             * @message Message object
             */
            var receiveMessage = function (message) {
                var tab = getTabFromTarget(message.target);
                if (!tab) {
                    Log.debug('Unable to retrieve tab from {0}', message.target);
                    return;
                }
                
                // Get the message manager of the sender frame script
                var messageManager = message.target
                    .QueryInterface(Ci.nsIFrameLoaderOwner)
                    .frameLoader
                    .messageManager;
                    
                // Message sender identification
                var sender = {
                    tab: {id: tabUtils.getTabId(tab)},
                    messageManager: messageManager
                };

                var sendResponse = null;
                if ('callbackId' in message.data) {
                    sendResponse = function (result) {
                        messageManager.sendAsyncMessage('Adguard:send-message-channel', wrapResponseResult(result, message));
                    };
                } else {
                    // Caller does not expect to get a response
                    sendResponse = function () {
                        // Empty
                    };
                }

                var result = contentMessageHandler.handleMessage(message.data, sender, sendResponse);
                var async = result === true;

                if (async) {
                    // If async is true sendResponse will be invoked later
                    return;
                }

                if (message.sync) {
                    // Message was sent with a "sendSyncMessage" call
                    // Returning response immediately
                    return wrapResponseResult(result, message);
                } else {
                    sendResponse(result);
                }
            };

            // Expose listener interface
            return {
                receiveMessage: receiveMessage
            };
        })(this.contentMessageHandler);

        // Using global MM to register our frame script browser-wide
        var messageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        messageManager.addMessageListener('Adguard:send-message-channel', listener);
        messageManager.loadFrameScript(this._contentUrl('content-script/frame-script.js'), true);
    },

    
    _contentUrl: function (resource) {
        return 'chrome://adguard/content/' + resource;
    },

    /**
     * Load translation bundle into a javascript object
     */
    _geti18nMessages: function () {
        // Randomize URI to work around bug 719376
        var stringBundle = Services.strings.createBundle('chrome://adguard/locale/messages.properties?' + Math.random());

        // MDN says getSimpleEnumeration returns nsIPropertyElement // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle#getSimpleEnumeration%28%29
        var props = stringBundle.getSimpleEnumeration();

        var messages = Object.create(null);
        while (props.hasMoreElements()) {
            var prop = props.getNext();
            var propEl = prop.QueryInterface(Ci.nsIPropertyElement);
            var key = propEl.key;
            messages[key] = propEl.value;
        }
        return messages;
    }
};

exports.contentScripts = new ContentScripts();