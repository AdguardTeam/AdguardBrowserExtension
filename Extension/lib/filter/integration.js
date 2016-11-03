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
/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var userSettings = require('../../lib/utils/user-settings').userSettings;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var FilterRuleBuilder = require('../../lib/filter/rules/filter-rule-builder').FilterRuleBuilder;
var UrlFilterRule = require('../../lib/filter/rules/url-filter-rule').UrlFilterRule;
var StringUtils = require('../../lib/utils/common').StringUtils;
var RequestTypes = require('../../lib/utils/common').RequestTypes;

/**
 * AdguardApplication is used for integration of Adguard extension and Adguard for Windows/Mac/Android versions.
 */
var AdguardApplication = exports.AdguardApplication = function (framesMap) {
	this.serviceClient = new ServiceClient();
	this.integrationMode = this.INTEGRATION_MODE_FULL;
	this.framesMap = framesMap;
};

AdguardApplication.prototype = {

	/**
	 * Looking for this header in HTTP response.
	 * If this header is present - request is filtered by Adguard for Windows/Mac/Android
	 */
	ADGUARD_APP_HEADER: "X-Adguard-Filtered",

	/**
	 * X-Adguard-Rule header contains the rule which was applied to the HTTP request
	 * If no rule applied - header won't be present in the response.
	 */
	ADGUARD_RULE_HEADER: "X-Adguard-Rule",

	/**
	 * Full mode means that extension can manage filtering status of the website.
	 * That also means that Adguard returns X-Adguard-Rule header (older version can't do it)
	 * Possible with Adguard 5.10.1180+
	 */
	INTEGRATION_MODE_FULL: "FULL",

	/**
	 * Adguard 5.10+. Extension cannot manage filtering status (only element blocking)
	 */
	INTEGRATION_MODE_DEFAULT: "DEFAULT",

	/**
	 * Older versions of Adguard. The only difference from default mode is API location
	 */
	INTEGRATION_MODE_OLD: "OLD",

	/**
	 * Detected adguard product name and version
	 */
	adguardProductName: null,
	adguardAppVersion: null,

	/**
	 * Adguard application detected
	 */
	adguardIntegrationDetected: false,

	/**
	 * Checks if X-Adguard-Filtered header is present
	 *
	 * @param tab       Tab data
	 * @param headers   Response headers
	 * @param frameUrl  Frame url
	 */
	checkHeaders: function (tab, headers, frameUrl) {
		this._detectAdguardApplication(tab, headers, frameUrl);
	},

	/**
	 * Parse X-Adguard-Rule and returns request rule (if present)
	 * @param headers
	 */
	parseAdguardRuleFromHeaders: function (headers) {
		if (headers) {
			for (var i = 0; i < headers.length; i++) {
				var header = headers[i];
				switch (header.name) {
					case this.ADGUARD_RULE_HEADER:
						return this._createRuleFromHeader(header.value);
				}
			}
		}
		return null;
	},

	/**
	 * Adds rule to User Filter
	 *
	 * @param ruleText  Rule text
	 * @param callback  Finish callback
	 */
	addRuleToApp: function (ruleText, callback) {
		switch (this.integrationMode) {
			case this.INTEGRATION_MODE_OLD:
				this.serviceClient.adguardAppAddRuleOld(ruleText, callback, callback);
				break;
			default:
				this.serviceClient.adguardAppAddRule(ruleText, callback, callback);
				break;
		}
	},

	/**
	 * Removes specified rule from User Filter
	 *
	 * @param ruleText  Rule text
	 * @param callback  Finish callback
	 */
	removeRuleFromApp: function (ruleText, callback) {
		this.serviceClient.adguardAppRemoveRule(ruleText, callback, callback);
	},

	/**
	 * If page URL is whitelisted in desktop Adguard, we should forcibly set Referer header value to this page URL.
	 * The problem is that standalone Adguard looks at the page referrer to check if it should bypass this request or not.
	 * Also there's an issue with Opera browser, it misses referrer for some requests.
	 *
	 * @param tab Tab
	 */
	shouldOverrideReferrer: function (tab) {
		return this.framesMap.isTabAdguardWhiteListed(tab);
	},

	/**
	 * Checks if request is for AG desktop app to intercept
	 * @param url request URL
	 */
	isIntegrationRequest: function (url) {
		return url && url.indexOf(this.serviceClient.adguardAppUrl) === 0;
	},

	/**
	 * Gets base url for requests to desktop AG
	 */
	getIntegrationBaseUrl: function () {
		return this.serviceClient.adguardAppUrl;
	},

	/**
	 * Gets headers used to authorize request to desktop AG
	 * In our case we set Referer header. It can't be forged by the webpage so it's enough.
	 */
	getAuthorizationHeaders: function () {
		return [{
			headerName: 'Referer',
			headerValue: this.serviceClient.injectionsUrl
		}];
	},

	checkIntegrationModeOn: function () {
		this.serviceClient._executeRequestAsync(this.serviceClient.injectionsUrl, 'text/plain', function (request) {
			if (request) {
				var header = request.getResponseHeader(this.ADGUARD_APP_HEADER);
				if (header) {
					var appInfo = this._parseAppHeader(header);
					this.adguardProductName = appInfo.adguardProductName;
					this.adguardAppVersion = appInfo.adguardAppVersion;
					this.integrationMode = appInfo.integrationMode;
					this.adguardIntegrationDetected = true;
				} else {
					this.adguardIntegrationDetected = false;
				}
			}
		}.bind(this));
	},

	/**
	 * Detects Adguard for Windows/Mac/Android
	 *
	 * @param tab       Tab data
	 * @param headers   HTTP response headers
	 * @param frameUrl  Frame url
	 * @private
	 */
	_detectAdguardApplication: function (tab, headers, frameUrl) {

		// Check headers
		var adguardAppHeaderValue = null;
		var adguardRuleHeaderValue = null;
		if (headers) {
			for (var i = 0; i < headers.length; i++) {
				var header = headers[i];
				if (!header.value) {
					continue;
				}
				switch (header.name) {
					case this.ADGUARD_APP_HEADER:
						adguardAppHeaderValue = header.value;
						break;
					case this.ADGUARD_RULE_HEADER:
						adguardRuleHeaderValue = header.value;
						break;
				}
			}
		}

		if (!adguardAppHeaderValue) {
			// No X-Adguard-Filtered header, disable integration mode for this tab
			this.framesMap.recordAdguardIntegrationForTab(tab, false, false, false, null, null, false);
			return;
		}

		// Set adguard detected in frame
		var appInfo = this._parseAppHeader(adguardAppHeaderValue);

		this.adguardProductName = appInfo.adguardProductName;
		this.adguardAppVersion = appInfo.adguardAppVersion;
		this.integrationMode = appInfo.integrationMode;

		var fullIntegrationMode = this.integrationMode == this.INTEGRATION_MODE_FULL;

		// Check for white list rule in frame
		var ruleInfo = Object.create(null);
		if (fullIntegrationMode) {
			ruleInfo = this._parseRuleHeader(adguardRuleHeaderValue, frameUrl);
		}

		// Save integration info to framesMap
		var adguardRemoveRuleNotSupported = !fullIntegrationMode;
		this.framesMap.recordAdguardIntegrationForTab(tab, true, ruleInfo.documentWhiteListed, ruleInfo.userWhiteListed, ruleInfo.headerRule, appInfo.adguardProductName, adguardRemoveRuleNotSupported);

		userSettings.changeShowInfoAboutAdguardFullVersion(false);
	},

	/**
	 * Parses Adguard version from X-Adguard-Filtered header
	 *
	 * @param header Header value
	 * @returns {{adguardProductName: null, adguardAppVersion: null, integrationMode: null}}
	 * @private
	 */
	_parseAppHeader: function (header) {
		var result = {
			adguardProductName: null,
			adguardAppVersion: null,
			integrationMode: null
		};
		if (/([a-z\s]+);\s+version=([a-z0-9.-]+)/i.test(header)) {
			//new version of adguard
			var adguardProductName = RegExp.$1;
			// header is either Adguard for Mac or Adguard for Windows
			// depending on it we use localized product name
			if (StringUtils.containsIgnoreCase(adguardProductName, "mac")) {
				result.adguardProductName = i18n.getMessage("adguard_product_mac");
			} else {
				result.adguardProductName = i18n.getMessage("adguard_product_windows");
			}
			result.adguardAppVersion = RegExp.$2;
			result.integrationMode = this.INTEGRATION_MODE_FULL;
		} else {
			if (/Adguard\s+(\d\.\d)/.test(header)) {
				result.adguardAppVersion = RegExp.$1;
			}
			if (this.adguardAppVersion == "5.8") {
				result.integrationMode = this.INTEGRATION_MODE_OLD;
			} else {
				result.integrationMode = this.INTEGRATION_MODE_DEFAULT;
			}
		}
		return result;
	},


	/**
	 * Parses Adguard version from X-Adguard-Rule header
	 *
	 * @param header Header value
	 * @param tabUrl Tab Url
	 * @returns {{documentWhiteListed: boolean, userWhiteListed: boolean, headerRule: null}}
	 * @private
	 */
	_parseRuleHeader: function (header, tabUrl) {
		var ruleInfo = {
			documentWhiteListed: false,
			userWhiteListed: false,
			headerRule: null
		};
		if (!header) {
			return ruleInfo;
		}

		var rule = this._createRuleFromHeader(header);
		if (rule && rule.whiteListRule
			&& rule instanceof UrlFilterRule
			&& rule.isFiltered(tabUrl, false, RequestTypes.DOCUMENT)
			&& rule.checkContentTypeIncluded("DOCUMENT")) {

			ruleInfo.headerRule = rule;
			ruleInfo.documentWhiteListed = true;
			ruleInfo.userWhiteListed = rule.filterId == 0;
		}

		return ruleInfo;
	},

	/**
	 * Parses rule and filterId from X-Adguard-Rule header
	 * @param header Header value
	 * @private
	 */
	_createRuleFromHeader: function (header) {

		var parts = header.split('; ');
		var headerInfo = Object.create(null);
		for (var i = 0; i < parts.length; i++) {
			var keyAndValue = parts[i].split('=');
			headerInfo[keyAndValue[0]] = decodeURIComponent(keyAndValue[1]);
		}

		return FilterRuleBuilder.createRule(headerInfo.rule, headerInfo.filterId - 0);
	}
};
