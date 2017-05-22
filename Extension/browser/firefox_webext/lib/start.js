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
 * Extension start entry point.
 * In this particular case, we have to process migration from bootstrapped add-on to WebExtension.
 */
(function (adguard) {

    'use strict';

    var SETTINGS_MIGRATED_PROP = 'adguard-settings-migrated';

    /**
     * Saves user settings to localStorage
     * @param values
     * @param callback
     */
    function migrateUserSettings(values, callback) {
        if (values) {
            for (var key in values) {
                if (values.hasOwnProperty(key)) {
                    adguard.localStorage.setItem(key, values[key]);
                }
            }
        }
        adguard.console.info('Adguard: User settings have been migrated.\n{0}', JSON.stringify(values));
        callback();
    }

    /**
     * Saves filter's rules to browser.storage
     * @param values
     * @param callback
     */
    function migrateFiltersRules(values, callback) {
        if (values) {
            var item = {};
            item[values.key] = values.value;
            adguard.rulesStorageImpl.write(values.key, values.value, function (ex) {
                if (ex) {
                    adguard.console.error('Adguard: Error while migrate filter "{0}" rules, {1}', values.key, ex);
                } else {
                    adguard.console.info('Adguard: Filter "{0}" rules have been migrated', values.key);
                }
                callback();
            });
        } else {
            callback();
        }
    }

    function migrateAll(callback) {

        if (adguard.localStorage.getItem(SETTINGS_MIGRATED_PROP)) {
            callback();
            return;
        }

        var requestAttempts = 0;

        /**
         * webExtension startup takes a time, so try to request for migration several times.
         */
        function onEmptyResponse() {
            requestAttempts++;
            if (requestAttempts >= 10) {
                adguard.console.warn('Adguard: Unable to migrate settings. Perhaps, there were errors during WebExtension initialization.');
                callback();
            } else {
                setTimeout(migrateNext, 100);
            }
        }

        function migrateNext() {
            browser.runtime.sendMessage({type: 'Adguard:WebExtMigration'}, function (response) {
                if (!response || browser.runtime.lastError) {
                    onEmptyResponse();
                    return;
                }
                switch (response.type) {
                    case 'user-settings':
                        migrateUserSettings(response.values, migrateNext);
                        break;
                    case 'filter-rules':
                        migrateFiltersRules(response.values, migrateNext);
                        break;
                    case 'finished':
                        adguard.localStorage.setItem(SETTINGS_MIGRATED_PROP, true);
                        callback();
                        break;
                }
            });
        }

        migrateNext();
    }

    adguard.localStorage.init(function () {
        /**
         * Migrate extension settings. Request to listener in bootstrap.js which is allowed in EmbeddedWebExtensions.
         * https://blog.mozilla.org/addons/2017/01/20/migrating-to-webextensions-port-your-stored-data/
         */
        migrateAll(adguard.initialize);
    });

})(adguard);