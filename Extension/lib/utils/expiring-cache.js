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

(function (adguard) {
    /**
     * Cache with maxCacheSize stored in local storage, which automatically clears expired values
     *
     * @param {string} storagePropertyName      Name of the local storage property.
     * @param {number} size                     Max cache size
     */
    function ExpiringCache(storagePropertyName, size) {
        const CACHE_SIZE = 1000;

        const maxCacheSize = size || CACHE_SIZE;

        let cache;
        let cacheSize;

        function getCacheFromLocalStorage() {
            let data = Object.create(null);
            try {
                const json = adguard.localStorage.getItem(storagePropertyName);
                if (json) {
                    data = JSON.parse(json);
                }
            } catch (ex) {
                // ignore
                adguard.console.error('Error read from {0} cache, cause: {1}', storagePropertyName, ex);
                adguard.localStorage.removeItem(storagePropertyName);
            }
            return data;
        }

        function saveCacheToLocalStorage() {
            try {
                adguard.localStorage.setItem(storagePropertyName, JSON.stringify(cache));
            } catch (ex) {
                adguard.console.error('Error save to {0} cache, cause: {1}', storagePropertyName, ex);
            }
        }

        /**
         * Retrieves value from cache and checks if saved data is not expired yet.
         * @param {string} key
         * @returns {null|object} saved data
         */
        function getValue(key) {
            const value = cache[key];
            if (value !== undefined) {
                const expires = value.expires - 0;
                if (Date.now() >= expires) {
                    return null;
                }
                return value.data;
            }
            return null;
        }

        function cleanup() {
            const keys = Object.keys(cache);
            for (let i = 0; i < keys.length; i += 1) {
                const key = keys[i];
                const foundItem = getValue(key);
                if (!foundItem) {
                    delete cache[key];
                    cacheSize -= 1;
                }
            }
            if (cacheSize > maxCacheSize / 2) {
                const keys = Object.keys(cache);
                for (let i = 0; i < keys.length; i += 1) {
                    const key = keys[i];
                    delete cache[key];
                    cacheSize -= 1;
                    if (cacheSize <= maxCacheSize / 2) {
                        break;
                    }
                }
            }
            saveCacheToLocalStorage();
        }

        const saveValue = function (key, data, expires) {
            if (!key) {
                return;
            }
            if (cacheSize > maxCacheSize) {
                cleanup();
            }
            cache[key] = {
                data,
                expires,
            };
            cacheSize += 1;

            if (cacheSize % 20 === 0) {
                saveCacheToLocalStorage();
            }
        };

        // Load cache
        cache = getCacheFromLocalStorage();
        cacheSize = Object.keys(cache).length;

        cleanup();

        return {
            getValue,
            saveValue,
        };
    }

    adguard.utils.ExpiringCache = ExpiringCache;
})(adguard);
