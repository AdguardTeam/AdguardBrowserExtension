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

/* global chrome */

/**
 * Sync settings provider
 */
(function (api, adguard) {

    /**
     * Loads file from chrome syncable storage.
     *
     * @param filePath
     * @param callback
     */
    var load = function (filePath, callback) {
        chrome.storage.sync.get([filePath], function (items) {
            var e = chrome.runtime.lastError;
            if (e) {
                adguard.console.error(e);
                callback(false);
                return;
            }

            var data = items ? items[filePath] : null;
            callback(data);
        });
    };

    /**
     * Saves file to to chrome syncable storage.
     * TODO: The storage has a quota, so we need to split long files.
     *
     * @param filePath
     * @param data
     * @param callback
     */
    var save = function (filePath, data, callback) {

        var items = {};
        items[filePath] = data;

        chrome.storage.sync.set(items, function () {

            var e = chrome.runtime.lastError;
            if (e) {
                adguard.console.error(e);
                callback(false);
                return;
            }

            callback(true);
        });
    };

    // EXPOSE
    api.storageSyncProvider = {
        /**
         * Loads data from provider
         */
        load: load,
        /**
         * Saves data to provider
         */
        save: save
    };

})(adguard.sync, adguard);