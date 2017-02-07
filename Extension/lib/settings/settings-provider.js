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

/**
 * Application settings provider.
 *
 * @type {{loadSettingsManifest, loadFiltersSection, saveSettingsManifest, saveFiltersSection}}
 */
var SettingsProvider = (function () { // jshint ignore:line

    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var FILTERS_SECTION = "filters.json";

    var SYNC_SETTINGS_TIMESTAMP_KEY = 'sync.settings.timestamp';
    var SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY = 'sync.settings.filters.timestamp';

    var WHITELIST_DOMAINS_KEY = 'white-list-domains';
    var BLOCKLIST_DOMAINS_KEY = 'block-list-domains';
    var DEFAULT_WHITELIST_FLAG_KEY = 'default-whitelist-mode';


    var loadSettingsManifest = function () {
        var manifest = {
            "timestamp": adguard.localStorage.getItem(SYNC_SETTINGS_TIMESTAMP_KEY),
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "sections": [
                {
                    "name": "filters.json",
                    "timestamp": adguard.localStorage.getItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY)
                }
            ]
        };

        return manifest;
    };

    var loadFiltersSection = function (callback) {
        var enabledFilters = adguard.filters.getEnabledFilters();
        var enabledFilterIds = [];
        for (var i in enabledFilters) {
            var f = enabledFilters[i];
            if (f && f.enabled) {
                enabledFilterIds.push(f.filterId);
            }
        }

        var whitelistDomains = adguard.whitelist.getWhiteListedDomains();
        var blocklistDomains = adguard.whitelist.getBlockListedDomains();
        var defaultWhiteListMode = adguard.whitelist.isDefaultMode();
        var userRules = adguard.userrules.getRules();

        var section = {
            "filters": {
                "enabled-filters": enabledFilterIds,
                "custom-filters": [
                    // Custom filters are not supported yet
                ],
                "user-filter": {
                    "rules": userRules.join('\n'),
                    "disabled-rules": ""
                },
                "whitelist": {
                    "inverted": !defaultWhiteListMode,
                    "domains": whitelistDomains,
                    "inverted-domains": blocklistDomains
                }
            }
        };

        console.log(section);
        callback(section);
    };

    var saveSettingsManifest = function (manifest) {
        adguard.localStorage.setItem(SYNC_SETTINGS_TIMESTAMP_KEY, manifest.timestamp);

        for (var i = 0; i < manifest.sections.length; i++) {
            var section = manifest.sections[i];
            if (section.name === FILTERS_SECTION) {
                adguard.localStorage.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, section.timestamp);
            }
        }
    };

    var saveFiltersSection = function (section, callback) {
        adguard.whitelist.clearWhiteListed();
        adguard.whitelist.addWhiteListed(section.filters["whitelist"].domains);
        adguard.whitelist.clearBlockListed();
        adguard.whitelist.addBlockListed(section.filters["whitelist"]["inverted-domains"]);
        adguard.whitelist.changeDefaultWhiteListMode(section.filters["whitelist"].inverted != true);

        adguard.userrules.clearRules();
        adguard.userrules.addRules(section.filters["user-filter"].rules.split('\n'));

        var enabledFilterIds = section.filters['enabled-filters'];
        adguard.filters.addAndEnableFilters(enabledFilterIds, function () {
            adguard.localStorage.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, new Date().getTime());

            callback(true);
        });
    };

    var loadSettingsSection = function(sectionName, callback) {
        if (sectionName === FILTERS_SECTION) {
            loadFiltersSection(callback);
        } else {
            adguard.console.error('Section {0} is not supported', sectionName);

            callback(false);
        }
    };

    /**
     * Saves settings section
     *
     * @param sectionName
     * @param section
     * @param callback
     */
    var saveSettingsSection = function (sectionName, section, callback) {
        if (sectionName === FILTERS_SECTION) {
            saveFiltersSection(section, function (result) {
                if (result) {
                    adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE);
                }

                callback(result);
            });
        } else {
            adguard.console.error('Section {0} is not supported', sectionName);

            callback(false);
        }
    };

    /**
     * Updates settings record timestamp
     */
    var updateSettingsTimestamp = function () {
        var time = new Date().getTime();
        adguard.localStorage.setItem(SYNC_SETTINGS_TIMESTAMP_KEY, time);
        adguard.localStorage.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, time);
    };

    // Add listener on user settings change
    adguard.listeners.addListener(function (event) {
        if (event === adguard.listeners.FILTER_ENABLE_DISABLE) {
            console.log('update');
            updateSettingsTimestamp();
        }
    });

    // EXPOSE
    return {
        /**
         * Loads app settings manifest
         */
        loadSettingsManifest: loadSettingsManifest,
        /**
         * Loads section of app settings
         */
        loadSettingsSection: loadSettingsSection,
        /**
         * Saves app settings manifest
         */
        saveSettingsManifest: saveSettingsManifest,
        /**
         * Saves section of app settings
         */
        saveSettingsSection: saveSettingsSection,
        /**
         * Updates app settings timestamp
         */
        updateSettingsTimestamp: updateSettingsTimestamp
    };
})();