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
     *
     * @param filePath
     * @param data
     * @param callback
     */
    var save = function (filePath, data, callback) {

        var items = {};
        items[filePath] = cropData(filePath, data, true);

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

    /**
     * The storage has a quota, so we need to crop long files.
     *
     * @param key
     * @param data
     * @param warn
     */
    var cropData = function (key, data, warn) {
        var itemSize = key.length + JSON.stringify(data).length + 20;
        var oversize = itemSize - chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
        if (oversize > 0) {
            if (data.filters && data.filters["user-filter"]
                && data.filters["user-filter"].rules) {
                // Cut user-filter field
                if (warn) {
                    adguard.console.warn('The data is over quota limit and will be cropped approximately by ' + oversize + ' bytes');
                }

                var rules = data.filters["user-filter"].rules;
                rules = rules.substring(0, JSON.stringify(rules).length - oversize);
                rules = rules.substring(0, rules.lastIndexOf('\n'));
                data.filters["user-filter"].rules = rules;

                return cropData(key, data);
            }
        }

        // Can't do anything return untouched data
        return data;
    };

    // EXPOSE
    api.storageSyncProvider = {
        /**
         * Provider name
         */
        get name() {
            return 'CHROME';
        },
        /**
         * Loads data from provider
         */
        load: load,
        /**
         * Saves data to provider
         */
        save: save,
    };

})(adguard.sync, adguard);