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

/* global Log */

var LS = require('../../lib/utils/local-storage').LS;
var FilterLSUtils = require('../../lib/utils/filters-storage').FilterLSUtils;
var AntiBannerFiltersId = require('../../lib/utils/common').AntiBannerFiltersId;
var FilterStorage = require('../../lib/filter/storage').FilterStorage;

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
            "timestamp": LS.getItem(SYNC_SETTINGS_TIMESTAMP_KEY),
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "sections": [
                {
                    "name": "filters.json",
                    "timestamp": LS.getItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY)
                }
            ]
        };

        return manifest;
    };

    var loadFiltersSection = function (callback) {
        var filtersState = FilterLSUtils.getFiltersStateInfo();
        var enabledFilterIds = [];
        if (filtersState instanceof Array) {
            for (var i = 0; i < filtersState.length; i++) {
                var f = filtersState[i];
                if (f && f.enabled) {
                    enabledFilterIds.push(i);
                }
            }
        }

        var whitelistDomains = [];
        var json = LS.getItem(WHITELIST_DOMAINS_KEY);
        if (json) {
            whitelistDomains = JSON.parse(json);
        }

        var blocklistDomains = [];
        var blocklistJson = LS.getItem(BLOCKLIST_DOMAINS_KEY);
        if (blocklistJson) {
            blocklistDomains = JSON.parse(blocklistJson);
        }

        var defaultWhiteListMode = LS.getItem(DEFAULT_WHITELIST_FLAG_KEY);

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
                        "inverted": defaultWhiteListMode != 'true',
                        "domains": whitelistDomains,
                        "inverted-domains": blocklistDomains
                    }
                }
            };

            callback(section);
        };

        FilterStorage.loadFilterRules(AntiBannerFiltersId.USER_FILTER_ID, onUserFilterRulesLoaded);
    };

    var saveSettingsManifest = function (manifest) {
        LS.setItem(SYNC_SETTINGS_TIMESTAMP_KEY, new Date().getTime());
    };

    var saveFiltersSection = function (section, callback) {
        var enabledFilterIds = section.filters['enabled-filters'];

        var filtersState = FilterLSUtils.getFiltersStateInfo();
        for (var i = 0; i < filtersState.length; i++) {
            var f = filtersState[i];
            if (f) {
                f.filterId = i;
                f.enabled = enabledFilterIds.indexOf(i) >= 0;

                FilterLSUtils.updateFilterStateInfo(f);
            }
        }

        LS.setItem(WHITELIST_DOMAINS_KEY, JSON.stringify(section.filters["whitelist"].domains));
        LS.setItem(BLOCKLIST_DOMAINS_KEY, JSON.stringify(section.filters["whitelist"]["inverted-domains"]));
        LS.setItem(DEFAULT_WHITELIST_FLAG_KEY, section.filters["whitelist"].inverted != true);

        FilterStorage.saveFilterRules(AntiBannerFiltersId.USER_FILTER_ID, section.filters["user-filter"].rules.split('\n'), function () {
            LS.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, new Date().getTime());

            callback(true);
        });
    };

    var loadSettingsSection = function(sectionName, callback) {
        if (sectionName === FILTERS_SECTION) {
            loadFiltersSection(callback);
        } else {
            Log.error('Section {0} is not supported', sectionName);

            callback(false);
        }
    };

    var saveSettingsSection = function (sectionName, section, callback) {
        if (sectionName === FILTERS_SECTION) {
            saveFiltersSection(section, callback);
        } else {
            Log.error('Section {0} is not supported', sectionName);

            callback(false);
        }
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
        saveSettingsSection: saveSettingsSection
    };
})();