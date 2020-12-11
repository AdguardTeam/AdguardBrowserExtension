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

import { LRUMap } from 'lru_map';

import SHA256 from 'crypto-js/sha256';
import { log } from '../../../../common/log';
import { utils } from '../../../utils/common';
import { localStorage } from '../../../storage';
import { backgroundPage } from '../../../extension-api/background-page';
import { backend } from '../../filters/service-client';
import { settings } from '../../../settings/user-settings';
import { LruCache } from '../../../utils/lru-cache';
import { lazyGet } from '../../../utils/lazy';

/**
 * Initializing SafebrowsingFilter.
 *
 * http://adguard.com/en/how-malware-blocked.html#extension
 */
const safebrowsing = (function () {
    // Lazy initialized safebrowsing cache
    const safebrowsingCache = {
        get cache() {
            return lazyGet(safebrowsingCache, 'cache', () => new LruCache('sb-lru-cache'));
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
            log.error('Error parse safebrowsing response, cause {0}', ex);
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
        localStorage.removeItem(suspendedFromProperty);
    }

    /**
     * Suspend work of SafebrowsingFilter (in case of backend error)
     * @private
     */
    function suspendSafebrowsing() {
        localStorage.setItem(suspendedFromProperty, Date.now());
    }

    /**
     * Calculates hash for host string
     *
     * @param host
     * @return {string}
     */
    function createHash(host) {
        return SHA256(`${host}/`).toString().toUpperCase();
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
        if (utils.url.isIpv4(host) || utils.url.isIpv6(host)) {
            hosts.push(host);
            return hosts;
        }

        const parts = host.split('.');
        if (parts.length <= 2) {
            hosts.push(host);
        } else {
            for (let i = 0; i <= parts.length - 2; i += 1) {
                hosts.push(utils.strings.join(parts, '.', i, parts.length));
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
        const isMalware = utils.strings.contains(listName, 'malware');
        let url = 'pages/blocking-pages/safebrowsing.html';
        url += `?malware=${isMalware}`;
        url += `&host=${encodeURIComponent(utils.url.getHost(requestUrl))}`;
        url += `&url=${encodeURIComponent(requestUrl)}`;
        url += `&ref=${encodeURIComponent(referrerUrl)}`;
        return backgroundPage.getURL(url);
    };

    /**
     * Performs lookup to safebrowsing service
     *
     * @param requestUrl        Request URL
     */
    const lookupUrl = async function (requestUrl) {
        const host = utils.url.getHost(requestUrl);
        if (!host) {
            return;
        }

        const hosts = extractHosts(host);
        if (!hosts || hosts.length === 0) {
            return;
        }

        // try find request url in cache
        let sbList = checkHostsInSbCache(hosts);
        if (sbList) {
            return createResponse(sbList);
        }

        // check safebrowsing is active
        const now = Date.now();
        const suspendedFrom = localStorage.getItem(suspendedFromProperty) - 0;
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
            return createResponse(SB_WHITE_LIST);
        }

        let response;
        try {
            response = await backend.lookupSafebrowsing(shortHashes);
        } catch (e) {
            log.error('Error response from safebrowsing lookup server for {0}', host);
            suspendSafebrowsing();
        }

        if (response.status >= 500) {
            // Error on server side, suspend request
            // eslint-disable-next-line max-len
            log.error('Error response status {0} received from safebrowsing lookup server.', response.status);
            suspendSafebrowsing();
            return;
        }
        resumeSafebrowsing();

        shortHashes.forEach((x) => {
            safebrowsingRequestsCache.set(x, true);
        });

        sbList = SB_WHITE_LIST;
        if (response.status !== 204) {
            sbList = processSbResponse(response.responseText, hashesMap) || SB_WHITE_LIST;
        }

        safebrowsingCache.cache.saveValue(createHash(host), sbList);
        return createResponse(sbList);
    };

    /**
     * Checks URL with safebrowsing filter.
     * http://adguard.com/en/how-malware-blocked.html#extension
     *
     * @param requestUrl Request URL
     * @param referrerUrl Referrer URL
     */
    const checkSafebrowsingFilter = async function (requestUrl, referrerUrl) {
        if (!settings.safebrowsingInfoEnabled()) {
            return;
        }

        log.debug('Checking safebrowsing filter for {0}', requestUrl);

        const sbList = await lookupUrl(requestUrl);

        if (!sbList) {
            log.debug('No safebrowsing rule found');
            return;
        }

        log.debug('Following safebrowsing filter has been fired: {0}', sbList);
        return getErrorPageURL(requestUrl, referrerUrl, sbList);
    };

    /**
     * Temporarily whitelist URL
     * Adds URL to trusted sites (this URL will be ignored by safebrowsing filter)
     *
     * @param url URL
     */
    const addToSafebrowsingTrusted = function (url) {
        const host = utils.url.getHost(url);
        if (!host) {
            return;
        }

        safebrowsingCache.cache.saveValue(createHash(host), SB_WHITE_LIST);
    };

    return {
        checkSafebrowsingFilter,
        lookupUrl,
        addToSafebrowsingTrusted,
        getErrorPageURL,
        extractHosts,
        createHashesMap,
        processSbResponse,
    };
})();

export default safebrowsing;
