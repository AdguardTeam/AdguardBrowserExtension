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

/* global RequestTypes, framesMap, EventNotifier, EventNotifierTypes, UrlUtils */
/* global Prefs, Utils, antiBannerService, StringUtils */

(function () {

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

        if (requestType === RequestTypes.DOCUMENT || requestType === RequestTypes.SUBDOCUMENT) {
            framesMap.recordFrame(tab, requestDetails.frameId, requestUrl, requestType);
        }

        if (requestType === RequestTypes.DOCUMENT) {
            // Reset tab button state
            EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, true);
            return true;
        }

        if (!UrlUtils.isHttpRequest(requestUrl)) {
            return true;
        }

        var referrerUrl = framesMap.getFrameUrl(tab, requestDetails.requestFrameId);
        if (!referrerUrl) {
            // Assign to main frame
            referrerUrl = framesMap.getFrameUrl(tab, 0);
        }
        var requestRule = adguard.webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        adguard.webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);
        return !adguard.webRequestService.isRequestBlockedByRule(requestRule);
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
            var mainFrameUrl = framesMap.getFrameUrl(tab, 0);
            headers = Utils.setHeaderValue(headers, 'Referer', mainFrameUrl);
            return {
                requestHeaders: headers,
                modifiedHeaders: [{
                    name: 'Referer',
                    value: mainFrameUrl
                }]
            };
        }

        if (requestDetails.requestType === 'DOCUMENT') {
            // Save ref header
            var refHeader = Utils.findHeaderByName(headers, 'Referer');
            if (refHeader) {
                framesMap.recordFrameReferrerHeader(tab, refHeader.value);
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
        // Retrieve referrer
        var referrerUrl = framesMap.getFrameUrl(tab, requestDetails.requestFrameId);
        if (!referrerUrl) {
            referrerUrl = framesMap.getFrameUrl(tab, 0);
        }

        adguard.webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

        if (requestType == RequestTypes.DOCUMENT) {
            // Safebrowsing check
            filterSafebrowsing(tab, requestUrl);

            /*
             Websocket check.
             If 'ws://' request is blocked for not existing domain - it's blocked for all domains.
             Then we gonna limit frame sources to http to block src:'data/text' etc.
             More details in the issue:
             https://github.com/AdguardTeam/AdguardBrowserExtension/issues/344

             WS connections are detected as "other"  by ABP
             EasyList already contains some rules for WS connections with $other modifier
             */
            var websocketCheckUrl = "ws://adguardwebsocket.check/";
            if (adguard.webRequestService.checkWebSocketRequest(tab, websocketCheckUrl, referrerUrl)) {
                var cspHeader = {
                    name: 'Content-Security-Policy',
                    value: 'frame-src http: https:; child-src http: https:'
                };
                responseHeaders.push(cspHeader);
                return {
                    responseHeaders: responseHeaders,
                    modifiedHeaders: [cspHeader]
                };
            }
        }
    }

    /**
     * Safebrowsing check
     *
     * @param tab
     * @param mainFrameUrl
     */
    function filterSafebrowsing(tab, mainFrameUrl) {

        if (framesMap.isTabAdguardDetected(tab) || framesMap.isTabProtectionDisabled(tab) || framesMap.isTabWhiteListedForSafebrowsing(tab)) {
            return;
        }

        var referrerUrl = Utils.getSafebrowsingBackUrl(tab);
        var incognitoTab = framesMap.isIncognitoTab(tab);

        antiBannerService.getRequestFilter().checkSafebrowsingFilter(mainFrameUrl, referrerUrl, function (safebrowsingUrl) {
            // Chrome doesn't allow open extension url in incognito mode
            // So close current tab and open new
            if (incognitoTab && Utils.isChromium()) {
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
    if (Prefs.platform === "chromium") {

        /* global browser */
        browser.webRequest.onBeforeSendHeaders.addListener(function callback(details) {

            var authHeaders = adguard.integration.getAuthorizationHeaders();
            var headers = details.requestHeaders;
            for (var i = 0; i < authHeaders.length; i++) {
                headers = Utils.setHeaderValue(details.requestHeaders, authHeaders[i].headerName, authHeaders[i].headerValue);
            }

            return {requestHeaders: headers};

        }, {urls: [adguard.integration.getIntegrationBaseUrl() + "*"]}, ["requestHeaders", "blocking"]);
    }

    // TODO[Edge]: Add support for collecting hits stats. Currently we cannot add listener for ms-browser-extension:// urls.
    if (Prefs.platform === "chromium" && Prefs.getBrowser() !== "Edge") {
        var parseCssRuleFromUrl = function (requestUrl) {
            if (!requestUrl) {
                return null;
            }
            var filterIdAndRuleText = decodeURIComponent(StringUtils.substringAfter(requestUrl, '#'));
            var filterId = StringUtils.substringBefore(filterIdAndRuleText, ';');
            var ruleText = StringUtils.substringAfter(filterIdAndRuleText, ';');
            return {
                filterId: filterId,
                ruleText: ruleText
            };
        };

        var onCssRuleHit = function (requestDetails) {
            if (framesMap.isIncognitoTab(requestDetails.tab)) {
                return;
            }
            var domain = framesMap.getFrameDomain(requestDetails.tab);
            var rule = parseCssRuleFromUrl(requestDetails.requestUrl);
            if (rule) {
                adguard.hitStats.addRuleHit(domain, rule.ruleText, rule.filterId);
            }
        };

        var hitPngUrl = adguard.app.getUrlScheme() + "://*/elemhidehit.png";
        adguard.webRequest.onBeforeRequest.addListener(onCssRuleHit, [hitPngUrl]);
    }

    var handlerBehaviorTimeout = null;
    EventNotifier.addListener(function (event) {
        switch (event) {
            case EventNotifierTypes.ADD_RULE:
            case EventNotifierTypes.ADD_RULES:
            case EventNotifierTypes.REMOVE_RULE:
            case EventNotifierTypes.UPDATE_FILTER_RULES:
            case EventNotifierTypes.ENABLE_FILTER:
            case EventNotifierTypes.DISABLE_FILTER:
                if (handlerBehaviorTimeout !== null) {
                    clearTimeout(handlerBehaviorTimeout);
                }
                handlerBehaviorTimeout = setTimeout(function () {
                    handlerBehaviorTimeout = null;
                    adguard.webRequest.handlerBehaviorChanged();
                }, 3000);
        }
    });

})();
