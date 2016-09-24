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

    function toTabFromFirefoxTab(firefoxTab) {
        //TODO: Fix

        return {
            tabId: firefoxTab.id,
            url: firefoxTab.url,
            title: firefoxTab.title,
            incognito: firefoxTab.incognito,
            status: firefoxTab.status
        };
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
     * active: false, // opens the tab in background - true and undefined: foreground
     * @param callback
     */
    function create(details, callback) {
        if (!details.url) {
            return null;
        }

        if (details.active === undefined) {
            details.active = true;
        }

        var win = Services.wm.getMostRecentWindow('navigator:browser');
        var tabBrowser = getTabBrowser(win);

        var tab;
        if (isFennec) {
            tab = tabBrowser.addTab(details.url, {selected: details.active !== false});
        } else {
            tab = tabBrowser.loadOneTab(details.url, {inBackground: !details.active});
        }

        callback(toTabFromFirefoxTab(tab));
    }

    /**
     * Removes tab with specified tabId
     *
     * @param tabId
     * @param callback
     */
    function remove(tabId, callback) {
        var tab = tabFromTabId(tabId);
        if (tab) {
            removeTab(tab, getTabBrowser(getOwnerWindow(tab)));
            callback(tabId);
        }
    }

    /**
     * Activates specified tab
     *
     * @param tab
     * @param callback
     */
    function activate(tab, callback) {
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

        callback(tabId);
    }

    /**
     * Reloads tab with tabId
     *
     * @param tabId
     * @param url
     */
    function reload(tabId, url) {
        var tab = getTab(tabId);
        if (!tab) {
            return;
        }

        var browserForTab = getBrowserForTab(tab);
        if (url) {
            browserForTab.webNavigation.loadURI(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
        } else {
            browserForTab.webNavigation.reload(
                Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE
            );
        }
    }

    function sendMessage() {
        //TODO: Implement
    }

    /**
     * Gets an array of all tabs
     *
     * @param callback
     * @returns {Array}
     */
    function getAll(callback) {
        var tabs = [];

        var windows = getWindows();
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];

            var tabBrowser = getTabBrowser(win);
            if (tabBrowser === null) {
                continue;
            }

            var tabBrowserTabs = tabBrowser.tabs;
            for (var j = 0; j < tabBrowserTabs.length; j++) {
                tabs.push(toTabFromFirefoxTab(tabBrowserTabs[j]));
            }
        }

        callback(tabs);
    }

    /**
     * @param callback
     */
    function getActive(callback) {
        var win = Services.wm.getMostRecentWindow('navigator:browser');
        var tabBrowser = getTabBrowser(win);

        callback(tabBrowser.selectedTab.tabId);
    }

    // Events

    function onCreated(callback) {
        var container = getTabBrowser(window).tabContainer;
        container.addEventListener("TabOpen", function(event) {
            callback(toTabFromFirefoxTab(event.target));
        }, false);
    }

    function onRemoved(callback) {
        var container = getTabBrowser(window).tabContainer;
        container.addEventListener("TabClose", function(event) {
            callback(toTabFromFirefoxTab(event.target).tabId);
        }, false);
    }

    function onUpdated(callback) {
        var container = getTabBrowser(window).tabContainer;
        container.addEventListener("TabMove", function(event) {
            callback(toTabFromFirefoxTab(event.target));
        }, false);
    }

    function onActivated(callback) {
        var container = getTabBrowser(window).tabContainer;
        container.addEventListener("TabSelect", function(event) {
            callback(toTabFromFirefoxTab(event.target).tabId);
        }, false);
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
        getActive: getActive
    };

})();