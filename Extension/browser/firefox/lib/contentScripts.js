/* global Cu, Cc, Ci, I18nUtils, Log, unload, ElemHide */
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
    init: function () {
        this.i18nMessages = this._geti18nMessages();

        // Filter-download.html
        this.registerChromeContentScript('pages/filter-download.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/nprogress.patched.js',
            'lib/content-script/content-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/filter-download.js'
        ]);

        // Thankyou.html
        this.registerChromeContentScript('pages/thankyou.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/thankyou.js'
        ]);

        // Options.html
        this.registerChromeContentScript('pages/options.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/bootstrap.min.js',
            'lib/libs/jquery.mousewheel.min.js',
            'lib/libs/jquery.jscrollpane.min.js',
            'lib/libs/moment-with-locales.min.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/options.js'
        ]);

        // Log.html
        this.registerChromeContentScript('pages/log.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/bootstrap.min.js',
            'lib/libs/moment-with-locales.min.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/log.js'
        ]);

        // Export.html
        this.registerChromeContentScript('pages/export.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/content-script.js',
            'lib/pages/export.js'
        ]);

        // Popup.html
        this.registerChromeContentScript('pages/popup.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/content-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/popup-controller.js',
            'lib/pages/script.js',
            'lib/content-script/panel-popup.js'
        ]);

        // Sb.html
        this.registerChromeContentScript('pages/sb.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/content-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/sb-filtered-page.js'
        ]);

        // Web pages content scripts (responsible for ad blocking)
        this.registerPageContentScript([
            'lib/libs/extended-css-1.0.6.js',
            'lib/utils/element-collapser.js',
            'lib/content-script/content-script.js',
            'lib/content-script/preload.js'
        ], 'document_start', true);

        this.registerPageContentScript([
            'lib/content-script/content-script.js', // Message passing
            'lib/content-script/content-utils.js'   // Show alert popup and reload without cache functionality
        ], 'document_start', false);

        // Assistant
        this.registerPageContentScript([
            'lib/libs/diff_match_patch.js',
            'lib/libs/dom.patched.js',
            'lib/libs/balalaika.patched.js',
            'lib/libs/deferred.js',
            'lib/content-script/i18n-helper.js',    // Localization placeholders
            'lib/content-script/content-script.js', // Message passing
            'lib/content-script/assistant/js/slider-widget.js',
            'lib/content-script/assistant/js/start-assistant.js',
            'lib/content-script/assistant/js/adguard-selector.js',
            'lib/content-script/assistant/js/adguard-rules-constructor.js',
            'lib/content-script/assistant/js/assistant.js'
        ], 'document_end', false);

        // abp:subscribe
        var subscribeIncludeDomains = [
            "easylist.github.io",
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
            'lib/content-script/content-script.js', // message-passing
            'lib/content-script/content-utils.js',  // showAlertPopup function
            'lib/content-script/subscribe.js'
        ], 'document_end', false, subscribeIncludeDomains);

        this._loadFrameScript();
    },

    /**
     * Registers a content script for "chrome://" pages of our add-on.
     */
    registerChromeContentScript: function (url, paths, when) {
        var files = [];
        for (var i = 0; i < paths.length; i++) {
            files.push(adguard.getURL(paths[i]));
        }

        this.scripts.push({
            schemes: ['chrome:'],
            url: adguard.getURL(url),
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
            files.push(adguard.getURL(paths[i]));
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

        var initializeFrameScriptListenerName = 'Adguard:initialize-frame-script';
        var shouldLoadListenerMessageName = 'Adguard:should-load';
        var tabUpdatedListenerMessageName = 'Adguard:tab-updated';
        var navigationTargetCreatedListenerMessageName = 'Adguard:navigation-target-created';
        var elemHideInterceptorListenerMessageName = 'Adguard:elemhide-interceptor';

        var initializeFrameScriptListener = this.createInitializeFrameScriptListener();
        var shouldLoadListener = this.createShouldLoadListener();
        var tabUpdatedListener = this.createTabUpdatedListener();
        var navigationTargetCreatedListener = this.createNavigationTargetCreatedAsyncListener();
        var elemHideInterceptorListener = this.createElemHideInterceptorListener();

        /**
         * For some unknown reason we can't use global message messenger for handling synchronous messages from a frame script.
         * On the other hand, parent process manager allows us to receive synchronous messages and send immediate response.
         */
        var parentMessageManager = Cc["@mozilla.org/parentprocessmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

        parentMessageManager.addMessageListener(initializeFrameScriptListenerName, initializeFrameScriptListener);

        var frameScriptUrl = adguard.getURL('lib/frameScript.js');

        // Using global MM to register our frame script browser-wide
        var globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

        // Register special handlers
        globalMessageManager.addMessageListener(shouldLoadListenerMessageName, shouldLoadListener);
        globalMessageManager.addMessageListener(tabUpdatedListenerMessageName, tabUpdatedListener);
        globalMessageManager.addMessageListener(navigationTargetCreatedListenerMessageName, navigationTargetCreatedListener);
        globalMessageManager.addMessageListener(elemHideInterceptorListenerMessageName, elemHideInterceptorListener);

        globalMessageManager.loadFrameScript(frameScriptUrl, true);

        unload.when(function () {

            parentMessageManager.removeMessageListener(initializeFrameScriptListenerName, initializeFrameScriptListener);

            globalMessageManager.removeMessageListener(shouldLoadListenerMessageName, shouldLoadListener);
            globalMessageManager.removeMessageListener(tabUpdatedListenerMessageName, tabUpdatedListener);
            globalMessageManager.removeMessageListener(navigationTargetCreatedListenerMessageName, navigationTargetCreatedListener);
            globalMessageManager.removeMessageListener(elemHideInterceptorListenerMessageName, elemHideInterceptorListener);

            globalMessageManager.removeDelayedFrameScript(frameScriptUrl);

            // Cleanup services in frameModule
            var frameModuleURL = adguard.getURL('lib/frameModule.js');
            var frameModule = {};
            try {
                Cu.import(frameModuleURL, frameModule);
                frameModule.contentPolicyService.unregister();
                frameModule.interceptHandler.unregister();
                Cu.unload(frameModuleURL);
            } catch (ex) {
                Log.error('Error while unregister contentPolicyService and interceptHandler: {0}', ex);
            }
        });
    },

    createInitializeFrameScriptListener: function () {
        return function () {
            return {
                scripts: this.scripts,
                i18nMessages: this.i18nMessages
            };
        }.bind(this);
    },

    createShouldLoadListener: function () {
        return function (e) {

            var browser = e.target;
            var details = e.data;

            var tab = adguard.tabsImpl.getTabForBrowser(browser);
            if (!tab) {
                return;
            }

            adguard.webRequest.saveRequestDetails(adguard.tabsImpl.getTabIdForTab(tab), details);
        };
    },

    createTabUpdatedListener: function () {
        return function (e) {

            var browser = e.target;
            var details = e.data;

            var tab = adguard.tabsImpl.getTabForBrowser(browser);
            if (!tab) {
                return;
            }
            adguard.tabsImpl.onTabUpdated(tab, {
                url: details.url,
                title: details.title,
                status: details.status
            });
        };
    },

    createNavigationTargetCreatedAsyncListener: function () {

        return function (e) {

            var browser = e.target;
            var details = e.data;

            var tab = adguard.tabsImpl.getTabForBrowser(browser);
            if (!tab) {
                return;
            }

            var tabId = adguard.tabsImpl.getTabIdForTab(tab);

            setTimeout(adguard.webNavigation.onPopupCreated.bind(null, tabId, details.targetUrl, details.sourceUrl), 1);
        };
    },

    createElemHideInterceptorListener: function () {

        return function (e) {

            var browser = e.target;
            var details = e.data;

            var tab = adguard.tabsImpl.getTabForBrowser(browser);

            var collapse = false;
            if (tab) {
                var tabId = adguard.tabsImpl.getTabIdForTab(tab);
                collapse = ElemHide.shouldCollapseElement(tabId, details.path);
            }
            return {collapse: collapse};
        };
    },

    /**
     * Load translation bundle into a javascript object
     */
    _geti18nMessages: function () {
        return I18nUtils.getMessagesMap();
    }
};

var contentScripts = new ContentScripts();
contentScripts.init();