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

    var CSP_HEADER_NAME = 'Content-Security-Policy';
    var DEFAULT_BLOCK_CSP_DIRECTIVE = 'connect-src http: https:; frame-src http: https:; child-src http: https:';

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
        var requestUrl = requestDetails.requestUrl;
        var requestType = requestDetails.requestType;

        if (requestType === adguard.RequestTypes.DOCUMENT || requestType === adguard.RequestTypes.SUBDOCUMENT) {
            adguard.frames.recordFrame(tab, requestDetails.frameId, requestUrl, requestType);
        }

        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // Reset tab button state
            adguard.listeners.notifyListeners(adguard.listeners.UPDATE_TAB_BUTTON_STATE, tab, true);
            return;
        }

        if (!adguard.utils.url.isHttpOrWsRequest(requestUrl)) {
            return;
        }

        var referrerUrl = getReferrerUrl(requestDetails);

        var requestRule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        adguard.webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);

        return adguard.webRequestService.getBlockedResponseByRule(requestRule);
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

        adguard.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        // Safebrowsing check
        if (requestType === adguard.RequestTypes.DOCUMENT) {
            filterSafebrowsing(tab, requestUrl);
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
         * Then we gonna limit frame sources to http to block src:'data/text' etc.
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
            rule = adguard.webRequestService.getRuleForRequest(tab, 'blob:adguardblob.check', frameUrl, adguard.RequestTypes.SCRIPT);
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
                value: DEFAULT_BLOCK_CSP_DIRECTIVE
            });
        }
        if (legacyCspRule) {
            adguard.webRequestService.recordRuleHit(tab, legacyCspRule, frameUrl);
            adguard.filteringLog.addEvent(tab, 'content-security-policy-check', frameUrl, adguard.RequestTypes.CSP, legacyCspRule);
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
                adguard.filteringLog.addEvent(tab, requestUrl, frameUrl, adguard.RequestTypes.CSP, rule);
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
            if (incognitoTab && adguard.utils.browser.isChromium()) {
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

            return {requestHeaders: headers};

        }, {urls: [adguard.integration.getIntegrationBaseUrl() + "*"]}, ["requestHeaders", "blocking"]);
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

    /**
     * When frame is committed we send to it js rules
     * We do this because we need to apply js rules as soon as possible
     */
    (function fastScriptRulesLoader(adguard) {

        var isEdgeBrowser = adguard.utils.browser.isEdgeBrowser();

        function tryInjectScripts(tabId, frameId, url, result, limit) {

            var options = null;
            if (!isEdgeBrowser) {
                /**
                 * In Edge browser: If we pass frameId in tabs.sendMessage then message aren't delivered to content-script
                 */
                options = {frameId: frameId};
            }

            adguard.tabs.sendMessage(tabId, result, function (response) {

                // Try again if no response was received from content-script
                if (adguard.runtime.lastError || !response) {

                    if (--limit <= 0) {
                        return;
                    }

                    setTimeout(function () {
                        tryInjectScripts(tabId, frameId, url, result, limit);
                    }, 10);
                }

            }, options);
        }

        adguard.webNavigation.onCommitted.addListener(function (tabId, frameId, url) {

            /**
             * Messaging a specific frame is not yet supported in Edge
             */
            if (frameId !== 0 && isEdgeBrowser) {
                return;
            }

            var result = adguard.webRequestService.processGetSelectorsAndScripts({tabId: tabId}, url, {filter: ['scripts']});
            if (!result.scripts || result.scripts.length === 0) {
                return;
            }

            result.type = 'injectScripts';
            tryInjectScripts(tabId, frameId, url, result, 5);
        });

    })(adguard);

})(adguard);
