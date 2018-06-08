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

    const CSP_HEADER_NAME = 'Content-Security-Policy';

    /**
     * In the case of the tabs.insertCSS API support we're trying to collapse a blocked element from the background page.
     * In order to do it we need to have a mapping requestType<->tagNames.
     */
    const REQUEST_TYPE_COLLAPSE_TAG_NAMES = {
        [adguard.RequestTypes.SUBDOCUMENT]: ["frame", "iframe"],
        [adguard.RequestTypes.IMAGE]: ["img"]
    };

    /**
     * In the newer versions of Firefox and Chromium we're able to inject CSS and scripts
     * using a better approach -- `browser.tabs.insertCSS` and `browser.tabs.executeScript`
     * instead of the traditional one (messaging to the content script).
     */
    const shouldUseInsertCSSAndExecuteScript = adguard.prefs.features.canUseInsertCSSAndExecuteScript;

    /**
     * Retrieve referrer url from request details.
     * Extract referrer by priority:
     * 1. referrerUrl in requestDetails
     * 2. url of frame where request was created
     * 3. url of main frame
     *
     * @param requestDetails
     * @returns {*|Frame}
     */
    function getReferrerUrl(requestDetails) {
        return requestDetails.referrerUrl ||
            adguard.frames.getFrameUrl(requestDetails.tab, requestDetails.requestFrameId) ||
            adguard.frames.getMainFrameUrl(requestDetails.tab);
    }

    /**
     * Process request
     *
     * @param requestDetails
     * @returns {boolean} False if request must be blocked
     */
    function onBeforeRequest(requestDetails) {
        var tab = requestDetails.tab;
        var tabId = tab.tabId;
        var requestId = requestDetails.requestId;
        var requestUrl = requestDetails.requestUrl;
        var requestType = requestDetails.requestType;
        var frameId = requestDetails.frameId;
        var requestFrameId = requestDetails.requestFrameId || 0;

        if (requestType === adguard.RequestTypes.DOCUMENT || requestType === adguard.RequestTypes.SUBDOCUMENT) {
            adguard.frames.recordFrame(tab, frameId, requestUrl, requestType);
        }

        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // New document is being loaded -- clear the filtering log for that tab
            adguard.filteringLog.clearEventsByTabId(tabId);

            // Reset tab button state
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_TAB_BUTTON_STATE, tab, true);

            /**
             * In the case of the "about:newtab" pages we don't receive onResponseReceived event for the main_frame, so we have to append log event here.
             * Also if chrome://newtab is overwritten, we won't receive any webRequest events for the main_frame
             * Unfortunately, we can't do anything in this case and just must remember about it
             */
            var tabRequestRule = adguard.frames.getFrameWhiteListRule(tab);
            adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, requestUrl, requestType, tabRequestRule, requestId);

            return;
        }

        if (!adguard.utils.url.isHttpOrWsRequest(requestUrl)) {
            // Do not mess with other extensions
            return;
        }

        var referrerUrl = getReferrerUrl(requestDetails);
        var requestRule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);

        adguard.webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule, requestId);
        var response = adguard.webRequestService.getBlockedResponseByRule(requestRule, requestType);

        if (response && response.cancel) {
            collapseElement(tabId, requestFrameId, requestUrl, referrerUrl, requestType);
        }

        return response;
    }

    /**
     * Tries to collapse a blocked element using tabs.insertCSS.
     * 
     * This method of collapsing has numerous advantages over the traditional one.
     * First of all, it prevents blocked elements flickering as it occurs earlier.
     * Second, it is harder to detect as there's no custom <style> node required.
     * 
     * However, we're still keeping the old approach intact - we have not enough information 
     * here to properly collapse elements that use relative URLs (<img src='../path_to_element'>).
     * 
     * @param {number} tabId Tab id
     * @param {number} requestFrameId Id of a frame request was sent from
     * @param {string} requestUrl Request URL
     * @param {string} referrerUrl Referrer URL
     * @param {string} requestType A member of adguard.RequestTypes
     */
    function collapseElement(tabId, requestFrameId, requestUrl, referrerUrl, requestType) {
        if (!shouldUseInsertCSSAndExecuteScript) {
            return;
        }

        let tagNames = REQUEST_TYPE_COLLAPSE_TAG_NAMES[requestType];
        if (!tagNames) {
            // Collapsing is not supported for this request type
            return;
        }

        // Collapsing is not supported for the requests which happen out of the tabs, e.g. other extensions
        if (tabId === -1) {
            return;
        }

        // Strip the protocol and host name (for first-party requests) from the selector
        let thirdParty = adguard.utils.url.isThirdPartyRequest(requestUrl, referrerUrl);
        let srcUrlStartIndex = requestUrl.indexOf("//");
        if (!thirdParty) {
            srcUrlStartIndex = requestUrl.indexOf("/", srcUrlStartIndex + 2);
        }
        let srcUrl = requestUrl.substring(srcUrlStartIndex);

        const collapseStyle = "{ display: none!important; visibility: hidden!important; height: 0px!important; min-height: 0px!important; }";
        let css = "";
        let iTagNames = tagNames.length;

        while (iTagNames--) {
            css += tagNames[iTagNames] + "[src$=\"" + srcUrl + "\"] " + collapseStyle + "\n";
        }

        adguard.tabs.insertCssCode(tabId, requestFrameId, css);
    }

    /**
     * Called before request is sent to the remote endpoint.
     * This method is used to modify request in case of working in integration mode
     * and also to record referrer header in frame data.
     *
     * @param requestDetails Request details
     * @returns {*} headers to send
     */
    function onBeforeSendHeaders(requestDetails) {

        var tab = requestDetails.tab;
        var headers = requestDetails.requestHeaders;

        if (adguard.integration.shouldOverrideReferrer(tab)) {
            // Retrieve main frame url
            var mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
            headers = adguard.utils.browser.setHeaderValue(headers, 'Referer', mainFrameUrl);
            return {
                requestHeaders: headers,
                modifiedHeaders: [{
                    name: 'Referer',
                    value: mainFrameUrl
                }]
            };
        }

        if (requestDetails.requestType === adguard.RequestTypes.DOCUMENT) {
            // Save ref header
            var refHeader = adguard.utils.browser.findHeaderByName(headers, 'Referer');
            if (refHeader) {
                adguard.frames.recordFrameReferrerHeader(tab, refHeader.value);
            }
        }

        return {};
    }

    /**
     * On headers received callback function.
     * We do check request for safebrowsing
     * and check if websocket connections should be blocked.
     *
     * @param requestDetails Request details
     * @returns {{responseHeaders: *}} Headers to send
     */
    function onHeadersReceived(requestDetails) {

        var tab = requestDetails.tab;
        var requestUrl = requestDetails.requestUrl;
        var responseHeaders = requestDetails.responseHeaders;
        var requestType = requestDetails.requestType;
        var referrerUrl = getReferrerUrl(requestDetails);
        var requestId = requestDetails.requestId;
        var statusCode = requestDetails.statusCode;
        var method = requestDetails.method;

        adguard.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders, requestId);

        // Safebrowsing check
        if (requestType === adguard.RequestTypes.DOCUMENT &&
            // Don't apply safebrowsing filter in case of redirect
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/995
            statusCode !== 301 && statusCode !== 302) {
            filterSafebrowsing(tab, requestUrl);
        }

        if (adguard.contentFiltering) {
            var contentType = adguard.utils.browser.getHeaderValueByName(responseHeaders, 'content-type');
            adguard.contentFiltering.apply(tab, requestUrl, referrerUrl, requestType, requestId, statusCode, method, contentType);
        }

        if (requestType === adguard.RequestTypes.DOCUMENT || requestType === adguard.RequestTypes.SUBDOCUMENT) {
            return modifyCSPHeader(requestDetails);
        }
    }

    /**
     * Before the introduction of $CSP rules, we used another approach for modifying Content-Security-Policy header.
     * We are looking for URL blocking rule that matches some request type and protocol (ws:, blob:, stun:)
     *
     * @param tab Tab
     * @param frameUrl Frame URL
     * @returns matching rule
     */
    function findLegacyCspRule(tab, frameUrl) {

        var rule = null;
        var applyCSP = false;

        /**
         * Websocket check.
         * If 'ws://' request is blocked for not existing domain - it's blocked for all domains.
         * More details in these issue:
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/344
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/440
         */

        // And we don't need this check on newer than 58 chromes anymore
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/572
        if (!adguard.webRequest.webSocketSupported) {
            rule = adguard.webRequestService.getRuleForRequest(tab, 'ws://adguardwebsocket.check', frameUrl, adguard.RequestTypes.WEBSOCKET);
            applyCSP = adguard.webRequestService.isRequestBlockedByRule(rule);
        }
        if (!applyCSP) {
            rule = adguard.webRequestService.getRuleForRequest(tab, 'stun:adguardwebrtc.check', frameUrl, adguard.RequestTypes.WEBRTC);
        }

        return rule;
    }

    /**
     * Modify CSP header to block WebSocket, prohibit data: and blob: frames and WebWorkers
     * @param requestDetails
     * @returns {{responseHeaders: *}}
     */
    function modifyCSPHeader(requestDetails) {

        // Please note, that we do not modify response headers in Edge before Creators update:
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/401
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8796739/
        if (adguard.utils.browser.isEdgeBeforeCreatorsUpdate()) {
            return;
        }

        var tab = requestDetails.tab;
        var requestUrl = requestDetails.requestUrl;
        var responseHeaders = requestDetails.responseHeaders || [];
        var requestType = requestDetails.requestType;
        var frameUrl = adguard.frames.getFrameUrl(tab, requestDetails.frameId);

        var cspHeaders = [];

        var legacyCspRule = findLegacyCspRule(tab, frameUrl);
        if (adguard.webRequestService.isRequestBlockedByRule(legacyCspRule)) {
            cspHeaders.push({
                name: CSP_HEADER_NAME,
                value: adguard.rules.CspFilter.DEFAULT_DIRECTIVE
            });
        }
        if (legacyCspRule) {
            adguard.webRequestService.recordRuleHit(tab, legacyCspRule, frameUrl);
            adguard.filteringLog.addHttpRequestEvent(tab, 'content-security-policy-check', frameUrl, adguard.RequestTypes.CSP, legacyCspRule);
        }

        /**
         * Retrieve $CSP rules specific for the request
         * https://github.com/adguardteam/adguardbrowserextension/issues/685
         */
        var cspRules = adguard.webRequestService.getCspRules(tab, requestUrl, frameUrl, requestType);
        if (cspRules) {
            for (var i = 0; i < cspRules.length; i++) {
                var rule = cspRules[i];
                // Don't forget: getCspRules returns all $csp rules, we must directly check that the rule is blocking.
                if (adguard.webRequestService.isRequestBlockedByRule(rule)) {
                    cspHeaders.push({
                        name: CSP_HEADER_NAME,
                        value: rule.cspDirective
                    });
                }
                adguard.webRequestService.recordRuleHit(tab, rule, requestUrl);
                adguard.filteringLog.addHttpRequestEvent(tab, requestUrl, frameUrl, adguard.RequestTypes.CSP, rule);
            }
        }

        /**
         * Websocket connection is blocked by connect-src directive
         * https://www.w3.org/TR/CSP2/#directive-connect-src
         *
         * Web Workers is blocked by child-src directive
         * https://www.w3.org/TR/CSP2/#directive-child-src
         * https://www.w3.org/TR/CSP3/#directive-worker-src
         * We have to use child-src as fallback for worker-src, because it isn't supported
         * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src#Browser_compatibility
         *
         * We also need the frame-src restriction since CSPs are not inherited from the parent for documents with data: and blob: URLs
         * https://bugs.chromium.org/p/chromium/issues/detail?id=513860
         */
        if (cspHeaders.length > 0) {
            responseHeaders = responseHeaders.concat(cspHeaders);
            return {
                responseHeaders: responseHeaders,
                modifiedHeaders: cspHeaders
            };
        }
    }

    /**
     * Safebrowsing check
     *
     * @param tab
     * @param mainFrameUrl
     */
    function filterSafebrowsing(tab, mainFrameUrl) {

        if (adguard.frames.isTabAdguardDetected(tab) ||
            adguard.frames.isTabProtectionDisabled(tab) ||
            adguard.frames.isTabWhiteListedForSafebrowsing(tab)) {
            return;
        }

        var referrerUrl = adguard.utils.browser.getSafebrowsingBackUrl(tab);
        var incognitoTab = adguard.frames.isIncognitoTab(tab);

        adguard.safebrowsing.checkSafebrowsingFilter(mainFrameUrl, referrerUrl, function (safebrowsingUrl) {
            // Chrome doesn't allow open extension url in incognito mode
            // So close current tab and open new
            if (adguard.utils.browser.isChromium() && incognitoTab) {
                // Closing tab before opening a new one may lead to browser crash (Chromium)
                adguard.ui.openTab(safebrowsingUrl, {}, function () {
                    adguard.tabs.remove(tab.tabId);
                });
            } else {
                adguard.tabs.reload(tab.tabId, safebrowsingUrl);
            }
        }, incognitoTab);
    }

    /**
     * Add listeners described above.
     */
    adguard.webRequest.onBeforeRequest.addListener(onBeforeRequest, ["<all_urls>"]);
    adguard.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, ["<all_urls>"]);
    adguard.webRequest.onHeadersReceived.addListener(onHeadersReceived, ["<all_urls>"]);

    // AG for Windows and Mac checks either request signature or request Referer to authorize request.
    // Referer cannot be forged by the website so it's ok for add-on authorization.
    if (adguard.integration.isSupported() && adguard.utils.browser.isChromium()) {

        /* global browser */
        browser.webRequest.onBeforeSendHeaders.addListener(function callback(details) {

            var authHeaders = adguard.integration.getAuthorizationHeaders();
            var headers = details.requestHeaders;
            for (var i = 0; i < authHeaders.length; i++) {
                headers = adguard.utils.browser.setHeaderValue(details.requestHeaders, authHeaders[i].headerName, authHeaders[i].headerValue);
            }

            return { requestHeaders: headers };

        }, { urls: [adguard.integration.getIntegrationBaseUrl() + "*"] }, ["requestHeaders", "blocking"]);
    }

    var handlerBehaviorTimeout = null;
    adguard.listeners.addListener(function (event) {
        switch (event) {
            case adguard.listeners.ADD_RULES:
            case adguard.listeners.REMOVE_RULE:
            case adguard.listeners.UPDATE_FILTER_RULES:
            case adguard.listeners.UPDATE_WHITELIST_FILTER_RULES:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                if (handlerBehaviorTimeout !== null) {
                    clearTimeout(handlerBehaviorTimeout);
                }
                handlerBehaviorTimeout = setTimeout(function () {
                    handlerBehaviorTimeout = null;
                    adguard.webRequest.handlerBehaviorChanged();
                }, 3000);
        }
    });

    if (shouldUseInsertCSSAndExecuteScript) {

        /**
         * Applying CSS/JS rules from the background page.
         * This function implements the algorithm suggested here: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1029
         * For faster script injection, we prepare scriptText onResponseStarted event, save it and try to inject twice
         * 1. onResponseStarted - this event fires early, but is not reliable
         * 2. onCommited - this event fires on when part of document has been received, this event is reliable
         * Every time we try to inject script we check if script wasn't yet executed
         * We use browser.tabs.insertCSS and browser.tabs.executeScript functions to inject our CSS/JS rules.
         * This method can be used in modern Chrome and FF only.
         */
        (function (adguard) {
            /**
             * Object used for keeping js and css code when onBeforeRequest event fired
             */
            let cssJsForTabs = {
                createKey: function (tabId, frameId) {
                    return tabId + '-' + frameId;
                },

                set: function (tabId, frameId, scripts) {
                    this[this.createKey(tabId, frameId)] = scripts;
                },

                get: function (tabId, frameId) {
                    return this[this.createKey(tabId, frameId)];
                },

                remove: function (tabId, frameId) {
                    delete this[this.createKey(tabId, frameId)];
                },
            };
            /**
             * Taken from
             * {@link https://github.com/seanl-adg/InlineResourceLiteral/blob/master/index.js#L136}
             * {@link https://github.com/joliss/js-string-escape/blob/master/index.js}
             */
            const reJsEscape = /["'\\\n\r\u2028\u2029]/g;
            function escapeJs(match) {
                switch (match) {
                    case '"':
                    case "'":
                    case '\\':
                        return '\\' + match;
                    case '\n':
                        return '\\n\\\n' // Line continuation character for ease
                    // of reading inlined resource.
                    case '\r':
                        return ''        // Carriage returns won't have
                    // any semantic meaning in JS
                    case '\u2028':
                        return '\\u2028'
                    case '\u2029':
                        return '\\u2029'
                }
            }

            function buildScriptText(scriptText) {
                if (!scriptText) {
                    return null;
                }

                /**
                 * Executes scripts in a scope of the page.
                 * In order to prevent multiple script execution checks if script was already executed
                 * Sometimes in Firefox when content-filtering is applied to the page race condition happens.
                 * This causes an issue when the page doesn't have its document.head or document.documentElement at the moment of
                 * injection. So script waits for them. But if a quantity of frame-requests reaches FRAME_REQUESTS_LIMIT then
                 * script stops waiting with the error.
                 * Description of the issue: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1004
                 */
                let injectedScript = '(function() {\
                    if (window.scriptExecuted) {\
                        return;\
                    }\
                    var script = document.createElement("script");\
                    script.setAttribute("type", "text/javascript");\
                    script.textContent = "' + scriptText.replace(reJsEscape, escapeJs) + '";\
                    var FRAME_REQUESTS_LIMIT = 500;\
                    var frameRequests = 0;\
                    function waitParent () {\
                        frameRequests += 1;\
                        var parent = document.head || document.documentElement;\
                        if (parent) {\
                            try {\
                                parent.appendChild(script);\
                                parent.removeChild(script);\
                                window.scriptExecuted = true;\
                            } catch (e) {\
                            } finally {\
                                return true;\
                            }\
                        }\
                        if(frameRequests < FRAME_REQUESTS_LIMIT) {\
                            requestAnimationFrame(waitParent);\
                        } else {\
                            console.log("AdGuard: document.head or document.documentElement were unavailable too long");\
                        }\
                    }\
                    waitParent();\
                })()';

                return injectedScript;
            }

            /**
             * @param {SelectorsData} selectorsData Selectors data
             * @returns {string} CSS to be supplied to insertCSS or null if selectors data is empty
             */
            function buildCssText(selectorsData) {
                if (!selectorsData || !selectorsData.css) {
                    return null;
                }
                return selectorsData.css.join('\n');
            }

            const REQUEST_FILTER_READY_TIMEOUT = 100;
            function prepareScripts(details) {
                let tab = details.tab;
                let tabId = tab.tabId;
                let frameId = details.frameId;
                let url = details.requestUrl;

                let cssFilterOption = adguard.rules.CssFilter.RETRIEVE_TRADITIONAL_CSS;
                const retrieveScripts = true;
                let result = adguard.webRequestService.processGetSelectorsAndScripts({ tabId: tabId }, url, cssFilterOption, retrieveScripts);

                if (result.requestFilterReady === false) {
                    setTimeout(prepareScripts, REQUEST_FILTER_READY_TIMEOUT, details);
                    return;
                }

                cssJsForTabs.set(tabId, frameId, {
                    jsScriptText: buildScriptText(result.scripts),
                    cssText: buildCssText(result.selectors),
                });
            }

            /**
             * Injects js code in the page on responseStarted event only if event was fired from main_frame
             * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1029
             * @param {*} details Details about the webrequest event
             */
            function tryInjectOnResponseStarted(details) {
                if (details.requestType !== adguard.RequestTypes.DOCUMENT) {
                    return;
                }
                var frameId = details.frameId;
                var tab = details.tab;
                var tabId = tab.tabId;
                var scriptTexts = cssJsForTabs.get(tabId, frameId);
                if (scriptTexts && scriptTexts.jsScriptText) {
                    adguard.tabs.executeScriptCode(tabId, frameId, scriptTexts.jsScriptText);
                }
            }

            /**
             * Injects necessary CSS and scripts into the web page.
             *
             * @param {*} details Details about the navigation event:
             * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation/onCommitted#details
             */
            function tryInjectOnCommitted(details) {
                let tabId = details.tabId;
                let frameId = details.frameId;
                const scriptTexts = cssJsForTabs.get(tabId, frameId);
                if (!scriptTexts) {
                    setTimeout(tryInjectOnCommitted, REQUEST_FILTER_READY_TIMEOUT, details);
                    return;
                }
                if (scriptTexts.jsScriptText) {
                    adguard.tabs.executeScriptCode(tabId, frameId, scriptTexts.jsScriptText);
                }
                if (scriptTexts.cssText) {
                    adguard.tabs.insertCssCode(tabId, frameId, scriptTexts.cssText);
                }
                cssJsForTabs.remove(tabId, frameId);
            }

            adguard.webNavigation.onCommitted.addListener(tryInjectOnCommitted);
            adguard.webRequest.onBeforeRequest.addListener(prepareScripts, ['<all_urls>']);
            adguard.webRequest.onResponseStarted.addListener(tryInjectOnResponseStarted, ['<all_urls>']);
        })(adguard);
    }
})(adguard);
