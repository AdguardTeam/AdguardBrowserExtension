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

/* global LRUMap */

/**
 * Initializing SafebrowsingFilter.
 *
 * http://adguard.com/en/how-malware-blocked.html#extension
 */
adguard.safebrowsing = (function (adguard, global) {
    // Lazy initialized safebrowsing cache
    const safebrowsingCache = {
        get cache() {
            return adguard.lazyGet(safebrowsingCache, 'cache', () => new adguard.utils.LruCache('sb-lru-cache'));
        },
    };

    /**
     * Backend requests cache
     */
    const safebrowsingRequestsCache = new LRUMap(1000);

    const suspendedFromProperty = 'safebrowsing-suspended-from';

    /**
     * If we've got an error response from the backend, suspend requests for
     * this time: 40 minutes
     */
    const SUSPEND_TTL = 40 * 60 * 1000;

    const SB_WHITE_LIST = 'whitelist';

    /**
     * Domain hash length
     */
    const DOMAIN_HASH_LENGTH = 4;

    /**
     * Parses safebrowsing service response
     *
     * @param responseText  Response text
     * @param hashesMap  Hashes hosts map
     * @returns Safebrowsing list or null
     * @private
     */
    function processSbResponse(responseText, hashesMap) {
        if (!responseText || responseText.length > 10 * 1024) {
            return null;
        }

        try {
            let result;
            const lines = responseText.split('\n');
            for (let i = 0; i < lines.length; i += 1) {
                const r = lines[i].split(':');
                const hash = r[2];
                const list = r[0];

                safebrowsingCache.cache.saveValue(hash, list);

                if (!result) {
                    const host = hashesMap[hash];
                    if (host) {
                        result = list;
                    }
                }
            }

            return result;
        } catch (ex) {
            adguard.console.error('Error parse safebrowsing response, cause {0}', ex);
        }
        return null;
    }

    /**
     * Creates lookup callback parameter
     * @param sbList    Safebrowsing list we've detected or null
     * @returns Safebrowsing list or null if this list is SB_WHITE_LIST (means that site was whitelisted).
     * @private
     */
    function createResponse(sbList) {
        return (sbList === SB_WHITE_LIST) ? null : sbList;
    }

    /**
     * Resumes previously suspended work of SafebrowsingFilter
     * @private
     */
    function resumeSafebrowsing() {
        adguard.localStorage.removeItem(suspendedFromProperty);
    }

    /**
     * Suspend work of SafebrowsingFilter (in case of backend error)
     * @private
     */
    function suspendSafebrowsing() {
        adguard.localStorage.setItem(suspendedFromProperty, Date.now());
    }

    /**
     * Calculates hash for host string
     *
     * @param host
     * @return {string}
     */
    function createHash(host) {
        return global.SHA256.hash(`${host}/`).toUpperCase();
    }

    /**
     * Calculates SHA256 hashes for strings in hosts and then
     * gets prefixes for calculated hashes
     *
     * @param hosts
     * @returns Map object of prefixes
     * @private
     */
    function createHashesMap(hosts) {
        const result = Object.create(null);

        for (let i = 0; i < hosts.length; i += 1) {
            const host = hosts[i];
            const hash = createHash(host);
            result[hash] = host;
        }

        return result;
    }

    /**
     * Checks safebrowsing cache
     *
     * @param hosts List of hosts
     * @returns Safebrowsing list (for blacklisted request) or null
     * @private
     */
    function checkHostsInSbCache(hosts) {
        for (let i = 0; i < hosts.length; i += 1) {
            const sbList = safebrowsingCache.cache.getValue(createHash(hosts[i]));
            if (sbList) {
                return sbList;
            }
        }
        return null;
    }

    /**
     * Extracts hosts from one host.
     * This method returns all sub-domains and IP address of the specified host.
     *
     * @param host Host
     * @returns Array of extracted host names
     * @private
     */
    function extractHosts(host) {
        const hosts = [];
        if (adguard.utils.url.isIpv4(host) || adguard.utils.url.isIpv6(host)) {
            hosts.push(host);
            return hosts;
        }

        const parts = host.split('.');
        if (parts.length <= 2) {
            hosts.push(host);
        } else {
            for (let i = 0; i <= parts.length - 2; i += 1) {
                hosts.push(adguard.utils.strings.join(parts, '.', i, parts.length));
            }
        }

        return hosts;
    }

    /**
     * Access Denied page URL
     *
     * @param requestUrl    Request URL
     * @param referrerUrl   Referrer URL
     * @param sbList        Safebrowsing list
     * @returns page URL
     */
    const getErrorPageURL = function (requestUrl, referrerUrl, sbList) {
        const listName = sbList || 'malware';
        const isMalware = adguard.utils.strings.contains(listName, 'malware');
        let url = 'pages/blocking-pages/safebrowsing.html';
        url += `?malware=${isMalware}`;
        url += `&host=${encodeURIComponent(adguard.utils.url.getHost(requestUrl))}`;
        url += `&url=${encodeURIComponent(requestUrl)}`;
        url += `&ref=${encodeURIComponent(referrerUrl)}`;
        return adguard.getURL(url);
    };

    /**
     * Performs lookup to safebrowsing service
     *
     * @param requestUrl        Request URL
     * @param lookupUrlCallback Called on successful check
     */
    const lookupUrlWithCallback = function (requestUrl, lookupUrlCallback) {
        const host = adguard.utils.url.getHost(requestUrl);
        if (!host) {
            return;
        }

        const hosts = extractHosts(host);
        if (!hosts || hosts.length === 0) {
            return;
        }

        // try find request url in cache
        const sbList = checkHostsInSbCache(hosts);
        if (sbList) {
            lookupUrlCallback(createResponse(sbList));
            return;
        }

        // check safebrowsing is active
        const now = Date.now();
        const suspendedFrom = adguard.localStorage.getItem(suspendedFromProperty) - 0;
        if (suspendedFrom && (now - suspendedFrom) < SUSPEND_TTL) {
            return;
        }

        const hashesMap = createHashesMap(hosts);
        const hashes = Object.keys(hashesMap);
        let shortHashes = [];
        for (let i = 0; i < hashes.length; i += 1) {
            shortHashes.push(hashes[i].substring(0, DOMAIN_HASH_LENGTH));
        }

        // Filter already checked hashes
        shortHashes = shortHashes.filter(x => !safebrowsingRequestsCache.get(x));
        if (shortHashes.length === 0) {
            // In case we have not found anything in safebrowsingCache and all short hashes have been checked in
            // safebrowsingRequestsCache - means that there is no need to request backend again
            safebrowsingCache.cache.saveValue(createHash(host), SB_WHITE_LIST);
            lookupUrlCallback(createResponse(SB_WHITE_LIST));
        } else {
            adguard.backend.lookupSafebrowsing(shortHashes, (response) => {
                if (response.status >= 500) {
                    // Error on server side, suspend request
                    // eslint-disable-next-line max-len
                    adguard.console.error('Error response status {0} received from safebrowsing lookup server.', response.status);
                    suspendSafebrowsing();
                    return;
                }
                resumeSafebrowsing();

                shortHashes.forEach((x) => {
                    safebrowsingRequestsCache.set(x, true);
                });

                let sbList = SB_WHITE_LIST;
                if (response.status !== 204) {
                    sbList = processSbResponse(response.responseText, hashesMap) || SB_WHITE_LIST;
                }

                safebrowsingCache.cache.saveValue(createHash(host), sbList);
                lookupUrlCallback(createResponse(sbList));
            }, () => {
                adguard.console.error('Error response from safebrowsing lookup server for {0}', host);
                suspendSafebrowsing();
            });
        }
    };

    /**
     * Checks URL with safebrowsing filter.
     * http://adguard.com/en/how-malware-blocked.html#extension
     *
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     * @param safebrowsingCallback Called when check has been finished
     */
    const checkSafebrowsingFilter = function (requestUrl, referrerUrl, safebrowsingCallback) {
        if (!adguard.settings.safebrowsingInfoEnabled()) {
            return;
        }

        adguard.console.debug('Checking safebrowsing filter for {0}', requestUrl);

        const callback = function (sbList) {
            if (!sbList) {
                adguard.console.debug('No safebrowsing rule found');
                return;
            }
            adguard.console.debug('Following safebrowsing filter has been fired: {0}', sbList);
            safebrowsingCallback(getErrorPageURL(requestUrl, referrerUrl, sbList));
        };

        lookupUrlWithCallback(requestUrl, callback);
    };

    /**
     * Temporarily whitelist URL
     * Adds URL to trusted sites (this URL will be ignored by safebrowsing filter)
     *
     * @param url URL
     */
    const addToSafebrowsingTrusted = function (url) {
        const host = adguard.utils.url.getHost(url);
        if (!host) {
            return;
        }

        safebrowsingCache.cache.saveValue(createHash(host), SB_WHITE_LIST);
    };

    return {
        checkSafebrowsingFilter,
        lookupUrlWithCallback,
        addToSafebrowsingTrusted,
        getErrorPageURL,
        extractHosts,
        createHashesMap,
        processSbResponse,
    };
})(adguard, window);
