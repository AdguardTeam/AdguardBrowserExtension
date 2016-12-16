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
/* global chrome, Prefs, Log, BaseEvent, RequestTypes, Utils, OnMessageEvent, SendMessageFunction */
var BrowserTab, BrowserTabs;
var ext;
var browser = browser || chrome;

(function () {

    var TabEvent = function () {
        BaseEvent.apply(this, arguments);
    };
    LanguageUtils.inherit(TabEvent, BaseEvent);


    var OnCreatedTabEvent = function () {
        TabEvent.call(this, browser.tabs.onCreated);
    };

    LanguageUtils.inherit(OnCreatedTabEvent, TabEvent);
    OnCreatedTabEvent.prototype.specifyListener = function (listener) {
        return function (tab) {
            listener(new BrowserTab(tab));
        };
    };


    var OnLoadingTabEvent = function () {
        TabEvent.call(this, browser.tabs.onUpdated);
    };

    LanguageUtils.inherit(OnLoadingTabEvent, TabEvent);
    OnLoadingTabEvent.prototype.specifyListener = function (listener) {
        return function (id, info, tab) {
            if (info.status == "loading") {
                listener(new BrowserTab(tab));
            }
        };
    };


    var OnCompletedTabEvent = function () {
        TabEvent.call(this, browser.tabs.onUpdated);
    };

    LanguageUtils.inherit(OnCompletedTabEvent, TabEvent);
    OnCompletedTabEvent.prototype.specifyListener = function (listener) {
        return function (id, info, tab) {
            if (info.status == "complete") {
                listener(new BrowserTab(tab));
            }
        };
    };


    var OnUpdatedTabEvent = function () {
        TabEvent.call(this, browser.tabs.onUpdated);
    };

    LanguageUtils.inherit(OnUpdatedTabEvent, TabEvent);
    OnUpdatedTabEvent.prototype.specifyListener = function (listener) {
        return function (id, info, tab) {
            listener(new BrowserTab(tab));
        };
    };


    var OnActivatedTabEvent = function () {
        TabEvent.call(this, browser.tabs.onActivated);
    };

    LanguageUtils.inherit(OnActivatedTabEvent, TabEvent);
    OnActivatedTabEvent.prototype.specifyListener = function (listener) {
        return function (info) {
            browser.tabs.get(info.tabId, function (tab) {
                if (checkLastError()) {
                    return;
                }
                if (tab) {
                    listener(new BrowserTab(tab));
                }
            });
        };
    };


    var OnRemovedTabEvent = function () {
        TabEvent.call(this, browser.tabs.onRemoved);
    };
    LanguageUtils.inherit(OnRemovedTabEvent, TabEvent);
    OnRemovedTabEvent.prototype.specifyListener = function (listener) {
        return function (id) {
            listener(new BrowserTab({id: id}));
        };
    };


    function getRequestDetails(details) {

        var tab = new BrowserTab({id: details.tabId});

        //https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
        var requestDetails = {
            requestUrl: details.url,    //request url
            tab: tab                    //request tab
        };

        var frameId = 0;        //id of this frame (only for main_frame and sub_frame types)
        var requestFrameId = 0; //id of frame where request is executed
        var requestType;        //request type

        switch (details.type) {
            case "main_frame":
                frameId = 0;
                requestType = RequestTypes.DOCUMENT;
                break;
            case "sub_frame":
                frameId = details.frameId;
                requestFrameId = details.parentFrameId; //for sub_frame use parentFrameId as id of frame that wraps this frame
                requestType = RequestTypes.SUBDOCUMENT;
                break;
            default:
                requestFrameId = details.frameId;
                requestType = details.type.toUpperCase();
                break;
        }

        //relate request to main_frame
        if (requestFrameId == -1) {
            requestFrameId = 0;
        }

        if (requestType === RequestTypes.OTHER) {
            requestType = parseRequestTypeFromUrl(details.url);
        }

        requestDetails.frameId = frameId;
        requestDetails.requestFrameId = requestFrameId;
        requestDetails.requestType = requestType;

        if (details.requestHeaders) {
            requestDetails.requestHeaders = details.requestHeaders;
        }

        if (details.responseHeaders) {
            requestDetails.responseHeaders = details.responseHeaders;
        }

        return requestDetails;
    }

    var linkHelper = document.createElement('a');

    /**
     * Fixing request type:
     * https://code.google.com/p/chromium/issues/detail?id=410382
     *
     * @param url Request url
     * @returns String Fixed object type
     */
    function parseRequestTypeFromUrl(url) {
        linkHelper.href = url;
        var path = linkHelper.pathname;
        var requestType = Utils.parseContentTypeFromUrlPath(path);
        if (requestType === null) {
            // https://code.google.com/p/chromium/issues/detail?id=410382
            requestType = RequestTypes.OBJECT;
        }
        return requestType;
    }


    var OnBeforeRequestEvent = function () {
        BaseEvent.call(this, browser.webRequest.onBeforeRequest);
    };

    LanguageUtils.inherit(OnBeforeRequestEvent, BaseEvent);
    OnBeforeRequestEvent.prototype.specifyListener = function (listener) {

        return function (details) {

            if (details.tabId == -1) {
                return {};
            }

            var requestDetails = getRequestDetails(details);

            var skip = listener(requestDetails);
            return {
                cancel: skip === false
            };
        };
    };
    OnBeforeRequestEvent.prototype.getOptExtraInfoSpec = function (urls) {
        return [urls ? {urls: urls} : {}, ["blocking"]];
    };


    var OnHeadersReceivedEvent = function () {
        BaseEvent.call(this, browser.webRequest.onHeadersReceived);
    };

    LanguageUtils.inherit(OnHeadersReceivedEvent, BaseEvent);
    OnHeadersReceivedEvent.prototype.specifyListener = function (listener) {

        return function (details) {

            if (details.tabId == -1) {
                return;
            }

            var requestDetails = getRequestDetails(details);
            return listener(requestDetails);
        };
    };
    OnHeadersReceivedEvent.prototype.getOptExtraInfoSpec = function (urls) {
        return [urls ? {urls: urls} : {}, ["responseHeaders", "blocking"]];
    };


    var OnBeforeSendHeadersEvent = function () {
        BaseEvent.call(this, browser.webRequest.onBeforeSendHeaders);
    };

    LanguageUtils.inherit(OnBeforeSendHeadersEvent, BaseEvent);
    OnBeforeSendHeadersEvent.prototype.specifyListener = function (listener) {

        return function (details) {

            if (details.tabId == -1) {
                return;
            }

            var requestDetails = getRequestDetails(details);
            return listener(requestDetails);
        };
    };
    OnBeforeSendHeadersEvent.prototype.getOptExtraInfoSpec = function (urls) {
        return [urls ? {urls: urls} : {}, ["requestHeaders", "blocking"]];
    };


    var checkLastError = function () {
        var ex = browser.runtime.lastError;
        if (ex) {
            Log.error("Error while executing operation: {0}", ex);
        }

        return ex;
    };

    BrowserTab = function (tab) {
        this.id = tab.id;
        this.url = tab.url;
        this.active = tab.active;
        this.title = tab.title;
        this.windowId = tab.windowId;
        this.incognito = tab.incognito;
    };
    BrowserTab.prototype = {
        close: function () {
            browser.tabs.remove(this.id, checkLastError);
        },
        activate: function () {
            // Activate tab
            browser.tabs.update(this.id, {active: true}, checkLastError);

            // Focus window
            browser.windows.update(this.windowId, {focused: true}, checkLastError);
        },
        sendMessage: function (message, responseCallback) {
            (browser.tabs.sendMessage || browser.tabs.sendRequest)(this.id, message, responseCallback);
        },
        reload: function (url) {
            if (url) {
                if (Utils.isEdgeBrowser()) {
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
                    this.sendMessage({
                        type: 'update-tab-url',
                        url: url
                    });
                } else {
                    browser.tabs.update(this.id, {url: url}, checkLastError);
                }
            } else {
                if (browser.tabs.reload) {
                    browser.tabs.reload(this.id, {
                        bypassCache: true
                    }, checkLastError);
                } else {
                    // Reload page without cache via content script
                    this.sendMessage({type: 'no-cache-reload'});
                }
            }
        },
        executeScript: function (details, callback) {
            browser.tabs.executeScript(this.id, details, function () {
                if (checkLastError()) {
                    return;
                }
                callback();
            });
        },
        insertCSS: function (details, callback) {
            browser.tabs.insertCSS(this.id, details, function () {
                if (checkLastError()) {
                    return;
                }
                callback();
            });
        },
        equals: function (t) {
            return this.id == t.id;
        }
    };

    BrowserTabs = function (options) {
        this.tabsById = {};
        this.incognitoTabsById = {};
        this.options = options;
        this._delete = this._delete.bind(this);
    };
    BrowserTabs.prototype = {
        get: function (tab) {
            return (this.tabsById[tab.id] || {}).value;
        },
        set: function (tab, value) {
            this.tabsById[tab.id] = {tab: tab, value: value};
        },
        has: function (tab) {
            return tab.id in this.tabsById;
        },
        clear: function () {
            for (var id in this.tabsById) {
                this._delete(this.tabsById[id].tab);
            }
        },
        collection: function () {
            var result = [];
            for (var id in this.tabsById) {
                result.push(this.tabsById[id].value);
            }
            return result;
        },
        checkIncognitoMode: function (tab) {
            this.incognitoTabsById[tab.id] = tab.incognito;
        },
        isIncognito: function (tab) {
            return this.incognitoTabsById[tab.id];
        },
        remove: function (tab) {
            this._delete(tab);
        },
        _delete: function (tab) {
            delete this.tabsById[tab.id];
            delete this.incognitoTabsById[tab.id];
        }
    };

    var BrowserWindow = function (win) {
        this.id = win.id;
        this.visible = win.state != "minimized";
    };
    BrowserWindow.prototype = {
        getAllTabs: function (callback) {
            browser.tabs.query({
                windowId: this.id
            }, function (tabs) {
                callback(tabs.map(function (tab) {
                    return new BrowserTab(tab);
                }));
            });
        },
        getActiveTab: function (callback) {
            var queryInfo = {
                windowId: this.id,
                active: true
            };
            browser.tabs.query(queryInfo, function (tabs) {
                if (tabs && tabs.length > 0) {
                    callback(new BrowserTab(tabs[0]));
                }
            });
        },
        openTab: function (url, background, callback) {
            var createProperties = {
                windowId: this.id,
                url: url,
                active: !background
            };
            browser.tabs.create(createProperties, function (tab) {
                if (callback) {
                    callback(new BrowserTab(tab));
                }
            });
        }
    };

    /**
     * Common API for all platforms
     */
    ext = {};
    /**
     * Gets URL of a file that belongs to our extension
     */
    ext.getURL = browser.extension.getURL;
    ext.onMessage = new OnMessageEvent();

    ext.i18n = browser.i18n;

    ext.backgroundPage = {};
    ext.backgroundPage.getWindow = function () {
        return browser.extension.getBackgroundPage();
    };
    ext.backgroundPage.sendMessage = SendMessageFunction;

    ext.app = {

        /**
         * Extension ID
         */
        getId: function () {
            return browser.runtime.id;
        },

        /**
         * Gets extension scheme
         * @returns "chrome-extension" for Chrome," ms-browser-extension" for Edge
         */
        getUrlScheme: function () {
            var url = ext.getURL('test.html');
            var index = url.indexOf('://');
            return url.substring(0, index);
        },

        /**
         * Extension version
         */
        getVersion: function () {
            return browser.runtime.getManifest().version;
        },

        /**
         * Extension UI locale
         */
        getLocale: function () {
            return browser.i18n.getUILanguage();
        }
    };

    ext.windows = {
        getAll: function (callback) {
            browser.windows.getAll(function (windows) {
                callback(windows.map(function (win) {
                    return new BrowserWindow(win);
                }));
            });
        },
        getLastFocused: function (callback) {
            //https://github.com/AdguardTeam/AdguardBrowserExtension/issues/134
            browser.windows.getLastFocused(function (win) {
                callback(new BrowserWindow(win));
            });
        },
        getOrCreate: function (callback, isExtensionTab) {
            var isAppropriateWindow = function (wnd) {
                return wnd.type == "normal" && (!wnd.incognito || !isExtensionTab);
            };
            browser.windows.getLastFocused(function (activeWnd) {
                //last focused window
                if (isAppropriateWindow(activeWnd)) {
                    callback(new BrowserWindow(activeWnd));
                    return;
                }
                //try to find appropriate window
                browser.windows.getAll(function (windows) {
                    for (var i = 0; i < windows.length; i++) {
                        var wnd = windows[i];
                        if (isAppropriateWindow(wnd)) {
                            (function (wnd) {
                                browser.windows.update(wnd.id, {focused: true}, function () {
                                    if (checkLastError()) {
                                        return;
                                    }
                                    callback(new BrowserWindow(wnd));
                                });
                            })(wnd);
                            return;
                        }
                    }
                    //couldn't find window, create new
                    browser.windows.create({}, function (win) {
                        callback(new BrowserWindow(win));
                    });
                });
            });
        },
        onFocusChanged: {
            addListener: function (callback) {
                browser.windows.onFocusChanged.addListener(function (windowId) {
                    if (windowId != browser.windows.WINDOW_ID_NONE) {
                        callback();
                    }
                });
            }
        },
        createPopup: function (url, callback) {
            browser.windows.create({
                url: url,
                type: 'popup',
                width: 1230,
                height: 630
            }, function (win) {
                if (callback) {
                    callback(new BrowserWindow(win));
                }
            });
        }
    };

    ext.tabs = {
        onCreated: new OnCreatedTabEvent(),
        onLoading: new OnLoadingTabEvent(),
        onUpdated: new OnUpdatedTabEvent(),
        onCompleted: new OnCompletedTabEvent(),
        onActivated: new OnActivatedTabEvent(),
        onRemoved: new OnRemovedTabEvent(),
        getLastFocused: function (callback) {
            browser.tabs.query({currentWindow: true, active: true}, function (tabs) {
                if (callback && tabs && tabs.length > 0) {
                    callback(new BrowserTab(tabs[0]));
                }
            });
        }
    };

    ext.webRequest = {
        onBeforeRequest: new OnBeforeRequestEvent(),
        handlerBehaviorChanged: browser.webRequest.handlerBehaviorChanged,
        onCompleted: browser.webRequest.onCompleted,
        onErrorOccurred: browser.webRequest.onErrorOccurred,
        onHeadersReceived: new OnHeadersReceivedEvent(),
        onBeforeSendHeaders: new OnBeforeSendHeadersEvent()
    };

    ext.webNavigation = {
        onCreatedNavigationTarget: browser.webNavigation.onCreatedNavigationTarget
    };

    //noinspection JSUnusedLocalSymbols
    ext.browserAction = {
        setBrowserAction: function (tab, icon, badge, badgeColor, title) {
            var tabId = tab.id;

            var onIconReady = function () {
                if (browser.runtime.lastError) {
                    return;
                }
                browser.browserAction.setBadgeText({tabId: tabId, text: badge});

                if (browser.runtime.lastError) {
                    return;
                }
                if (badge) {
                    browser.browserAction.setBadgeBackgroundColor({tabId: tabId, color: badgeColor});
                }

                //title setup via manifest.json file
                //chrome.browserAction.setTitle({tabId: tabId, title: title});
            };

            /**
             * Workaround for MS Edge.
             * For some reason Edge changes the inner state of the "icon" object and adds a tabId property inside.
             */
            delete icon.tabId;

            if (browser.runtime.lastError) {
                return;
            }

            browser.browserAction.setIcon({tabId: tabId, path: icon}, onIconReady);
        }
    };

    ext.contextMenus = browser.contextMenus;
})();