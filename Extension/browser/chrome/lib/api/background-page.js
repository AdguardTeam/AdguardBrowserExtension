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

/* global chrome */

var browser = window.browser || chrome;

(function (adguard, browser) {

    'use strict';

    adguard.runtime = (function () {

        var onMessage = {
            addListener: function (callback) {
                // https://developer.chrome.com/extensions/runtime#event-onMessage
                adguard.runtimeImpl.onMessage.addListener(function (message, sender, sendResponse) {
                    var senderOverride = Object.create(null);
                    if (sender.tab) {
                        senderOverride.tab = adguard.tabsImpl.fromChromeTab(sender.tab);
                    }
                    if (typeof sender.frameId !== 'undefined') {
                        senderOverride.frameId = sender.frameId;
                    }
                    var response = callback(message, senderOverride, sendResponse);
                    var async = response === true;
                    // If async sendResponse will be invoked later
                    if (!async) {
                        sendResponse(response);
                    }
                    // Don't forget return callback result for asynchronous message passing
                    return async;
                });
            }
        };

        return {
            onMessage: onMessage,
            get lastError() {
                return browser.runtime.lastError;
            }
        };
    })();

    // Calculates absolute URL of this extension
    const extensionProtocol = (function () {
        var url = browser.extension.getURL("");
        var index = url.indexOf('://');
        if (index > 0) {
            return url.substring(0, index);
        }
        return url;
    })();

    /**
     * We are skipping requests to internal resources of extensions (e.g. chrome-extension:// or moz-extension://... etc.)
     * @param details Request details
     * @returns {boolean}
     */
    function shouldSkipRequest(details) {
        return details.tabId === adguard.BACKGROUND_TAB_ID && details.url.indexOf(extensionProtocol) === 0;
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
        var requestType = adguard.utils.browser.parseContentTypeFromUrlPath(path);
        if (requestType === null) {
            // https://code.google.com/p/chromium/issues/detail?id=410382
            requestType = adguard.RequestTypes.OBJECT;
        }
        return requestType;
    }

    /**
     * An array of HTTP headers.
     * Each header is represented as a dictionary containing the keys name and either value or binaryValue.
     * https://developer.chrome.com/extensions/webRequest#type-HttpHeaders
     * @typedef HttpHeaders
     * @type {Array.<{ name: String, value: String, binaryValue }>}
     */

    /**
     * @typedef RequestDetails
     * @type {Object}
     * @property {String} requestUrl - request url
     * @property {{tabId: Number}} tab - request tab with tabId in property
     * @property {Number} requestId - the ID of the request
     * @property {Number} statusCode - standard HTTP status code
     * @property {String} method - standard HTTP method
     * @property {Number} frameId - ID of current frame. Frame IDs are unique within a tab.
     * @property {Number} requestFrameId - ID of frame where request is executed
     * @property {Number} requestType - request type
     * @property {HttpHeaders} [requestHeaders] - the HTTP request headers
     * @property {HttpHeaders} [responseHeaders] - the HTTP response headers
     * @property {String} [referrerUrl] - the origin where the request was initiated
     */

    /**
     * Argument passed to the webRequest event listener.
     * Every webRequest event listener has its own object with request details.
     * To learn more see https://developer.chrome.com/extensions/webRequest or
     * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest
     * @typedef {Object} WebRequestDetails
     */

    /**
     * Transforms raw request details from different browsers into unified format
     * @param {WebRequestDetails} details raw webRequest details
     * @returns {RequestDetails} prepared request details
     */
    function getRequestDetails(details) {
        var tab = { tabId: details.tabId };

        /**
         * FF sends http instead of ws protocol at the http-listeners layer
         * Although this is expected, as the Upgrade request is indeed an HTTP request, we use a chromium based approach in this case.
         */
        if (details.type === 'websocket' && details.url.indexOf('http') === 0) {
            details.url = details.url.replace(/^http(s)?:/, 'ws$1:');
        }

        // https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
        var requestDetails = {
            requestUrl: details.url,    //request url
            tab: tab,                   //request tab,
            requestId: details.requestId,
            statusCode: details.statusCode,
            method: details.method
        };

        var frameId = 0;        //id of this frame (only for main_frame and sub_frame types)
        var requestFrameId = 0; //id of frame where request is executed
        var requestType;        //request type

        switch (details.type) {
            case "main_frame":
                frameId = 0;
                requestType = adguard.RequestTypes.DOCUMENT;
                break;
            case "sub_frame":
                frameId = details.frameId;
                requestFrameId = details.parentFrameId; //for sub_frame use parentFrameId as id of frame that wraps this frame
                requestType = adguard.RequestTypes.SUBDOCUMENT;
                break;
            default:
                requestFrameId = details.frameId;
                requestType = details.type.toUpperCase();
                break;
        }

        // Relate request to main_frame
        if (requestFrameId === -1) {
            requestFrameId = 0;
        }

        if (requestType === 'IMAGESET') {
            requestType = adguard.RequestTypes.IMAGE;
        }

        if (requestType === adguard.RequestTypes.OTHER) {
            requestType = parseRequestTypeFromUrl(details.url);
        }

        /**
         * Use `OTHER` type as a fallback
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/777
         */
        if (!(requestType in adguard.RequestTypes)) {
            requestType = adguard.RequestTypes.OTHER;
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

        if (details.tabId === adguard.BACKGROUND_TAB_ID) {
            // In case of background request, its details contains referrer url
            // Chrome uses `initiator`: https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
            // FF uses `originUrl`: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeRequest#Additional_objects
            requestDetails.referrerUrl = details.originUrl || details.initiator;
        }

        return requestDetails;
    }

    var onBeforeRequest = {
        /**
         * Wrapper for webRequest.onBeforeRequest event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {

            // https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
            browser.webRequest.onBeforeRequest.addListener(function (details) {

                if (shouldSkipRequest(details)) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                return callback(requestDetails);

            }, urls ? { urls: urls } : {}, ["blocking"]);
        }
    };

    var onHeadersReceived = {
        /**
         * Wrapper for webRequest.onHeadersReceived event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {

            browser.webRequest.onHeadersReceived.addListener(function (details) {

                if (shouldSkipRequest(details)) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                var result = callback(requestDetails);
                if (result) {
                    return 'responseHeaders' in result ? { responseHeaders: result.responseHeaders } : {};
                }

            }, urls ? { urls: urls } : {}, ["responseHeaders", "blocking"]);
        }
    };

    var onBeforeSendHeaders = {

        /**
         * Wrapper for webRequest.onBeforeSendHeaders event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {

            browser.webRequest.onBeforeSendHeaders.addListener(function (details) {

                if (shouldSkipRequest(details)) {
                    return;
                }

                var requestDetails = getRequestDetails(details);
                var result = callback(requestDetails);
                if (result) {
                    return 'requestHeaders' in result ? { requestHeaders: result.requestHeaders } : {};
                }

            }, urls ? { urls: urls } : {}, ["requestHeaders", "blocking"]);
        }
    };

    var onResponseStarted = {
        /**
         * Wrapper for webRequest.onResponseStarted event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {
            browser.webRequest.onResponseStarted.addListener(function (details) {
                if (shouldSkipRequest(details)) {
                    return;
                }
                var requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls: urls } : {}, ['responseHeaders']);
        },
    };

    var onErrorOccurred = {
        /**
         * Wrapper for webRequest.onErrorOccurred event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {
            browser.webRequest.onErrorOccurred.addListener(function (details) {
                if (shouldSkipRequest(details)) {
                    return;
                }
                var requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls: urls } : {});
        },
    };

    var onCompleted = {
        /**
         * Wrapper for webRequest.onCompleted event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener: function (callback, urls) {
            browser.webRequest.onCompleted.addListener(function (details) {
                if (shouldSkipRequest(details)) {
                    return;
                }
                var requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls: urls } : {}, ['responseHeaders']);
        },
    };

    /**
     * Gets URL of a file that belongs to our extension
     */
    adguard.getURL = browser.extension.getURL;

    adguard.backgroundPage = {};
    adguard.backgroundPage.getWindow = function () {
        return browser.extension.getBackgroundPage();
    };

    adguard.app = {

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
            var url = adguard.getURL('test.html');
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

    adguard.webRequest = {
        onBeforeRequest: onBeforeRequest,
        handlerBehaviorChanged: browser.webRequest.handlerBehaviorChanged,
        onCompleted: onCompleted,
        onErrorOccurred: onErrorOccurred,
        onHeadersReceived: onHeadersReceived,
        onBeforeSendHeaders: onBeforeSendHeaders,
        onResponseStarted: onResponseStarted,
        webSocketSupported: typeof browser.webRequest.ResourceType !== 'undefined' && browser.webRequest.ResourceType['WEBSOCKET'] === 'websocket',
        filterResponseData: browser.webRequest.filterResponseData,
    };

    var onCreatedNavigationTarget = {

        addListener: function (callback) {

            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation/onCreatedNavigationTarget#Browser_compatibility
            if (typeof browser.webNavigation.onCreatedNavigationTarget === 'undefined') {
                return;
            }

            browser.webNavigation.onCreatedNavigationTarget.addListener(function (details) {

                if (details.tabId === adguard.BACKGROUND_TAB_ID) {
                    return;
                }

                callback({
                    tabId: details.tabId,
                    sourceTabId: details.sourceTabId,
                    url: details.url
                });
            });
        }
    };

    var onCommitted = {
        /**
         * Wrapper for webNavigation.onCommitted event
         * It prepares webNavigation details and passes them to the callback
         * @param callback callback function receives object similar to {RequestDetails} and handles event
         */
        addListener: function (callback) {
            // https://developer.chrome.com/extensions/webNavigation#event-onCommitted
            browser.webNavigation.onCommitted.addListener(function (details) {
                // makes webNavigation.onCommited details similar to webRequestDetails
                details.requestType = details.frameId === 0 ? adguard.RequestTypes.DOCUMENT : adguard.RequestTypes.SUBDOCUMENT;
                details.tab = { tabId: details.tabId };
                details.requestUrl = details.url;
                callback(details);
            }, {
                url: [{
                    urlPrefix: 'http'
                }, {
                    urlPrefix: 'https'
                }]
            });
        }
    };

    // https://developer.chrome.com/extensions/webNavigation
    adguard.webNavigation = {
        onCreatedNavigationTarget: onCreatedNavigationTarget,
        onCommitted: onCommitted,
        onDOMContentLoaded: browser.webNavigation.onDOMContentLoaded,
    };

    var browserActionSupported = typeof browser.browserAction.setIcon !== 'undefined';
    if (!browserActionSupported && browser.browserAction.onClicked) {
        // Open settings menu
        browser.browserAction.onClicked.addListener(function () {
            adguard.ui.openSettingsTab();
        });
    }

    //noinspection JSUnusedLocalSymbols,JSHint
    adguard.browserAction = {

        setBrowserAction: function (tab, icon, badge, badgeColor, title) {

            if (!browserActionSupported) {
                return;
            }

            var tabId = tab.tabId;

            var onIconReady = function () {
                if (browser.runtime.lastError) {
                    return;
                }
                browser.browserAction.setBadgeText({ tabId: tabId, text: badge });

                if (browser.runtime.lastError) {
                    return;
                }
                if (badge) {
                    browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: badgeColor });
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

            browser.browserAction.setIcon({ tabId: tabId, path: icon }, onIconReady);
        },
        setPopup: function () {
            // Do nothing. Popup is already installed in manifest file
        },
        resize: function () {
            // Do nothing
        },
        close: function () {
            // Do nothing
        }
    };

    adguard.contextMenus = browser.contextMenus;

})(adguard, browser);
