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
var chrome = require('chrome');
var self = require('sdk/self');
var l10n = require('sdk/l10n');
var tabs = require('sdk/tabs');
var simplePrefs = require('sdk/simple-prefs');
var simpleStorage = require('sdk/simple-storage');
var unload = require('sdk/system/unload');
var pageMod = require('sdk/page-mod');

const {Cc, Ci, Cr, Cu} = chrome;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var sdkModules = {
    'chrome': chrome,
    'sdk/timers': require('sdk/timers'),
    'sdk/tabs': tabs,
    'sdk/tabs/utils': require('sdk/tabs/utils'),
    'sdk/system': require('sdk/system'),
    'sdk/simple-prefs': simplePrefs,
    'sdk/simple-storage': simpleStorage,
    'sdk/self': self,
    'sdk/page-mod': pageMod,
    'sdk/l10n': l10n,
    'sdk/system/unload': unload,
    'sdk/system/events': require('sdk/system/events'),
    'sdk/core/promise': require('sdk/core/promise'),
    'sdk/io/file': require('sdk/io/file'),
    'sdk/windows': require('sdk/windows'),
    'sdk/private-browsing': require('sdk/private-browsing')
};

exports.onUnload = function (reason) {
    switch (reason) {
        case 'disable':
        case 'upgrade':
        case 'downgrade':
        case 'uninstall':
            break;
    }
};

exports.main = function (options, callbacks) {

    try {

        var {Log} = loadAdguardModule('utils/log');
        var {FS} = loadAdguardModule('utils/file-storage');
        var {LS} = loadAdguardModule('utils/local-storage');
        if (options.loadReason == 'install' || options.loadReason == 'downgrade') {
            LS.clean();
            FS.removeAdguardDir();
        }

        var SdkPanel = null;
        // PaleMoon (25) and fennec doesn't support sdk/panel
        try {
            SdkPanel = require('sdk/panel').Panel;
        } catch (ex) {
            Log.info("Module sdk/panel is not supported");
        }

        var SdkContextMenu = null;
        try {
            SdkContextMenu = require('sdk/context-menu');
        } catch (ex) {
            Log.info("Module sdk/context-menu is not supported");
        }

        //load module 'sdk/ui/button/toggle'. This module supported from 29 version
        var SdkButton;
        try {
            SdkButton = require('sdk/ui/button/toggle').ToggleButton;
        } catch (ex) {
            Log.info('Module sdk/ui/button/toggle is not supported');
        }

        var {Prefs} = loadAdguardModule('prefs');
        var {AntiBannerFiltersId} = loadAdguardModule('utils/common');
        var {Utils} = loadAdguardModule('utils/browser-utils');
        var {TabsMap} = loadAdguardModule('tabsMap');
        var {FramesMap} = loadAdguardModule('utils/frames');
        var {AdguardApplication} = loadAdguardModule('filter/integration');
        var {filterRulesHitCount} = loadAdguardModule('filter/filters-hit');
        var {FilteringLog} = loadAdguardModule('filter/filtering-log');
        var {WebRequestService}= loadAdguardModule('filter/request-blocking');
        var {AntiBannerService} = loadAdguardModule('filter/antibanner');
        var {ElemHide} = loadAdguardModule('elemHide');
        var {WebRequestImpl} = loadAdguardModule('contentPolicy');
        var {InterceptHandler} = loadAdguardModule('elemHideIntercepter');
        var {UI} = loadAdguardModule('ui');
        var {ContentMessageHandler}= loadAdguardModule('content-message-handler');
        var {contentScripts} = loadAdguardModule('contentScripts');

        // These require-calls are needed for proper build by cfx.
        require('prefs');
        require('elemHide');
        require('tabsMap');
        require('contentPolicy');
        require('elemHideIntercepter');
        require('content-message-handler');
        require('ui');
        require('utils/frames');
        require('utils/common');
        require('utils/browser-utils');
        require('utils/user-settings');
        require('filter/integration');
        require('filter/filtering-log');

        Log.info('Starting adguard addon...');

        var antiBannerService = new AntiBannerService();
        var framesMap = new FramesMap(antiBannerService, TabsMap);
        var adguardApplication = new AdguardApplication(framesMap);
        var filteringLog = new FilteringLog(TabsMap, framesMap, UI);
        var webRequestService = new WebRequestService(framesMap, antiBannerService, filteringLog, adguardApplication);

        WebRequestImpl.init(antiBannerService, adguardApplication, ElemHide, framesMap, filteringLog, webRequestService);
        ElemHide.init(framesMap, antiBannerService, webRequestService);
        InterceptHandler.init(framesMap, antiBannerService);
        filterRulesHitCount.setAntiBannerService(antiBannerService);

        // Initialize content-message handler
        var contentMessageHandler = new ContentMessageHandler();
        contentMessageHandler.init(antiBannerService, webRequestService, framesMap, adguardApplication, filteringLog, UI);
        contentMessageHandler.setSendMessageToSender(function (worker, message) {
            contentScripts.sendMessageToWorker(worker, message);
        });
        contentScripts.init(contentMessageHandler);

        // Initialize overlay toolbar button
        UI.init(antiBannerService, framesMap, filteringLog, adguardApplication, SdkPanel, SdkContextMenu, SdkButton);

        var AdguardModules = {

            antiBannerService: antiBannerService,
            framesMap: framesMap,
            filteringLog: filteringLog,
            Prefs: Prefs,
            UI: UI,
            i18n: i18n,
            Utils: Utils,
            AntiBannerFiltersId: AntiBannerFiltersId,
            //for popup script
            tabs: tabs
        };

        /**
         * Observer for loaded adguard modules.
         * This observer is used for scripts on "chrome" pages to get access to Adguard modules.
         * Look at loadAdguardModule method in modules.js file.
         */
        var RequireObserver = {

            LOAD_MODULE_TOPIC: "adguard-load-module",

            observe: function (subject, topic, data) {
                if (topic == RequireObserver.LOAD_MODULE_TOPIC) {
                    var service = AdguardModules[data];
                    if (!service) {
                        throw 'Module "' + data + '" is undefined';
                    }
                    subject.wrappedJSObject.exports = service;
                }
            },

            QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
        };
        Services.obs.addObserver(RequireObserver, RequireObserver.LOAD_MODULE_TOPIC, true);
        //remove observer on unload
        unload.when(function () {
            Services.obs.removeObserver(RequireObserver, RequireObserver.LOAD_MODULE_TOPIC);
        });

        var antiBannerCallback = function (runInfo) {
            if (runInfo.isFirstRun) {
                // Show filters download page on first run of addon
                UI.openFiltersDownloadPage();
            }
        };
        antiBannerService.init({
            runCallback: antiBannerCallback
        });
    } catch (ex) {
        Cu.reportError(ex);
        throw  ex;
    }

    //cleanup stored frames
    tabs.on('close', function (tab) {
        framesMap.removeFrame(tab);
    });

    // language detect on tab ready event
    tabs.on('ready', function (tab) {
        antiBannerService.checkTabLanguage(tab.id, tab.url);
    });

    //initialize filtering log
    filteringLog.synchronizeOpenTabs();
    tabs.on('open', function (tab) {
        filteringLog.addTab(tab);
        framesMap.checkTabIncognitoMode(tab);
    });
    tabs.on('close', function (tab) {
        filteringLog.removeTab(tab);
    });
    tabs.on('ready', function (tab) {
        filteringLog.updateTab(tab);
    });
};

var i18n = (function () {

    function getText(text, args) {
        if (!text) {
            return "";
        }
        if (args && args.length > 0) {
            text = text.replace(/\$(\d+)/g, function (match, number) {
                return typeof args[number - 1] != "undefined" ? args[number - 1] : match;
            });
        }
        return text;
    }

    return {
        getMessage: function (key, args) {
            return getText(l10n.get(key), args);
        }
    };
})();

/**
 * Loads Adguard module.
 *
 * We use "loadSubScript" function instead of "require" because of strange behavior of the modules loaded by "require" method.
 * It seems that "require"-loaded modules work really slow comparing to loaded with "loadSubScript".
 *
 * @param module
 */
var loadAdguardModule = function (module) {
    try {
        var scopes = loadAdguardModule.scopes;
        if (!(module in scopes)) {
            var modulePath = module + ".js";
            var url = self.data.url('../lib/' + modulePath).replace("data/../lib/" + modulePath, 'lib/' + modulePath);
            scopes[module] = {
                require: function (module) {
                    if (module in sdkModules) {
                        return sdkModules[module];
                    }
                    return loadAdguardModule(module);
                },
                i18n: i18n,
                exports: Object.create(Object.prototype)
            };
            Services.scriptloader.loadSubScript(url, scopes[module]);
        }
        return scopes[module].exports;
    } catch (ex) {
        Cu.reportError('Error while loading module: ' + module);
        Cu.reportError(ex);
        throw ex;
    }
};
loadAdguardModule.scopes = Object.create(null);
