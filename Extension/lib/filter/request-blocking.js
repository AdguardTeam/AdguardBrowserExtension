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

adguard.webRequestService = (function (adguard) {

    'use strict';

    var onRequestBlockedChannel = adguard.utils.channels.newChannel();

    /**
     * Records filtering rule hit
     *
     * @param tab            Tab object
     * @param requestRule    Rule to record
     * @param requestUrl     Request URL
     */
    var recordRuleHit = function (tab, requestRule, requestUrl) {
        if (requestRule &&
            adguard.settings.collectHitsCount() &&
            !adguard.utils.filters.isUserFilterRule(requestRule) &&
            !adguard.utils.filters.isWhiteListFilterRule(requestRule) &&
            !adguard.frames.isIncognitoTab(tab)) {

            var domain = adguard.frames.getFrameDomain(tab);
            adguard.hitStats.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
        }
    };

    /**
     * Prepares CSS and JS which should be injected to the page.
     *
     * @param tab           Tab
     * @param documentUrl   Document URL
     * @param options       Options for select:
     * options = {
     *      filter: ['selectors', 'scripts'] (selection filter) (mandatory)
     *      genericHide: true|false ( select only generic hide css rules) (optional)
     * }
     *
     * @returns {*}         null or object the following properties: "selectors", "scripts", "collapseAllElements"
     */
    var processGetSelectorsAndScripts = function (tab, documentUrl, options) {

        var result = Object.create(null);

        if (!tab) {
            return result;
        }

        if (!adguard.requestFilter.isReady()) {
            result.requestFilterReady = false;
            return result;
        }

        if (adguard.frames.isTabAdguardDetected(tab) ||
            adguard.frames.isTabProtectionDisabled(tab)) {
            return result;
        }

        // Looking for the whitelist rule
        var whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        if (!whitelistRule) {
            //Check whitelist for current frame
            var mainFrameUrl = adguard.frames.getMainFrameUrl(tab);
            whitelistRule = adguard.requestFilter.findWhiteListRule(documentUrl, mainFrameUrl, adguard.RequestTypes.DOCUMENT);
        }

        var retrieveSelectors = options.filter.indexOf('selectors') >= 0;
        var retrieveScripts = options.filter.indexOf('scripts') >= 0;

        if (retrieveSelectors) {
            // Record rule hit
            recordRuleHit(tab, whitelistRule, documentUrl);
        }

        // It's important to check this after the recordRuleHit call
        // as otherwise we will never record $document rules hit for domain
        if (adguard.frames.isTabWhiteListed(tab)) {
            return result;
        }

        if (retrieveSelectors) {

            // Prepare result
            result.selectors = {
                css: null,
                extendedCss: null,
                cssHitsCounterEnabled: false

            };
            result.collapseAllElements = adguard.requestFilter.shouldCollapseAllElements();
            result.useShadowDom = adguard.utils.browser.isShadowDomSupported();

            // Check what exactly is disabled by this rule
            var genericHideFlag = options.genericHide || (whitelistRule && whitelistRule.checkContentType("GENERICHIDE"));
            var elemHideFlag = whitelistRule && whitelistRule.checkContentType("ELEMHIDE");

            if (!elemHideFlag) {
                // Element hiding rules aren't disabled, so we should use them
                if (shouldLoadAllSelectors(result.collapseAllElements)) {
                    result.selectors = adguard.requestFilter.getSelectorsForUrl(documentUrl, genericHideFlag);
                } else {
                    result.selectors = adguard.requestFilter.getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
                }
            }
        }

        if (retrieveScripts) {
            var jsInjectFlag = whitelistRule && whitelistRule.checkContentType("JSINJECT");
            if (!jsInjectFlag) {
                // JS rules aren't disabled, returning them
                result.scripts = adguard.requestFilter.getScriptsForUrl(documentUrl);
            }
        }

        return result;
    };

    /**
     * Checks if request that is wrapped in page script should be blocked.
     * We do this because browser API doesn't have full support for intercepting all requests, e.g. WebSocket or WebRTC.
     *
     * @param tab           Tab
     * @param requestUrl    request url
     * @param referrerUrl   referrer url
     * @param requestType   Request type (WEBSOCKET or WEBRTC)
     * @returns {boolean}   true if request is blocked
     */
    var checkPageScriptWrapperRequest = function (tab, requestUrl, referrerUrl, requestType) {

        if (!tab) {
            return false;
        }

        var requestRule = getRuleForRequest(tab, requestUrl, referrerUrl, requestType);

        postProcessRequest(tab, requestUrl, referrerUrl, requestType, requestRule);

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
     * Gets blocked response by rule
     * See https://developer.chrome.com/extensions/webRequest#type-BlockingResponse or https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/BlockingResponse for details
     * @param requestRule Request rule or null
     * @returns {*} Blocked response or null
     */
    var getBlockedResponseByRule = function (requestRule) {
        if (isRequestBlockedByRule(requestRule)) {
            if (requestRule.emptyResponse) {
                return {redirectUrl: 'data:,'};
            } else {
                return {cancel: true};
            }
        }
        return null;
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

        if (adguard.frames.isTabAdguardDetected(tab) || adguard.frames.isTabProtectionDisabled(tab)) {
            //don't process request
            return null;
        }

        var whitelistRule = adguard.frames.getFrameWhiteListRule(tab);
        if (whitelistRule && whitelistRule.checkContentTypeIncluded("DOCUMENT")) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        } else if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        }

        return adguard.requestFilter.findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
    };

    /**
     * Find CSP rules for request
     * @param tab           Tab
     * @param requestUrl    Request URL
     * @param referrerUrl   Referrer URL
     * @param requestType   Request type (DOCUMENT or SUBDOCUMENT)
     * @returns {*}         Collection of rules or null
     */
    var getCspRules = function (tab, requestUrl, referrerUrl, requestType) {

        if (adguard.frames.isTabAdguardDetected(tab) || adguard.frames.isTabProtectionDisabled(tab) || adguard.frames.isTabWhiteListed(tab)) {
            //don't process request
            return null;
        }

        var whitelistRule = adguard.requestFilter.findWhiteListRule(requestUrl, referrerUrl, adguard.RequestTypes.DOCUMENT);
        if (whitelistRule && whitelistRule.checkContentTypeIncluded("DOCUMENT")) {
            return null;
        }

        return adguard.requestFilter.getCspRules(requestUrl, referrerUrl, requestType);
    };

    /**
     * Processes HTTP response.
     * It could do the following:
     * 1. Detect desktop AG and switch to integration mode
     * 2. Add event to the filtering log (for DOCUMENT requests)
     * 3. Record page stats (if it's enabled)
     *
     * @param tab Tab object
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param requestType Request type
     * @param responseHeaders Response headers
     */
    var processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {

        if (requestType === adguard.RequestTypes.DOCUMENT) {
            // Check headers to detect Adguard application

            if (adguard.integration.isSupported() && // Integration module may be missing
                !adguard.prefs.mobile &&  // Mobile Firefox doesn't support integration mode
                !adguard.utils.browser.isEdgeBrowser()) { // TODO[Edge]: Integration mode is not fully functional in Edge (cannot redefine Referer header yet and Edge doesn't intercept requests from background page)

                adguard.integration.checkHeaders(tab, responseHeaders, requestUrl);
            }
            // Clear previous events
            adguard.filteringLog.clearEventsByTabId(tab.tabId);
        }

        var requestRule = null;
        var appendLogEvent = false;

        if (adguard.integration.isSupported() && adguard.frames.isTabAdguardDetected(tab)) {
            // Parse rule applied to request from response headers
            requestRule = adguard.integration.parseAdguardRuleFromHeaders(responseHeaders);
            appendLogEvent = !adguard.backend.isAdguardAppRequest(requestUrl);
        } else if (adguard.frames.isTabProtectionDisabled(tab)) { // jshint ignore:line
            // Doing nothing
        } else if (requestType === adguard.RequestTypes.DOCUMENT) {
            requestRule = adguard.frames.getFrameWhiteListRule(tab);
            var domain = adguard.frames.getFrameDomain(tab);
            if (!adguard.frames.isIncognitoTab(tab) &&
                adguard.settings.collectHitsCount()) {
                //add page view to stats
                adguard.hitStats.addDomainView(domain);
            }
            appendLogEvent = true;
        }

        // add event to filtering log
        if (appendLogEvent) {
            adguard.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);
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

        if (adguard.frames.isTabAdguardDetected(tab)) {
            //do nothing, log event will be added on response
            return;
        }

        if (isRequestBlockedByRule(requestRule)) {
            adguard.listeners.notifyListenersAsync(adguard.listeners.ADS_BLOCKED, requestRule, tab, 1);
            var details = {
                tabId: tab.tabId,
                requestUrl: requestUrl,
                referrerUrl: referrerUrl,
                requestType: requestType
            };
            if (requestRule) {
                details.rule = requestRule.ruleText;
                details.filterId = requestRule.filterId;
            }
            onRequestBlockedChannel.notify(details);
        }

        adguard.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

        // Record rule hit
        recordRuleHit(tab, requestRule, requestUrl);
    };

    var shouldLoadAllSelectors = function (collapseAllElements) {

        var safariContentBlockerEnabled = adguard.utils.browser.isContentBlockerEnabled();
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
        checkPageScriptWrapperRequest: checkPageScriptWrapperRequest,
        processShouldCollapse: processShouldCollapse,
        processShouldCollapseMany: processShouldCollapseMany,
        isRequestBlockedByRule: isRequestBlockedByRule,
        getBlockedResponseByRule: getBlockedResponseByRule,
        getRuleForRequest: getRuleForRequest,
        getCspRules: getCspRules,
        processRequestResponse: processRequestResponse,
        postProcessRequest: postProcessRequest,
        recordRuleHit: recordRuleHit,
        onRequestBlocked: onRequestBlockedChannel
    };

})(adguard);
