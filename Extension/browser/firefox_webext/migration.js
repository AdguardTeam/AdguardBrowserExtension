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
 * Migrate extension settings. Request to listener in bootstrap.js which is allowed in EmbeddedWebExtensions.
 * https://blog.mozilla.org/addons/2017/01/20/migrating-to-webextensions-port-your-stored-data/
 */
(function () {

    'use strict';

    /**
     * Saves settings to localStorage
     * @param values
     * @param callback
     */
    function migrateLocalStorage(values, callback) {
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                localStorage[key] = values[key];
            }
        }
        console.log('Adguard: Prefs migration finished.\n' + JSON.stringify(values));
        callback();
    }

    /**
     * Saves filter's rules to browser.storage
     * @param values
     * @param callback
     */
    function migrateStorage(values, callback) {
        var item = {};
        item[values.key] = values.value;
        browser.storage.local.set(item, callback);
        console.log('Adguard: Filter "' + values.key + '" rules have been migrated');
    }

    function migrateAll(callback) {

        function migrateNext() {
            browser.runtime.sendMessage({type: 'Adguard:WebExtMigration'}, function (response) {
                if (!response) {
                    migrateNext();
                    return;
                }
                switch (response.type) {
                    case 'localStorage':
                        migrateLocalStorage(response.values, migrateNext);
                        break;
                    case 'storage':
                        migrateStorage(response.values, migrateNext);
                        break;
                    case 'finished':
                        callback();
                        break;
                }
            });
        }

        migrateNext();
    }

    adguard.preInitializationHook = migrateAll;

})();