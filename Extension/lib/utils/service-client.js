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

adguard.backend = (function (adguard) {

    'use strict';

    /**
     * Represents filter version metadata
     * @type {Function}
     */
    var AdguardFilterVersion = function (timeUpdated, version, filterId) {
        this.timeUpdated = timeUpdated;
        this.version = version;
        this.filterId = filterId;
    };

    /**
     * Filter version metadata parser
     *
     * @param filter Object
     * @returns {*}
     */
    AdguardFilterVersion.fromJSON = function (filter) {
        var timeUpdated = new Date(filter.timeUpdated).getTime();
        var version = filter.version;
        var filterId = filter.filterId - 0;
        return new AdguardFilterVersion(timeUpdated, version, filterId);
    };

    /**
     * Class for working with our backend server.
     * All requests sent by this class are covered in the privacy policy:
     * http://adguard.com/en/privacy.html#browsers
     */

    /**
     * Settings
     */
    var settings = {

        // Base url of our backend server
        get backendUrl() {
            return "https://chrome.adtidy.org";
        },

        get apiKey() {
            return "4DDBE80A3DA94D819A00523252FB6380";
        },

        // Url for load filters metadata and rules
        get filtersUrl() {
            return adguard.lazyGet(this, 'filtersUrl', function () {
                if (adguard.utils.browser.isFirefoxBrowser()) {
                    return 'https://filters.adtidy.org/extension/firefox';
                } else if (adguard.utils.browser.isSafariBrowser()) {
                    return 'https://filters.adtidy.org/extension/safari';
                } else {
                    return 'https://filters.adtidy.org/extension/chromium';
                }
            });
        },

        // URL for downloading AG filters
        get getFilterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}.txt";
        },

        // URL for downloading optimized AG filters
        get getOptimizedFilterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}_optimized.txt";
        },

        // URL for checking filter updates
        get filtersMetadataUrl() {
            return this.filtersUrl + "/filters.json";
        },

        // URL for user complaints on missed ads or malware/phishing websites
        get reportUrl() {
            return this.backendUrl + "/url-report.html";
        },

        // URL for detecting user's country code (to auto-enable proper language-specific filter)
        get getCountryUrl() {
            return this.backendUrl + "/getcountry.html?";
        },

        // URL for tracking Adguard installation
        get trackInstallUrl() {
            return this.backendUrl + "/install.html?";
        },

        /**
         * URL for collecting filter rules statistics.
         * We do not collect it by default, unless user is willing to help.
         *
         * Filter rules stats are covered in our privacy policy and on also here:
         * http://adguard.com/en/filter-rules-statistics.html
         */
        get ruleStatsUrl() {
            return this.backendUrl + "/rulestats.html";
        },

        /**
         * Browsing Security lookups. In case of Firefox lookups are disabled for HTTPS urls.
         */
        get safebrowsingLookupUrl() {
            return "https://sb.adtidy.org/safebrowsing-lookup-hash.html";
        },

        /**
         * URL for collecting Browsing Security stats.
         * We do not collect it by default, unless user is willing to help.
         * For now - blocked urls are reported only.
         */
        get safebrowsingStatsUrl() {
            return "https://sb.adtidy.org/sb-report.html";
        },

        // This url is used in integration mode. Adguard for Windows/Mac/Android intercepts requests to injections.adguard.com host.
        // It is not used for remote requests, requests are intercepted by the desktop version of Adguard.
        get injectionsUrl() {
            return "http://injections.adguard.com";
        },

        // URLs used when add-on works in integration mode.
        // @deprecated
        get adguardAppUrlOld() {
            return this.injectionsUrl + "/adguard-ajax-crossdomain-hack/api?";
        },
        get adguardAppUrl() {
            return this.injectionsUrl + "/adguard-ajax-api/api?";
        },

        /**
         * Appends to some requests for analytics
         */
        get appInfoParam() {
            return '&app=ag&v=' + adguard.app.getVersion();
        }
    };

    /**
     * Loading subscriptions map
     */
    var loadingSubscriptions = Object.create(null);

    /**
     * Tracks event info: install, uninstall etc
     * @param trackUrl
     * @param isAllowedAcceptableAds
     */
    function trackInfo(trackUrl, isAllowedAcceptableAds) {
        try {
            var clientId = encodeURIComponent(adguard.utils.browser.getClientId());
            var locale = encodeURIComponent(adguard.app.getLocale());
            var version = encodeURIComponent(adguard.app.getVersion());
            var whiteListEnabled = encodeURIComponent(isAllowedAcceptableAds);

            var params = [];
            params.push("id=" + clientId);
            params.push("l=" + locale);
            params.push("v=" + version);
            params.push("wlen=" + whiteListEnabled);

            var url = trackUrl + params.join("&");
            url = addKeyParameter(url);

            executeRequestAsync(url, "text/plain");

        } catch (ex) {
            adguard.console.error('Error track {0}, cause: {1}', trackUrl, ex);
        }
    }

    /**
     * Retrieve filter metadata from first lines in response
     * @param lines
     * @returns {*}
     * @private
     */
    function parseFilterMetadataFromRulesHeader(lines) {

        var version = null;
        var timeUpdated = null;
        for (var i = 0; i < 7; i++) {

            var line = lines[i];

            var match;
            if (version === null) {
                match = line.match(/!\s+Version:\s+([0-9.]+)/);
                if (match) {
                    version = match[1];
                    continue;
                }
            }
            if (timeUpdated === null) {
                match = line.match(/!\s+TimeUpdated:\s+(.+)$/);
                if (match) {
                    timeUpdated = new Date(match[1]);
                }
            }
        }

        if (!version || !timeUpdated) {
            return null;
        }

        return {
            version: version,
            timeUpdated: timeUpdated
        };
    }

    /**
     * Load filter rules.
     * Parse header and rules.
     * Response format:
     * HEADER
     * rule1
     * rule2
     * ...
     * ruleN
     *
     * @param filterId Filter identifier
     * @param url Url for loading rules
     * @param successCallback Success callback (version, rules)
     * @param errorCallback Error callback (response, errorText)
     * @private
     */
    function doLoadFilterRules(filterId, url, successCallback, errorCallback) {

        var success = function (response) {

            var responseText = response.responseText;
            if (!responseText) {
                errorCallback(response, "filter rules missing");
                return;
            }

            var lines = responseText.split(/[\r\n]+/);

            var metadata = parseFilterMetadataFromRulesHeader(lines);
            if (!metadata) {
                errorCallback(response, "wrong filter metadata");
                return;
            }

            var rules = [];
            for (var i = 0; i < lines.length; i++) {
                var rule = adguard.rules.builder.createRule(lines[i], filterId);
                if (rule !== null) {
                    rules.push(rule);
                }
            }

            var filterVersion = new AdguardFilterVersion(metadata.timeUpdated.getTime(), metadata.version, filterId);

            successCallback(filterVersion, rules);

        };

        executeRequestAsync(url, "text/plain", success, errorCallback);
    }

    /**
     * Executes async request
     * @param url Url
     * @param contentType Content type
     * @param successCallback success callback
     * @param errorCallback error callback
     */
    function executeRequestAsync(url, contentType, successCallback, errorCallback) {

        var request = new XMLHttpRequest();
        try {
            request.open('GET', url);
            request.setRequestHeader('Content-type', contentType);
            request.setRequestHeader('Pragma', 'no-cache');
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
    }

    /**
     * URL for downloading AG filter
     *
     * @param filterId Filter identifier
     * @param useOptimizedFilters
     * @private
     */
    function getUrlForDownloadFilterRules(filterId, useOptimizedFilters) {
        var url = useOptimizedFilters ? settings.getOptimizedFilterRulesUrl : settings.getFilterRulesUrl;
        return adguard.utils.strings.replaceAll(url, '{filter_id}', filterId);
    }

    /**
     * Appends request key to url
     */
    function addKeyParameter(url) {
        return url + "&key=" + settings.apiKey;
    }

    /**
     * Safe json parsing
     * @param text
     * @private
     */
    function parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (ex) {
            adguard.console.error('Error parse json {0}', ex);
            return null;
        }
    }

    /**
     * Checks versions of the specified filters
     *
     * @param filterIds         Filters identifiers
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var checkFilterVersions = function (filterIds, successCallback, errorCallback) {

        if (!filterIds || filterIds.length === 0) {
            successCallback([]);
            return;
        }

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, "invalid response");
                    return;
                }
                var filterVersions = [];
                for (var i = 0; i < filterIds.length; i++) {
                    var filter = adguard.utils.collections.find(metadata.filters, 'filterId', filterIds[i]);
                    if (filter) {
                        filterVersions.push(AdguardFilterVersion.fromJSON(filter));
                    }
                }
                successCallback(filterVersions);
            } else {
                errorCallback(response, "empty response");
            }
        };

        var url = settings.filtersMetadataUrl + '?' + settings.appInfoParam;
        url = addKeyParameter(url);
        executeRequestAsync(url, "application/json", success, errorCallback);
    };

    /**
     * Downloads filter rules by filter ID
     *
     * @param filterId            Filter identifier
     * @param useOptimizedFilters    Download optimized filters flag
     * @param successCallback    Called on success
     * @param errorCallback        Called on error
     */
    var loadRemoteFilterRules = function (filterId, useOptimizedFilters, successCallback, errorCallback) {

        var url = getUrlForDownloadFilterRules(filterId, useOptimizedFilters) + '?' + settings.appInfoParam;
        url = addKeyParameter(url);

        doLoadFilterRules(filterId, url, successCallback, errorCallback);
    };

    /**
     * Loads filter rules from a local file
     *
     * @param filterId            Filter identifier
     * @param useOptimizedFilters    Download optimized filters flag
     * @param successCallback    Called on success
     * @param errorCallback        Called on error
     */
    var loadLocalFilterRules = function (filterId, useOptimizedFilters, successCallback, errorCallback) {

        var url = adguard.getURL("filters/filter_" + filterId + ".txt");
        if (useOptimizedFilters) {
            url = adguard.getURL("filters/filter_mobile_" + filterId + ".txt");
        }

        doLoadFilterRules(filterId, url, successCallback, errorCallback);
    };

    /**
     * Downloads filter rules frm url
     *
     * @param url               Subscription url
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadFilterRulesBySubscriptionUrl = function (url, successCallback, errorCallback) {

        if (url in loadingSubscriptions) {
            return;
        }
        loadingSubscriptions[url] = true;

        var success = function (response) {

            delete loadingSubscriptions[url];

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
            delete loadingSubscriptions[url];
            errorCallback(request, cause);
        };

        executeRequestAsync(url, "text/plain", success, error);
    };

    /**
     * Loads filter groups metadata
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalFiltersMetadata = function (successCallback, errorCallback) {

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, 'invalid response');
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, 'empty response');
            }
        };

        var url = adguard.getURL('filters/filters.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Loads filter groups metadata from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalFiltersI18Metadata = function (successCallback, errorCallback) {

        var success = function (response) {
            if (response && response.responseText) {
                var metadata = parseJson(response.responseText);
                if (!metadata) {
                    errorCallback(response, 'invalid response');
                    return;
                }
                successCallback(metadata);
            } else {
                errorCallback(response, 'empty response');
            }
        };

        var url = adguard.getURL('filters/filters_i18n.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Checks specified host hashes with our safebrowsing service
     *
     * @param hashes                Host hashes
     * @param successCallback       Called on success
     * @param errorCallback         Called on error
     */
    var lookupSafebrowsing = function (hashes, successCallback, errorCallback) {
        var url = settings.safebrowsingLookupUrl + "?prefixes=" + encodeURIComponent(hashes.join('/'));
        executeRequestAsync(url, "application/json", successCallback, errorCallback);
    };

    /**
     * Track safebrowsing stats
     *
     * @param url - filtered url by safebrowsing
     */
    var trackSafebrowsingStats = function (url) {
        var trackUrl = settings.safebrowsingStatsUrl + "?url=" + encodeURIComponent(url);
        trackUrl += "&locale=" + adguard.app.getLocale();
        trackUrl += "&referrer=";
        trackUrl += "&r=" + Math.random();
        executeRequestAsync(trackUrl, "text/plain");
    };

    /**
     * Sends feedback from the user to our server
     *
     * @param url           URL
     * @param messageType   Message type
     * @param comment       Message text
     */
    var sendUrlReport = function (url, messageType, comment) {

        var params = "url=" + encodeURIComponent(url);
        params += "&messageType=" + encodeURIComponent(messageType);
        if (comment) {
            params += "&comment=" + encodeURIComponent(comment);
        }
        params = addKeyParameter(params);

        var request = new XMLHttpRequest();
        request.open('POST', settings.reportUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * Gets user's country
     *
     * @param successCallback   Called on success
     */
    var getCountry = function (successCallback) {
        var url = addKeyParameter(settings.getCountryUrl);
        executeRequestAsync(url, "text/plain", function (response) {
            successCallback(response.responseText);
        }, function () {
            successCallback(null);
        });
    };

    /**
     * Tracks extension install
     */
    var trackInstall = function () {
        // SEARCH_AND_SELF_PROMO_FILTER_ID is enabled by default
        trackInfo(settings.trackInstallUrl, true);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText          Rule text
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var adguardAppAddRule = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrl + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText
     * @param successCallback
     * @param errorCallback
     */
    var adguardAppRemoveRule = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrl + "type=remove&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Used in integration mode. Sends ajax-request which should be intercepted by Adguard for Windows/Mac/Android.
     *
     * @param ruleText          Rule text
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     * @deprecated
     */
    var adguardAppAddRuleOld = function (ruleText, successCallback, errorCallback) {
        executeRequestAsync(settings.adguardAppUrlOld + "type=add&rule=" + encodeURIComponent(ruleText), "text/plain", successCallback, errorCallback);
    };

    /**
     * Sends filter hits stats to backend server.
     * This method is used if user has enabled "Send statistics for ad filters usage".
     * More information about ad filters usage stats:
     * http://adguard.com/en/filter-rules-statistics.html
     *
     * @param stats             Stats
     * @param enabledFilters    List of enabled filters
     */
    var sendHitStats = function (stats, enabledFilters) {

        var params = "stats=" + encodeURIComponent(stats);
        params += "&v=" + encodeURIComponent(adguard.app.getVersion());
        params += "&b=" + encodeURIComponent(adguard.prefs.browser);
        if (enabledFilters) {
            for (var i = 0; i < enabledFilters.length; i++) {
                var filter = enabledFilters[i];
                params += "&f=" + encodeURIComponent(filter.filterId + "," + filter.version);
            }
        }
        params = addKeyParameter(params);

        var request = new XMLHttpRequest();
        request.open('POST', settings.ruleStatsUrl);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.send(params);
    };

    /**
     * @param requestUrl
     * @returns true if request to adguard application
     */
    var isAdguardAppRequest = function (requestUrl) {
        return requestUrl && (requestUrl.indexOf('/adguard-ajax-crossdomain-hack/') > 0 || requestUrl.indexOf('/adguard-ajax-api/') > 0);
    };

    return {

        adguardAppUrl: settings.adguardAppUrl,
        injectionsUrl: settings.injectionsUrl,

        checkFilterVersions: checkFilterVersions,
        loadRemoteFilterRules: loadRemoteFilterRules,
        loadLocalFilterRules: loadLocalFilterRules,

        loadFilterRulesBySubscriptionUrl: loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata: loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata: loadLocalFiltersI18Metadata,

        adguardAppAddRule: adguardAppAddRule,
        adguardAppAddRuleOld: adguardAppAddRuleOld,
        adguardAppRemoveRule: adguardAppRemoveRule,

        lookupSafebrowsing: lookupSafebrowsing,
        trackSafebrowsingStats: trackSafebrowsingStats,

        sendUrlReport: sendUrlReport,
        getCountry: getCountry,
        trackInstall: trackInstall,
        sendHitStats: sendHitStats,

        isAdguardAppRequest: isAdguardAppRequest
    };

})(adguard);
