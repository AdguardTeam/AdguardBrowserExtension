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

/* global Services, Ci, XPCOMUtils, Map, adguard, EventChannels, ConcurrentUtils, unload */

(function () {

    'use strict';

    var isFennec = false;

    var BROWSER = 'navigator:browser';

    function isBrowser(window) {
        try {
            return window.document.documentElement.getAttribute("windowtype") === BROWSER;
        } catch (e) {
        }
        return false;
    }

    var getCurrentBrowserWindow = function () {
        return Services.wm.getMostRecentWindow(BROWSER);
    };

    function activateTab(tab, window) {
        var gBrowser = getTabBrowserForTab(tab);
        // normal case
        if (gBrowser) {
            gBrowser.selectedTab = tab;
        } else if (window && window.BrowserApp) { // fennec ?
            window.BrowserApp.selectTab(tab);
        }
        return null;
    }


    function getTabBrowser(window) {
        return window.BrowserApp || window.gBrowser;
    }

    function getTabContainer(window) {
        return getTabBrowser(window).tabContainer;
    }

    /**
     * Returns the tabs for the `window` if given, or the tabs
     * across all the browser's windows otherwise.
     */
    function getTabs(window) {

        var tabs = [], i;

        if (arguments.length === 0) {
            var windows = adguard.winWatcher.getWindows();
            for (i = 0; i < windows.length; i++) {
                var win = windows[i];
                if (isBrowser(win)) {
                    tabs = tabs.concat(getTabs(win));
                }
            }
            return tabs;
        }

        // fennec
        if (window.BrowserApp) {
            return window.BrowserApp.tabs;
        }

        // firefox - default
        var children = getTabContainer(window).children;
        for (i = 0; i < children.length; i++) {
            var child = children[i];
            if (!child.closing) {
                tabs.push(child);
            }
        }
        return tabs;
    }

    function getActiveTab(window) {
        if (window.BrowserApp) {// fennec?
            return window.BrowserApp.selectedTab;
        }
        if (window.gBrowser) {
            return window.gBrowser.selectedTab;
        }
        return null;
    }

    function getOwnerWindow(tab) {
        // normal case
        if (tab.ownerDocument) {
            return tab.ownerDocument.defaultView;
        }

        // try fennec case
        return getWindowHoldingTab(tab);
    }

    // fennec
    function getWindowHoldingTab(rawTab) {
        var windows = adguard.winWatcher.getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            // this function may be called when not using fennec,
            // but BrowserApp is only defined on Fennec
            if (!win.BrowserApp) {
                continue;
            }
            var tabs = win.BrowserApp.tabs;
            for (var j = 0; j < tabs.length; j++) {
                if (tabs[i] == rawTab) {
                    return win;
                }
            }
        }
        return null;
    }

    function closeTab(tab) {
        var gBrowser = getTabBrowserForTab(tab);
        // normal case?
        if (gBrowser) {
            if (gBrowser.tabs && gBrowser.tabs.length === 1) {
                getOwnerWindow(tab).close();
                return;
            }
            // Bug 699450: the tab may already have been detached
            if (!tab.parentNode) {
                return;
            }
            return gBrowser.removeTab(tab);
        }

        var window = getWindowHoldingTab(tab);
        // fennec?
        if (window && window.BrowserApp) {
            // Bug 699450: the tab may already have been detached
            if (!tab.browser) {
                return;
            }
            return window.BrowserApp.closeTab(tab);
        }
        return null;
    }

    function getURI(tab) {
        if (tab.browser) { // fennec
            return tab.browser.currentURI.spec;
        }
        return tab.linkedBrowser.currentURI.spec;
    }

    function getTabTitle(tab) {
        return getBrowserForTab(tab).contentTitle || tab.label || "";
    }

    function getTabBrowserForTab(tab) {
        var outerWin = getOwnerWindow(tab);
        if (outerWin) {
            return getOwnerWindow(tab).gBrowser;
        }
        return null;
    }


    function getBrowserForTab(tab) {
        if (tab.browser) { // fennec
            return tab.browser;
        }
        return tab.linkedBrowser;
    }


    function getTabId(tab) {
        if (tab.browser) { // fennec
            return tab.id;
        }
        return String.split(tab.linkedPanel, 'panel').pop();
    }

    function getTabContentWindow(tab) {
        return getBrowserForTab(tab).contentWindow;
    }

    // gets the tab containing the provided window
    function getTabForContentWindow(window) {
        var tabs = getTabs();
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (getTabContentWindow(tab) === window.top) {
                return tab;
            }
        }
    }

    function getTabForBrowser(browser) {

        var windows = adguard.winWatcher.getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            // this function may be called when not using fennec
            if (!win.BrowserApp) {
                continue;
            }
            var tabs = win.BrowserApp.tabs;
            for (var j = 0; j < tabs.length; j++) {
                var tab = tabs[j];
                if (tab.browser === browser) {
                    return tab;
                }
            }
        }

        var tabbrowser = browser.getTabBrowser && browser.getTabBrowser();
        if (!tabbrowser) {
            return null;
        }

        var index;
        if (isFennec) {
            // Fennec
            // https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/API/BrowserApp
            index = tabbrowser.tabs.indexOf(tabbrowser.getTabForBrowser(browser));
        } else {
            index = tabbrowser.browsers.indexOf(browser);
        }
        if (!tabbrowser.tabs || index < 0 || index >= tabbrowser.tabs.length) {
            return null;
        }
        return tabbrowser.tabs[index];
    }

    adguard.winWatcher = adguard.windowsImpl = (function () {

        var windowsIdMap = new Map();
        var nextWindowId = 1;

        var onCreatedChannel = EventChannels.newChannel();
        var onRemovedChannel = EventChannels.newChannel();
        var onUpdatedChannel = EventChannels.newChannel();

        function toWindowFromChromeWindow(windowId, win) {
            return {
                windowId: windowId,
                type: isBrowser(win) ? 'normal' : 'other'
            };
        }

        (function () {

            function isTabBrowserInitialized(win) {

                var document = win && win.document;
                if (!document || document.readyState !== 'complete') {
                    return false;
                }

                // the tab browser isn't immediately available
                var tabBrowser = getTabBrowser(win);
                if (!tabBrowser) {
                    return false;
                }

                return isBrowser(win);
            }

            function addWindow(domWin) {

                if (!domWin || windowsIdMap.has(domWin)) {
                    return;
                }

                var windowId = nextWindowId++;
                windowsIdMap.set(domWin, windowId);
                onCreatedChannel.notify(toWindowFromChromeWindow(windowId, domWin), domWin);

                // TabBrowserReady event
                ConcurrentUtils.retryUntil(
                    isTabBrowserInitialized.bind(null, domWin),
                    function () {
                        onUpdatedChannel.notify(toWindowFromChromeWindow(windowId, domWin), domWin, 'TabBrowserReady');
                    });

                // Fennec case
                domWin.addEventListener('UIReady', function onUIReady() {
                    domWin.removeEventListener('UIReady', onUIReady, false);
                    onWindowLoad(domWin);
                }, false);
            }

            function onWindowLoad(domWin) {
                if (!domWin) {
                    return;
                }
                var windowId = windowsIdMap.get(domWin);
                if (!windowId) {
                    return;
                }
                onUpdatedChannel.notify(toWindowFromChromeWindow(windowId, domWin), domWin, 'ChromeWindowLoad');
            }

            function removeWindow(domWin) {
                if (!domWin) {
                    return;
                }
                var windowId = windowsIdMap.get(domWin);
                if (windowsIdMap.delete(domWin) !== true) {
                    return;
                }
                onRemovedChannel.notify(windowId, domWin);
            }

            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowMediator
            // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIWindowWatcher
            //noinspection JSUnusedGlobalSymbols
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
                        case 'chrome-document-global-created':
                            domWindow.addEventListener('load', function onLoad() {
                                domWindow.removeEventListener('load', onLoad, false);
                                onWindowLoad(domWindow);
                            }, false);
                            break;
                    }
                },

                QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
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
            Services.obs.addObserver(windowEventsListeners, 'chrome-document-global-created', true);

            unload.when(function () {
                Services.wm.removeListener(windowEventsListeners);
                Services.ww.unregisterNotification(windowEventsListeners);
                Services.obs.removeObserver(windowEventsListeners, 'chrome-document-global-created');
                windowsIdMap.clear();
            });
        })();

        var create = function (createData, callback) { // jshint ignore:line
            //TODO: implement
        };

        var getAll = function (callback) {
            var metadata = [];
            windowsIdMap.forEach(function (windowId, win) {
                metadata.push([toWindowFromChromeWindow(windowId, win), win]);
            });
            callback(metadata);
        };

        var getLastFocused = function (callback) {
            var win = getCurrentBrowserWindow();
            if (!win) {
                return;
            }
            var windowId = windowsIdMap.get(win);
            if (windowId) {
                callback(windowId, win);
            }
        };

        var getWindows = function () {
            if (typeof Array.from === 'function') {
                return Array.from(windowsIdMap.keys());
            }
            var result = [];
            windowsIdMap.forEach(function (windowId, win) {
                result.push(win);
            });
            return result;
        };

        return {
            onCreated: onCreatedChannel,
            onRemoved: onRemovedChannel,
            onUpdated: onUpdatedChannel,

            create: create,
            getAll: getAll,
            getLastFocused: getLastFocused,

            getWindows: getWindows,
            getCurrentBrowserWindow: getCurrentBrowserWindow,
            getOwnerWindow: getOwnerWindow
        };
    })();

    adguard.tabsImpl = (function () {

        var tabsLookup = Object.create(null);

        var onCreatedChannel = EventChannels.newChannel();
        var onRemovedChannel = EventChannels.newChannel();
        var onActivatedChannel = EventChannels.newChannel();
        var onUpdatedChannel = EventChannels.newChannel();

        function addTab(xulTab) {

            var tabId = getTabId(xulTab);
            tabsLookup[tabId] = xulTab;

            onCreatedChannel.notify(toTabFromXulTab(xulTab));
        }

        function removeTab(xulTab) {

            var tabId = getTabId(xulTab);
            delete tabsLookup[tabId];

            onRemovedChannel.notify(tabId);
        }

        // https://developer.mozilla.org/ru/docs/Web/Events
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
                    onActivatedChannel.notify(tabId);
                    break;
                case 'activate': // window event
                    getActive(onActivatedChannel.notify);
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
                            onUpdatedChannel.notify(toTabFromXulTab(xulTab, 'complete'));
                        }
                    }
                    break;
            }
        }

        function onTabBrowserInitialized(win) {

            var tabBrowser = getTabBrowser(win);
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

            var tabs = getTabs(win);
            for (var i = 0; i < tabs.length; i++) {
                addTab(tabs[i]);
            }
        }

        function detachFromTabBrowser(win) {

            var tabBrowser = getTabBrowser(win);
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

        // Initialize with currently opened windows
        var windows = adguard.winWatcher.getWindows();
        for (var i = 0; i < windows.length; i++) {
            onTabBrowserInitialized(windows[i]);
        }

        adguard.winWatcher.onUpdated.addListener(function (win, domWin, type) {
            if (type === 'TabBrowserReady') {
                onTabBrowserInitialized(domWin);
            }
        });
        adguard.winWatcher.onRemoved.addListener(function (win, domWin) {
            detachFromTabBrowser(domWin);
        });

        unload.when(function () {
            var windows = adguard.winWatcher.getWindows();
            for (var i = 0; i < windows.length; i++) {
                detachFromTabBrowser(windows[i]);
            }
        });

        function isPrivate(xulTab) {

            var win = getOwnerWindow(xulTab);
            if (!win) {
                return false;
            }

            // if the pbService is undefined, the PrivateBrowsingUtils.jsm is available,
            // and the app is Firefox, then assume per-window private browsing is
            // enabled.
            try {
                return win.QueryInterface(Ci.nsIInterfaceRequestor)
                    .getInterface(Ci.nsIWebNavigation)
                    .QueryInterface(Ci.nsILoadContext)
                    .usePrivateBrowsing;
            } catch (e) {
            }

            // Sometimes the input is not a nsIDOMWindow.. but it is still a window.
            try {
                return !!win.docShell.QueryInterface(Ci.nsILoadContext).usePrivateBrowsing;
            } catch (e) {
            }

            return false;
        }

        function toTabFromXulTab(xulTab, status) {
            return {
                tabId: getTabId(xulTab),
                url: getURI(xulTab),
                title: getTabTitle(xulTab),
                status: status || 'loading',
                incognito: isPrivate(xulTab)
            };
        }

        function getTabById(tabId) {
            return tabsLookup[tabId];
        }

        // API functions

        var create = function (details, callback) {

            var url = details.url;
            var active = details.active === true;
            var inNewWindow = details.inNewWindow === true;

            var win = getCurrentBrowserWindow();
            if (!win) {
                return;
            }
            var tabBrowser = getTabBrowser(win);
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

            var xulTab = tabBrowser.addTab(url);
            if (active) {
                activateTab(xulTab);
            }

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
            closeTab(xulTab);

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
            if (!win) {
                return;
            }

            win.focus();
            activateTab(xulTab, win);

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
                browser.loadURI(String(url));
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
            var xulTabs = getTabs();
            for (var i = 0; i < xulTabs.length; i++) {
                tabs.push(toTabFromXulTab(xulTabs[i]));
            }
            callback(tabs);
        };

        /**
         * Gets an active tab
         * @param callback
         */
        var getActive = function (callback) {
            var win = getCurrentBrowserWindow();
            if (!win) {
                return;
            }
            var xulTab = getActiveTab(win);
            if (!xulTab) {
                return;
            }
            callback(getTabId(xulTab));
        };

        return {

            onCreated: onCreatedChannel,
            onRemoved: onRemovedChannel,
            onUpdated: onUpdatedChannel,
            onActivated: onActivatedChannel,

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