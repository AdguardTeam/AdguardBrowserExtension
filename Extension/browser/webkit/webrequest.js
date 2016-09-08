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

/* global RequestTypes, framesMap, EventNotifier, EventNotifierTypes, UrlUtils, webRequestService */
/* global ext, Prefs, adguardApplication, Utils, antiBannerService, UI, StringUtils, filterRulesHitCount */

/**
 * Process request
 * @param requestDetails
 * @returns {boolean} False if request must be blocked
 */
function onBeforeRequest(requestDetails) {

    var tab = requestDetails.tab;
    var requestUrl = requestDetails.requestUrl;
    var requestType = requestDetails.requestType;

    if (requestType == RequestTypes.DOCUMENT || requestType == RequestTypes.SUBDOCUMENT) {
        framesMap.recordFrame(tab, requestDetails.frameId, requestUrl, requestType);
    }

    if (requestType == RequestTypes.DOCUMENT) {
        //reset tab button state
        EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_TAB_BUTTON_STATE, tab, true);
        return true;
    }

    if (!UrlUtils.isHttpRequest(requestUrl)) {
        return true;
    }

    var referrerUrl = framesMap.getFrameUrl(tab, requestDetails.requestFrameId);
    var requestRule = webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
    webRequestService.postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);
    return !webRequestService.isRequestBlockedByRule(requestRule);
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

    if (adguardApplication.shouldOverrideReferrer(tab)) {
        // Retrieve main frame url
        var mainFrameUrl = framesMap.getFrameUrl(tab, 0);
        headers = Utils.setHeaderValue(headers, 'Referer', mainFrameUrl);
        return {requestHeaders: headers};
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

function headerIndexFromName(headerName, headers) {
    var i = headers.length;
    while (i--) {
        if (headers[i].name.toLowerCase() === headerName) {
            return i;
        }
    }
    return -1;
}

function foilWithCSP(headers, blockWebSockets) {
    var i = headerIndexFromName('content-security-policy', headers),
        before = i === -1 ? '' : headers[i].value.trim(),
        after = before;

    if (blockWebSockets) {
        after = foilWithCSPDirective(
            after,
            /connect-src[^;]*;?\s*/,
            'connect-src http:',
            /wss?:[^\s]*\s*/g
        );
    }

    /*
     https://bugs.chromium.org/p/chromium/issues/detail?id=513860
     Bad Chromium bug: web pages can work around CSP directives by
     creating data:- or blob:-based URI. So if we must restrict using CSP,
     we have no choice but to also prevent the creation of nested browsing
     contexts based on data:- or blob:-based URIs.
     */
    if (Prefs.platform === "chromium" && blockWebSockets) {
        // https://w3c.github.io/webappsec-csp/#directive-frame-src
        after = foilWithCSPDirective(
            after,
            /frame-src[^;]*;?\s*/,
            'frame-src http:',
            /data:[^\s]*\s*|blob:[^\s]*\s*/g
        );
    }

    var changed = after !== before;
    if (changed) {
        if (i !== -1) {
            headers.splice(i, 1);
        }
        headers.push({name: 'Content-Security-Policy', value: after});
    }

    return changed;
}

// https://w3c.github.io/webappsec-csp/#directives-reporting
var reReportDirective = /report-(?:to|uri)[^;]*;?\s*/;
var reEmptyDirective = /^([a-z-]+)\s*;/;

var foilWithCSPDirective = function (csp, toExtract, toAdd, toRemove) {
    // Set
    if (csp === '') {
        return toAdd;
    }

    var matches = toExtract.exec(csp);

    // Add
    if (matches === null) {
        if (csp.slice(-1) !== ';') {
            csp += ';';
        }
        csp += ' ' + toAdd;
        return csp.replace(reReportDirective, '');
    }

    var directive = matches[0];

    // No change
    if (toRemove.test(directive) === false) {
        return csp;
    }

    // Remove
    csp = csp.replace(toExtract, '').trim();
    if (csp.slice(-1) !== ';') {
        csp += ';';
    }
    directive = directive.replace(toRemove, '').trim();

    // Check for empty directive after removal
    matches = reEmptyDirective.exec(directive);
    if (matches) {
        directive = matches[1] + " 'none';";
    }

    csp += ' ' + directive;
    return csp.replace(reReportDirective, '');
};

function onHeadersReceived(requestDetails) {

    var tab = requestDetails.tab;
    var requestUrl = requestDetails.requestUrl;
    var responseHeaders = requestDetails.responseHeaders;
    var requestType = requestDetails.requestType;
    //retrieve referrer
    var referrerUrl = framesMap.getFrameUrl(tab, requestDetails.requestFrameId);

    webRequestService.processRequestResponse(tab, requestUrl, referrerUrl, requestType, responseHeaders);

    if (requestType == RequestTypes.DOCUMENT) {
        //safebrowsing check
        filterSafebrowsing(tab, requestUrl);

        /*
         Websocket check
         https://github.com/AdguardTeam/AdguardBrowserExtension/issues/344

         WS connections are detected as "other"  by ABP
         EasyList already contains some rules for WS connections with $other modifier
         */
        var rule = webRequestService.getRuleForRequest(tab, requestUrl, referrerUrl, RequestTypes.OTHER);
        if (webRequestService.isRequestBlockedByRule(rule)) {
            if (foilWithCSP(responseHeaders, true)) {
                return { responseHeaders: responseHeaders };
            }
        }
    }
}

function filterSafebrowsing(tab, mainFrameUrl) {

    if (framesMap.isTabAdguardDetected(tab) || framesMap.isTabProtectionDisabled(tab) || framesMap.isTabWhiteListedForSafebrowsing(tab)) {
        return;
    }

    var frameData = framesMap.getMainFrame(tab);
    var referrerUrl = Utils.getSafebrowsingBackUrl(frameData);
    var incognitoTab = framesMap.isIncognitoTab(tab);

    antiBannerService.getRequestFilter().checkSafebrowsingFilter(mainFrameUrl, referrerUrl, function (safebrowsingUrl) {
        // Chrome doesn't allow open extension url in incognito mode
        // So close current tab and open new
        if (incognitoTab && !Utils.isSafariBrowser()) {
            UI.openTab(safebrowsingUrl, {
                onOpen: function () {
                    tab.close();
                }
            });
        } else {
            tab.reload(safebrowsingUrl);
        }
    }, incognitoTab);
}

ext.webRequest.onBeforeRequest.addListener(onBeforeRequest, ["<all_urls>"]);

ext.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, ["<all_urls>"]);

ext.webRequest.onHeadersReceived.addListener(onHeadersReceived, ["<all_urls>"]);

// AG for Windows and Mac checks either request signature or request Referer to authorize request.
// Referer cannot be forged by the website so it's ok for add-on authorization.
if (Prefs.platform === "chromium") {

    /* global browser */
    browser.webRequest.onBeforeSendHeaders.addListener(function callback(details) {

        var authHeaders = adguardApplication.getAuthorizationHeaders();
        var headers = details.requestHeaders;
        for (var i = 0; i < authHeaders.length; i++) {
            headers = Utils.setHeaderValue(details.requestHeaders, authHeaders[i].headerName, authHeaders[i].headerValue);
        }

        return {requestHeaders: headers};

    }, {urls: [adguardApplication.getIntegrationBaseUrl() + "*"]}, ["requestHeaders", "blocking"]);
}

// TODO[Edge]: Add support for collecting hits statis. Currently we cannot add listener for ms-browser-extension:// urls.
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
            filterRulesHitCount.addRuleHit(domain, rule.ruleText, rule.filterId);
        }
    };

    var hitPngUrl = ext.app.getUrlScheme() + "://*/elemhidehit.png";
    ext.webRequest.onBeforeRequest.addListener(onCssRuleHit, [hitPngUrl]);
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
                ext.webRequest.handlerBehaviorChanged();
            }, 3000);
    }
});