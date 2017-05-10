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

/* global browser */

/**
 * Local storage implementation for chromium-based browsers
 */
adguard.localStorageImpl = (function () {

    var ADGUARD_SETTINGS_PROP = 'adguard-settings';
    var values = null;

    function checkError(ex) {
        if (ex) {
            adguard.console.error('{0}', ex);
        }
    }

    /**
     * Checks runtime.lastError and calls "callback" if so.
     *
     * @returns true if operation caused error
     */
    function checkLastError(callback) {
        if (browser.runtime.lastError) {
            callback(browser.runtime.lastError);
            return true;
        }
        return false;
    }

    /**
     * Reads data from storage.local
     * @param path Path
     * @param callback Callback
     */
    function read(path, callback) {
        try {
            browser.storage.local.get(path, function (results) {
                if (!checkLastError(callback)) {
                    var result = null;
                    if (results) {
                        result = results[path];
                    }
                    callback(null, result);
                }
            });
        } catch (ex) {
            callback(ex);
        }
    }

    /**
     * Writes data to storage.local
     * @param path Path
     * @param data Data to write
     * @param callback Callback
     */
    function write(path, data, callback) {
        var item = {};
        item[path] = data;
        try {
            browser.storage.local.set(item, function () {
                if (!checkLastError(callback)) {
                    callback();
                }
            });
        } catch (ex) {
            callback(ex);
        }
    }

    /**
     * Migrates key-value pair from local storage to storage.local
     * Part of task https://github.com/AdguardTeam/AdguardBrowserExtension/issues/681
     * @param key Key to migrate
     */
    function migrateKeyValue(key) {
        if (key in localStorage) {
            var value = localStorage.getItem(key);
            localStorage.removeItem(key);
            setItem(key, value);
        }
    }

    /**
     * Retrieves value by key from cached values
     * @param key
     * @returns {*}
     */
    var getItem = function (key) {
        if (!(key in values)) {
            migrateKeyValue(key);
        }
        return values[key];
    };

    var setItem = function (key, value) {
        values[key] = value;
        write(ADGUARD_SETTINGS_PROP, values, checkError);
    };

    var removeItem = function (key) {
        delete values[key];
        // Remove from localStorage too, as a part of migration process
        localStorage.removeItem(key);
        write(ADGUARD_SETTINGS_PROP, values, checkError);
    };

    var hasItem = function (key) {
        if (key in values) {
            return true;
        }
        migrateKeyValue(key);
        return key in values;
    };

    /**
     * We can't use localStorage object anymore and we've decided to store all data into storage.local
     * localStorage is affected by cleaning tools: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/681
     * storage.local has async nature and we have to preload all key-values pairs into memory on extension startup
     *
     * @param callback
     */
    var init = function (callback) {
        if (values !== null) {
            // Already initialized
            callback();
            return;
        }
        read(ADGUARD_SETTINGS_PROP, function (ex, items) {
            if (ex) {
                checkError(ex);
            }
            values = items || Object.create(null);
            callback();
        });
    };

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        hasItem: hasItem,
        init: init
    };

})();