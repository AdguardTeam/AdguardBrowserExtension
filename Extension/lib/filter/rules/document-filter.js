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

/* global adguard */

(function (adguard, api) {
    const { utils: { url: urlUtils } } = adguard;

    const trustedCache = (() => {
        const MAX_CACHE_SIZE = 1000;
        const CLEANING_INTERVAL = 50;
        const cache = {};
        let savesNumberSinceCleaning = 0;

        const cleanExpired = () => {
            const keys = Object.keys(cache);
            const currentTime = Date.now();
            keys.forEach((key) => {
                const value = cache[key];
                const { expires } = value;
                if (expires < currentTime) {
                    delete cache[key];
                }
            });
        };

        /**
         * Checks size and clears expired values when size of cache is too big and values
         * were saved more than defined number of times
         */
        const checkSize = () => {
            const size = Object.keys(cache).length;
            if (size < MAX_CACHE_SIZE
                && savesNumberSinceCleaning < CLEANING_INTERVAL) {
                return;
            }
            cleanExpired();
            savesNumberSinceCleaning = 0;
        };

        /**
         * Saves host in the cache
         * @param host
         * @param expires
         */
        const saveValue = (host, expires) => {
            cache[host] = { host, expires };
            savesNumberSinceCleaning += 1;
            checkSize();
        };

        /**
         * Returns value from hash by host
         * @param host
         * @returns {null|*}
         */
        const getValue = (host) => {
            const value = cache[host];
            if (!value) {
                return null;
            }
            return value;
        };

        return {
            saveValue,
            getValue,
        };
    })();

    function documentFilterService() {
        const TRUSTED_TTL = 1000 * 60 * 40;
        const DOCUMENT_BLOCKED_URL = 'pages/blocking-pages/adBlockedPage.html';

        /**
         * Checks if url is trusted
         * @param url
         * @returns {boolean}
         */
        const isTrusted = (url) => {
            const host = urlUtils.getHost(url);
            if (!host) {
                return false;
            }
            const value = trustedCache.getValue(host);
            return !!(value && value.expires > Date.now());
        };

        /**
         * Return url of the document block page and ads there parameters with rule and url
         * @param url
         * @param ruleText
         * @returns {null|string}
         */
        const getDocumentBlockedPage = (url, ruleText) => {
            if (isTrusted(url)) {
                return null;
            }

            let blockingUrl = adguard.getURL(DOCUMENT_BLOCKED_URL);

            blockingUrl += `?url=${encodeURIComponent(url)}`;
            blockingUrl += `&rule=${encodeURIComponent(ruleText)}`;

            return blockingUrl;
        };

        /**
         * Gets url host and adds it the cache of trusted domains
         * @param url
         */
        const addToTrusted = (url) => {
            const host = urlUtils.getHost(url);
            if (!host) {
                return;
            }
            trustedCache.saveValue(host, Date.now() + TRUSTED_TTL);

            // Reloads ad-blocked page with trusted url
            adguard.tabs.getActive((tab) => {
                adguard.tabs.reload(tab.tabId, url);
            });
        };

        return {
            getDocumentBlockedPage,
            addToTrusted,
        };
    }

    api.documentFilterService = documentFilterService();
})(adguard, adguard.rules);
