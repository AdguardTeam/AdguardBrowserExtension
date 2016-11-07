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

/* global WeakMap, Map, adguard, require, console */

var Ci = require('chrome').Ci;
var Cu = require('chrome').Cu;
var Services = Cu.import("resource://gre/modules/Services.jsm").Services;
var setTimeout = require('sdk/timers').setTimeout; // jshint ignore:line
var unload = require('sdk/system/unload');
var contentScripts = require('../../lib/contentScripts').contentScripts;

(function () {

    'use strict';

    var isFennec = false;

    // TabBrowser: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/tabbrowser
    // Browser: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/browser
    // Tab: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/tab

    function getOwnerWindow(xulTab) {

        if (xulTab.ownerDocument) {
            return xulTab.ownerDocument.defaultView;
        }

        // TODO: fennec case
        return null;
    }

    function getTabForBrowser(browser) {

        var windows = adguard.winWatcher.getWindows();

        for (var i = 0; i < windows.length; i++) {
            // this function may be called when not using fennec
            var window = windows[i];
            if (!window.BrowserApp) {
                continue;
            }

            var tabs = window.BrowserApp.tabs;
            for (var j = 0; j < tabs.length; j++) {
                var tab = tabs[i];
                if (tab.browser === browser) {
                    return tab;
                }
            }
        }
        return null;
    }

    function getTabBrowserForTab(xulTab) {
        var win = getOwnerWindow(xulTab);
        if (!win) {
            return null;
        }
        return getTabBrowserForWin(win);
    }

    function getTabBrowserForWin(win) {
        if (isFennec) {
            return win.BrowserApp;
        }
        return win.gBrowser;
    }

    function getBrowserForTab(xulTab) {
        if (isFennec) {
            return xulTab.browser;
        }
        return xulTab.linkedBrowser;
    }

    function getTabForContentWindow(win) {

        // <xul:iframe/> or <html:iframe/>. But in our case, it should be xul:browser.
        var browser;
        try {
            browser = win.QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIWebNavigation)
                .QueryInterface(Ci.nsIDocShell)
                .chromeEventHandler;
        } catch (e) {
            // Bug 699450: The tab may already have been detached so that `window` is
            // in a almost destroyed state and can't be queryinterfaced anymore.
        }

        // Is null for toplevel documents
        if (!browser) {
            return null;
        }

        // Retrieve the owner window, should be browser.xul one
        var chromeWindow = browser.ownerDocument.defaultView;

        // Ensure that it is top-level browser window.
        // We need extra checks because of Mac hidden window that has a broken
        // `gBrowser` global attribute.
        if ('gBrowser' in chromeWindow && chromeWindow.gBrowser &&
            'browsers' in chromeWindow.gBrowser) {
            // Looks like we are on Firefox Desktop
            // Then search for the position in tabbrowser in order to get the tab object
            var browsers = chromeWindow.gBrowser.browsers;
            var i = browsers.indexOf(browser);
            if (i !== -1) {
                return chromeWindow.gBrowser.tabs[i];
            }
            return null;
        } else if ('BrowserApp' in chromeWindow) {
            //TODO: fennec
        }

        return null;
    }

    function toBrowserWindow(win) {
        var docElement = win && win.document && win.document.documentElement;
        if (!docElement) {
            return null;
        }
        return docElement.getAttribute('windowtype') === 'navigator:browser' || docElement.getAttribute('id') === 'main-window' ? win : null;
    }

    function retryUntil(predicate, main, details) {

        if (typeof details !== 'object') {
            details = {};
        }

        var now = 0;
        var next = details.next || 200;
        var until = details.until || 2000;

        var check = function () {
            if (predicate() === true || now >= until) {
                main();
                return;
            }
            now += next;
            setTimeout(check, next);
        };

        if ('sync' in details && details.sync === true) {
            check();
        } else {
            setTimeout(check, 1);
        }
    }

    var noOpFunc = function () {
    };

    adguard.winWatcher = (function () {

        var windowsIdMap = new Map();
        var nextWindowId = 1;

        var callbacks = {
            onOpenWindow: noOpFunc,
            onCloseWindow: noOpFunc
        };

        (function () {

            function addWindow(domWin) {
                if (!domWin || windowsIdMap.has(domWin)) {
                    return;
                }
                windowsIdMap.set(domWin, nextWindowId++);
                callbacks.onOpenWindow(domWin);
            }

            function removeWindow(domWin) {
                if (!domWin || windowsIdMap.delete(domWin) !== true) {
                    return;
                }
                callbacks.onCloseWindow(domWin);
            }

            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator
            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowWatcher
            var windowEventsListeners = {

                onOpenWindow: function (aWindow) {
                    var domWindow;
                    try {
                        domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
                    } catch (ex) {
                        // ignore
                    }
                    addWindow(domWindow);
                },

                onCloseWindow: function (aWindow) {
                    var domWindow;
                    try {
                        domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
                    } catch (ex) {
                        // ignore
                    }
                    removeWindow(domWindow);
                },

                observe: function (aSubject, topic) {
                    var domWindow;
                    try {
                        domWindow = aSubject.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
                    } catch (ex) {
                        // ignore
                    }
                    if (!domWindow) {
                        return;
                    }
                    switch (topic) {
                        case 'domwindowopened':
                            addWindow(domWindow);
                            break;
                        case 'domwindowclosed':
                            removeWindow(domWindow);
                            break;
                    }
                }
            };

            // Initialize open windows

            var winEnumerator;
            var win;

            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator#getEnumerator%28%29
            winEnumerator = Services.wm.getEnumerator(null);
            while (winEnumerator.hasMoreElements()) {
                win = winEnumerator.getNext();
                if (!win.closed) {
                    windowsIdMap.set(win, nextWindowId++);
                }
            }

            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowWatcher#getWindowEnumerator%28%29
            winEnumerator = Services.ww.getWindowEnumerator();
            while (winEnumerator.hasMoreElements()) {
                win = winEnumerator.getNext()
                    .QueryInterface(Ci.nsIInterfaceRequestor)
                    .getInterface(Ci.nsIDOMWindow);
                if (!win.closed) {
                    windowsIdMap.set(win, nextWindowId++);
                }
            }

            Services.wm.addListener(windowEventsListeners);
            Services.ww.registerNotification(windowEventsListeners);

            unload.when(function () {
                Services.wm.removeListener(windowEventsListeners);
                Services.ww.unregisterNotification(windowEventsListeners);
                windowsIdMap.clear();
            });
        })();

        var onOpenWindow = function (callback) {
            callbacks.onOpenWindow = callback;
        };

        var onCloseWindow = function (callback) {
            callbacks.onCloseWindow = callback;
        };

        var getWindows = function () {
            return Array.from(windowsIdMap.keys());
        };

        var getCurrentWindow = function () {
            return toBrowserWindow(Services.wm.getMostRecentWindow(null));
        };

        var getCurrentBrowserWindow = function () {
            return toBrowserWindow(Services.wm.getMostRecentWindow('navigator:browser'));
        };

        return {
            onOpenWindow: onOpenWindow,
            onCloseWindow: onCloseWindow,
            getWindows: getWindows,
            getCurrentWindow: getCurrentWindow,
            getCurrentBrowserWindow: getCurrentBrowserWindow
        };

    })();

    adguard.tabsImpl = (function () {

        var tabsLookup = Object.create(null);

        // https://developer.mozilla.org/ru/docs/Web/Events

        var callbacks = {
            onCreated: noOpFunc,
            onRemoved: noOpFunc,
            onActivated: noOpFunc,
            onUpdated: noOpFunc
        };

        function addTab(xulTab) {

            var tabId = getTabId(xulTab);
            tabsLookup[tabId] = xulTab;

            var browser = getBrowserForTab(xulTab);

            callbacks.onCreated(toTabFromXulTab(xulTab, browser));
        }

        function removeTab(xulTab) {

            var tabId = getTabId(xulTab);
            delete tabsLookup[tabId];

            callbacks.onRemoved(tabId);
        }

        function onTabEvent(event) {

            var tabId, xulTab, browser;

            switch (event.type) {
                case 'TabShow':
                case 'TabOpen':
                    xulTab = event.target;
                    addTab(xulTab);
                    break;
                case 'TabClose':
                    // Remove Tab
                    xulTab = event.target;
                    removeTab(xulTab);
                    break;
                case 'TabSelect':
                    tabId = getTabId(event.target);
                    callbacks.onActivated(tabId);
                    break;
                case 'activate': // window event
                    getActive(function (tabId) {
                        callbacks.onActivated(tabId);
                    });
                    break;
                case 'DOMContentLoaded':
                case 'DOMTitleChanged':
                case 'load':
                case 'pageshow':
                    if (event.target instanceof Ci.nsIDOMHTMLDocument) {
                        var win = event.target.defaultView;
                        if (win === win.top) {
                            xulTab = getTabForContentWindow(win);
                            if (!xulTab) {
                                return;
                            }
                            browser = getBrowserForTab(xulTab);
                            callbacks.onUpdated(toTabFromXulTab(xulTab, browser, 'complete'));
                        }
                    }
                    break;
            }
        }

        function isTabBrowserInitialized(win) {

            var document = win && win.document;
            if (!document || document.readyState !== 'complete') {
                return false;
            }

            // the tab browser isn't immediately available
            var tabBrowser = getTabBrowserForWin(win);
            if (!tabBrowser) {
                return false;
            }

            return toBrowserWindow(win) !== null;
        }

        function onTabBrowserInitialized(win) {

            var tabBrowser = getTabBrowserForWin(win);
            if (!tabBrowser) {
                return;
            }

            var tabContainer = tabBrowser.deck || tabBrowser.tabContainer;
            if (tabContainer) {
                tabContainer.addEventListener('TabShow', onTabEvent, false);
                tabContainer.addEventListener('TabOpen', onTabEvent, false);
                tabContainer.addEventListener('TabClose', onTabEvent, false);
                tabContainer.addEventListener('TabSelect', onTabEvent, false);
            }

            tabBrowser.addEventListener('load', onTabEvent, true);

            win.addEventListener('activate', onTabEvent, false);
            win.addEventListener('DOMContentLoaded', onTabEvent, false);
            win.addEventListener('DOMTitleChanged', onTabEvent, false);
            win.addEventListener('pageshow', onTabEvent, false);

            for (var i = 0; i < tabBrowser.tabs.length; i++) {
                addTab(tabBrowser.tabs[i]);
            }
        }

        function detachFromTabBrowser(win) {

            var tabBrowser = getTabBrowserForWin(win);
            if (!tabBrowser) {
                return;
            }

            var tabContainer = tabBrowser.deck || tabBrowser.tabContainer;
            if (tabContainer) {
                tabContainer.removeEventListener('TabShow', onTabEvent, false);
                tabContainer.removeEventListener('TabOpen', onTabEvent, false);
                tabContainer.removeEventListener('TabClose', onTabEvent, false);
                tabContainer.removeEventListener('TabSelect', onTabEvent, false);
            }

            tabBrowser.removeEventListener('load', onTabEvent, true);

            win.removeEventListener('activate', onTabEvent, false);
            win.removeEventListener('DOMContentLoaded', onTabEvent, false);
            win.removeEventListener('DOMTitleChanged', onTabEvent, false);
            win.removeEventListener('pageshow', onTabEvent, false);
        }

        function onOpenWindow(win) {
            retryUntil(
                isTabBrowserInitialized.bind(null, win),
                onTabBrowserInitialized.bind(null, win)
            );
        }

        // Initialize with currently opened windows
        var windows = adguard.winWatcher.getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            onOpenWindow(win);
        }

        adguard.winWatcher.onOpenWindow(onOpenWindow);
        adguard.winWatcher.onCloseWindow(function (win) {
            detachFromTabBrowser(win);
        });

        unload.when(function () {
            var wins = adguard.winWatcher.getWindows();
            for (var i = 0; i < wins.length; i++) {
                detachFromTabBrowser(wins[i]);
            }
        });

        function toTabFromXulTab(xulTab, browser, status) {
            return {
                tabId: getTabId(xulTab),
                url: browser.currentURI.asciiSpec,
                title: browser.contentTitle,
                status: status || 'loading',
                incognito: false // TODO: implement incognito
            };
        }

        function getTabId(xulTab) {
            if (isFennec) {
                return xulTab.id;
            }
            return String.split(xulTab.linkedPanel, 'panel').pop();
        }

        function getTabById(tabId) {
            return tabsLookup[tabId];
        }

        // API functions

        var create = function (details, callback) {

            var url = details.url;
            var active = details.active === true;
            var inNewWindow = details.inNewWindow === true;

            var win = adguard.winWatcher.getCurrentWindow();
            if (!win) {
                return;
            }
            var tabBrowser = getTabBrowserForWin(win);
            if (!tabBrowser) {
                return;
            }

            if (isFennec) {
                tabBrowser.addTab(url, {selected: active});
                return;
            }

            if (details.type === 'popup') {
                win.open(url, '_blank', 'width=1230,height=630,menubar=0,status=no,toolbar=no,scrollbars=yes,resizable=yes');
                callback();
                return;
            }
            if (inNewWindow) {
                win.open(url);
                callback();
                return;
            }

            tabBrowser.loadOneTab(url, {inBackground: !active});
            callback();
        };

        /**
         * Removes tab with specified tabId
         *
         * @param tabId
         * @param callback
         */
        var remove = function (tabId, callback) {

            var xulTab = getTabById(tabId);
            if (!xulTab) {
                return;
            }

            var tabBrowser = getTabBrowserForTab(xulTab);
            if (!tabBrowser) {
                return;
            }

            if (isFennec) {
                tabBrowser.closeTab(xulTab);
            } else {
                if (tabBrowser.tabs.length === 1) {
                    getOwnerWindow(xulTab).close();
                } else {
                    // Bug 699450: the tab may already have been detached
                    if (!xulTab.parentNode) {
                        return;
                    }
                    tabBrowser.removeTab(xulTab);
                }
            }

            callback(tabId);
        };

        /**
         * Activates specified tab
         *
         * @param tabId
         * @param callback
         */
        var activate = function (tabId, callback) {

            var xulTab = getTabById(tabId);
            if (!xulTab) {
                return;
            }

            var win = getOwnerWindow(xulTab);
            var tabBrowser = getTabBrowserForTab(xulTab);
            if (!tabBrowser) {
                return;
            }

            win.focus();

            if (isFennec) {
                tabBrowser.selectTab(xulTab);
            } else {
                tabBrowser.selectedTab = xulTab;
            }

            callback(tabId);
        };

        /**
         * Reloads tab with tabId
         *
         * @param tabId
         * @param url
         */
        var reload = function (tabId, url) {

            var xulTab = getTabById(tabId);
            if (!xulTab) {
                return;
            }

            var browser = getBrowserForTab(xulTab);
            if (!browser) {
                return;
            }

            if (url) {
                // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/loadURIWithFlags
                browser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
            } else {
                // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/reloadWithFlags
                browser.reloadWithFlags(Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
            }
        };

        /**
         * Sends message to specified tab
         *
         * @param tabId       Tab identifier
         * @param message   Message to send
         */
        var sendMessage = function (tabId, message) {
            var xulTab = getTabById(tabId);
            if (!xulTab) {
                return;
            }
            var browser = getBrowserForTab(xulTab);
            if (!browser) {
                return;
            }
            browser.messageManager.sendAsyncMessage('Adguard:on-message-channel', message);
        };

        /**
         * Gets an array of all tabs
         *
         * @param callback
         * @returns {Array}
         */
        var getAll = function (callback) {

            var tabs = [];

            var windows = adguard.winWatcher.getWindows();
            for (var i = 0; i < windows.length; i++) {

                var win = windows[i];

                var tabBrowser = getTabBrowserForWin(win);
                if (!tabBrowser) {
                    continue;
                }

                for (var j = 0; j < tabBrowser.tabs.length; j++) {
                    var xulTab = tabBrowser.tabs[j];
                    var browser = getBrowserForTab(xulTab);
                    tabs.push(toTabFromXulTab(xulTab, browser));
                }
            }

            callback(tabs);
        };

        /**
         * Gets an active tab
         * @param callback
         */
        var getActive = function (callback) {

            var win = adguard.winWatcher.getCurrentWindow();
            if (!win) {
                return;
            }
            var tabBrowser = getTabBrowserForWin(win);
            if (!tabBrowser) {
                return;
            }

            var xulTab = tabBrowser.selectedTab;
            if (!xulTab) {
                return;
            }

            callback(getTabId(xulTab));

        };

        // Tab Events
        var onCreated = function (callback) {
            callbacks.onCreated = callback;
        };

        function onRemoved(callback) {
            callbacks.onRemoved = callback;
        }

        function onUpdated(callback) {
            callbacks.onUpdated = callback;
        }

        function onActivated(callback) {
            callbacks.onActivated = callback;
        }

        return {

            onCreated: onCreated,
            onRemoved: onRemoved,
            onUpdated: onUpdated,
            onActivated: onActivated,

            create: create,
            remove: remove,
            activate: activate,
            reload: reload,
            sendMessage: sendMessage,
            getAll: getAll,
            getActive: getActive,

            getTabIdForTab: getTabId,
            getTabForBrowser: getTabForBrowser,
            getTabForContentWindow: getTabForContentWindow
        };

    })();

})();