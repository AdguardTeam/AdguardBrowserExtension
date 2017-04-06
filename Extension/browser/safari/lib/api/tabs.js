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

/* global safari, SafariBrowserWindow, SafariBrowserTab */

adguard.windowsImpl = (function (adguard) {

    'use strict';

    var windows = Object.create(null);
    var nextWindowId = 1;

    function getWindowId(safariWindow) {
        if (safariWindow.adguardCachedWindowId) {
            return safariWindow.adguardCachedWindowId;
        }
        for (var windowId in windows) { // jshint ignore:line
            var window = windows[windowId];
            if (window === safariWindow) {
                return windowId;
            }
        }
        return -1;
    }

    function getOrCreateWindowId(safariWindow) {
        var windowId = getWindowId(safariWindow);
        if (windowId === -1) {
            windowId = nextWindowId++;
            windows[windowId] = safariWindow;
            safariWindow.adguardCachedWindowId = windowId;
        }
        return windowId;
    }

    function toWindowFromSafariWindow(windowId) {
        return {
            windowId: windowId,
            type: 'normal'
        };
    }

    var onCreatedChannel = adguard.utils.channels.newChannel();
    var onRemovedChannel = adguard.utils.channels.newChannel();
    var onUpdatedChannel = adguard.utils.channels.newChannel();

    safari.application.addEventListener('open', function (event) {
        var safariWindow = event.target;
        if (safariWindow instanceof SafariBrowserWindow) {
            var windowId = getOrCreateWindowId(safariWindow);
            onCreatedChannel.notify(toWindowFromSafariWindow(windowId), safariWindow);
        }
    }, true);

    safari.application.addEventListener('close', function (event) {
        var safariWindow = event.target;
        if (safariWindow instanceof SafariBrowserWindow) {
            var windowId = getWindowId(safariWindow);
            if (windowId === -1) {
                return;
            }
            onRemovedChannel.notify(windowId);
            delete windows[windowId];
            delete safariWindow.adguardCachedWindowId;
        }
    }, true);

    var create = function (createData, callback) {
        var safariWindow = safari.application.openBrowserWindow();
        var windowId = getOrCreateWindowId(safariWindow);
        callback(toWindowFromSafariWindow(windowId), safariWindow);
    };

    var forEachNative = function (callback) {
        var safariWindows = safari.application.browserWindows;
        for (var i = 0; i < safariWindows.length; i++) {
            var safariWindow = safariWindows[i];
            var windowId = getOrCreateWindowId(safariWindow);
            callback(safariWindow, toWindowFromSafariWindow(windowId));
        }
    };

    var getLastFocused = function (callback) {
        var safariWindow = safari.application.activeBrowserWindow;
        var windowId = getWindowId(safariWindow);
        if (windowId !== -1) {
            callback(windowId);
        }
    };

    return {

        onCreated: onCreatedChannel, // callback (adguardWin, nativeWin)
        onRemoved: onRemovedChannel, // callback (windowId)
        onUpdated: onUpdatedChannel, // empty

        create: create,
        getLastFocused: getLastFocused,

        forEachNative: forEachNative
    };

})(adguard);

adguard.tabsImpl = (function (adguard) {

    'use strict';

    var tabs = Object.create(null);
    var nextTabId = 1;

    var noOpFunc = function () {
    };

    function getTabId(safariTab) {
        if (safariTab.adguardCachedTabId) {
            return safariTab.adguardCachedTabId;
        }
        for (var tabId in tabs) { // jshint ignore:line
            var tab = tabs[tabId];
            if (tab === safariTab) {
                return tabId;
            }
        }
        return -1;
    }

    function getOrCreateTabId(safariTab) {
        var tabId = getTabId(safariTab);
        if (tabId === -1) {
            tabId = nextTabId++;
            tabs[tabId] = safariTab;
            safariTab.adguardCachedTabId = tabId;
        }
        return tabId;
    }

    function isPrivate(safariTab) {
        // The enabled property of SafariPrivateBrowsing is deprecated. Use the private property of SafariBrowserTab instead.
        if ('private' in safariTab) {
            return safariTab.private === true;
        } else {
            return safari.application.privateBrowsing.enabled === true;
        }
    }

    function toTabFromSafariTab(tabId, safariTab, status) {
        return {
            tabId: tabId,
            url: safariTab.url,
            title: safariTab.title,
            incognito: isPrivate(safariTab),
            status: status || 'loading'
        };
    }

    var onCreatedChannel = adguard.utils.channels.newChannel();
    safari.application.addEventListener('open', function (event) {

        var safariTab = event.target;

        if (safariTab instanceof SafariBrowserTab) {

            var tabId = getOrCreateTabId(safariTab);
            onCreatedChannel.notify(toTabFromSafariTab(tabId, safariTab));
        }

    }, true);

    var onRemovedChannel = adguard.utils.channels.newChannel();
    safari.application.addEventListener('close', function (event) {

        var safariTab = event.target;

        if (safariTab instanceof SafariBrowserTab) {

            var tabId = getTabId(safariTab);
            if (tabId === -1) {
                return;
            }

            onRemovedChannel.notify(tabId);
            delete tabs[tabId];
            delete safariTab.adguardCachedTabId;
        }

    }, true);

    var onUpdatedChannel = adguard.utils.channels.newChannel();
    safari.application.addEventListener('navigate', function (event) {

        var safariTab = event.target;

        var tabId = getTabId(safariTab);
        if (tabId === -1) {
            return;
        }

        onUpdatedChannel.notify(toTabFromSafariTab(tabId, safariTab, 'complete'));

    }, true);

    safari.application.addEventListener('message', function (event) {

        if (event.name === "loading" && event.message === event.target.url) {

            var safariTab = event.target;

            var tabId = getTabId(safariTab);
            if (tabId === -1) {
                return;
            }

            onUpdatedChannel.notify(toTabFromSafariTab(tabId, safariTab, 'loading'));
        }

    }, true);

    var onActivatedChannel = adguard.utils.channels.newChannel();
    safari.application.addEventListener('activate', function (event) {

        var target = event.target;

        var safariTab;
        if (target instanceof SafariBrowserTab) {
            safariTab = target;
        } else if (target instanceof SafariBrowserWindow) {
            safariTab = target.activeTab;
        }

        if (safariTab) {
            var tabId = getTabId(safariTab);
            if (tabId === -1) {
                return;
            }
            onActivatedChannel.notify(tabId);
        }

    }, true);

    var create = function (createData, callback) {

        var win = safari.application.activeBrowserWindow || safari.application.openBrowserWindow();

        var safariTab = win.openTab();
        safariTab.url = createData.url;

        var tabId = getOrCreateTabId(safariTab);

        if (createData.active === true) {
            activate(tabId, noOpFunc);
        }

        callback(toTabFromSafariTab(tabId, safariTab));
    };

    var remove = function (tabId, callback) {
        var safariTab = tabs[tabId];
        if (safariTab) {
            safariTab.close();
            callback(tabId);
        }
    };

    var activate = function (tabId, callback) {
        var safariTab = tabs[tabId];
        if (safariTab) {
            safariTab.activate();
            safariTab.browserWindow.activate();
            callback(tabId);
        }
    };

    var reload = function (tabId, url) {
        var safariTab = tabs[tabId];
        if (safariTab) {
            safariTab.url = (url || safariTab.url);
        }
    };

    var sendMessage = function (tabId, message, responseCallback) {

        var safariTab = tabs[tabId];
        if (!safariTab) {
            return;
        }

        return adguard.runtimeImpl.sendMessage(safariTab.page, safariTab, message, responseCallback);
    };

    var getAll = function (callback) {

        var result = [];

        var windows = safari.application.browserWindows;
        for (var i = 0; i < windows.length; i++) {

            var win = windows[i];
            var winTabs = win.tabs;

            for (var j = 0; j < winTabs.length; j++) {

                var safariTab = winTabs[j];

                var tabId = getOrCreateTabId(safariTab);
                result.push(toTabFromSafariTab(tabId, safariTab));
            }
        }
        callback(result);
    };

    var getActive = function (callback) {
        var safariTab = safari.application.activeBrowserWindow.activeTab;
        var tabId = getTabId(safariTab);
        if (tabId !== -1) {
            callback(tabId);
        }
    };

    /**
     * Gets tab by id
     * @param tabId Tab identifier
     * @param callback
     */
    var get = function (tabId, callback) {
        var safariTab = tabs[tabId];
        if (!safariTab) {
            return;
        }
        callback(toTabFromSafariTab(tabId, safariTab));
    };

    var fromSafariTab = function (safariTab) {
        var tabId = getOrCreateTabId(safariTab);
        return {tabId: tabId};
    };

    var toSafariTab = function (tab) {
        return tabs[tab.tabId];
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
        get: get,

        fromSafariTab: fromSafariTab,
        toSafariTab: toSafariTab
    };
})(adguard);