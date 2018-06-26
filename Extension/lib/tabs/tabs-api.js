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

(function (adguard) {

    'use strict';

    adguard.windowsImpl = adguard.windowsImpl || (function () {

            function noOpFunc() {
                throw new Error('Not implemented');
            }

            var emptyListener = {
                addListener: noOpFunc,
                removeListener: noOpFunc
            };

            return {

                onCreated: emptyListener, // callback (adguardWin, nativeWin)
                onRemoved: emptyListener, // callback (windowId, nativeWin)
                onUpdated: emptyListener, // callback (adguardWin, nativeWin, type) (Defined only for Firefox)

                create: noOpFunc,
                getLastFocused: noOpFunc, // callback (windowId, nativeWin)
                forEachNative: noOpFunc // callback (nativeWin, adguardWin)
            };
        });

    adguard.windows = (function (windowsImpl) {

        var AdguardWin = { // jshint ignore:line
            windowId: 1,
            type: 'normal' // 'popup'
        };

        function noOpFunc() {
        }

        var adguardWindows = Object.create(null); // windowId => AdguardWin

        windowsImpl.forEachNative(function (nativeWin, adguardWin) {
            adguardWindows[adguardWin.windowId] = adguardWin;
        });

        var onCreatedChannel = adguard.utils.channels.newChannel();
        var onRemovedChannel = adguard.utils.channels.newChannel();

        windowsImpl.onCreated.addListener(function (adguardWin) {
            adguardWindows[adguardWin.windowId] = adguardWin;
            onCreatedChannel.notify(adguardWin);
        });

        windowsImpl.onRemoved.addListener(function (windowId) {
            var adguardWin = adguardWindows[windowId];
            if (adguardWin) {
                onRemovedChannel.notify(adguardWin);
                delete adguardWindows[windowId];
            }
        });

        var create = function (createData, callback) {
            windowsImpl.create(createData, callback || noOpFunc);
        };

        var getLastFocused = function (callback) {
            windowsImpl.getLastFocused(function (windowId) {
                var metadata = adguardWindows[windowId];
                if (metadata) {
                    callback(metadata[0]);
                }
            });
        };

        return {

            onCreated: onCreatedChannel,    // callback(adguardWin)
            onRemoved: onRemovedChannel,    // callback(adguardWin)

            create: create,
            getLastFocused: getLastFocused // callback (adguardWin)
        };

    })(adguard.windowsImpl);

    adguard.tabsImpl = adguard.tabsImpl || (function () {

            function noOpFunc() {
                throw new Error('Not implemented');
            }

            var emptyListener = {
                addListener: noOpFunc,
                removeListener: noOpFunc
            };

            return {

                onCreated: emptyListener,	// callback(tab)
                onRemoved: emptyListener,	// callback(tabId)
                onUpdated: emptyListener,	// callback(tab)
                onActivated: emptyListener, 	// callback(tabId)

                create: noOpFunc,		// callback(tab)
                remove: noOpFunc,		// callback(tabId)
                activate: noOpFunc,		// callback(tabId)
                reload: noOpFunc,
                sendMessage: noOpFunc,
                getAll: noOpFunc,		// callback(tabs)
                getActive: noOpFunc,    // callback(tabId),
                get: noOpFunc           // callback(tab)
            };

        })();

    adguard.tabs = (function (tabsImpl) {

        var AdguardTab = { // jshint ignore:line
            tabId: 1,
            url: 'url',
            title: 'Title',
            incognito: false,
            status: null,   // 'loading' or 'complete'
            frames: null,   // Collection of frames inside tab
            metadata: null  // Contains info about integration, white list rule is applied to tab.
        };

        var AdguardTabFrame = { // jshint ignore:line
            frameId: 1,
            url: 'url',
            domainName: 'domainName'
        };

        function noOpFunc() {
        }

        var tabs = Object.create(null);

        /**
         * Saves tab to collection and notify listeners
         * @param aTab
         */
        function onTabCreated(aTab) {
            var tab = tabs[aTab.tabId];
            if (tab) {
                // Tab has been already synchronized
                return;
            }
            tabs[aTab.tabId] = aTab;
            onCreatedChannel.notify(aTab);
        }

        // Synchronize opened tabs
        tabsImpl.getAll(function (aTabs) {
            for (var i = 0; i < aTabs.length; i++) {
                var aTab = aTabs[i];
                tabs[aTab.tabId] = aTab;
            }
        });

        tabsImpl.onCreated.addListener(onTabCreated);

        tabsImpl.onRemoved.addListener(function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                onRemovedChannel.notify(tab);
                delete tabs[tabId];
            }
        });

        tabsImpl.onUpdated.addListener(function (aTab) {
            var tab = tabs[aTab.tabId];
            if (tab) {
                tab.url = aTab.url;
                tab.title = aTab.title;
                tab.status = aTab.status;
                onUpdatedChannel.notify(tab);
            }
        });

        tabsImpl.onActivated.addListener(function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                onActivatedChannel.notify(tab);
            }
        });

        // Fired when a tab is created. Note that the tab's URL may not be set at the time this event fired, but you can listen to onUpdated events to be notified when a URL is set.

        var onCreatedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is closed.
        var onRemovedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is updated.
        var onUpdatedChannel = adguard.utils.channels.newChannel();

        // Fires when the active tab in a window changes.
        var onActivatedChannel = adguard.utils.channels.newChannel();

        // --------- Actions ---------

        // Creates a new tab.
        var create = function (details, callback) {
            tabsImpl.create(details, callback || noOpFunc);
        };

        // Closes tab.
        var remove = function (tabId, callback) {
            tabsImpl.remove(tabId, callback || noOpFunc);
        };

        // Activates tab (Also makes tab's window in focus).
        var activate = function (tabId, callback) {
            tabsImpl.activate(tabId, callback || noOpFunc);
        };

        // Reloads tab.
        var reload = function (tabId, url) {
            tabsImpl.reload(tabId, url);
        };

        // Sends message to tab
        var sendMessage = function (tabId, message, responseCallback, options) {
            tabsImpl.sendMessage(tabId, message, responseCallback, options);
        };

        // Gets all opened tabs
        var getAll = function (callback) {
            tabsImpl.getAll(function (aTabs) {
                var result = [];
                for (var i = 0; i < aTabs.length; i++) {
                    var aTab = aTabs[i];
                    var tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    result.push(tab);
                }
                callback(result);
            });
        };

        var forEach = function (callback) {
            tabsImpl.getAll(function (aTabs) {
                for (var i = 0; i < aTabs.length; i++) {
                    var aTab = aTabs[i];
                    var tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    callback(tab);
                }
            });
        };

        // Gets active tab
        var getActive = function (callback) {
            tabsImpl.getActive(function (tabId) {
                var tab = tabs[tabId];
                if (tab) {
                    callback(tab);
                } else {
                    // Tab not found in the local state, but we are sure that this tab exists. Sync...
                    // TODO[Edge]: Relates to Edge Bug https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
                    tabsImpl.get(tabId, function (tab) {
                        onTabCreated(tab);
                        callback(tab);
                    });
                }
            });
        };

        var isIncognito = function (tabId) {
            var tab = tabs[tabId];
            return tab && tab.incognito === true;
        };

        // Records tab's frame
        var recordTabFrame = function (tabId, frameId, url, domainName) {
            var tab = tabs[tabId];
            if (!tab && frameId === 0) {
                // Sync tab for that 'onCreated' event was missed.
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
                tab = {
                    tabId: tabId,
                    url: url,
                    status: 'loading'
                };
                onTabCreated(tab);
            }
            if (tab) {
                if (!tab.frames) {
                    tab.frames = Object.create(null);
                }
                tab.frames[frameId] = {
                    url: url,
                    domainName: domainName
                };
            }
        };

        var clearTabFrames = function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                tab.frames = null;
            }
        };

        // Gets tab's frame by id
        var getTabFrame = function (tabId, frameId) {
            var tab = tabs[tabId];
            if (tab && tab.frames) {
                return tab.frames[frameId || 0];
            }
            return null;
        };

        // Update tab metadata
        var updateTabMetadata = function (tabId, values) {
            var tab = tabs[tabId];
            if (tab) {
                if (!tab.metadata) {
                    tab.metadata = Object.create(null);
                }
                for (var key in values) {
                    if (values.hasOwnProperty && values.hasOwnProperty(key)) {
                        tab.metadata[key] = values[key];
                    }
                }
            }
        };

        // Gets tab metadata
        var getTabMetadata = function (tabId, key) {
            var tab = tabs[tabId];
            if (tab && tab.metadata) {
                return tab.metadata[key];
            }
            return null;
        };

        var clearTabMetadata = function (tabId) {
            var tab = tabs[tabId];
            if (tab) {
                tab.metadata = null;
            }
        };

        // Injecting resources to tabs
        var insertCssCode = tabsImpl.insertCssCode;
        var executeScriptCode = tabsImpl.executeScriptCode;
        var executeScriptFile = tabsImpl.executeScriptFile;

        return {
            // Events
            onCreated: onCreatedChannel,
            onRemoved: onRemovedChannel,
            onUpdated: onUpdatedChannel,
            onActivated: onActivatedChannel,

            // Actions
            create: create,
            remove: remove,
            activate: activate,
            reload: reload,
            sendMessage: sendMessage,
            getAll: getAll,
            forEach: forEach,
            getActive: getActive,
            isIncognito: isIncognito,

            // Frames
            recordTabFrame: recordTabFrame,
            clearTabFrames: clearTabFrames,
            getTabFrame: getTabFrame,

            // Other
            updateTabMetadata: updateTabMetadata,
            getTabMetadata: getTabMetadata,
            clearTabMetadata: clearTabMetadata,

            insertCssCode: insertCssCode,
            executeScriptCode: executeScriptCode,
            executeScriptFile: executeScriptFile
        };

    })(adguard.tabsImpl);

})(adguard);
