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

/* global IDBDatabase, indexedDB */

/**
 * Filter rules storage implementation. Based on the indexedDB
 *
 * We have to use indexedDB instead of browser.storage.local due to some problems with the latest one.
 * browser.storage.local has high memory and disk utilization.
 *
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1371255
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/892
 */
adguard.rulesStorageImpl = (function (adguard, initialAPI) {

    var STORAGE_NAME = 'AdguardRulesStorage';

    var database;

    function onError(error) {
        adguard.console.error('Adguard rulesStorage error: {0}', error.error || error);
    }

    /**
     * Gets value from the database by key
     */
    function getFromDatabase(key, callback) {

        var transaction = database.transaction(STORAGE_NAME);
        var table = transaction.objectStore(STORAGE_NAME);

        var request = table.get(key);
        request.onsuccess = callback;
        request.onerror = callback;
    }

    /**
     * Puts key and value to the database
     */
    function putToDatabase(key, value, callback) {

        var transaction = database.transaction(STORAGE_NAME, 'readwrite');
        var table = transaction.objectStore(STORAGE_NAME);

        var request = table.put({
            key: key,
            value: value.join('\n')
        });
        request.onsuccess = callback;
        request.onerror = callback;
    }

    /**
     * Deletes value from the database
     */
    function deleteFromDatabase(key, callback) {

        var transaction = database.transaction(STORAGE_NAME, 'readwrite');
        var table = transaction.objectStore(STORAGE_NAME);

        var request = table.delete(key);
        request.onsuccess = callback;
        request.onerror = callback;
    }

    /**
     * Read rules
     * @param path Path to rules
     * @param callback
     */
    var read = function (path, callback) {
        return getFromDatabase(path, function (event) {
            var request = event.target;
            if (request.error) {
                callback(request.error);
                return;
            }
            var lines = [];
            var result = request.result;
            if (result && result.value) {
                lines = result.value.split(/[\r\n]+/);
            }
            callback(null, lines);
        });
    };

    /**
     * Writes rules
     * @param path Path to rules
     * @param data Data to write (Array)
     * @param callback
     */
    var write = function (path, data, callback) {
        putToDatabase(path, data, function (event) {
            var request = event.target;
            callback(request.error);
        });
    };

    /**
     * Removes rules
     * @param path Path to rules
     * @param callback
     */
    var remove = function (path, callback) {
        deleteFromDatabase(path, callback || function () {
        });
    };

    /**
     * We can detect whether IndexedDB was initialized or not only in an async way
     *
     * @param callback
     */
    var init = function (callback) {

        // Failed in private browsing mode.
        var request = indexedDB.open(STORAGE_NAME, 1);

        request.onupgradeneeded = function (ev) {
            database = ev.target.result;
            database.onerror = database.onabort = onError;
            // DB doesn't exist => creates new storage
            var table = database.createObjectStore(STORAGE_NAME, {keyPath: 'key'});
            table.createIndex('value', 'value', {unique: false});
        };

        request.onsuccess = function (ev) {
            database = ev.target.result;
            database.onerror = database.onabort = onError;
            callback(api);
        };

        request.onerror = request.onblocked = function () {
            onError(this.error);
            // Fallback to the browser.storage API
            callback(initialAPI);
        };
    };

    var api = {};
    api.read = read;
    api.write = write;
    api.remove = remove;
    api.init = init;
    api.migrationRequired = true; // For data migration

    return api;

})(adguard, adguard.rulesStorageImpl || {});