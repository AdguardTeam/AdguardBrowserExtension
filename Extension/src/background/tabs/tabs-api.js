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

import { utils } from '../utils/common';
import { tabsImpl } from '../extension-api/tabs';

const tabsApi = ((tabsImpl) => {

    const tabs = Object.create(null);

    // Fired when a tab is created. Note that the tab's URL may not be set at the time
    // this event fired, but you can listen to onUpdated events to be notified when a URL is set.
    const onCreatedChannel = utils.channels.newChannel();

    // Fired when a tab is closed.
    const onRemovedChannel = utils.channels.newChannel();

    // Fired when a tab is updated.
    const onUpdatedChannel = utils.channels.newChannel();

    // Fires when the active tab in a window changes.
    const onActivatedChannel = utils.channels.newChannel();

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
    (async () => {
        const aTabs = await tabsImpl.getAll();
        for (let i = 0; i < aTabs.length; i += 1) {
            const aTab = aTabs[i];
            tabs[aTab.tabId] = aTab;
        }
    })();

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
    const create = async (details) => {
        return tabsImpl.create(details);
    };

    // Closes tab.
    const remove = async (tabId) => {
        return tabsImpl.remove(tabId);
    };

    // Activates tab (Also makes tab's window in focus).
    const activate = function (tabId) {
        return tabsImpl.activate(tabId);
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
    const getAll = async () => {
        const aTabs = await tabsImpl.getAll();
        const result = [];
        for (let i = 0; i < aTabs.length; i += 1) {
            const aTab = aTabs[i];
            let tab = tabs[aTab.tabId];
            if (!tab) {
                // Synchronize state
                tabs[aTab.tabId] = aTab;
                tab = aTab;
            }
            result.push(tab);
        }
        return result;
    };

    // Calls callback with each tab
    const forEach = function (callback) {
        (async () => {
            const aTabs = await tabsImpl.getAll();
            for (let i = 0; i < aTabs.length; i += 1) {
                const aTab = aTabs[i];
                let tab = tabs[aTab.tabId];
                if (!tab) {
                    // Synchronize state
                    tabs[aTab.tabId] = aTab;
                    tab = aTab;
                }
                callback(tab);
            }
        })();
    };

    // Gets active tab
    const getActive = async (tabId) => {
        if (!tabId) {
            tabId = await tabsImpl.getActive();
        }

        if (!tabId) {
            return null;
        }

        let tab = tabs[tabId];

        if (tab) {
            return tab;
        }

        // Tab not found in the local state, but we are sure that this tab exists. Sync...
        // TODO[Edge]: Relates to Edge Bug https://github.com/AdguardTeam/AdguardBrowserExtension/issues/481
        tab = await tabsImpl.get(tabId);
        onTabCreated(tab);
        return tab;
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
            // eslint-disable-next-line no-restricted-syntax
            for (const key in values) {
                if (values.hasOwnProperty && values.hasOwnProperty(key)) {
                    tab.metadata[key] = values[key];
                }
            }
        }
    };

    // Gets tab metadata
    const getTabMetadata = (tabId, key) => {
        const tab = tabs[tabId];
        if (tab && tab.metadata) {
            return tab.metadata[key];
        }
        return null;
    };

    const clearTabMetadata = tabId => {
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
})(tabsImpl);

export { tabsApi };
