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

/* global browser */

/**
 * Chromium windows implementation
 * @type {{onCreated, onRemoved, onUpdated, create, getLastFocused, forEachNative}}
 */
adguard.windowsImpl = (function (adguard) {

    'use strict';

    function toWindowFromChromeWindow(chromeWin) {
        return {
            windowId: chromeWin.id,
            type: chromeWin.type === 'normal' || chromeWin.type === 'popup' ? chromeWin.type : 'other'
        };
    }

    // Make compatible with Android WebExt
    if (typeof browser.windows === 'undefined') {

        browser.windows = (function () {

            var defaultWindow = {
                id: 1,
                type: 'normal'
            };

            var emptyListener = {
                addListener: function () {
                    // Doing nothing
                }
            };

            var create = function (createData, callback) {
                callback(defaultWindow);
            };

            var update = function (windowId, data, callback) {
                callback();
            };

            var getAll = function (query, callback) {
                callback(defaultWindow);
            };

            var getLastFocused = function (callback) {
                callback(defaultWindow);
            };

            return {
                onCreated: emptyListener,
                onRemoved: emptyListener,
                onFocusChanged: emptyListener,
                create: create,
                update: update,
                getAll: getAll,
                getLastFocused: getLastFocused
            };

        })();
    }

    var onCreatedChannel = adguard.utils.channels.newChannel();
    var onRemovedChannel = adguard.utils.channels.newChannel();
    var onUpdatedChannel = adguard.utils.channels.newChannel();

    // https://developer.chrome.com/extensions/windows#event-onCreated
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/onCreated
    browser.windows.onCreated.addListener(function (chromeWin) {
        onCreatedChannel.notify(toWindowFromChromeWindow(chromeWin), chromeWin);
    });

    // https://developer.chrome.com/extensions/windows#event-onRemoved
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/onRemoved
    browser.windows.onRemoved.addListener(function (windowId) {
        onRemovedChannel.notify(windowId);
    });

    var create = function (createData, callback) {
        // https://developer.chrome.com/extensions/windows#method-create
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/create
        browser.windows.create(createData, function (chromeWin) {
            callback(toWindowFromChromeWindow(chromeWin), chromeWin);
        });
    };

    var forEachNative = function (callback) {
        // https://developer.chrome.com/extensions/windows#method-getAll
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/getAll
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/569
        browser.windows.getAll({}, function (chromeWins) {
            for (var i = 0; i < chromeWins.length; i++) {
                var chromeWin = chromeWins[i];
                callback(chromeWin, toWindowFromChromeWindow(chromeWin));
            }
        });
    };

    var getLastFocused = function (callback) {
        // https://developer.chrome.com/extensions/windows#method-getLastFocused
        browser.windows.getLastFocused(function (chromeWin) {
            callback(chromeWin.id);
        });
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

/**
 * Chromium tabs implementation
 * @type {{onCreated, onRemoved, onUpdated, onActivated, create, remove, activate, reload, sendMessage, getAll, getActive, fromChromeTab}}
 */
adguard.tabsImpl = (function (adguard) {

    'use strict';

    /**
     * tabId parameter must be integer
     * @param tabId
     */
    function tabIdToInt(tabId) {
        return parseInt(tabId);
    }

    function checkLastError(operation) {
        var ex = browser.runtime.lastError;
        if (ex) {
            adguard.console.error("Error while executing operation{1}: {0}", ex, operation ? " '" + operation + "'" : '');
        }
        return ex;
    }

    // https://developer.chrome.com/extensions/tabs#type-Tab
    function toTabFromChromeTab(chromeTab) {
        return {
            tabId: chromeTab.id,
            url: chromeTab.url,
            title: chromeTab.title,
            incognito: chromeTab.incognito,
            status: chromeTab.status
        };
    }

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    var onCreatedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onCreated.addListener(function (chromeTab) {
        onCreatedChannel.notify(toTabFromChromeTab(chromeTab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onCreated
    var onRemovedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onRemoved.addListener(function (tabId) {
        onRemovedChannel.notify(tabId);
    });

    var onUpdatedChannel = adguard.utils.channels.newChannel();
    // https://developer.chrome.com/extensions/tabs#event-onUpdated
    browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        onUpdatedChannel.notify(toTabFromChromeTab(tab));
    });

    // https://developer.chrome.com/extensions/tabs#event-onActivated
    var onActivatedChannel = adguard.utils.channels.newChannel();
    browser.tabs.onActivated.addListener(function (activeInfo) {
        onActivatedChannel.notify(activeInfo.tabId);
    });

    // https://developer.chrome.com/extensions/windows#event-onFocusChanged
    browser.windows.onFocusChanged.addListener(function (windowId) {
        if (windowId === browser.windows.WINDOW_ID_NONE) {
            return;
        }
        getActive(onActivatedChannel.notify);
    });

    /**
     * Give focus to a window
     * @param tabId Tab identifier
     * @param windowId Window identifier
     * @param callback Callback
     */
    function focusWindow(tabId, windowId, callback) {
        /**
         * Updating already focused window produces bug in Edge browser
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/675
         */
        getActive(function (activeTabId) {
            if (tabId !== activeTabId) {
                // Focus window
                browser.windows.update(windowId, { focused: true }, function () {
                    if (checkLastError("Update window " + windowId)) {
                        return;
                    }
                    callback();
                });
            }
            callback();
        });
    }

    var create = function (createData, callback) {

        var url = createData.url;
        var active = createData.active === true;

        if (createData.type === 'popup' &&
            // Does not work properly in Anniversary builds
            !adguard.utils.browser.isEdgeBeforeCreatorsUpdate() &&
            // Isn't supported by Android WebExt
            !adguard.prefs.mobile) {
            // https://developer.chrome.com/extensions/windows#method-create
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/create
            browser.windows.create({
                url: url,
                type: 'popup',
                width: 1230,
                height: 630
            }, callback);
            return;
        }

        var isHttp = url.indexOf('http') === 0;

        function onWindowFound(win) {
            // https://developer.chrome.com/extensions/tabs#method-create
            browser.tabs.create({
                /**
                 * In the Firefox browser for Android there is not concept of windows
                 * There is only one window whole time
                 * Thats why if we try to provide windowId, method fails with error.
                 */
                windowId: !adguard.prefs.mobile ? win.id : undefined,
                url: url,
                active: active,
            }, function (chromeTab) {
                if (active) {
                    focusWindow(chromeTab.id, chromeTab.windowId, function () {
                    });
                }
                callback(toTabFromChromeTab(chromeTab));
            });
        }

        function isAppropriateWindow(win) {
            // We can't open not-http (e.g. 'chrome-extension://') urls in incognito mode
            return win.type === 'normal' && (isHttp || !win.incognito);
        }

        // https://developer.chrome.com/extensions/windows#method-create
        // https://developer.chrome.com/extensions/windows#method-getLastFocused
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/create
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/getLastFocused

        browser.windows.getLastFocused(function (win) {
            if (isAppropriateWindow(win)) {
                onWindowFound(win);
                return;
            }

            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/569
            browser.windows.getAll({}, function (wins) {
                if (wins) {
                    for (var i = 0; i < wins.length; i++) {
                        var win = wins[i];
                        if (isAppropriateWindow(win)) {
                            onWindowFound(win);
                            return;
                        }
                    }
                }

                // Create new window
                browser.windows.create({}, onWindowFound);
            });
        });
    };

    var remove = function (tabId, callback) {
        // https://developer.chrome.com/extensions/tabs#method-remove
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/remove
        browser.tabs.remove(tabIdToInt(tabId), function () {
            if (checkLastError()) {
                return;
            }
            callback(tabId);
        });
    };

    var activate = function (tabId, callback) {
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/update
        browser.tabs.update(tabIdToInt(tabId), { active: true }, function (chromeTab) {
            if (checkLastError("Before tab update")) {
                return;
            }
            focusWindow(tabId, chromeTab.windowId, function () {
                callback(tabId);
            });
        });
    };

    var reload = function (tabId, url) {
        if (url) {
            if (adguard.utils.browser.isEdgeBrowser()) {
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
                setTimeout(function () {
                    sendMessage(tabId, { type: 'update-tab-url', url: url });
                }, 100);
            } else {
                browser.tabs.update(tabIdToInt(tabId), { url: url }, checkLastError);
            }
        } else {
            // https://developer.chrome.com/extensions/tabs#method-reload
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/reload#Browser_compatibility
            if (browser.tabs.reload) {
                browser.tabs.reload(tabIdToInt(tabId), { bypassCache: true }, checkLastError);
            } else {
                // Reload page without cache via content script
                sendMessage(tabId, { type: 'no-cache-reload' });
            }
        }
    };

    var sendMessage = function (tabId, message, responseCallback, options) {
        // https://developer.chrome.com/extensions/tabs#method-sendMessage
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage
        if (typeof options === 'object' && browser.tabs.sendMessage) {
            browser.tabs.sendMessage(tabIdToInt(tabId), message, options, responseCallback);
            return;
        }
        (browser.tabs.sendMessage || browser.tabs.sendRequest)(tabIdToInt(tabId), message, responseCallback);
    };

    var getAll = function (callback) {
        // https://developer.chrome.com/extensions/tabs#method-query
        // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
        browser.tabs.query({}, function (chromeTabs) {
            var result = [];
            for (var i = 0; i < chromeTabs.length; i++) {
                var chromeTab = chromeTabs[i];
                result.push(toTabFromChromeTab(chromeTab));
            }
            callback(result);
        });
    };

    var getActive = function (callback) {
        /**
         * lastFocusedWindow parameter isn't supported by Opera
         * But seems currentWindow has the same effect in our case.
         * See for details:
         * https://developer.chrome.com/extensions/windows#current-window
         * https://dev.opera.com/extensions/tab-window/#accessing-the-current-tab
         * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query
         */
        browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            if (tabs && tabs.length > 0) {
                callback(tabs[0].id);
            }
        });
    };

    /**
     * Gets tab by id
     * @param tabId Tab identifier
     * @param callback
     */
    var get = function (tabId, callback) {
        browser.tabs.get(tabIdToInt(tabId), function (chromeTab) {
            if (browser.runtime.lastError) {
                return;
            }
            callback(toTabFromChromeTab(chromeTab));
        });
    };

    /**
     * The only purpose of this callback is to read `lastError` and prevent
     * unnecessary console warnings (can happen with Chrome preloaded tabs).
     * See https://stackoverflow.com/questions/43665470/cannot-call-chrome-tabs-executescript-into-preloaded-tab-is-this-a-bug-in-chr
     */
    const noopCallback = function () {
        adguard.runtime.lastError;
    };

    /**
     * Updates tab url
     * @param {number} tabId
     * @param {string} url
     */
    const updateUrl = (tabId, url) => {
        if (tabId === 0) {
            return;
        }
        browser.tabs.update(tabId, { url }, noopCallback);
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
    const insertCssCode = !browser.tabs.insertCSS ? undefined : function (tabId, requestFrameId, code) {
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
            browser.tabs.insertCSS(tabId, injectDetails, noopCallback);
        } catch (e) {
            // e.message in edge is undefined
            const errorMessage = e.message || e;
            // Some browsers do not support user css origin
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
    const executeScriptCode = !browser.tabs.executeScript ? undefined : function (tabId, requestFrameId, code) {
        browser.tabs.executeScript(tabId, {
            code: code,
            frameId: requestFrameId,
            runAt: 'document_start',
            matchAboutBlank: true,
        }, noopCallback);
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
    const executeScriptFile = !browser.tabs.executeScript
        ? undefined
        : (tabId, options, callback) => {
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

            browser.tabs.executeScript(tabId, executeScriptOptions, () => {
                noopCallback();
                if (callback) {
                    callback();
                }
            });
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
        updateUrl: updateUrl,

        insertCssCode: insertCssCode,
        executeScriptCode: executeScriptCode,
        executeScriptFile: executeScriptFile,

        fromChromeTab: toTabFromChromeTab
    };

})(adguard);
