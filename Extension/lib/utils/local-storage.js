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

import { utils } from './common';
import { log } from '../../../tools/log';
import { browser } from '../browser';


/**
 * Local storage implementation for chromium-based browsers
 */
export const localStorageImpl = (function () {
    const ADGUARD_SETTINGS_PROP = 'adguard-settings';
    let values = null;

    function checkError(ex) {
        if (ex) {
            log.error('{0}', ex);
        }
    }

    /**
     * Creates default handler for async operation
     * @param callback Callback, fired with parameters (ex, result)
     */
    function createDefaultAsyncHandler(callback) {
        const dfd = new utils.Promise();
        dfd.then(
            (result) => {
                callback(null, result);
            }, (ex) => {
                callback(ex);
            }
        );

        return dfd;
    }

    /**
     * Reads data from storage.local
     * @param path Path
     * @param callback Callback
     */
    function read(path, callback) {
        const dfd = createDefaultAsyncHandler(callback);

        try {
            browser.storage.local.get(path, (results) => {
                if (browser.runtime.lastError) {
                    dfd.reject(browser.runtime.lastError);
                } else {
                    dfd.resolve(results ? results[path] : null);
                }
            });
        } catch (ex) {
            dfd.reject(ex);
        }
    }

    /**
     * Writes data to storage.local
     * @param path Path
     * @param data Data to write
     * @param callback Callback
     */
    function write(path, data, callback) {
        const dfd = createDefaultAsyncHandler(callback);

        try {
            const item = {};
            item[path] = data;
            browser.storage.local.set(item, () => {
                if (browser.runtime.lastError) {
                    dfd.reject(browser.runtime.lastError);
                } else {
                    dfd.resolve();
                }
            });
        } catch (ex) {
            dfd.reject(ex);
        }
    }

    /**
     * Migrates key-value pair from local storage to storage.local
     * Part of task https://github.com/AdguardTeam/AdguardBrowserExtension/issues/681
     * @param key Key to migrate
     */
    function migrateKeyValue(key) {
        if (key in localStorage) {
            const value = localStorage.getItem(key);
            localStorage.removeItem(key);
            setItem(key, value);
        }
    }

    /**
     * Due to async initialization of storage, we have to check it before accessing values object
     * @returns {boolean}
     */
    function isInitialized() {
        return values !== null;
    }

    /**
     * Retrieves value by key from cached values
     * @param key
     * @returns {*}
     */
    function getItem(key) {
        if (!isInitialized()) {
            return null;
        }
        if (!(key in values)) {
            migrateKeyValue(key);
        }
        return values[key];
    }

    function setItem(key, value) {
        if (!isInitialized()) {
            return;
        }
        values[key] = value;
        write(ADGUARD_SETTINGS_PROP, values, checkError);
    }

    function removeItem(key) {
        if (!isInitialized()) {
            return;
        }
        delete values[key];
        // Remove from localStorage too, as a part of migration process
        localStorage.removeItem(key);
        write(ADGUARD_SETTINGS_PROP, values, checkError);
    }

    function hasItem(key) {
        if (!isInitialized()) {
            return false;
        }
        if (key in values) {
            return true;
        }
        migrateKeyValue(key);
        return key in values;
    }

    /**
     * We can't use localStorage object anymore and we've decided to store all data into storage.local
     * localStorage is affected by cleaning tools: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/681
     * storage.local has async nature and we have to preload all key-values pairs into memory on extension startup
     *
     * @param callback
     */
    function init(callback) {
        if (isInitialized()) {
            // Already initialized
            callback();
            return;
        }
        read(ADGUARD_SETTINGS_PROP, (ex, items) => {
            if (ex) {
                checkError(ex);
            }
            values = items || Object.create(null);
            callback();
        });
    }

    return {
        getItem,
        setItem,
        removeItem,
        hasItem,
        init,
        isInitialized,
    };
})();
