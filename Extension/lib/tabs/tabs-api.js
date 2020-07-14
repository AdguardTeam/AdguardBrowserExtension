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

        const emptyListener = {
            addListener: noOpFunc,
            removeListener: noOpFunc,
        };

        return {

            onCreated: emptyListener, // callback (adguardWin, nativeWin)
            onRemoved: emptyListener, // callback (windowId, nativeWin)
            onUpdated: emptyListener, // callback (adguardWin, nativeWin, type) (Defined only for Firefox)

            create: noOpFunc,
            getLastFocused: noOpFunc, // callback (windowId, nativeWin)
            forEachNative: noOpFunc, // callback (nativeWin, adguardWin)
        };
    });

    adguard.windows = (function (windowsImpl) {
        // eslint-disable-next-line no-unused-vars
        const AdguardWin = {
            windowId: 1,
            type: 'normal', // 'popup'
        };

        function noOpFunc() {
        }

        const adguardWindows = Object.create(null); // windowId => AdguardWin

        windowsImpl.forEachNative((nativeWin, adguardWin) => {
            adguardWindows[adguardWin.windowId] = adguardWin;
        });

        const onCreatedChannel = adguard.utils.channels.newChannel();
        const onRemovedChannel = adguard.utils.channels.newChannel();

        windowsImpl.onCreated.addListener((adguardWin) => {
            adguardWindows[adguardWin.windowId] = adguardWin;
            onCreatedChannel.notify(adguardWin);
        });

        windowsImpl.onRemoved.addListener((windowId) => {
            const adguardWin = adguardWindows[windowId];
            if (adguardWin) {
                onRemovedChannel.notify(adguardWin);
                delete adguardWindows[windowId];
            }
        });

        const create = function (createData, callback) {
            windowsImpl.create(createData, callback || noOpFunc);
        };

        const getLastFocused = function (callback) {
            windowsImpl.getLastFocused((windowId) => {
                const metadata = adguardWindows[windowId];
                if (metadata) {
                    callback(metadata[0]);
                }
            });
        };

        return {

            onCreated: onCreatedChannel,    // callback(adguardWin)
            onRemoved: onRemovedChannel,    // callback(adguardWin)

            create,
            getLastFocused, // callback (adguardWin)
        };
    })(adguard.windowsImpl);

    adguard.tabsImpl = adguard.tabsImpl || (function () {
        function noOpFunc() {
            throw new Error('Not implemented');
        }

        const emptyListener = {
            addListener: noOpFunc,
            removeListener: noOpFunc,
        };

        return {

            onCreated: emptyListener, // callback(tab)
            onRemoved: emptyListener, // callback(tabId)
            onUpdated: emptyListener, // callback(tab)
            onActivated: emptyListener, // callback(tabId)

            create: noOpFunc, // callback(tab)
            remove: noOpFunc, // callback(tabId)
            activate: noOpFunc, // callback(tabId)
            reload: noOpFunc,
            sendMessage: noOpFunc,
            getAll: noOpFunc, // callback(tabs)
            getActive: noOpFunc, // callback(tabId),
            get: noOpFunc, // callback(tab)
        };
    })();

    adguard.tabs = (function (tabsImpl) {
        // eslint-disable-next-line no-unused-vars
        const AdguardTab = {
            tabId: 1,
            url: 'url',
            title: 'Title',
            incognito: false,
            status: null,   // 'loading' or 'complete'
            frames: null,   // Collection of frames inside tab
            metadata: null,  // Contains info about white list rule is applied to tab.
        };

        // eslint-disable-next-line no-unused-vars
        const AdguardTabFrame = {
            frameId: 1,
            url: 'url',
            domainName: 'domainName',
        };

        function noOpFunc() {
        }

        const tabs = Object.create(null);

        // Fired when a tab is created. Note that the tab's URL may not be set at the time
        // this event fired, but you can listen to onUpdated events to be notified when a URL is set.
        const onCreatedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is closed.
        const onRemovedChannel = adguard.utils.channels.newChannel();

        // Fired when a tab is updated.
        const onUpdatedChannel = adguard.utils.channels.newChannel();

        // Fires when the active tab in a window changes.
        const onActivatedChannel = adguard.utils.channels.newChannel();

        /**
         * Saves tab to collection and notify listeners
         * @param aTab
         */
        function onTabCreated(aTab) {
            const tab = tabs[aTab.tabId];
            if (tab) {
                // Tab has been already synchronized
                return;
            }
            tabs[aTab.tabId] = aTab;
            onCreatedChannel.notify(aTab);
        }

        // Synchronize opened tabs
        tabsImpl.getAll((aTabs) => {
            for (let i = 0; i < aTabs.length; i++) {
                const aTab = aTabs[i];
                tabs[aTab.tabId] = aTab;
            }
        });

        tabsImpl.onCreated.addListener(onTabCreated);

        tabsImpl.onRemoved.addListener((tabId) => {
            const tab = tabs[tabId];
            if (tab) {
                onRemovedChannel.notify(tab);
                delete tabs[tabId];
            }
        });

        tabsImpl.onUpdated.addListener((aTab) => {
            const tab = tabs[aTab.tabId];
            if (tab) {
                tab.url = aTab.url;
                tab.title = aTab.title;
                tab.status = aTab.status;
                // If the tab was updated it means that it wasn't used to send requests in the background
                tab.synthetic = false;
                onUpdatedChannel.notify(tab);
            }
        });

        tabsImpl.onActivated.addListener((tabId) => {
            const tab = tabs[tabId];
            if (tab) {
                onActivatedChannel.notify(tab);
            }
        });

        // --------- Actions ---------

        // Creates a new tab.
        const create = function (details, callback) {
            tabsImpl.create(details, callback || noOpFunc);
        };

        // Closes tab.
        const remove = function (tabId, callback) {
            tabsImpl.remove(tabId, callback || noOpFunc);
        };

        // Activates tab (Also makes tab's window in focus).
        const activate = function (tabId, callback) {
            tabsImpl.activate(tabId, callback || noOpFunc);
        };

        // Reloads tab.
        const reload = function (tabId, url) {
            tabsImpl.reload(tabId, url);
        };

        // Updates tab url
        const updateUrl = (tabId, url) => {
            tabsImpl.updateUrl(tabId, url);
        };

        // Sends message to tab
        const sendMessage = function (tabId, message, responseCallback, options) {
            tabsImpl.sendMessage(tabId, message, responseCallback, options);
        };

        // Gets all opened tabs
        const getAll = function (callback) {
            tabsImpl.getAll((aTabs) => {
                const result = [];
                for (let i = 0; i < aTabs.length; i++) {
                    const aTab = aTabs[i];
                    let tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    result.push(tab);
                }
                callback(result);
            });
        };

        const forEach = function (callback) {
            tabsImpl.getAll((aTabs) => {
                for (let i = 0; i < aTabs.length; i++) {
                    const aTab = aTabs[i];
                    let tab = tabs[aTab.tabId];
                    if (!tab) {
                        // Synchronize state
                        tabs[aTab.tabId] = tab = aTab;
                    }
                    callback(tab);
                }
            });
        };

        // Gets active tab
        const getActive = function (callback) {
            tabsImpl.getActive((tabId) => {
                const tab = tabs[tabId];
                if (tab) {
                    callback(tab);
                } else {
                    // Tab not found in the local state, but we are sure that this tab exists. Sync...
                    // TODO[Edge]: Relates to Edge Bug https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
                    tabsImpl.get(tabId, (tab) => {
                        onTabCreated(tab);
                        callback(tab);
                    });
                }
            });
        };

        const isIncognito = function (tabId) {
            const tab = tabs[tabId];
            return tab && tab.incognito === true;
        };

        // Records tab's frame
        const recordTabFrame = function (tabId, frameId, url, domainName) {
            let tab = tabs[tabId];
            if (!tab && frameId === 0) {
                // Sync tab for that 'onCreated' event was missed.
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
                tab = {
                    tabId,
                    url,
                    status: 'loading',
                    // We mark this tabs as synthetic because actually they may not exists
                    synthetic: true,
                };
                onTabCreated(tab);
            }
            if (tab) {
                if (!tab.frames) {
                    tab.frames = Object.create(null);
                }
                tab.frames[frameId] = {
                    url,
                    domainName,
                };
            }
        };

        const clearTabFrames = function (tabId) {
            const tab = tabs[tabId];
            if (tab) {
                tab.frames = null;
            }
        };

        // Gets tab's frame by id
        const getTabFrame = function (tabId, frameId) {
            const tab = tabs[tabId];
            if (tab && tab.frames) {
                return tab.frames[frameId || 0];
            }
            return null;
        };

        /**
         * Checks if the tab is new tab for popup or not
         * May be false positive for FF at least because new tab url in FF is "about:blank" too
         * @param tabId
         * @returns {boolean}
         */
        const isNewPopupTab = (tabId) => {
            const tab = tabs[tabId];
            if (!tab) {
                return false;
            }
            return !!(tab.url === '' || tab.url === 'about:blank');
        };

        // Update tab metadata
        const updateTabMetadata = function (tabId, values) {
            const tab = tabs[tabId];
            if (tab) {
                if (!tab.metadata) {
                    tab.metadata = Object.create(null);
                }
                for (const key in values) {
                    if (values.hasOwnProperty && values.hasOwnProperty(key)) {
                        tab.metadata[key] = values[key];
                    }
                }
            }
        };

        // Gets tab metadata
        const getTabMetadata = function (tabId, key) {
            const tab = tabs[tabId];
            if (tab && tab.metadata) {
                return tab.metadata[key];
            }
            return null;
        };

        const clearTabMetadata = function (tabId) {
            const tab = tabs[tabId];
            if (tab) {
                tab.metadata = null;
            }
        };

        // Injecting resources to tabs
        const { insertCssCode } = tabsImpl;
        const { executeScriptCode } = tabsImpl;
        const { executeScriptFile } = tabsImpl;

        return {
            // Events
            onCreated: onCreatedChannel,
            onRemoved: onRemovedChannel,
            onUpdated: onUpdatedChannel,
            onActivated: onActivatedChannel,

            // Actions
            create,
            remove,
            activate,
            reload,
            sendMessage,
            getAll,
            forEach,
            getActive,
            isIncognito,
            updateUrl,

            // Frames
            recordTabFrame,
            clearTabFrames,
            getTabFrame,
            isNewPopupTab,

            // Other
            updateTabMetadata,
            getTabMetadata,
            clearTabMetadata,

            insertCssCode,
            executeScriptCode,
            executeScriptFile,
        };
    })(adguard.tabsImpl);
})(adguard);
