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
 * @type {{loadSettingsManifest, loadFiltersSection, updateManifestSyncTime, saveFiltersSection}}
 */
adguard.sync.settingsProvider = (function () { // jshint ignore:line

    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var FILTERS_SECTION = "filters.json";

    var SYNC_TIMESTAMPS_PROP = "sync-timestamps";

    /**
     * Loads sync timestamps from local storage
     * @returns {{timestamp: number, sections: {}}}
     */
    function loadSyncTimestamps() {
        var timestamps = {
            timestamp: 0,
            sections: {}
        };
        var item = adguard.localStorage.getItem(SYNC_TIMESTAMPS_PROP);
        if (!item) {
            return timestamps;
        }
        return JSON.parse(item);
    }

    /**
     * Save sync timestamps to local storage
     * @param manifest
     */
    function saveSyncTimestamps(manifest) {
        var timestamps = {
            timestamp: manifest.timestamp,
            sections: {}
        };
        for (var i = 0; i < manifest.sections.length; i++) {
            var section = manifest.sections[i];
            timestamps.sections[section.name] = section.timestamp;
        }
        adguard.localStorage.setItem(SYNC_TIMESTAMPS_PROP, JSON.stringify(timestamps));
    }

    /**
     * Loads local manifest object
     */
    var loadSettingsManifest = function () {
        var timestamps = loadSyncTimestamps();
        return {
            "timestamp": timestamps.timestamp || 0,
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "sections": [
                {
                    "name": FILTERS_SECTION,
                    "timestamp": timestamps.sections[FILTERS_SECTION] || 0
                }
            ]
        };
    };

    /**
     * Creates empty settings manifest.
     */
    var getEmptySettingsManifest = function () {
        return {
            "timestamp": 0,
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "sections": [
                {
                    "name": FILTERS_SECTION,
                    "timestamp": 0
                }
            ]
        };
    };

    /**
     * Loads filters settings section
     * @param callback
     */
    var loadFiltersSection = function (callback) {

        // Collect enabled filters
        var enabledFilters = adguard.filters.getEnabledFilters();
        var enabledFilterIds = [];
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            enabledFilterIds.push(filter.filterId);
        }

        // Collect whitelist/blacklist domains and whitelist mode
        var whitelistDomains = adguard.whitelist.getWhiteListedDomains() || [];
        var blocklistDomains = adguard.whitelist.getBlockListedDomains() || [];
        var defaultWhiteListMode = !!adguard.whitelist.isDefaultMode();

        // Collect user rules
        var userRules = adguard.userrules.getRules() || [];

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

    /**
     * Updates sync timestamp. If syncTime is passed it overrides manifest timestamps
     * @param manifest
     * @param syncTime
     */
    var updateManifestSyncTime = function (manifest, syncTime) {
        if (syncTime) {
            manifest.timestamp = syncTime;
            for (var i = 0; i < manifest.sections.length; i++) {
                manifest.sections[i].timestamp = syncTime;
            }
        }
        saveSyncTimestamps(manifest);
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    var applyFiltersSection = function (section, callback) {

        var whiteListSection = section.filters["whitelist"] || {}; // jshint ignore:line
        var whitelistDomains = whiteListSection.domains || [];
        var blacklistDomains = whiteListSection["inverted-domains"] || [];

        // Apply whitelist/blacklist domains and whitelist mode
        adguard.whitelist.clearWhiteListed();
        adguard.whitelist.addWhiteListed(whitelistDomains);
        adguard.whitelist.clearBlockListed();
        adguard.whitelist.addBlockListed(blacklistDomains);
        adguard.whitelist.changeDefaultWhiteListMode(!whiteListSection.inverted);

        var userFilterSection = section.filters["user-filter"] || {};
        var userRules = userFilterSection.rules || "";

        // Apply user rules
        adguard.userrules.clearRules();
        adguard.userrules.addRules(userRules.split('\n'));

        // Apply enabled filters
        var enabledFilterIds = section.filters['enabled-filters'] || [];
        adguard.filters.addAndEnableFilters(enabledFilterIds, function () {
            callback(true);
        });

        //TODO: disable filters that are not in the list
    };

    /**
     * Constructs section from application settings
     * @param sectionName Section name
     * @param callback Finish callback
     */
    var loadSection = function (sectionName, callback) {
        switch (sectionName) {
            case FILTERS_SECTION:
                loadFiltersSection(callback);
                break;
            default:
                adguard.console.error('Section {0} is not supported', sectionName);
                callback(false);
        }
    };

    /**
     * Apply section to application.
     * Now we support only filters.json section
     *
     * @param sectionName Section name
     * @param section Section object
     * @param callback Finish callback
     */
    var applySection = function (sectionName, section, callback) {
        switch (sectionName) {
            case FILTERS_SECTION:
                applyFiltersSection(section, callback);
                break;
            default:
                adguard.console.error('Section {0} is not supported', sectionName);
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
         * Gets empty settings manifest
         */
        getEmptySettingsManifest: getEmptySettingsManifest,
        /**
         * Loads section of app settings
         */
        loadSection: loadSection,
        /**
         * Updates manifest and sections sync time
         */
        updateManifestSyncTime: updateManifestSyncTime,
        /**
         * Apply section to application
         */
        applySection: applySection
    };
})();