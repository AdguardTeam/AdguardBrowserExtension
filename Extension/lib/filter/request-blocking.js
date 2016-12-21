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
/* global require, exports */
var filterRulesHitCount = require('../../lib/filter/filters-hit').filterRulesHitCount;
var FilterUtils = require('../../lib/utils/common').FilterUtils;
var EventNotifier = require('../../lib/utils/notifier').EventNotifier;
var EventNotifierTypes = require('../../lib/utils/common').EventNotifierTypes;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var Utils = require('../../lib/utils/browser-utils').Utils;
var RequestTypes = require('../../lib/utils/common').RequestTypes;
var userSettings = require('../../lib/utils/user-settings').userSettings;
var Prefs = require('../../lib/prefs').Prefs;

var WebRequestService = exports.WebRequestService = function (framesMap, antiBannerService, filteringLog, adguardApplication) {
    this.framesMap = framesMap;
    this.antiBannerService = antiBannerService;
    this.filteringLog = filteringLog;
    this.adguardApplication = adguardApplication;
};

WebRequestService.prototype = (function () {

    /**
     * Records filtering rule hit
     * 
     * @param tab            Tab object
     * @param requestRule    Rule to record
     * @param requestUrl     Request URL
     * @param framesMap      Frames map
     */
    var recordRuleHit = function(tab, requestRule, requestUrl, framesMap) {
        if (requestRule && 
            !FilterUtils.isUserFilterRule(requestRule) && 
            !FilterUtils.isWhiteListFilterRule(requestRule) && 
            !framesMap.isIncognitoTab(tab)) {
            
            var domain = framesMap.getFrameDomain(tab);
            filterRulesHitCount.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
        }
    };

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

        if (!this.antiBannerService.isRequestFilterReady()) {
            return {
                requestFilterReady: false
            };
        }

        if (this.framesMap.isTabAdguardDetected(tab) || 
            this.framesMap.isTabProtectionDisabled(tab)) {
            return result;
        }

        // Looking for the whitelist rule
        var whitelistRule = this.framesMap.getFrameWhiteListRule(tab);
        if (!whitelistRule) {
            // Check whitelist for current frame
            var mainFrameUrl = this.framesMap.getMainFrameUrl(tab);
            whitelistRule = this.antiBannerService.getRequestFilter().findWhiteListRule(documentUrl, mainFrameUrl, RequestTypes.DOCUMENT);
        }

        // Record rule hit
        recordRuleHit(tab, whitelistRule, documentUrl, this.framesMap);

        // It's important to check this after the recordRuleHit call
        // as otherwise we will never record $document rules hit for domain
        if (this.framesMap.isTabWhiteListed(tab)) {
            return result;
        }

        // Prepare result
        result = {
            selectors: {
                css: null,
                extendedCss: null
            },
            scripts: null,
            collapseAllElements: this.antiBannerService.shouldCollapseAllElements(),
            useShadowDom: Utils.isShadowDomSupported()
        };

        // Check what exactly is disabled by this rule
        var genericHideFlag = genericHide || (whitelistRule && whitelistRule.checkContentType("GENERICHIDE"));
        var elemHideFlag = whitelistRule && whitelistRule.checkContentType("ELEMHIDE");
        
        if (!elemHideFlag) {
            // Element hiding rules aren't disabled, so we should use them            
            if (shouldLoadAllSelectors(result.collapseAllElements)) {
                result.selectors = this.antiBannerService.getRequestFilter().getSelectorsForUrl(documentUrl, genericHideFlag);
            } else {
                result.selectors = this.antiBannerService.getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideFlag);
            }
        }

        var jsInjectFlag = whitelistRule && whitelistRule.checkContentType("JSINJECT");
        if (!jsInjectFlag) {
            // JS rules aren't disabled, returning them
            result.scripts = this.antiBannerService.getRequestFilter().getScriptsForUrl(documentUrl);
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

        var requestRule = this.getRuleForRequest(tab, requestUrl, referrerUrl, RequestTypes.WEBSOCKET);
        this.filteringLog.addEvent(tab, requestUrl, referrerUrl, RequestTypes.WEBSOCKET, requestRule);

        return this.isRequestBlockedByRule(requestRule);
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

        var requestRule = this.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
        return this.isRequestBlockedByRule(requestRule);
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
            var requestRule = this.getRuleForRequest(tab, request.elementUrl, referrerUrl, request.requestType);
            request.collapse = this.isRequestBlockedByRule(requestRule);
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

        if (this.framesMap.isTabAdguardDetected(tab) || this.framesMap.isTabProtectionDisabled(tab)) {
            //don't process request
            return null;
        }

        var whitelistRule = this.framesMap.getFrameWhiteListRule(tab);
        if (whitelistRule && whitelistRule.checkContentTypeIncluded("DOCUMENT")) {
            // Frame is whitelisted by the main frame's $document rule
            // We do nothing more in this case - return the rule.
            return whitelistRule;
        } else if (!whitelistRule) {
            // If whitelist rule is not found for the main frame, we check it for referrer
            whitelistRule = this.antiBannerService.getRequestFilter().findWhiteListRule(requestUrl, referrerUrl, RequestTypes.DOCUMENT);
        }

        return this.antiBannerService.getRequestFilter().findRuleForRequest(requestUrl, referrerUrl, requestType, whitelistRule);
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

        if (requestType == RequestTypes.DOCUMENT) {
            // Check headers to detect Adguard application

            if (!Utils.isEdgeBrowser()) {
                // TODO[Edge]: Integration mode is not fully functional in Edge (cannot redefine Referer header yet)
                this.adguardApplication.checkHeaders(tab, responseHeaders, requestUrl);
            }
            // Clear previous events
            this.filteringLog.clearEventsForTab(tab);
        }

        var requestRule = null;
        var appendLogEvent = false;

        if (this.framesMap.isTabAdguardDetected(tab)) {
            // Parse rule applied to request from response headers
            requestRule = this.adguardApplication.parseAdguardRuleFromHeaders(responseHeaders);
            appendLogEvent = !ServiceClient.isAdguardAppRequest(requestUrl);
        } else if (this.framesMap.isTabProtectionDisabled(tab)) {
            // Doing nothing
        } else if (requestType == RequestTypes.DOCUMENT) {
            requestRule = this.framesMap.getFrameWhiteListRule(tab);
            var domain = this.framesMap.getFrameDomain(tab);
            if (!this.framesMap.isIncognitoTab(tab)) {
                //add page view to stats
                filterRulesHitCount.addDomainView(domain);
            }
            appendLogEvent = true;
        }

        // add event to filtering log
        if (appendLogEvent) {
            this.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);
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

        if (this.framesMap.isTabAdguardDetected(tab)) {
            //do nothing, log event will be added on response
            return;
        }

        if (this.isRequestBlockedByRule(requestRule)) {
            EventNotifier.notifyListenersAsync(EventNotifierTypes.ADS_BLOCKED, requestRule, tab, 1);
        }

        this.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

        // Record rule hit
        recordRuleHit(tab, requestRule, requestUrl, this.framesMap);
    };

    var shouldLoadAllSelectors = function (collapseAllElements) {

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
    }
})();
