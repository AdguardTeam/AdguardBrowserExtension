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

var LS = require('../../lib/utils/local-storage').LS;
var FilterLSUtils = require('../../lib/utils/filters-storage').FilterLSUtils;
var ServiceClient = require('../../lib/utils/service-client').ServiceClient;
var AntiBannerFiltersId = require('../../lib/utils/common').AntiBannerFiltersId;

/**
 * Application settings provider.
 *
 * @type {{loadSettingsManifest, loadFiltersSection, saveSettingsManifest, saveFiltersSection}}
 */
var SettingsProvider = (function () { // jshint ignore:line

    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var SYNC_SETTINGS_TIMESTAMP_KEY = 'sync.settings.timestamp';
    var SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY = 'sync.settings.filters.timestamp';

    var WHITELIST_DOMAINS_KEY = 'white-list-domains';
    var DEFAULT_WHITELIST_FLAG_KEY = 'default-whitelist-mode';

    var serviceClient = new ServiceClient();


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
        for (var i = 0; i < filtersState.length; i++) {
            var f = filtersState[i];
            if (f && f.enabled) {
                enabledFilterIds.push(i);
            }
        }

        var whitelistDomains = [];
        var json = LS.getItem(WHITELIST_DOMAINS_KEY);
        if (json) {
            whitelistDomains = JSON.parse(json);
        }

        var defaultWhiteListMode = LS.getItem(DEFAULT_WHITELIST_FLAG_KEY);

        var onUserFilterRulesLoaded = function (result) {
            var userFilterRules = [];

            for (var i = 0; i < result.length; i++) {
                var r = result[i];
                userFilterRules.push(r.ruleText);
            }

            var section = {
                "filters": {
                    "enabled-filters": enabledFilterIds,
                    "custom-filters": [
                        // Custom filters are not supported yet
                    ],
                    "user-filter": {
                        "rules": userFilterRules,
                        "disabled-rules": ""
                    },
                    "whitelist": {
                        "inverted": defaultWhiteListMode != 'true',
                        "domains": whitelistDomains
                    }
                }
            };

            callback(section);
        };

        serviceClient.loadLocalFilter(AntiBannerFiltersId.USER_FILTER_ID, false, onUserFilterRulesLoaded);
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
        LS.setItem(DEFAULT_WHITELIST_FLAG_KEY, section.filters["whitelist"].inverted != true);

        //TODO: save user filter

        LS.setItem(SYNC_SETTINGS_FILTERS_TIMESTAMP_KEY, new Date().getTime());

        callback(true);
    };


    // EXPOSE
    return {
        /**
         * Loads app settings manifest
         */
        loadSettingsManifest: loadSettingsManifest,
        /**
         * Loads filters section of app settings
         */
        loadFiltersSection: loadFiltersSection,
        /**
         * Saves app settings manifest
         */
        saveSettingsManifest: saveSettingsManifest,
        /**
         * Saves filters section of app settings
         */
        saveFiltersSection: saveFiltersSection
    };
})();