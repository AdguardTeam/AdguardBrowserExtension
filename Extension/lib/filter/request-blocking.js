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

/* global Prefs, framesMap, antiBannerService, filteringLog, adguardApplication, filterRulesHitCount,
 ServiceClient, RequestTypes, EventNotifier, EventNotifierTypes, FilterUtils, Utils */

var webRequestService = (function () { // jshint ignore:line

    /**
     * Prepares CSS and JS which should be injected to the page.
     *
     * @param tab           Tab
     * @param documentUrl   Document URL
     * @param genericHide   flag to hide common rules
     * @returns {*}         null or object the following properties: "selectors", "scripts", "collapseAllElements"
     */
    var processGetSelectorsAndScripts = function (tab, documentUrl, genericHide) {

        var result = {};

        if (!tab) {
            return result;
        }

        if (!antiBannerService.isRequestFilterReady()) {
            return {
                requestFilterReady: false
            };
        }

        if (framesMap.isTabAdguardDetected(tab) || framesMap.isTabProtectionDisabled(tab) || framesMap.isTabWhiteListed(tab)) {
            return result;
        }

        result = {
            selectors: {
                css: null,
                extendedCss: null
            },
            scripts: null,
            collapseAllElements: antiBannerService.shouldCollapseAllElements(),
            useShadowDom: Utils.isShadowDomSupported()
        };

        var whitelistRule = framesMap.getFrameWhiteListRule(tab);
        var genericHideFlag = genericHide || (whitelistRule && whitelistRule.checkContentType("GENERICHIDE"));
        var elemHideFlag = whitelistRule && whitelistRule.checkContentType("ELEMHIDE");
        if (!elemHideFlag) {
            if (shouldLoadAllSelectors(result.collapseAllElements)) {
                result.selectors = antiBannerService.getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
            } else {
                result.selectors = antiBannerService.getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
            }
        }

        var jsInjectFlag = whitelistRule && whitelistRule.checkContentType("JSINJECT");
        if (!jsInjectFlag) {
            result.scripts = antiBannerService.getRequestFilter().getScriptsForUrl(documentUrl);
        }

        return result;
    };

    /**
     * Checks if websocket request is blocked
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @returns {boolean}   true if request is blocked
     */
    var checkWebSocketRequest = function (tab, requestUrl, referrerUrl) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, RequestTypes.WEBSOCKET);
        filteringLog.addEvent(tab, requestUrl, referrerUrl, RequestTypes.WEBSOCKET, requestRule);

        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if request is blocked
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {boolean}   true if request is blocked
     */
    var processShouldCollapse = function (tab, requestUrl, referrerUrl, requestType) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        return isRequestBlockedByRule(requestRule);
    };

    /**
     * Checks if requests are blocked
     *
     * @param tab               Tab
     * @param referrerUrl       referrer url
     * @param collapseRequests  requests array
     * @returns {*}             requests array
     */
    var processShouldCollapseMany = function (tab, referrerUrl, collapseRequests) {

        if (!tab) {
            return collapseRequests;
        }

        for (var i = 0; i < collapseRequests.length; i++) {
            var request = collapseRequests[i];
            var requestRule = getRuleForRequest(tab, request.elementUrl, referrerUrl, request.requestType);
            request.collapse = isRequestBlockedByRule(requestRule);
        }

        return collapseRequests;
    };

    /**
     * Checks if request is blocked by rule
     *
     * @param requestRule
     * @returns {*|boolean}
     */
    var isRequestBlockedByRule = function (requestRule) {
        return requestRule && !requestRule.whiteListRule;
    };

    /**
     * Finds rule for request
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @returns {*}         rule or null
     */
    var getRuleForRequest = function (tab, requestUrl, referrerUrl, requestType) {

        if (framesMap.isTabAdguardDetected(tab) || framesMap.isTabProtectionDisabled(tab)) {
            //don't process request
            return null;
        }

        var whitelistRule = framesMap.getFrameWhiteListRule(tab);
        if (whitelistRule && whitelistRule.checkContentTypeIncluded("DOCUMENT")) {
            // Frame is whitelisted by $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        }

        return antiBannerService.getRequestFilter().findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Processes HTTP response.
     * It could do the following:
     * 1. Detect desktop AG and switch to integration mode
     * 2. Add event to filtering log (for DOCUMENT requests)
     * 3. Record page stats (if it's enabled)
     *
     * @param tab Tab object
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param requestType Request type
     * @param responseHeaders Response headers
     */
    var processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {

        if (requestType == RequestTypes.DOCUMENT) {
            // Check headers to detect Adguard application

            if (Prefs.getBrowser() != "Edge") {
                // TODO[Edge]: Integration mode is not fully functional in Edge (cannot redefine Referer header yet)
                adguardApplication.checkHeaders(tab, responseHeaders, requestUrl);
            }
            // Clear previous events
            filteringLog.clearEventsForTab(tab);
        }

        var requestRule = null;
        var appendLogEvent = false;

        if (framesMap.isTabAdguardDetected(tab)) {
            //parse rule applied to request from response headers
            requestRule = adguardApplication.parseAdguardRuleFromHeaders(responseHeaders);
            appendLogEvent = !ServiceClient.isAdguardAppRequest(requestUrl);
        } else if (framesMap.isTabProtectionDisabled(tab)) { // jshint ignore:line
            //do nothing
        } else if (requestType == RequestTypes.DOCUMENT) {
            requestRule = framesMap.getFrameWhiteListRule(tab);
            var domain = framesMap.getFrameDomain(tab);
            if (!framesMap.isIncognitoTab(tab)) {
                //add page view to stats
                filterRulesHitCount.addDomainView(domain);
            }
            appendLogEvent = true;
        }

        // add event to filtering log
        if (appendLogEvent) {
            filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);
        }
    };

    /**
     * Request post processing, firing events, add log records etc.
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   one of RequestType
     * @param requestRule   rule
     */
    var postProcessRequest = function (tab, requestUrl, referrerUrl, requestType, requestRule) {

        if (framesMap.isTabAdguardDetected(tab)) {
            //do nothing, log event will be added on response
            return;
        }

        if (isRequestBlockedByRule(requestRule)) {
            EventNotifier.notifyListenersAsync(EventNotifierTypes.ADS_BLOCKED, requestRule, tab, 1);
        }

        filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

        if (requestRule && !FilterUtils.isUserFilterRule(requestRule) && !FilterUtils.isWhiteListFilterRule(requestRule) && !framesMap.isIncognitoTab(tab)) {

            var domain = framesMap.getFrameDomain(tab);
            filterRulesHitCount.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
        }
    };

    var shouldLoadAllSelectors = function (collapseAllElements) {
        if ((Utils.isFirefoxBrowser() && adguard.settings.collectHitsCount()) || Prefs.useGlobalStyleSheet) {
            // We don't need all CSS selectors in case of FF using global stylesheet
            // as in this case we register browser wide stylesheet which will be
            // applied even if page was already loaded
            return false;
        }

        var safariContentBlockerEnabled = Utils.isContentBlockerEnabled();
        if (safariContentBlockerEnabled && collapseAllElements) {
            // For Safari 9+ we will load all selectors when browser is just started
            // as at that moment content blocker may not been initialized
            return true;
        }

        // In other cases we should load all selectors every time
        return !safariContentBlockerEnabled;
    };

    // EXPOSE
    return {
        processGetSelectorsAndScripts: processGetSelectorsAndScripts,
        checkWebSocketRequest: checkWebSocketRequest,
        processShouldCollapse: processShouldCollapse,
        processShouldCollapseMany: processShouldCollapseMany,
        isRequestBlockedByRule: isRequestBlockedByRule,
        getRuleForRequest: getRuleForRequest,
        processRequestResponse: processRequestResponse,
        postProcessRequest: postProcessRequest
    };
})();
