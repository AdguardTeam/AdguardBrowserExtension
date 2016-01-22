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
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var LocalStorageCache = require('../../lib/utils/cache').LocalStorageCache;
var UrlUtils = require('../../lib/utils/url').UrlUtils;
var Log = require('../../lib/utils/log').Log;
var LS = require('../../lib/utils/local-storage').LS;
var Prefs = require('../../lib/prefs').Prefs;
var StringUtils = require('../../lib/utils/common').StringUtils;
var SHA256 = require('../../lib/utils/sha256.patched').SHA256;

/**
 * Initializing SafebrowsingFilter.
 *
 * http://adguard.com/en/how-malware-blocked.html#extension
 */
var SafebrowsingFilter = exports.SafebrowsingFilter = function () {

    this.serviceClient = new ServiceClient();
    this.safebrowsingCache = new LocalStorageCache("sb-cache");

    this.suspendedFromProperty = "safebrowsing-suspended-from";
};

SafebrowsingFilter.prototype = {

    /**
     * If we've got an error response from the backend, suspend requests for
     * this time: 40 minutes
     */
    SUSPEND_TTL: 40 * 60 * 1000,

    /**
     * SB cache ttl: 40 minutes
     */
    SB_TTL: 40 * 60 * 1000,

    /**
     * If user ignores warning - do not check SB for 40 minutes
     */
    TRUSTED_TTL: 40 * 60 * 1000,
    SB_WHITE_LIST: "whitelist",

    /**
     * Performs lookup to safebrowsing service
     *
     * @param requestUrl        Request URL
     * @param lookupUrlCallback Called on successful check
     */
    lookupUrlWithCallback: function (requestUrl, lookupUrlCallback) {

        var host = UrlUtils.getHost(requestUrl);
        if (!host) {
            return;
        }

        var hosts = this._extractHosts(host);
        if (hosts == null || hosts.length == 0) {
            return;
        }

        // try find request url in cache
        var sbList = this._checkHostsInSbCache(hosts);
        if (sbList) {
            lookupUrlCallback(this._createResponse(sbList));
            return;
        }

        // check safebrowsing is active
        var now = Date.now();
        var suspendedFrom = LS.getItem(this.suspendedFromProperty) - 0;
        if (suspendedFrom && (now - suspendedFrom) < this.SUSPEND_TTL) {
            return;
        }

        var hashesMap = this._createHashesMap(hosts);

        var successCallback = function (response) {
            if (response.status >= 500) {
                // Error on server side, suspend request
                Log.error("Error response status {0} received from safebrowsing lookup server.", response.status);
                this._suspendSafebrowsing();
                return;
            }
            this._resumeSafebrowsing();

            var sbList = this.SB_WHITE_LIST;
            if (response.status != 204) {
                sbList = this._processSbResponse(response.responseText, hashesMap) || this.SB_WHITE_LIST;
            }

            this.safebrowsingCache.saveValue(host, sbList, Date.now() + this.SB_TTL);

            lookupUrlCallback(this._createResponse(sbList));

        }.bind(this);

        var errorCallback = function () {
            Log.error("Error response from safebrowsing lookup server for {0}", host);
            this._suspendSafebrowsing();
        }.bind(this);

        var hashes = Object.keys(hashesMap);
        var shortHashes = [];
        for (var i = 0; i < hashes.length; i++) {
            shortHashes.push(hashes[i].substring(0, 8));
        }

        this.serviceClient.lookupSafebrowsing(shortHashes, successCallback, errorCallback);
    },

    /**
     * Temporarily whitelist URL
     *
     * @param url URL
     */
    addToSafebrowsingTrusted: function (url) {
        var host = UrlUtils.getHost(url);
        if (!host) {
            return;
        }
        this.safebrowsingCache.saveValue(host, this.SB_WHITE_LIST, Date.now() + this.TRUSTED_TTL);
    },

    /**
     * Access Denied page URL
     *
     * @param requestUrl    Request URL
     * @param referrerUrl   Referrer URL
     * @param sbList        Safebrowsing list
     * @returns page URL
     */
    getErrorPageURL: function (requestUrl, referrerUrl, sbList) {
        var listName = sbList || "malware";
        var isMalware = StringUtils.contains(listName, "malware");
        var url = Prefs.safebrowsingPagePath;
        url += "?malware=" + isMalware;
        url += "&host=" + encodeURIComponent(UrlUtils.getHost(requestUrl));
        url += "&url=" + encodeURIComponent(requestUrl);
        url += "&ref=" + encodeURIComponent(referrerUrl);
        return url;
    },

    /**
     * Track safebrowsing stats
     * @param requestUrl
     */
    trackSafebrowsingStats: function (requestUrl) {
        this.serviceClient.trackSafebrowsingStats(requestUrl);
    },

    /**
     * Parses safebrowsing service response
     *
     * @param responseText  Response text
     * @param hashesMap  Hashes hosts map
     * @returns Safebrowsing list or null
     * @private
     */
    _processSbResponse: function (responseText, hashesMap) {
        if (!responseText || responseText.length > 10 * 1024) {
            return null;
        }

        try {
            var lines = responseText.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var r = lines[i].split(":");
                var hash = r[2];
                var host = hashesMap[hash];
                if (host != null) {
                    return r[0];
                }
            }

            return null;
        } catch (ex) {
            Log.error("Error parse safebrowsing response, cause {0}", ex);
        }
        return null;
    },

    /**
     * Creates lookup callback parameter
     * @param sbList    Safebrowsing list we've detected or null
     * @returns Safebrowsing list or null if this list is SB_WHITE_LIST (means that site was whitelisted).
     * @private
     */
    _createResponse: function (sbList) {
        return (sbList == this.SB_WHITE_LIST) ? null : sbList;
    },

    /**
     * Resumes previously suspended work of SafebrowsingFilter
     * @private
     */
    _resumeSafebrowsing: function () {
        LS.removeItem(this.suspendedFromProperty);
    },

    /**
     * Suspend work of SafebrowsingFilter (in case of backend error)
     * @private
     */
    _suspendSafebrowsing: function () {
        LS.setItem(this.suspendedFromProperty, Date.now());
    },

    /**
     * Checks safebrowsing cache
     *
     * @param hosts List of hosts
     * @returns Safebrowsing list (for blacklisted request) or null
     * @private
     */
    _checkHostsInSbCache: function (hosts) {
        for (var i = 0; i < hosts.length; i++) {
            var sbList = this.safebrowsingCache.getValue(hosts[i]);
            if (sbList) {
                return sbList;
            }
        }
        return null;
    },

    /**
     * Extracts hosts from one host.
     * This method returns all sub-domains and IP address of the specified host.
     *
     * @param host Host
     * @returns Array of extracted host names
     * @private
     */
    _extractHosts: function (host) {

        var hosts = [];
        if (UrlUtils.isIpv4(host) || UrlUtils.isIpv6(host)) {
            hosts.push(host);
            return hosts;
        }

        var parts = host.split(".");
        if (parts.length <= 2) {
            hosts.push(host);
        } else {
            for (var i = 0; i <= parts.length - 2; i++) {
                hosts.push(StringUtils.join(parts, ".", i, parts.length));
            }
        }

        return hosts;
    },

    /**
     * Calculates SHA256 hashes for strings in hosts and then
     * gets prefixes for calculated hashes
     *
     * @param hosts
     * @returns Map object of prefixes
     * @private
     */
    _createHashesMap: function (hosts) {

        var result = Object.create(null);

        for (var i = 0; i < hosts.length; i++) {
            var host = hosts[i];
            var hash = SHA256.hash(host + '/');
            result[hash.toUpperCase()] = host;
        }

        return result;
    }
};