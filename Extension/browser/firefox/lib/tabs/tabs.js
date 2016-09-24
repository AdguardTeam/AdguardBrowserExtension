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

/* global adguard */

adguard.tabsImpl = (function () {

    'use strict';

    const {Cc, Ci} = require('chrome');
    var Services = Cu.import("resource://gre/modules/Services.jsm");

    //TODO: Detect fennec
    var isFennec = false;

    var tabLookup = Object.create(null);
    
    function noOpFunc() {
        throw new Error('Not implemented');
    }

    function getWindows() {
        var winumerator = Services.wm.getEnumerator('navigator:browser');
        var windows = [];

        while (winumerator.hasMoreElements()) {
            var win = winumerator.getNext();

            if (!win.closed) {
                windows.push(win);
            }
        }

        return windows;
    }

    function getBrowserForTab(tab) {
        if (!tab) {
            return null;
        }

        return isFennec && tab.browser || tab.linkedBrowser || null;
    }

    function getTabBrowser(win) {
        return isFennec && win.BrowserApp || win.gBrowser || null;
    }

    function getTabForBrowser(browser) {
        if (!browser) {
            return null;
        }

        var win = browser.ownerGlobal;
        if (!win) {
            return null;
        }

        if (isFennec) {
            return win.BrowserApp && win.BrowserApp.getTabForBrowser(browser);
        } else {
            var gBrowser = win.gBrowser;
            if (gBrowser) {
                if (typeof gBrowser.getTabForBrowser === 'function') {
                    return gBrowser.getTabForBrowser(browser);
                } else if (gBrowser.browsers && gBrowser.tabs) {
                    // Fallback to manual searching if the browser doesn't support getTabForBrowser
                    for (var i = 0; i < gBrowser.browsers.length; i++) {
                        if (gBrowser.browsers[i] === browser) {
                            return gBrowser.tabs[i];
                        }
                    }
                }
            }
        }

        return null;
    }

    function tabFromTabId(tabId) {
        var target = tabLookup[tabId];

        if (!target) {
            return null;
        }

        // Check if this is actually a tab
        if (isFennec && target.browser ||
            target.linkedPanel) {
            return target;
        }

        // This isn't a tab. No tab for this browser is yet known.
        var tab = getTabForBrowser(target);
        if (tab) {
            // Found the tab now, so record it
            tabLookup[tabId] = tab;
        }

        return tab;
    }

    function removeTab(tab, tabBrowser) {
        if (isFennec) {
            tabBrowser.closeTab(tab);
            return;
        }

        tabBrowser.removeTab(tab);
    }

    function getOwnerWindow(target) {
        if (target.ownerDocument) {
            return target.ownerDocument.defaultView;
        }

        // Fennec
        var windows = getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            var tabs = win.BrowserApp.tabs;
            for (var j = 0; j < tabs.length; j++) {
                var tab = tabs[j];
                if (tab === target || tab.window === target) {
                    return win;
                }
            }
        }

        return null;
    }

    function getTab(tabId) {
        var tab;

        if (tabId === null) {
            var win = Services.wm.getMostRecentWindow('navigator:browser');
            var tabBrowser = getTabBrowser(win);
            if (tabBrowser) {
                tab = tabBrowser.selectedTab;
            }
        } else {
            tab = tabFromTabId(tabId);
        }

        return tab;
    }

    // API functions

    /**
     * Create a tab with details.
     *
     * @param details
     * url: 'URL', // the address that will be opened
     * index: -1, // undefined: end of the list, -1: following tab, or after index
     * active: false, // opens the tab in background - true and undefined: foreground
     * select: true // if a tab is already opened with that url, then select it instead of opening a new one
     */
    function create(details) {
        if (!details.url) {
            return null;
        }

        var win, tab, tabBrowser;

        if (details.select) {
            var URI = Services.io.newURI(details.url, null, null);

            var tabs = getAll();
            for (var i = 0; i < tabs.length; i++) {
                tab = tabs[i];
                var browser = getBrowserForTab(tab);

                // Or simply .equals if we care about the fragment
                if (URI.equalsExceptRef(browser.currentURI) === false) {
                    continue;
                }

                activate(tab);
                return;
            }
        }

        if (details.active === undefined) {
            details.active = true;
        }

        win = Services.wm.getMostRecentWindow('navigator:browser');
        tabBrowser = getTabBrowser(win);

        if (isFennec) {
            tabBrowser.addTab(details.url, {selected: details.active !== false});
            // Note that it's impossible to move tabs on Fennec, so don't bother
            return;
        }

        if (details.index === -1) {
            details.index = tabBrowser.browsers.indexOf(tabBrowser.selectedBrowser) + 1;
        }

        tab = tabBrowser.loadOneTab(details.url, {inBackground: !details.active});

        if (details.index !== undefined) {
            tabBrowser.moveTabTo(tab, details.index);
        }
    }

    /**
     * Removes tab with specified tabId
     *
     * @param tabId
     */
    function remove(tabId) {
        var tab = tabFromTabId(tabId);
        if (tab) {
            removeTab(tab, getTabBrowser(getOwnerWindow(tab)));
        }
    }

    /**
     * Activates specified tab
     *
     * @param tab
     */
    function activate(tab) {
        tab = typeof tab === 'object' ? tab : getTab(tab);

        if (!tab) {
            return;
        }

        var tabBrowser = getTabBrowser(getOwnerWindow(tab));

        if (isFennec) {
            tabBrowser.selectTab(tab);
        } else {
            tabBrowser.selectedTab = tab;
        }
    }

    /**
     * Reloads tab with tabId
     *
     * @param tabId
     */
    function reload(tabId) {
        var tab = getTab(tabId);

        if ( !tab ) {
            return;
        }

        getBrowserForTab(tab).webNavigation.reload(
            Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE
        );
    }

    function sendMessage() {
        //TODO: Implement
    }

    /**
     * Gets an array of all tabs
     *
     * @param window
     * @returns {Array}
     */
    function getAll(window) {
        var tabs = [];

        var windows = getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            if (window && window !== win) {
                continue;
            }

            var tabBrowser = getTabBrowser(win);
            if (tabBrowser === null) {
                continue;
            }

            var tabBrowserTabs = tabBrowser.tabs;
            for (var j = 0; j < tabBrowserTabs.length; j++) {
                tabs.push(tabBrowserTabs[j]);
            }
        }

        return tabs;
    }

    return {

        onCreated: noOpFunc,
        onRemoved: noOpFunc,
        onUpdated: noOpFunc,
        onActivated: noOpFunc,

        create: create,
        remove: remove,
        activate: activate,
        reload: reload,
        sendMessage: sendMessage,
        getAll: getAll
    };

})();