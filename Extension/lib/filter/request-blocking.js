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

var filterRulesHitCount = require('filter/filters-hit').filterRulesHitCount;
var UrlUtils = require('utils/url').UrlUtils;
var FilterUtils = require('utils/common').FilterUtils;
var EventNotifier = require('utils/notifier').EventNotifier;
var EventNotifierTypes = require('utils/common').EventNotifierTypes;
var ServiceClient = require('utils/service-client').ServiceClient;

var WebRequestService = exports.WebRequestService = function (framesMap, antiBannerService, filteringLog, adguardApplication) {
	this.framesMap = framesMap;
	this.antiBannerService = antiBannerService;
	this.filteringLog = filteringLog;
	this.adguardApplication = adguardApplication;
};

WebRequestService.prototype.processRequest = function (tab, requestUrl, referrerUrl, requestType) {

	var requestEvent = {requestBlocked: false};

	if (!UrlUtils.isHttpRequest(requestUrl) || !UrlUtils.isHttpRequest(referrerUrl)) {
		return requestEvent;
	}

	var requestRule = null;
	var requestBlocked = false;

	if (this.framesMap.isTabAdguardDetected(tab)) {
		//don't process request, add log event later
		return requestEvent;
	} else if (this.framesMap.isTabProtectionDisabled(tab)) {
		//don't process request
	} else if (this.framesMap.isTabWhiteListed(tab)) {
		requestRule = this.framesMap.getFrameWhiteListRule(tab);
	} else {
		requestRule = this.antiBannerService.getRequestFilter().findRuleForRequest(requestUrl, referrerUrl, requestType);
		requestBlocked = requestRule && !requestRule.whiteListRule;
	}

	requestEvent.requestBlocked = requestBlocked;

	// TODO: Don't create it if filtering log is disabled
	requestEvent.logEvent = {
		tab: tab,
		requestUrl: requestUrl,
		frameUrl: referrerUrl,
		requestType: requestType,
		requestRule: requestRule
	};

	return requestEvent;
};

WebRequestService.prototype.processRequestResponse = function (tab, requestUrl, referrerUrl, requestType, responseHeaders) {

	if (requestType == "DOCUMENT") {
		//check headers to detect Adguard application
		this.adguardApplication.checkHeaders(tab, responseHeaders, requestUrl);
		//clear previous events
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
	} else if (requestType == "DOCUMENT") {
		requestRule = this.framesMap.getFrameWhiteListRule(tab);
		//add page view to stats
		filterRulesHitCount.addPageView();
		appendLogEvent = true;
	}

	// add event to filtering log
	if (appendLogEvent) {
		this.filteringLog.addEvent({
			tab: tab,
			requestUrl: requestUrl,
			frameUrl: referrerUrl,
			requestType: requestType,
			requestRule: requestRule
		});
	}
};

WebRequestService.prototype.postProcessRequest = function (requestEvent) {

	var tab;
	var requestRule;

	if (requestEvent.logEvent) {
		requestRule = requestEvent.logEvent.requestRule;
		tab = requestEvent.logEvent.tab;
	}

	if (requestEvent.requestBlocked) {
		EventNotifier.notifyListeners(EventNotifierTypes.ADS_BLOCKED, requestRule, tab, 1);
	}

	if (requestEvent.logEvent) {
		this.filteringLog.addEvent(requestEvent.logEvent);
	}

	if (requestRule && !FilterUtils.isUserFilterRule(requestRule)) {
		filterRulesHitCount.addHitCount(requestRule.ruleText);
	}
};
