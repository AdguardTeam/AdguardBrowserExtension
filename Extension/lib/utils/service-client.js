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

/* global FilterDownloader */
adguard.backend = (function (adguard) {

    'use strict';

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
                } else if (adguard.utils.browser.isEdgeBrowser()) {
                    return 'https://filters.adtidy.org/extension/edge';
                } else if (adguard.utils.browser.isOperaBrowser()) {
                    return 'https://filters.adtidy.org/extension/opera';
                } else {
                    return 'https://filters.adtidy.org/extension/chromium';
                }
            });
        },

        // URL for downloading AG filters
        get filterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}.txt";
        },

        // URL for downloading optimized AG filters
        get optimizedFilterRulesUrl() {
            return this.filtersUrl + "/filters/{filter_id}_optimized.txt";
        },

        // URL for checking filter updates
        get filtersMetadataUrl() {
            var params = adguard.utils.browser.getExtensionParams();
            return this.filtersUrl + '/filters.json?' + params.join('&');
        },

        // URL for user complaints on missed ads or malware/phishing websites
        get reportUrl() {
            return this.backendUrl + "/url-report.html";
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
            return "https://injections.adguard.com";
        },

        // URLs used when add-on works in integration mode.
        // @deprecated
        get adguardAppUrlOld() {
            return this.injectionsUrl + "/adguard-ajax-crossdomain-hack/api?";
        },
        get adguardAppUrl() {
            return this.injectionsUrl + "/adguard-ajax-api/api?";
        },
        // Folder that contains filters metadata and files with rules. 'filters' by default
        get localFiltersFolder() {
            return 'filters';
        },
        // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
        get localFilterIds() {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        }
    };

    /**
     * FilterDownloader constants
     */
    var FilterCompilerConditionsConstants = {
        adguard: true,
        adguard_ext_chromium: adguard.utils.browser.isChromium(),
        adguard_ext_firefox: adguard.utils.browser.isFirefoxBrowser(),
        adguard_ext_edge: adguard.utils.browser.isEdgeBrowser(),
        adguard_ext_safari: adguard.utils.browser.isSafariBrowser(),
        adguard_ext_opera: adguard.utils.browser.isOperaBrowser(),
    };

    /**
     * Loading subscriptions map
     */
    var loadingSubscriptions = Object.create(null);

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
        var url = useOptimizedFilters ? settings.optimizedFilterRulesUrl : settings.filterRulesUrl;
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
     * Load metadata of the specified filters
     *
     * @param filterIds         Filters identifiers
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadFiltersMetadata = function (filterIds, successCallback, errorCallback) {

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
                var filterMetadataList = [];
                for (var i = 0; i < filterIds.length; i++) {
                    var filter = adguard.utils.collections.find(metadata.filters, 'filterId', filterIds[i]);
                    if (filter) {
                        filterMetadataList.push(adguard.subscriptions.createSubscriptionFilterFromJSON(filter));
                    }
                }
                successCallback(filterMetadataList);
            } else {
                errorCallback(response, "empty response");
            }
        };

        executeRequestAsync(settings.filtersMetadataUrl, "application/json", success, errorCallback);
    };

    /**
     * Downloads filter rules by filter ID
     *
     * @param filterId            Filter identifier
     * @param forceRemote         Force download filter rules from remote server
     * @param useOptimizedFilters    Download optimized filters flag
     * @param successCallback    Called on success
     * @param errorCallback        Called on error
     */
    var loadFilterRules = function (filterId, forceRemote, useOptimizedFilters, successCallback, errorCallback) {

        var url;
        if (forceRemote || settings.localFilterIds.indexOf(filterId) < 0) {
            url = getUrlForDownloadFilterRules(filterId, useOptimizedFilters);
        } else {
            url = adguard.getURL(settings.localFiltersFolder + "/filter_" + filterId + ".txt");
            if (useOptimizedFilters) {
                url = adguard.getURL(settings.localFiltersFolder + "/filter_mobile_" + filterId + ".txt");
            }
        }

        FilterDownloader.download(url, FilterCompilerConditionsConstants).then(successCallback, errorCallback);
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

        var success = function (lines) {
            delete loadingSubscriptions[url];

            if (lines[0].indexOf('[') === 0) {
                //[Adblock Plus 2.0]
                lines.shift();
            }

            successCallback(lines);
        };

        var error = function (cause) {
            delete loadingSubscriptions[url];
            errorCallback(cause);
        };

        FilterDownloader.download(url, FilterCompilerConditionsConstants).then(success, error);
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

        var url = adguard.getURL(settings.localFiltersFolder + '/filters.json');
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

        var url = adguard.getURL(settings.localFiltersFolder + '/filters_i18n.json');
        executeRequestAsync(url, 'application/json', success, errorCallback);
    };

    /**
     * Loads script rules from local file
     *
     * @param successCallback   Called on success
     * @param errorCallback     Called on error
     */
    var loadLocalScriptRules = function (successCallback, errorCallback) {
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
        var url = adguard.getURL(settings.localFiltersFolder + '/local_script_rules.json');
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

    /**
     * Allows to receive response headers from the request to the given URL
     * @param url URL
     * @param callback Callback with headers or null in the case of error
     */
    var getResponseHeaders = function (url, callback) {
        executeRequestAsync(url, 'text/plain', function (request) {
            var arr = request.getAllResponseHeaders().trim().split(/[\r\n]+/);
            var headers = arr.map(function (line) {
                var parts = line.split(': ');
                var header = parts.shift();
                var value = parts.join(': ');
                return {
                    name: header,
                    value: value
                };
            });
            callback(headers);
        }, function (request) {
            adguard.console.error("Error retrieved response from {0}, cause: {1}", url, request.statusText);
            callback(null);
        })
    };

    /**
     * Configures backend's URLs
     * @param configuration Configuration object:
     * {
     *  filtersMetadataUrl: '...',
     *  filterRulesUrl: '...',
     *  localFiltersFolder: '...',
     *  localFilterIds: []
     * }
     */
    var configure = function (configuration) {
        var filtersMetadataUrl = configuration.filtersMetadataUrl;
        if (filtersMetadataUrl) {
            Object.defineProperty(settings, 'filtersMetadataUrl', {
                get: function () {
                    return filtersMetadataUrl;
                }
            });
        }
        var filterRulesUrl = configuration.filterRulesUrl;
        if (filterRulesUrl) {
            Object.defineProperty(settings, 'filterRulesUrl', {
                get: function () {
                    return filterRulesUrl;
                }
            });
        }
        var localFiltersFolder = configuration.localFiltersFolder;
        if (localFiltersFolder) {
            Object.defineProperty(settings, 'localFiltersFolder', {
                get: function () {
                    return localFiltersFolder;
                }
            });
        }
        var localFilterIds = configuration.localFilterIds;
        if (localFilterIds) {
            Object.defineProperty(settings, 'localFilterIds', {
                get: function () {
                    return localFilterIds;
                }
            });
        }
    };

    return {

        adguardAppUrl: settings.adguardAppUrl,
        injectionsUrl: settings.injectionsUrl,

        loadFiltersMetadata: loadFiltersMetadata,
        loadFilterRules: loadFilterRules,

        loadFilterRulesBySubscriptionUrl: loadFilterRulesBySubscriptionUrl,

        loadLocalFiltersMetadata: loadLocalFiltersMetadata,
        loadLocalFiltersI18Metadata: loadLocalFiltersI18Metadata,
        loadLocalScriptRules: loadLocalScriptRules,

        adguardAppAddRule: adguardAppAddRule,
        adguardAppAddRuleOld: adguardAppAddRuleOld,
        adguardAppRemoveRule: adguardAppRemoveRule,

        lookupSafebrowsing: lookupSafebrowsing,
        trackSafebrowsingStats: trackSafebrowsingStats,

        sendUrlReport: sendUrlReport,
        sendHitStats: sendHitStats,

        isAdguardAppRequest: isAdguardAppRequest,

        getResponseHeaders: getResponseHeaders,

        configure: configure
    };

})(adguard);
