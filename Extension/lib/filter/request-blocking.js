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

/**
 * Prepares CSS and JS which should be injected to the page.
 *
 * @param tab           Tab
 * @param documentUrl   Document URL
 * @returns {*} null or object the following properties: "selectors", "scripts", "collapseAllElements"
 */
WebRequestService.prototype.processGetSelectorsAndScripts = function (tab, documentUrl) {

    var result = {};

    if (!tab) {
        return result;
    }

    if (!this.antiBannerService.isRequestFilterReady()) {
        return {
            requestFilterReady: false
        };
    }

    if (this.framesMap.isTabAdguardDetected(tab) || this.framesMap.isTabProtectionDisabled(tab) || this.framesMap.isTabWhiteListed(tab)) {
        return result;
    }
    
    result = {
        selectors: null,
        scripts: null,
        collapseAllElements: this.antiBannerService.shouldCollapseAllElements(),
        useShadowDom: Utils.isShadowDomSupported()
    };

    var genericHideRule = this.antiBannerService.getRequestFilter().findWhiteListRule(documentUrl, documentUrl, "GENERICHIDE");
    var elemHideRule = this.antiBannerService.getRequestFilter().findWhiteListRule(documentUrl, documentUrl, "ELEMHIDE");
    if (!elemHideRule) {
        if (this.shouldLoadAllSelectors(result.collapseAllElements)) {
            result.selectors = this.antiBannerService.getRequestFilter().getSelectorsForUrl(documentUrl, genericHideRule);
        } else {
            result.selectors = this.antiBannerService.getRequestFilter().getInjectedSelectorsForUrl(documentUrl, genericHideRule);
        }
    }

    var jsInjectRule = this.antiBannerService.getRequestFilter().findWhiteListRule(documentUrl, documentUrl, "JSINJECT");
    if (!jsInjectRule) {
        result.scripts = this.antiBannerService.getRequestFilter().getScriptsForUrl(documentUrl);
    }
    
    return result;
};

WebRequestService.prototype.shouldLoadAllSelectors = function (collapseAllElements) {
    if ((Utils.isFirefoxBrowser() && userSettings.collectHitsCount()) || Prefs.useGlobalStyleSheet) {
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

WebRequestService.prototype.checkWebSocketRequest = function (tab, requestUrl, referrerUrl, requestType) {

    if (!tab) {
        return false;
    }

    var requestRule = this.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
    this.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

    return this.isRequestBlockedByRule(requestRule);
};

WebRequestService.prototype.processShouldCollapse = function (tab, requestUrl, referrerUrl, requestType) {

    if (!tab) {
        return false;
    }

    var requestRule = this.getRuleForRequest(tab, requestUrl, referrerUrl, requestType);
    return this.isRequestBlockedByRule(requestRule);
};

WebRequestService.prototype.processShouldCollapseMany = function (tab, referrerUrl, collapseRequests) {

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

WebRequestService.prototype.isRequestBlockedByRule = function (requestRule) {
    return requestRule && !requestRule.whiteListRule;
};

WebRequestService.prototype.getRuleForRequest = function (tab, requestUrl, referrerUrl, requestType) {

    if (this.framesMap.isTabAdguardDetected(tab) || this.framesMap.isTabProtectionDisabled(tab)) {
        //don't process request
        return null;
    }

    var requestRule = null;

    if (this.framesMap.isTabWhiteListed(tab)) {
        requestRule = this.framesMap.getFrameWhiteListRule(tab);
    } else {
        requestRule = this.antiBannerService.getRequestFilter().findRuleForRequest(requestUrl, referrerUrl, requestType);
    }

    return requestRule;
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
WebRequestService.prototype.processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {

    if (requestType == RequestTypes.DOCUMENT) {
        // Check headers to detect Adguard application
        
        if (Prefs.getBrowser() != "Edge") {
            // TODO[Edge]: Integration mode is not fully functional in Edge (cannot redefine Referer header yet)
            this.adguardApplication.checkHeaders(tab, responseHeaders, requestUrl);
        }
        // Clear previous events
        this.filteringLog.clearEventsForTab(tab);
    }

    var requestRule = null;
    var appendLogEvent = false;

    if (this.framesMap.isTabAdguardDetected(tab)) {
        //parse rule applied to request from response headers
        requestRule = this.adguardApplication.parseAdguardRuleFromHeaders(responseHeaders);
        appendLogEvent = !ServiceClient.isAdguardAppRequest(requestUrl);
    } else if (this.framesMap.isTabProtectionDisabled(tab)) {
        //do nothing
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

WebRequestService.prototype.postProcessRequest = function (tab, requestUrl, referrerUrl, requestType, requestRule) {

    if (this.framesMap.isTabAdguardDetected(tab)) {
        //do nothing, log event will be added on response
        return;
    }

    if (this.isRequestBlockedByRule(requestRule)) {
        EventNotifier.notifyListenersAsync(EventNotifierTypes.ADS_BLOCKED, requestRule, tab, 1);
    }

    this.filteringLog.addEvent(tab, requestUrl, referrerUrl, requestType, requestRule);

    if (requestRule && !FilterUtils.isUserFilterRule(requestRule) && 
        !FilterUtils.isWhiteListFilterRule(requestRule) && 
        !this.framesMap.isIncognitoTab(tab)) {

        var domain = this.framesMap.getFrameDomain(tab);
        filterRulesHitCount.addRuleHit(domain, requestRule.ruleText, requestRule.filterId, requestUrl);
    }
};
