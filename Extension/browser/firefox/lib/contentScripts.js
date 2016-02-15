var pageMod = require('sdk/page-mod');
var l10n = require('sdk/l10n');
var self = require('sdk/self');

var I18N_MESSAGES = require('utils/i18n-messages').I18N_MESSAGES;
var userSettings = require('utils/user-settings').userSettings;

var ContentScripts = function () {
    this.onAttach = this.onAttach.bind(this);
};

ContentScripts.prototype = {

    CONTENT_TO_BACKGROUND_CHANNEL: 'content-background-channel',
    BACKGROUND_TO_CONTENT_CHANNEL: 'background-content-channel',

    contentMessageHandler: null,
    i18nMessages: Object.create(null),

    workers: [],

    init: function (contentMessageHandler) {

        this.contentMessageHandler = contentMessageHandler;
        this.i18nMessages = this._getI18nMessages();

        // Filter-download.html
        this.registerChromeContentScript('chrome://adguard/content/filter-download.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/libs/nprogress.patched.js',
            'content/content-script/content-script.js',
            'content/content-script/i18n-helper.js',
            'content/pages/i18n.js',
            'content/pages/script.js',
            'content/pages/filter-download.js'
        ]);

        // Thankyou.html
        this.registerChromeContentScript('chrome://adguard/content/thankyou.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/content-script/content-script.js',
            'content/content-script/i18n-helper.js',
            'content/pages/i18n.js',
            'content/pages/script.js',
            'content/pages/thankyou.js'
        ]);

        // Options.html
        this.registerChromeContentScript('chrome://adguard/content/options.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/libs/bootstrap.min.js',
            'content/libs/jquery.mousewheel.min.js',
            'content/libs/jquery.jscrollpane.min.js',
            'content/libs/moment-with-locales.min.js',
            'content/content-script/content-script.js',
            'content/content-script/i18n-helper.js',
            'content/pages/i18n.js',
            'content/pages/script.js',
            'content/pages/options.js'
        ]);

        // Log.html
        this.registerChromeContentScript('chrome://adguard/content/log.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/libs/bootstrap.min.js',
            'content/libs/moment-with-locales.min.js',
            'content/content-script/content-script.js',
            'content/content-script/i18n-helper.js',
            'content/pages/i18n.js',
            'content/pages/script.js',
            'content/pages/log.js'
        ]);

        // Export.html
        this.registerChromeContentScript('chrome://adguard/content/export.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/content-script/content-script.js',
            'content/pages/export.js'
        ]);

        // Sb.html
        this.registerChromeContentScript('chrome://adguard/content/sb.html*', [
            'content/libs/jquery-1.8.3.min.js',
            'content/content-script/content-script.js',
            'content/content-script/i18n-helper.js',
            'content/pages/i18n.js',
            'content/pages/sb-filtered-page.js'
        ]);

        // Css and Script Injections
        this.registerPageContentScript(['http://*', 'https://*'], [
            'content/content-script/content-script.js',
            'content/content-script/preload.js'
        ], 'start');

        this.registerPageContentScript(['http://*', 'https://*'], [
            'content/content-script/content-script.js', // Message passing
            'content/content-script/content-utils.js'   // Show alert popup and reload without cache functionality
        ], 'start', ['top', 'existing']);

        // Assistant
        this.registerPageContentScript(['http://*', 'https://*'], [
            'content/libs/jquery-1.8.3.min.js',
            'content/libs/jquery-ui.min.js',
            'content/libs/diff_match_patch.js',
            'content/libs/dom.js',
            'content/libs/balalaika.patched.js',
            'content/content-script/i18n-helper.js',    // Localization placeholders
            'content/content-script/content-script.js', // Message passing
            'content/content-script/assistant/js/start-assistant.js',
            'content/content-script/assistant/js/tools.js',
            'content/content-script/assistant/js/adguard-selector.js',
            'content/content-script/assistant/js/adguard-rules-constructor.js',
            'content/content-script/assistant/js/assistant.js'
        ], 'ready', ['top', 'existing']);


        // abp:subscribe
        var subscribeIncludeDomains = [
            "*.abpchina.org",
            "*.abpindo.blogspot.com",
            "*.abpvn.com",
            "*.adblock-listefr.com",
            "*.adblock.gardar.net",
            "*.adblockplus.org",
            "*.adblockplus.me",
            "*.adguard.com",
            "*.certyficate.it",
            "*.code.google.com",
            "*.dajbych.net",
            "*.fanboy.co.nz",
            "*.fredfiber.no",
            "*.gardar.net",
            "*.github.com",
            "*.henrik.schack.dk",
            "*.latvian-list.site11.com",
            "*.liamja.co.uk",
            "*.malwaredomains.com",
            "*.margevicius.lt",
            "*.nauscopio.nireblog.com",
            "*.nireblog.com",
            "*.noads.it",
            "*.schack.dk",
            "*.spam404.com",
            "*.stanev.org",
            "*.void.gr",
            "*.yoyo.org",
            "*.zoso.ro"
        ];
        this.registerPageContentScript(subscribeIncludeDomains, [
            'content/content-script/content-script.js', // message-passing
            'content/content-script/content-utils.js',  // showAlertPopup function
            'content/content-script/subscribe.js'
        ], 'ready', ['top', 'existing']);
    },

    getContentScriptOptions: function () {
        return {
            i18nMessages: this.i18nMessages
        };
    },

    sendMessageToWorker: function (worker, message) {
        worker.port.emit(this.BACKGROUND_TO_CONTENT_CHANNEL, message);
    },

    sendMessageToTab: function (tab, message) {
        var workers = this.getWorkersForTab(tab);
        for (var i = 0; i < workers.length; i++) {
            this.sendMessageToWorker(workers[i], message);
        }
    },

    addContentScriptMessageListener: function (worker, callback) {
        worker.port.on(this.CONTENT_TO_BACKGROUND_CHANNEL, function (message) {
            callback(message);
        });
    },

    getWorkersForTab: function (tab) {
        var workers = [];
        for (var i = 0; i < this.workers.length; i++) {
            var worker = this.workers[i];
            if (worker.tab === tab) {
                workers.push(worker);
            }
        }
        return workers;
    },

    registerChromeContentScript: function (url, paths) {

        var contentScriptFile = [];
        for (var i = 0; i < paths.length; i++) {
            contentScriptFile.push(self.data.url(paths[i]));
        }

        var contentScriptOptions = this.getContentScriptOptions();

        pageMod.PageMod({
            include: url,
            contentScriptFile: contentScriptFile,
            contentScriptWhen: 'start',
            contentScriptOptions: contentScriptOptions,
            onAttach: this.onAttach
        });
    },

    registerPageContentScript: function (url, paths, when, attachTo) {

        var contentScriptFile = [];
        for (var i = 0; i < paths.length; i++) {
            contentScriptFile.push(self.data.url(paths[i]));
        }

        var pageModOptions = {
            include: url,
            contentScriptFile: contentScriptFile,
            contentScriptWhen: when,
            onAttach: this.onAttach
        };

        if (attachTo) {
            pageModOptions.attachTo = attachTo;
        }

        pageMod.PageMod(pageModOptions);
    },


    onAttach: function (worker) {

        this.workers.push(worker);

        // Cleanup
        var self = this;
        worker.on('detach', function () {
            self._detachWorker(this);
        });

        worker.port.on(this.CONTENT_TO_BACKGROUND_CHANNEL, function (message) {

            var callback = function () {
            };

            if ('callbackId' in message) {

                callback = function (result) {

                    if ('callbackId' in result) {
                        throw 'callbackId present in result';
                    }
                    if ('type' in result) {
                        throw 'type present in result';
                    }

                    // Passing type and callbackId to response
                    result.type = message.type;
                    result.callbackId = message.callbackId;

                    worker.port.emit(this.CONTENT_TO_BACKGROUND_CHANNEL, result);

                }.bind(this);
            }

            this.contentMessageHandler.handleMessage(message, worker, callback);

        }.bind(this));
    },

    _getI18nMessages: function () {
        var messages = Object.create(null);
        for (var i = 0; i < I18N_MESSAGES.length; i++) {
            var messageId = I18N_MESSAGES[i];
            messages[messageId] = l10n.get(messageId);
        }
        return messages;
    },

    _detachWorker: function (worker) {
        var index = this.workers.indexOf(worker);
        if (index != -1) {
            this.workers.splice(index, 1);
        }
    }
};

exports.contentScripts = new ContentScripts();

