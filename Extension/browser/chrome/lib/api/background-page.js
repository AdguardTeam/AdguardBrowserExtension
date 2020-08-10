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

const browser = window.browser || chrome;

(function (adguard, browser) {
    'use strict';

    adguard.runtime = (function () {
        const onMessage = {
            addListener(callback) {
                // https://developer.chrome.com/extensions/runtime#event-onMessage
                adguard.runtimeImpl.onMessage.addListener((message, sender, sendResponse) => {
                    const senderOverride = Object.create(null);
                    if (sender.tab) {
                        senderOverride.tab = adguard.tabsImpl.fromChromeTab(sender.tab);
                    }
                    if (typeof sender.frameId !== 'undefined') {
                        senderOverride.frameId = sender.frameId;
                    }
                    const response = callback(message, senderOverride, sendResponse);
                    const async = response === true;
                    // If async sendResponse will be invoked later
                    if (!async) {
                        sendResponse(response);
                    }
                    // Don't forget return callback result for asynchronous message passing
                    return async;
                });
            },
        };

        return {
            setUninstallURL: browser.runtime.setUninstallURL,
            onMessage,
            get lastError() {
                return browser.runtime.lastError;
            },
        };
    })();

    // Calculates scheme of this extension (e.g.: chrome-extension:// or moz-extension://)
    const extensionScheme = (function () {
        const url = browser.extension.getURL('');
        const index = url.indexOf('://');
        if (index > 0) {
            return url.substring(0, index);
        }
        return url;
    })();

    /**
     * We are skipping requests to internal resources of extensions
     * (e.g. chrome-extension:// or moz-extension://... etc.)
     * @param details Request details
     * @returns {boolean}
     */
    function shouldSkipRequest(details) {
        return details.tabId === adguard.BACKGROUND_TAB_ID
            && details.url.indexOf(extensionScheme) === 0;
    }

    const linkHelper = document.createElement('a');

    /**
     * Fixing request type:
     * https://code.google.com/p/chromium/issues/detail?id=410382
     *
     * @param url Request url
     * @returns String Fixed object type
     */
    function parseRequestTypeFromUrl(url) {
        linkHelper.href = url;
        const path = linkHelper.pathname;
        let requestType = adguard.utils.browser.parseContentTypeFromUrlPath(path);
        if (requestType === null) {
            // https://code.google.com/p/chromium/issues/detail?id=410382
            requestType = adguard.RequestTypes.OBJECT;
        }
        return requestType;
    }

    /**
     * An array of HTTP headers.
     * Each header is represented as a dictionary containing the keys name
     * and either value or binaryValue.
     * https://developer.chrome.com/extensions/webRequest#type-HttpHeaders
     * @typedef HttpHeaders
     * @type {Array.<{ name: String, value: String, binaryValue }>}
     */

    /**
     * @typedef RequestDetails
     * @type {Object}
     * @property {String} requestUrl - request url
     * @property {String} referrerUrl - the origin where the request was initiated
     * @property {{tabId: Number}} tab - request tab with tabId in property
     * @property {Number} requestId - the ID of the request
     * @property {Number} statusCode - standard HTTP status code
     * @property {String} method - standard HTTP method
     * @property {Number} frameId - ID of current frame. Frame IDs are unique within a tab.
     * @property {Number} requestFrameId - ID of frame where request is executed
     * @property {Number} requestType - request type {@link adguard.RequestTypes}
     * @property {HttpHeaders} [requestHeaders] - the HTTP request headers
     * @property {HttpHeaders} [responseHeaders] - the HTTP response headers
     * @property {String} redirectUrl - new URL in onBeforeRedirect event
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
        const tab = { tabId: details.tabId };

        /**
         * FF sends http instead of ws protocol at the http-listeners layer
         * Although this is expected, as the Upgrade request is indeed an HTTP request,
         * we use a chromium based approach in this case.
         */
        if (details.type === 'websocket' && details.url.indexOf('http') === 0) {
            details.url = details.url.replace(/^http(s)?:/, 'ws$1:');
        }

        // https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
        const requestDetails = {
            requestUrl: details.url,    // request url
            tab,                        // request tab,
            requestId: details.requestId,
            statusCode: details.statusCode,
            method: details.method,
        };

        let frameId = 0;        // id of this frame (only for main_frame and sub_frame types)
        let requestFrameId = 0; // id of frame where request is executed
        let requestType;        // request type

        switch (details.type) {
            case 'main_frame':
                frameId = 0;
                requestType = adguard.RequestTypes.DOCUMENT;
                break;
            case 'sub_frame':
                frameId = details.frameId;
                // for sub_frame use parentFrameId as id of frame that wraps this frame
                requestFrameId = details.parentFrameId;
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
        requestDetails.originUrl = details.originUrl || details.initiator;

        return requestDetails;
    }

    const onBeforeRequest = {
        /**
         * Wrapper for webRequest.onBeforeRequest event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            // https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
            browser.webRequest.onBeforeRequest.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }

                const requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls } : {}, ['blocking']);
        },
    };

    /**
     * Apply 'extraHeaders' option for request/response headers access/change. See:
     * https://groups.google.com/a/chromium.org/forum/#!topic/chromium-extensions/vYIaeezZwfQ
     * https://chromium-review.googlesource.com/c/chromium/src/+/1338165
     */

    const onBeforeSendHeadersExtraInfoSpec = ['requestHeaders', 'blocking'];
    const onHeadersReceivedExtraInfoSpec = ['responseHeaders', 'blocking'];

    if (typeof browser.webRequest.OnBeforeSendHeadersOptions !== 'undefined'
        && browser.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
        onBeforeSendHeadersExtraInfoSpec.push('extraHeaders');
    }

    if (typeof browser.webRequest.OnHeadersReceivedOptions !== 'undefined'
        && browser.webRequest.OnHeadersReceivedOptions.hasOwnProperty('EXTRA_HEADERS')) {
        onHeadersReceivedExtraInfoSpec.push('extraHeaders');
    }

    const onHeadersReceived = {
        /**
         * Wrapper for webRequest.onHeadersReceived event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {Array.<String>} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            browser.webRequest.onHeadersReceived.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }

                const requestDetails = getRequestDetails(details);
                const result = callback(requestDetails);
                if (result) {
                    return 'responseHeaders' in result ? { responseHeaders: result.responseHeaders } : {};
                }
            }, urls ? { urls } : {}, onHeadersReceivedExtraInfoSpec);
        },
    };

    const onBeforeSendHeaders = {
        /**
         * Wrapper for webRequest.onBeforeSendHeaders event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {Array.<String>} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            let requestFilter = {};
            /**
             * Sometimes extraHeaders option of onBeforeSendHeaders handler is blocking network
             * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1634
             * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1644
             * https://bugs.chromium.org/p/chromium/issues/detail?id=938560
             * https://bugs.chromium.org/p/chromium/issues/detail?id=1075905
             * This issue was fixed in the Canary v85.0.4178.0 and would be fixed
             * in the Chrome with the same version
             * Until v85 we have decided to filter requests with types:
             * 'stylesheet', 'script', 'media'
             */
            if (adguard.prefs.browser === 'Chrome' && adguard.prefs.chromeVersion < 85) {
                const allTypes = [
                    'main_frame',
                    'sub_frame',
                    'stylesheet',
                    'script',
                    'image',
                    'font',
                    'object',
                    'xmlhttprequest',
                    'ping',
                    'csp_report',
                    'media',
                    'websocket',
                    'other',
                ];
                // this request types block requests, if use them with extraHeaders and blocking options
                const nonExtraHeadersTypes = ['stylesheet', 'script', 'media'];
                const extraHeadersTypes = allTypes.filter(type => !nonExtraHeadersTypes.includes(type));
                // Assign instead of spread used because FF begin to support them from v55
                // https://caniuse.com/#feat=mdn-javascript_operators_spread_spread_in_object_literals
                requestFilter = Object.assign(requestFilter, { types: extraHeadersTypes });
            }

            if (urls) {
                // Assign instead of spread used because FF begin to support them from v55
                // https://caniuse.com/#feat=mdn-javascript_operators_spread_spread_in_object_literals
                requestFilter = Object.assign(requestFilter, { urls });
            }

            browser.webRequest.onBeforeSendHeaders.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }

                const requestDetails = getRequestDetails(details);
                const result = callback(requestDetails);
                if (result) {
                    return 'requestHeaders' in result ? { requestHeaders: result.requestHeaders } : {};
                }
            }, requestFilter, onBeforeSendHeadersExtraInfoSpec);
        },
    };

    const onResponseStarted = {
        /**
         * Wrapper for webRequest.onResponseStarted event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            browser.webRequest.onResponseStarted.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }
                const requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls } : {}, ['responseHeaders']);
        },
    };

    const onErrorOccurred = {
        /**
         * Wrapper for webRequest.onErrorOccurred event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            browser.webRequest.onErrorOccurred.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }
                const requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls } : {});
        },
    };

    const onCompleted = {
        /**
         * Wrapper for webRequest.onCompleted event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {String} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            browser.webRequest.onCompleted.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }
                const requestDetails = getRequestDetails(details);
                return callback(requestDetails);
            }, urls ? { urls } : {}, ['responseHeaders']);
        },
    };

    const onBeforeRedirect = {
        /**
         * Wrapper for webRequest.onBeforeRedirect event
         * It prepares requestDetails and passes them to the callback
         * @param callback callback function receives {RequestDetails} and handles event
         * @param {Array.<String>} urls url match pattern https://developer.chrome.com/extensions/match_patterns
         */
        addListener(callback, urls) {
            browser.webRequest.onBeforeRedirect.addListener((details) => {
                if (shouldSkipRequest(details)) {
                    return;
                }
                const requestDetails = getRequestDetails(details);
                requestDetails.redirectUrl = details.redirectUrl;
                return callback(requestDetails);
            }, urls ? { urls } : {});
        },
    };

    /**
     * Gets URL of a file that belongs to our extension
     * https://developer.chrome.com/apps/runtime#method-getURL
     */
    adguard.getURL = browser.runtime.getURL;

    adguard.backgroundPage = {};
    adguard.backgroundPage.getWindow = function () {
        return browser.extension.getBackgroundPage();
    };

    adguard.app = {

        /**
         * Extension ID
         */
        getId() {
            return browser.runtime.id;
        },

        /**
         * Gets extension scheme
         * @returns "chrome-extension" for Chrome," ms-browser-extension" for Edge
         */
        getUrlScheme() {
            const url = adguard.getURL('test.html');
            const index = url.indexOf('://');
            return url.substring(0, index);
        },

        /**
         * Extension version
         */
        getVersion() {
            return browser.runtime.getManifest().version;
        },

        /**
         * Extension UI locale
         */
        getLocale() {
            return browser.i18n.getUILanguage();
        },

        /**
         * Returns extension's full url
         */
        getExtensionUrl() {
            const url = adguard.getURL('');
            return url.substring(0, url.length - 1);
        },

        /**
         * If referrer of request contains full url of extension,
         * then this request is considered as extension's own request
         * (e.g. request for filter downloading)
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1437
         * @param referrerUrl
         * @returns {boolean}
         */
        isOwnRequest(referrerUrl) {
            return referrerUrl && referrerUrl.indexOf(this.getExtensionUrl()) === 0;
        },
    };

    adguard.webRequest = {
        onBeforeRequest,
        handlerBehaviorChanged: browser.webRequest.handlerBehaviorChanged,
        onCompleted,
        onErrorOccurred,
        onHeadersReceived,
        onBeforeSendHeaders,
        onResponseStarted,
        onBeforeRedirect,
        webSocketSupported: typeof browser.webRequest.ResourceType !== 'undefined'
            && browser.webRequest.ResourceType.WEBSOCKET === 'websocket',
        filterResponseData: browser.webRequest.filterResponseData,
    };

    const onCreatedNavigationTarget = {

        addListener(callback) {
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation/onCreatedNavigationTarget#Browser_compatibility
            if (typeof browser.webNavigation.onCreatedNavigationTarget === 'undefined') {
                return;
            }

            browser.webNavigation.onCreatedNavigationTarget.addListener((details) => {
                if (details.tabId === adguard.BACKGROUND_TAB_ID) {
                    return;
                }

                callback({
                    tabId: details.tabId,
                    sourceTabId: details.sourceTabId,
                    url: details.url,
                });
            });
        },
    };

    const onCommitted = {
        /**
         * Wrapper for webNavigation.onCommitted event
         * It prepares webNavigation details and passes them to the callback
         * @param callback callback function receives object similar to {RequestDetails}
         * and handles event
         */
        addListener(callback) {
            // https://developer.chrome.com/extensions/webNavigation#event-onCommitted
            browser.webNavigation.onCommitted.addListener((details) => {
                // makes webNavigation.onCommitted details similar to webRequestDetails
                details.requestType = details.frameId === 0
                    ? adguard.RequestTypes.DOCUMENT
                    : adguard.RequestTypes.SUBDOCUMENT;
                details.tab = { tabId: details.tabId };
                details.requestUrl = details.url;
                callback(details);
            }, {
                url: [{
                    urlPrefix: 'http',
                }, {
                    urlPrefix: 'https',
                }],
            });
        },
    };

    // https://developer.chrome.com/extensions/webNavigation
    adguard.webNavigation = {
        onCreatedNavigationTarget,
        onCommitted,
        onDOMContentLoaded: browser.webNavigation.onDOMContentLoaded,
    };

    const browserActionSupported = typeof browser.browserAction.setIcon !== 'undefined';
    if (!browserActionSupported && browser.browserAction.onClicked) {
        // Open settings menu
        browser.browserAction.onClicked.addListener(() => {
            adguard.ui.openSettingsTab();
        });
    }

    adguard.browserAction = {
        /* eslint-disable-next-line no-unused-vars */
        setBrowserAction(tab, icon, badge, badgeColor, title) {
            if (!browserActionSupported) {
                return;
            }

            const { tabId } = tab;

            const onIconReady = function () {
                if (browser.runtime.lastError) {
                    return;
                }
                browser.browserAction.setBadgeText({ tabId, text: badge });

                if (browser.runtime.lastError) {
                    return;
                }
                if (badge) {
                    browser.browserAction.setBadgeBackgroundColor({ tabId, color: badgeColor });
                }

                // title setup via manifest.json file
                // chrome.browserAction.setTitle({tabId: tabId, title: title});
            };

            /**
             * Workaround for MS Edge.
             * For some reason Edge changes the inner state of the "icon"
             * object and adds a tabId property inside.
             */
            delete icon.tabId;

            if (browser.runtime.lastError) {
                return;
            }

            browser.browserAction.setIcon({ tabId, path: icon }, onIconReady);
        },
        setPopup() {
            // Do nothing. Popup is already installed in manifest file
        },
        resize() {
            // Do nothing
        },
        close() {
            // Do nothing
        },
    };

    adguard.contextMenus = browser.contextMenus;
})(adguard, browser);
