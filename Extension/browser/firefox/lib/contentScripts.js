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

/* global Cu, Cc, Ci, Services */

/**
 * Object that implements our frame scripts logic.
 *
 * Basically, we register one frame script which manages other scripts (so named content scripts).
 * Content scripts are executed inside the sandbox with "loadSubScript" calls.
 */
(function (adguard) {

    /**
     * Array or registered content scripts
     */
    var scripts = [];

    /**
     * In order to translate UI we inject i18n messages to the page using a content script.
     */
    var i18nMessages = Object.create(null);

    /**
     * Initializes ContentScripts object
     */
    function init() {

        /**
         * Load translation bundle into a javascript object
         */
        i18nMessages = adguard.i18n.getMessagesMap();

        // Filter-download.html
        registerChromeContentScript('pages/filter-download.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/nprogress.patched.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/filter-download.js'
        ]);

        // Thankyou.html
        registerChromeContentScript('pages/thankyou.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/thankyou.js'
        ]);

        // Options.html
        registerChromeContentScript('pages/options.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/bootstrap.min.js',
            'lib/libs/jquery.mousewheel.min.js',
            'lib/libs/jquery.jscrollpane.min.js',
            'lib/libs/moment-with-locales.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/options.js'
        ]);

        // Log.html
        registerChromeContentScript('pages/log.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/libs/bootstrap.min.js',
            'lib/libs/moment-with-locales.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/content-utils.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/log.js'
        ]);

        // Export.html
        registerChromeContentScript('pages/export.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/pages/export.js'
        ]);

        // Popup.html
        registerChromeContentScript('pages/popup.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/popup-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/script.js',
            'lib/pages/popup-controller.js'
        ]);

        // Sb.html
        registerChromeContentScript('pages/sb.html', [
            'lib/libs/jquery-2.2.4.min.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/i18n-helper.js',
            'lib/pages/i18n.js',
            'lib/pages/sb-filtered-page.js'
        ]);

        // Web pages content scripts (responsible for ad blocking)
        registerPageContentScript([
            'lib/libs/css.escape.js',
            'lib/libs/extended-css-1.0.6.js',
            'lib/utils/element-collapser.js',
            'lib/utils/css-hits-counter.js',
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js',
            'lib/content-script/wrappers.js',
            'lib/content-script/preload.js'
        ], 'document_start', true);

        registerPageContentScript([
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js', // Message passing
            'lib/content-script/content-utils.js'   // Show alert popup and reload without cache functionality
        ], 'document_start', false);

        // Assistant
        registerPageContentScript([
            'lib/libs/css.escape.js', // It's very weird. This script has been already loaded above, but it doesn't work. Load it again!
            'lib/libs/diff_match_patch.js',
            'lib/libs/dom.patched.js',
            'lib/libs/balalaika.patched.js',
            'lib/content-script/i18n-helper.js',    // Localization placeholders
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js', // Message passing
            'lib/content-script/assistant/js/slider-widget.js',
            'lib/content-script/assistant/js/adguard-selector.js',
            'lib/content-script/assistant/js/adguard-rules-constructor.js',
            'lib/content-script/assistant/js/assistant.js',
            'lib/content-script/assistant/js/start-assistant.js'
        ], 'document_end', false);

        // Register assistant css
        registerCss(adguard.loadURL('lib/content-script/assistant/css/selector.css'));

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
            "filterlists.com",
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

        registerPageContentScript([
            'lib/content-script/adguard-content.js',
            'lib/content-script/content-script.js', // message-passing
            'lib/content-script/content-utils.js',  // showAlertPopup function
            'lib/content-script/subscribe.js'
        ], 'document_end', false, subscribeIncludeDomains);

        loadFrameScript();
    }

    /**
     * Register css in user sheet
     * @param cssContent Css content
     */
    function registerCss(cssContent) {

        var styleSheetService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
        var USER_SHEET = styleSheetService.USER_SHEET;

        var cssUri = Services.io.newURI("data:text/css," + encodeURIComponent(cssContent), null, null);
        if (!styleSheetService.sheetRegistered(cssUri, USER_SHEET)) {
            styleSheetService.loadAndRegisterSheet(cssUri, USER_SHEET);
        }
        // Cleanup
        adguard.unload.when(function () {
            if (styleSheetService.sheetRegistered(cssUri, USER_SHEET)) {
                styleSheetService.unregisterSheet(cssUri, USER_SHEET);
            }
        });
    }

    /**
     * Registers a content script for "chrome://" pages of our add-on.
     */
    function registerChromeContentScript(url, paths, when) {
        var files = [];
        for (var i = 0; i < paths.length; i++) {
            files.push(adguard.getURL(paths[i]));
        }

        scripts.push({
            schemes: ['chrome:'],
            url: adguard.getURL(url),
            files: files,
            allFrames: false,
            runAt: when || 'document_start'
        });
    }

    /**
     * Registers a content script for http(s) pages
     */
    function registerPageContentScript(paths, when, allFrames, domains) {
        var files = [];
        for (var i = 0; i < paths.length; i++) {
            files.push(adguard.getURL(paths[i]));
        }

        scripts.push({
            schemes: ['http:', 'https:'],
            files: files,
            allFrames: allFrames,
            runAt: when || 'document_start',
            domains: domains || []
        });
    }

    /**
     * Initializes our frame script and sets up a listener object.
     */
    function loadFrameScript() {

        var initializeFrameScriptListenerName = 'Adguard:initialize-frame-script';
        var shouldLoadListenerMessageName = 'Adguard:should-load';
        var tabUpdatedListenerMessageName = 'Adguard:tab-updated';
        var navigationTargetCreatedListenerMessageName = 'Adguard:navigation-target-created';

        var initializeFrameScriptListener = createInitializeFrameScriptListener();
        var shouldLoadListener = createShouldLoadListener();
        var tabUpdatedListener = createTabUpdatedListener();
        var navigationTargetCreatedListener = createNavigationTargetCreatedAsyncListener();

        /**
         * For some unknown reason we can't use global message messenger for handling synchronous messages from a frame script.
         * On the other hand, parent process manager allows us to receive synchronous messages and send immediate response.
         */
        var parentMessageManager = Cc["@mozilla.org/parentprocessmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

        parentMessageManager.addMessageListener(initializeFrameScriptListenerName, initializeFrameScriptListener);

        var frameScriptUrl = adguard.getURL('lib/frame-script.js');

        // Using global MM to register our frame script browser-wide
        var globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

        // Register special handlers
        globalMessageManager.addMessageListener(shouldLoadListenerMessageName, shouldLoadListener);
        globalMessageManager.addMessageListener(tabUpdatedListenerMessageName, tabUpdatedListener);
        globalMessageManager.addMessageListener(navigationTargetCreatedListenerMessageName, navigationTargetCreatedListener);

        // Cleanup didn't work correctly in previous version. Remove frame-script before loading a new one.
        globalMessageManager.removeDelayedFrameScript(frameScriptUrl);

        globalMessageManager.loadFrameScript(frameScriptUrl, true);

        adguard.unload.when(function () {

            parentMessageManager.removeMessageListener(initializeFrameScriptListenerName, initializeFrameScriptListener);

            globalMessageManager.removeMessageListener(shouldLoadListenerMessageName, shouldLoadListener);
            globalMessageManager.removeMessageListener(tabUpdatedListenerMessageName, tabUpdatedListener);
            globalMessageManager.removeMessageListener(navigationTargetCreatedListenerMessageName, navigationTargetCreatedListener);

            globalMessageManager.removeDelayedFrameScript(frameScriptUrl);

            // Cleanup services in frameModule
            var frameModuleURL = adguard.getURL('lib/frameModule.js');
            var frameModule = {};
            try {
                Cu.import(frameModuleURL, frameModule);
                frameModule.unloadModule();
                Cu.unload(frameModuleURL);
            } catch (ex) {
                adguard.console.error('Error while unregister frame module: {0}', ex);
            }
        });
    }

    /**
     * Frame script initialization listener
     * @returns {Function}
     */
    function createInitializeFrameScriptListener() {
        return function () {
            return {
                scripts: scripts,
                i18nMessages: i18nMessages
            };
        };
    }

    /**
     * Process shouldLoad message from frame-script
     * @returns {Function}
     */
    function createShouldLoadListener() {
        return function (e) {

            var browser = e.target;
            var details = e.data;

            var tab = adguard.tabsImpl.getTabForBrowser(browser);
            if (!tab) {
                return;
            }

            adguard.webRequest.saveRequestDetails(adguard.tabsImpl.getTabIdForTab(tab), details);
        };
    }

    /**
     * Tab update listener
     * @returns {Function}
     */
    function createTabUpdatedListener() {
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
    }

    /**
     * Navigation target created listener
     * @returns {Function}
     */
    function createNavigationTargetCreatedAsyncListener() {

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
    }

    init();

})(adguard);
