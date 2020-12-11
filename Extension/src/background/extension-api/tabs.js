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

/* eslint-disable max-len */

import { browser } from './browser';
import { utils, toTabFromChromeTab } from '../utils/common';
import { prefs } from '../prefs';
import { browserUtils } from '../utils/browser-utils';
import { log } from '../../common/log';

/**
 * Chromium tabs implementation
 * @type {{onCreated, onRemoved, onUpdated, onActivated, create, remove, activate, reload, sendMessage, getAll, getActive, fromChromeTab}}
 */
export const tabsImpl = (function () {
    /**
     * tabId parameter must be integer
     * @param tabId
     */
    function tabIdToInt(tabId) {
        return Number.parseInt(tabId, 10);
    }

    function logOperationError(operation, e) {
        log.error('Error while executing operation{1}: {0}', e, operation ? ` '${operation}'` : '');
    }

    /**
     * Returns id of active tab
     * @returns {Promise<number|null>}
     */
    const getActive = async function () {
        /**
         * lastFocusedWindow parameter isn't supported by Opera
         * But seems currentWindow has the same effect in our case.
         * See for details:
         * https://developer.chrome.com/extensions/windows#current-window
         * https://dev.opera.com/extensions/tab-window/#accessing-the-current-tab
         * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
         */
        const tabs = await browser.tabs.query({ currentWindow: true, active: true });

        if (tabs && tabs.length > 0) {
            return tabs[0].id;
        }

        return null;
    };

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    const onCreatedChannel = utils.channels.newChannel();
    browser.tabs.onCreated.addListener((chromeTab) => {
        onCreatedChannel.notify(toTabFromChromeTab(chromeTab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    const onRemovedChannel = utils.channels.newChannel();
    browser.tabs.onRemoved.addListener((tabId) => {
        onRemovedChannel.notify(tabId);
    });

    const onUpdatedChannel = utils.channels.newChannel();
    // https://developer.chrome.com/extensions/tabs#event-onUpdated
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        onUpdatedChannel.notify(toTabFromChromeTab(tab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onActivated
    const onActivatedChannel = utils.channels.newChannel();
    browser.tabs.onActivated.addListener((activeInfo) => {
        onActivatedChannel.notify(activeInfo.tabId);
    });

    // https://developer.chrome.com/extensions/windows#event-onFocusChanged
    browser.windows.onFocusChanged.addListener(async (windowId) => {
        if (windowId === browser.windows.WINDOW_ID_NONE) {
            return;
        }
        const tabId = await getActive();
        if (tabId) {
            onActivatedChannel.notify(tabId);
        }
    });

    /**
     * Give focus to a window
     * @param tabId Tab identifier
     * @param windowId Window identifier
     */
    async function focusWindow(tabId, windowId) {
        /**
         * Updating already focused window produces bug in Edge browser
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/675
         */
        const activeTabId = await getActive();
        if (activeTabId && tabId !== activeTabId) {
            // Focus window
            try {
                await browser.windows.update(windowId, { focused: true });
            } catch (e) {
                logOperationError(`Update window ${windowId}`, e);
            }
        }
    }

    /**
     * Creates new tab
     * @param createData
     */
    const create = async function (createData) {
        const { url } = createData;
        const active = createData.active === true;

        if (createData.type === 'popup'
            // Does not work properly in Anniversary builds
            && !browserUtils.isEdgeBeforeCreatorsUpdate()
            // Isn't supported by Android WebExt
            && !prefs.mobile) {
            // https://developer.chrome.com/extensions/windows#method-create
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/create
            await browser.windows.create({
                url,
                type: 'popup',
                width: 1000,
                height: 650,
            });
            return;
        }

        const isHttp = url.indexOf('http') === 0;

        async function onWindowFound(win) {
            // https://developer.chrome.com/extensions/tabs#method-create
            const chromeTab = await browser.tabs.create({
                /**
                 * In the Firefox browser for Android there is not concept of windows
                 * There is only one window whole time
                 * That's why if we try to provide windowId, method fails with error.
                 */
                windowId: !prefs.mobile ? win.id : undefined,
                url,
                active,
            });

            if (active) {
                await focusWindow(chromeTab.id, chromeTab.windowId);
            }

            return toTabFromChromeTab(chromeTab);
        }

        function isAppropriateWindow(win) {
            // We can't open not-http (e.g. 'chrome-extension://') urls in incognito mode
            return win.type === 'normal' && (isHttp || !win.incognito);
        }

        // https://developer.chrome.com/extensions/windows#method-create
        // https://developer.chrome.com/extensions/windows#method-getLastFocused
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/create
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/getLastFocused
        const win = await browser.windows.getLastFocused();

        if (isAppropriateWindow(win)) {
            return onWindowFound(win);
        }

        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/569
        const wins = await browser.windows.getAll({});

        if (wins) {
            for (let i = 0; i < wins.length; i += 1) {
                const win = wins[i];
                if (isAppropriateWindow(win)) {
                    return onWindowFound(win);
                }
            }
        }

        // Create new window
        const newWin = await browser.windows.create({});
        return onWindowFound(newWin);
    };

    const remove = async (tabId) => {
        // https://developer.chrome.com/extensions/tabs#method-remove
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/remove
        try {
            await browser.tabs.remove(tabIdToInt(tabId));
        } catch (e) {
            return;
        }
        return tabId;
    };

    const activate = async function (tabId) {
        try {
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/update
            const chromeTab = await browser.tabs.update(tabIdToInt(tabId), { active: true });
            await focusWindow(tabId, chromeTab.windowId);
            return tabId;
        } catch (e) {
            logOperationError('Before tab update', e);
        }
    };

    const sendMessage = function (tabId, message, responseCallback, options) {
        // https://developer.chrome.com/extensions/tabs#method-sendMessage
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage
        if (typeof options === 'object' && browser.tabs.sendMessage) {
            browser.tabs.sendMessage(tabIdToInt(tabId), message, options, responseCallback);
            return;
        }
        browser.tabs.sendMessage(tabIdToInt(tabId), message, responseCallback);
    };

    const reload = async (tabId, url) => {
        if (url) {
            if (browserUtils.isEdgeBrowser()) {
                /**
                 * For security reasons, in Firefox and Edge, this may not be a privileged URL.
                 * So passing any of the following URLs will fail, with runtime.lastError being set to an error message:
                 * chrome: URLs
                 * javascript: URLs
                 * data: URLs
                 * privileged about: URLs (for example, about:config, about:addons, about:debugging).
                 *
                 * Non-privileged URLs (about:home, about:newtab, about:blank) are allowed.
                 *
                 * So we use a content script instead.
                 */
                /**
                 * Content script may not have been loaded at this point yet.
                 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/580
                 */
                setTimeout(() => {
                    sendMessage(tabId, { type: 'update-tab-url', url });
                }, 100);
            } else {
                try {
                    await browser.tabs.update(tabIdToInt(tabId), { url });
                } catch (e) {
                    logOperationError('Tab update', e);
                }
            }
        } else {
            // https://developer.chrome.com/extensions/tabs#method-reload
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/reload#Browser_compatibility
            if (browser.tabs.reload) {
                try {
                    await browser.tabs.reload(tabIdToInt(tabId), { bypassCache: true });
                } catch (e) {
                    logOperationError('Tab reload', e);
                }
            } else {
                // Reload page without cache via content script
                sendMessage(tabId, { type: 'no-cache-reload' });
            }
        }
    };

    const getAll = async () => {
        // https://developer.chrome.com/extensions/tabs#method-query
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
        const chromeTabs = await browser.tabs.query({});
        const result = [];
        for (let i = 0; i < chromeTabs.length; i += 1) {
            const chromeTab = chromeTabs[i];
            result.push(toTabFromChromeTab(chromeTab));
        }
        return result;
    };

    /**
     * Gets tab by id
     * @param tabId Tab identifier
     */
    const get = async (tabId) => {
        try {
            const chromeTab = await browser.tabs.get(tabIdToInt(tabId));
            return toTabFromChromeTab(chromeTab);
        } catch (e) {
            logOperationError('Get tab', e);
        }
    };

    /**
     * Updates tab url
     * @param {number} tabId
     * @param {string} url
     */
    const updateUrl = async (tabId, url) => {
        if (tabId === 0) {
            return;
        }
        try {
            await browser.tabs.update(tabId, { url });
        } catch (e) {
            log.error(new Error(e.message));
        }
    };

    /**
     * True if `browser.tabs.insertCSS` supports `cssOrigin: "user"`.
     */
    let userCSSSupport = true;

    /**
     * Inserts CSS using the `browser.tabs.insertCSS` under the hood.
     * This method always injects CSS using `runAt: document_start`/
     *
     * @param {number} tabId Tab id or null if you want to inject into the active tab
     * @param {number} requestFrameId Target frame id (CSS will be inserted into that frame)
     * @param {number} code CSS code to insert
     */
    const insertCssCode = !browser.tabs.insertCSS ? undefined : async (tabId, requestFrameId, code) => {
        const injectDetails = {
            code,
            runAt: 'document_start',
            frameId: requestFrameId,
            matchAboutBlank: true,
        };

        if (userCSSSupport) {
            // If this is set for not supporting browser, it will throw an error.
            injectDetails.cssOrigin = 'user';
        }

        try {
            await browser.tabs.insertCSS(tabId, injectDetails);
        } catch (e) {
            // e.message in edge is undefined
            const errorMessage = e.message || e;
            // Some browsers do not support user css origin // TODO which one?
            if (/\bcssOrigin\b/.test(errorMessage)) {
                userCSSSupport = false;
            }
        }
    };

    /**
     * Executes the specified JS code using `browser.tabs.executeScript` under the hood.
     * This method forces `runAt: document_start`.
     *
     * @param {number} tabId Tab id or null if you want to inject into the active tab
     * @param {requestFrameId} requestFrameId Target frame id (script will be injected into that frame)
     * @param {requestFrameId} code Javascript code to execute
     */
    const executeScriptCode = !browser.tabs.executeScript ? undefined : async (tabId, requestFrameId, code) => {
        try {
            await browser.tabs.executeScript(tabId, {
                code,
                frameId: requestFrameId,
                runAt: 'document_start',
                matchAboutBlank: true,
            });
        } catch (e) {
            log.debug(new Error(e.message));
        }
    };

    /**
     * Executes the specified javascript file in the top frame of the specified tab.
     * This method forces `runAt: document_start`.
     *
     * @param {number} tabId Tab id or null if you want to inject into the active tab
     * @param {Object} options
     * @param {string} options.file - Path to the javascript file
     * @param {number} [options.frameId=0] - id of the frame, default to the 0;
     * @param {function} callback Called when the script injection is complete
     */
    const executeScriptFile = !browser.tabs.executeScript ? undefined : async (tabId, options) => {
        const { file, frameId = 0 } = options;
        const executeScriptOptions = {
            file,
            runAt: 'document_start',
        };

        // Chrome 49 throws an exception if browser.tabs.executeScript is called
        // with a frameId equal to 0
        if (frameId !== 0) {
            executeScriptOptions.frameId = frameId;
        }

        try {
            await browser.tabs.executeScript(tabId, executeScriptOptions);
        } catch (e) {
            log.debug(new Error(e.message));
        }
    };

    return {

        onCreated: onCreatedChannel,
        onRemoved: onRemovedChannel,
        onUpdated: onUpdatedChannel,
        onActivated: onActivatedChannel,

        create,
        remove,
        activate,
        reload,
        sendMessage,
        getAll,
        getActive,
        get,
        updateUrl,

        insertCssCode,
        executeScriptCode,
        executeScriptFile,
    };
})();
