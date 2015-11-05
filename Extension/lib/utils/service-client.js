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

/**
 * Initializing required libraries for this file.
 * require method is overridden in Chrome extension (port/require.js).
 */
var Log = require('utils/log').Log;
var Utils = require('utils/common').Utils;
var FilterRule = require('filter/rules/base-filter-rule').FilterRule;
var Prefs = require('prefs').Prefs;
var LS = require('utils/local-storage').LS;
var Cc = require('chrome').Cc;
var Ci = require('chrome').Ci;
var XMLHttpRequestConstructor = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"];

/**
 * Class for working with our backend server.
 * All requests sent by this class are covered in the privacy policy:
 * http://adguard.com/en/privacy.html#browsers
 */
var ServiceClient = exports.ServiceClient = function () {

	// Base url of our backend server
	this.backendUrl = "https://chrome.adtidy.org";
    this.apiKey = "4DDBE80A3DA94D819A00523252FB6380";

    // URL for checking filter updates
	this.checkFilterVersionsUrl = this.backendUrl + "/checkfilterversions.html";

    // URL for downloading AG filters
	this.getFilterRulesUrl = this.backendUrl + "/getfilter.html";

    // URL for user complaints on missed ads or malware/phishing websites
	this.reportUrl = this.backendUrl + "/url-report.html";

    // URL for detecting user's country code (to auto-enable proper language-specific filter)
	this.getCountryUrl = this.backendUrl + "/getcountry.html?";

    // URL for tracking Adguard installation
	this.trackInstallUrl = this.backendUrl + "/install.html?";

    /**
     * URL for collecting filter rules statistics.
     * We do not collect it by default, unless user is willing to help.
     *
     * Filter rules stats are covered in our privacy policy and on also here:
     * http://adguard.com/en/filter-rules-statistics.html
     */
	this.ruleStatsUrl = this.backendUrl + "/rulestats.html";

    /**
     * Browsing Security lookups. In case of Firefox lookups are disabled for HTTPS urls.
     * TODO: Switch to using SHA256 hashes instead of plain text domain names.
     */
	this.safebrowsingLookupUrl = "https://sb.adtidy.org/safebrowsing-lookup-domain.html";

    /**
     * URL for collecting Browsing Security stats.
     * We do not collect it by default, unless user is willing to help.
     * For now - blocked urls are reported only.
     */
	this.safebrowsingStatsUrl = "https://sb.adtidy.org/sb-report.html";

    // This url is used in integration mode. Adguard for Windows/Mac/Android intercepts requests to injections.adguard.com host.
    // It is not used for remote requests, requests are intercepted by the desktop version of Adguard.
    this.injectionsUrl = "http://injections.adguard.com";

    // URLs used when add-on works in integration mode.
	// @deprecated
    this.adguardAppUrlOld = this.injectionsUrl + "/adguard-ajax-crossdomain-hack/api?";
    this.adguardAppUrl = this.injectionsUrl + "/adguard-ajax-api/api?";

	this.loadingSubscriptions = Object.create(null);
};

ServiceClient.prototype = {

	APP_PARAM: '&app=ag&v=' + Prefs.version,

	/**
	 * Checks versions of the specified filters
	 *
	 * @param filterIds         Filters identifiers
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	checkFilterVersions: function (filterIds, successCallback, errorCallback) {

		if (!filterIds || filterIds.length == 0) {
			successCallback([]);
			return;
		}

		var AdguardFilterVersion = require('filter/antibanner').AdguardFilterVersion;

		var success = function (response) {
			var xml = response.responseXML;
			if (xml && xml.getElementsByTagName) {
				var filterVersionsList = xml.getElementsByTagName("filter-version-list")[0];
				filterVersionsList = filterVersionsList.getElementsByTagName("versions")[0];
				var filterVersions = [];
				var childNodes = filterVersionsList.childNodes;
				for (var i = 0; i < childNodes.length; i++) {
					var filterVersionXml = childNodes[i];
					if (filterVersionXml.tagName == "filter-version") {
						filterVersions.push(AdguardFilterVersion.fromXml(filterVersionXml));
					}
				}
				successCallback(filterVersions);
			} else {
				errorCallback(response, "empty response");
			}
		};
		var url = this.checkFilterVersionsUrl;
		for (var i = 0; i < filterIds.length; i++) {
			url += (i == 0 ? "?filterid=" : "&filterid=") + filterIds[i];
		}
		url += this.APP_PARAM;
		url = this._addKeyParameter(url);
		this._executeRequestAsync(url, "application/xml", success, errorCallback);
	},

	/**
	 * Downloads filter rules by filter ID
	 *
	 * @param filterId          Filter identifier
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	loadFilterRules: function (filterId, successCallback, errorCallback) {

		var AdguardFilterVersion = require('filter/antibanner').AdguardFilterVersion;

		var success = function (response) {

			var responseText = response.responseText;
			if (!responseText) {
				errorCallback(response, "filter rules missing");
				return;
			}
			var lines = responseText.split(/[\r\n]+/);

			var version = null;
			var timeUpdated = null;
			for (var i = 0; i < 7; i++) {
				var line = lines[i];
				if (/!\s+Version:\s+([0-9.]+)/.test(line)) {
					version = version || RegExp.$1;
				} else if (/!\s+TimeUpdated:\s+(.+)$/.test(line)) {
					timeUpdated = timeUpdated || new Date(RegExp.$1);
				}
			}
			if (!version || !timeUpdated) {
				errorCallback(response, "wrong filter metadata");
				return;
			}
			var rules = [];
			for (i = 0; i < lines.length; i++) {
				var rule = FilterRule.createRule(lines[i], filterId);
				if (rule != null) {
					rules.push(rule);
				}
			}
			var filterVersion = new AdguardFilterVersion(timeUpdated.getTime(), version, filterId);
			successCallback(filterVersion, rules);
		};
		var url = this.getFilterRulesUrl + "?filterid=" + filterId;
		url += this.APP_PARAM;
		url = this._addKeyParameter(url);
		this._executeRequestAsync(url, "text/plain", success, errorCallback);
	},

	/**
	 * Loads filter rules from local file
	 *
	 * @param filterId          Filter identifier
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	loadLocalFilter: function (filterId, successCallback, errorCallback) {

		var AdguardFilterVersion = require('filter/antibanner').AdguardFilterVersion;

		var success = function (response) {
			var responseText = response.responseText;
			var lines = responseText.split(/[\r\n]+/);
			var rules = [];
			var version = null;
			var timeUpdated = null;
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (/!\s+Version:\s+([0-9.]+)/.test(line)) {
					version = version || RegExp.$1;
				} else if (/!\s+TimeUpdated:\s+(.+)$/.test(line)) {
					timeUpdated = timeUpdated || new Date(RegExp.$1);
				}
				var rule = FilterRule.createRule(line, filterId);
				if (rule != null) {
					rules.push(rule);
				}
			}
			var filterVersion = new AdguardFilterVersion(timeUpdated.getTime(), version, filterId);
			successCallback(filterVersion, rules);
		};
		var url = Prefs.getLocalFilterPath(filterId);
		this._executeRequestAsync(url, "text/plain", success, errorCallback);
	},

    /**
     * Downloads filter rules frm url
     *
     * @param url               Subscription url
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    loadFilterRulesBySubscriptionUrl: function (url, successCallback, errorCallback) {

	    if (url in this.loadingSubscriptions) {
		    return;
	    }
	    this.loadingSubscriptions[url] = true;

	    var self = this;

        var success = function (response) {

	        delete self.loadingSubscriptions[url];

	        if (response.status !== 200) {
		        errorCallback(response, "wrong status code: " + response.status);
		        return;
	        }

	        var responseText = (response.responseText || '').trim();
	        if (responseText.length === 0) {
		        errorCallback(response, "filter rules missing");
		        return;
	        }

	        var lines = responseText.split(/[\r\n]+/);
	        if (lines[0].indexOf('[') === 0) {
		        //[Adblock Plus 2.0]
		        lines.shift();
	        }

            successCallback(lines);
        };

	    var error = function (request, cause) {
		    delete self.loadingSubscriptions[url];
		    errorCallback(request, cause);
	    };

        this._executeRequestAsync(url, "text/plain", success, error);
    },

	/**
	 * Loads filter groups metadata
	 *
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	loadLocalGroupsMetadata: function (successCallback, errorCallback) {

		var SubscriptionGroup = require('filter/subscription').SubscriptionGroup;

		var success = function (response) {
			var xml = response.responseXML;
			if (xml && xml.getElementsByTagName) {
				var groups = [];
				var groupsElements = xml.getElementsByTagName('group');
				for (var i = 0; i < groupsElements.length; i++) {
					var group = SubscriptionGroup.fromXml(groupsElements[i]);
					groups.push(group);
				}
				successCallback(groups);
			} else {
				errorCallback(response, 'empty response');
			}
		};

		var url = Prefs.localGroupsMetadataPath;
		this._executeRequestAsync(url, 'text/xml', success, errorCallback);
	},

	/**
	 * Loads filter groups metadata from local file
	 *
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	loadLocalFiltersMetadata: function (successCallback, errorCallback) {

		var SubscriptionFilter = require('filter/subscription').SubscriptionFilter;

		var success = function (response) {
			var xml = response.responseXML;
			if (xml && xml.getElementsByTagName) {
				var filters = [];
				var filtersElements = xml.getElementsByTagName('filter');
				for (var i = 0; i < filtersElements.length; i++) {
					var filter = SubscriptionFilter.fromXml(filtersElements[i]);
					filters.push(filter);
				}
				successCallback(filters);
			} else {
				errorCallback(response, 'empty response');
			}
		};

		var url = Prefs.localFiltersMetadataPath;
		this._executeRequestAsync(url, 'text/xml', success, errorCallback);
	},

	/**
	 * Checks specified host with our safebrowsing service
	 *
	 * @param host                  Host name
	 * @param successCallback       Called on success
	 * @param errorCallback         Called on error
	 */
	lookupSafebrowsing: function (host, successCallback, errorCallback) {
		var url = this.safebrowsingLookupUrl + "?domain=" + encodeURIComponent(host);
		this._executeRequestAsync(url, "application/json", successCallback, errorCallback);
	},

	/**
	 * Track safebrowsing stats
	 *
	 * @param url - filtered url by safebrowsing
	 */
	trackSafebrowsingStats: function (url) {
		var trackUrl = this.safebrowsingStatsUrl + "?url=" + encodeURIComponent(url);
		trackUrl += "&locale=" + Prefs.locale;
		trackUrl += "&referrer=";
		trackUrl += "&r=" + Math.random();
		this._executeRequestAsync(trackUrl, "text/plain");
	},

	/**
	 * Sends feedback from the user to our server
	 *
	 * @param url           URL
	 * @param messageType   Message type
	 * @param comment       Message text
	 */
	sendUrlReport: function (url, messageType, comment) {

		var params = "url=" + encodeURIComponent(url);
		params += "&messageType=" + encodeURIComponent(messageType);
		if (comment) {
			params += "&comment=" + encodeURIComponent(comment);
		}
		params = this._addKeyParameter(params);

		var request = XMLHttpRequestConstructor.createInstance(Ci.nsIXMLHttpRequest);
		request.open('POST', this.reportUrl);
		request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		request.send(params);
	},

	/**
	 * Gets user's country
	 *
	 * @param successCallback   Called on success
	 */
	getCountry: function (successCallback) {
		var url = this._addKeyParameter(this.getCountryUrl);
		this._executeRequestAsync(url, "text/plain", function (response) {
			successCallback(response.responseText);
		}, function () {
			successCallback(null);
		});
	},

	/**
	 * Tracks extension install
	 *
	 * @param isAllowedAcceptableAds true if "show useful ads" is enabled
	 */
	trackInstall: function (isAllowedAcceptableAds) {
		this._trackInfo(this.trackInstallUrl, isAllowedAcceptableAds);
	},

	/**
	 * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
	 *
	 * @param ruleText          Rule text
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 */
	adguardAppAddRule: function (ruleText, successCallback, errorCallback) {
		this._executeRequestAsync(this.adguardAppUrl + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
	},

	/**
	 * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
	 *
	 * @param ruleText
	 * @param successCallback
	 * @param errorCallback
	 */
	adguardAppRemoveRule: function (ruleText, successCallback, errorCallback) {
		this._executeRequestAsync(this.adguardAppUrl + "type=remove&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
	},

	/**
	 * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
	 *
	 * @param ruleText          Rule text
	 * @param successCallback   Called on success
	 * @param errorCallback     Called on error
	 * @deprecated
	 */
	adguardAppAddRuleOld: function (ruleText, successCallback, errorCallback) {
		this._executeRequestAsync(this.adguardAppUrlOld + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
	},

	/**
	 * Sends filter hits stats to backend server.
	 * This method is used if user has enabled "Send statistics for ad filters usage".
     * More information about ad filters usage stats:
     * http://adguard.com/en/filter-rules-statistics.html
	 *
	 * @param stats             Stats
	 * @param enabledFilters    List of enabled filters
	 */
	sendHitStats: function (stats, enabledFilters) {

		var params = "stats=" + encodeURIComponent(stats);
		params += "&v=" + encodeURIComponent(Prefs.version);
		params += "&b=" + encodeURIComponent(Prefs.getBrowser());
		if (enabledFilters) {
			for (var i = 0; i < enabledFilters.length; i++) {
				var filter = enabledFilters[i];
				params += "&f=" + encodeURIComponent(filter.filterId + "," + filter.version);
			}
		}
		params = this._addKeyParameter(params);

		var request = XMLHttpRequestConstructor.createInstance(Ci.nsIXMLHttpRequest);
		request.open('POST', this.ruleStatsUrl);
		request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		request.send(params);
	},

	_trackInfo: function (trackUrl, isAllowedAcceptableAds) {
		try {
			var clientId = encodeURIComponent(Utils.getClientId());
			var locale = encodeURIComponent(Prefs.locale);
			var version = encodeURIComponent(Prefs.version);
			var whiteListEnabled = encodeURIComponent(isAllowedAcceptableAds);

			var params = [];
			params.push("id=" + clientId);
			params.push("l=" + locale);
			params.push("v=" + version);
			params.push("wlen=" + whiteListEnabled);

			var url = trackUrl + params.join("&");
			url = this._addKeyParameter(url);

			this._executeRequestAsync(url, "text/plain");

		} catch (ex) {
			Log.error('Error track {0}, cause: {1}', trackUrl, ex);
		}
	},

	_executeRequestAsync: function (url, contentType, successCallback, errorCallback) {

		var request = XMLHttpRequestConstructor.createInstance(Ci.nsIXMLHttpRequest);
		try {
			request.open('GET', url);
			request.setRequestHeader('Content-type', contentType);
			request.overrideMimeType(contentType);
			request.mozBackgroundRequest = true;
			if (successCallback) {
				request.onload = function () {
					successCallback(request);
				};
			}
			if (errorCallback) {
				var errorCallbackWrapper = function () {
					errorCallback(request);
				};
				request.onerror = errorCallbackWrapper;
				request.onabort = errorCallbackWrapper;
				request.ontimeout = errorCallbackWrapper;
			}
			request.send(null);
		} catch (ex) {
			if (errorCallback) {
				errorCallback(request, ex);
			}
		}
	},

	_addKeyParameter: function (url) {
		return url + "&key=" + this.apiKey;
	}
};

/**
 * @param requestUrl
 * @returns true if request to adguard application
 */
ServiceClient.isAdguardAppRequest = function (requestUrl) {
	return requestUrl && (requestUrl.indexOf('/adguard-ajax-crossdomain-hack/') > 0 || requestUrl.indexOf('/adguard-ajax-api/') > 0);
};

