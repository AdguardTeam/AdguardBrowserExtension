var {Cc,Ci} = require('chrome');
var tabUtils = require('sdk/tabs/utils');
var {viewFor} = require('sdk/view/core');
var winUtils = require('sdk/window/utils');

var ContentScripts = function () {
};

ContentScripts.prototype = {

    CONTENT_TO_BACKGROUND_CHANNEL: 'content-background-channel',
    BACKGROUND_TO_CONTENT_CHANNEL: 'background-content-channel',

    contentMessageHandler: null,

    workers: [],
    scripts: [],
    i18nMessages: Object.create(null),

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

        //Thankyou.html
        this.registerChromeContentScript('thankyou.html', [
            'libs/jquery-1.8.3.min.js',
            'content-script/content-script.js',
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

        // Css and Script Injections
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
            'libs/jquery-ui.min.js',
            'libs/diff_match_patch.js',
            'libs/dom.js',
            'content-script/i18n-helper.js',    // Localization placeholders
            'content-script/content-script.js', // Message passing
            'content-script/assistant/js/tools.js',
            'content-script/assistant/js/selector.js',
            'content-script/assistant/js/assistant.js',
            'content-script/assistant/js/start-assistant.js'
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

    sendMessageToWorker: function (worker, message) {
        if ('port' in worker) {
            worker.port.emit(this.BACKGROUND_TO_CONTENT_CHANNEL, message);
        } else {
            worker.messageManager.sendAsyncMessage('Adguard:on-message-channel', message);
        }
    },

    sendMessageToTab: function (tab, message) {
        var lowLevelTab;
        if (typeof viewFor != 'undefined') {
            // Convert sdk tab to xul tab
            lowLevelTab = viewFor(tab);
        } else {
            // Legacy support for PaleMoon and old Firefox.
            var browserWindow = winUtils.getMostRecentBrowserWindow();
            lowLevelTab = tabUtils.getTabForContentWindow(browserWindow.content);
        }
        var browser = tabUtils.getBrowserForTab(lowLevelTab);
        browser.messageManager.sendAsyncMessage('Adguard:on-message-channel', message);
    },

    getContentScriptOptions: function () {
        return {
            i18nMessages: this.i18nMessages
        };
    },

    addContentScriptMessageListener: function (worker, callback) {
        if (!('port' in worker)) {
            throw 'Unable to add port listener to ' + worker;
        }
        worker.port.on(this.CONTENT_TO_BACKGROUND_CHANNEL, function (message) {
            callback(message);
        });
    },

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

    _loadFrameScript: function () {

        var ppmm = Cc["@mozilla.org/parentprocessmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

        ppmm.addMessageListener('Adguard:get-content-scripts', function () {
            return this.scripts;
        }.bind(this));

        ppmm.addMessageListener('Adguard:get-i18n-messages', function () {
            return this.i18nMessages;
        }.bind(this));

        var Listener = function () {
        };

        Listener.prototype.receiveMessage = function (message) {

            var tab = tabUtils.getTabForBrowser(message.target);
            if (!tab) {
                // Legacy support. For PaleMoon and old Firefox getTabForBrowser returns null
                tab = tabUtils.getTabForContentWindow(message.target.contentWindow)
            }

            var messageManager = message.target
                .QueryInterface(Ci.nsIFrameLoaderOwner)
                .frameLoader
                .messageManager;

            var sender = {
                tab: {id: tabUtils.getTabId(tab)},
                messageManager: messageManager
            };

            var callback = function () {
                // Empty
            };

            if ('callbackId' in message.data) {

                callback = function (result) {

                    if ('callbackId' in result) {
                        throw 'callbackId present in result';
                    }
                    if ('type' in result) {
                        throw 'type present in result';
                    }

                    // Passing type and callbackId to response
                    result.type = message.data.type;
                    result.callbackId = message.data.callbackId;

                    messageManager.sendAsyncMessage('Adguard:send-message-channel', result);
                };
            }

            this.contentMessageHandler.handleMessage(message.data, sender, callback);

        }.bind(this);

        var messageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
        messageManager.addMessageListener('Adguard:send-message-channel', new Listener());
        messageManager.loadFrameScript(this._contentUrl('content-script/frame-script.js'), true);
    },

    _contentUrl: function (resource) {
        return 'chrome://adguard/content/' + resource;
    },

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

