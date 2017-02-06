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
        var filtersState = adguard.filtersState.getFiltersState();
        var enabledFilterIds = [];
        for (var i in filtersState) {
            var f = filtersState[i];
            if (f && f.enabled) {
                enabledFilterIds.push(i);
            }
        }

        var whitelistDomains = [];
        var json = adguard.localStorage.getItem(WHITELIST_DOMAINS_KEY);
        if (json) {
            whitelistDomains = JSON.parse(json);
        }

        var blocklistDomains = [];
        var blocklistJson = adguard.localStorage.getItem(BLOCKLIST_DOMAINS_KEY);
        if (blocklistJson) {
            blocklistDomains = JSON.parse(blocklistJson);
        }

        var defaultWhiteListMode = adguard.localStorage.getItem(DEFAULT_WHITELIST_FLAG_KEY);

        var onUserFilterRulesLoaded = function (result) {
            var userFilterRules = [];

            for (var i = 0; i < result.length; i++) {
                var r = result[i];
                userFilterRules.push(r);
            }

            var section = {
                "filters": {
                    "enabled-filters": enabledFilterIds,
                    "custom-filters": [
                        // Custom filters are not supported yet
                    ],
                    "user-filter": {
                        "rules": userFilterRules.join('\n'),
                        "disabled-rules": ""
                    },
                    "whitelist": {
                        "inverted": defaultWhiteListMode === 'false',
                        "domains": whitelistDomains,
                        "inverted-domains": blocklistDomains
                    }
                }
            };

            callback(section);
        };

        var filterId = adguard.utils.filters.USER_FILTER_ID;
        adguard.rulesStorage.read(filterId, onUserFilterRulesLoaded);
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
        var enabledFilterIds = section.filters['enabled-filters'];

        var filtersState = adguard.filtersState.getFiltersState();
        for (var i in filtersState) {
            var f = filtersState[i];
            if (f) {
                f.filterId = i;
                f.enabled = enabledFilterIds.indexOf(i) >= 0;

                adguard.filtersState.updateFilterState(f);
            }
        }

        adguard.localStorage.setItem(WHITELIST_DOMAINS_KEY, JSON.stringify(section.filters["whitelist"].domains));
        adguard.localStorage.setItem(BLOCKLIST_DOMAINS_KEY, JSON.stringify(section.filters["whitelist"]["inverted-domains"]));
        adguard.localStorage.setItem(DEFAULT_WHITELIST_FLAG_KEY, section.filters["whitelist"].inverted != true);

        adguard.rulesStorage.write(adguard.utils.filters.USER_FILTER_ID, section.filters["user-filter"].rules.split('\n'), function() {
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
     * TODO: Should trigger app settings refresh
     *
     * @param sectionName
     * @param section
     * @param callback
     */
    var saveSettingsSection = function (sectionName, section, callback) {
        if (sectionName === FILTERS_SECTION) {
            saveFiltersSection(section, callback);
        } else {
            adguard.console.error('Section {0} is not supported', sectionName);

            callback(false);
        }
    };

    /**
     * TODO: Should be triggered on app settings updates
     */
    var updateSettingsTimestamp = function () {
        var time = new Date().getTime();
        adguard.localStorage.setItem(SYNC_SETTINGS_TIMESTAMP_KEY, time);
        adguard.localStorage.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, time);
    };

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