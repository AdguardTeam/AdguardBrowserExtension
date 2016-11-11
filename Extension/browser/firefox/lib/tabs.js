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

/* global Cu, Ci, Services, XPCOMUtils, WeakMap, Map, console, adguard */

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

        var win = getOwnerWindow(browser);
        if (!win) {
            return null;
        }

        var tabBrowser = getTabBrowserForWin(win);
        if (!tabBrowser) {
            return null;
        }

        var index = tabBrowser.browsers.indexOf(browser);
        if (index < 0) {
            return null;
        }

        if (!tabBrowser.tabs || index >= tabBrowser.tabs.length) {
            return null;
        }
        return tabBrowser.tabs[index];
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
        return getWindowType(win) === 'normal' ? win : null;
    }

    function getWindowType(win) {
        var docElement = win && win.document && win.document.documentElement;
        if (!docElement) {
            return 'other';
        }
        return docElement.getAttribute('windowtype') === 'navigator:browser' || docElement.getAttribute('id') === 'main-window' ? 'normal' : 'other';
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
                type: getWindowType(win)
            };
        }

        (function () {

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

        var create = function (createData, callback) {
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

        var getCurrentBrowserWindow = function () {
            return toBrowserWindow(Services.wm.getMostRecentWindow(null));
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

            var browser = getBrowserForTab(xulTab);

            onCreatedChannel.notify(toTabFromXulTab(xulTab, browser));
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
                            onUpdatedChannel.notify(toTabFromXulTab(xulTab, browser, 'complete'));
                        }
                    }
                    break;
            }
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

        function toTabFromXulTab(xulTab, browser, status) {
            return {
                tabId: getTabId(xulTab),
                url: browser.currentURI.asciiSpec,
                title: browser.contentTitle,
                status: status || 'loading',
                incognito: isPrivate(xulTab)
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

            var win = adguard.winWatcher.getCurrentBrowserWindow();
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

            var win = adguard.winWatcher.getCurrentBrowserWindow();
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