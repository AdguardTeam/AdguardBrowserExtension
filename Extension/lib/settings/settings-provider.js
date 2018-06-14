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
 */
(function (api, adguard) { // jshint ignore:line

    var PROTOCOL_VERSION = "1.0";
    var APP_ID = "adguard-browser-extension";

    var FILTERS_SECTION = "filters.json";
    var GENERAL_SECTION = "general-settings.json";
    var EXTENSION_SPECIFIC_SECTION = "extension-specific-settings.json";

    var SYNC_MANIFEST_PROP = "sync-manifest";

    var BACKUP_PROTOCOL_VERSION = "1.0";

    /**
     * Loads local manifest object
     */
    var loadLocalManifest = function () {
        var manifest = {
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "timestamp": 0,
            "sections": [
                {
                    "name": FILTERS_SECTION,
                    "timestamp": 0
                },
                {
                    "name": GENERAL_SECTION,
                    "timestamp": 0
                },
                {
                    "name": EXTENSION_SPECIFIC_SECTION,
                    "timestamp": 0
                }
            ]
        };
        var item = adguard.localStorage.getItem(SYNC_MANIFEST_PROP);
        if (!item) {
            return manifest;
        }
        try {
            var localManifest = JSON.parse(item);
            manifest.timestamp = localManifest.timestamp;
            manifest.sections = localManifest.sections;
        } catch (ex) {
            adguard.console.error('Error parsing local manifest {0}, {1}', item, ex);
        }
        return manifest;
    };

    /**
     * Creates empty settings manifest.
     */
    var getEmptyLocalManifest = function () {
        return {
            "protocol-version": PROTOCOL_VERSION,
            "min-compatible-version": PROTOCOL_VERSION,
            "app-id": APP_ID,
            "timestamp": 0,
            "sections": [
                {
                    "name": FILTERS_SECTION,
                    "timestamp": 0
                },
                {
                    "name": GENERAL_SECTION,
                    "timestamp": 0
                },
                {
                    "name": EXTENSION_SPECIFIC_SECTION,
                    "timestamp": 0
                }
            ]
        };
    };

    /**
     * Collect enabled filters
     * @returns {Array}
     */
    var collectEnabledFilterIds = function () {
        // Collect enabled filters
        var enabledFilters = adguard.filters.getEnabledFilters();
        var enabledFilterIds = [];
        for (var i = 0; i < enabledFilters.length; i++) {
            var filter = enabledFilters[i];
            enabledFilterIds.push(filter.filterId);
        }

        return enabledFilterIds;
    };

    /**
     * Loads filters settings section
     * @param callback
     */
    var loadFiltersSection = function (callback) {
        var enabledFilterIds = collectEnabledFilterIds();

        // Collect whitelist/blacklist domains and whitelist mode
        var whitelistDomains = adguard.whitelist.getWhiteListedDomains() || [];
        var blocklistDomains = adguard.whitelist.getBlockListedDomains() || [];
        var defaultWhiteListMode = !!adguard.whitelist.isDefaultMode();

        // Collect user rules
        adguard.userrules.getUserRulesText(function (content) {
            var section = {
                "filters": {
                    "enabled-filters": enabledFilterIds,
                    "custom-filters": [
                        // Custom filters are not supported yet
                    ],
                    "user-filter": {
                        "rules": content,
                        "disabled-rules": ""
                    },
                    "whitelist": {
                        "inverted": !defaultWhiteListMode,
                        "domains": whitelistDomains,
                        "inverted-domains": blocklistDomains
                    }
                }
            };

            callback(section);
        });
    };

    /**
     * Loads general settings section
     * @param callback
     */
    var loadGeneralSettingsSection = function (callback) {

        var enabledFilterIds = collectEnabledFilterIds();
        var allowAcceptableAds = enabledFilterIds.indexOf(adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID) >= 0;

        var section = {
            "general-settings": {
                "app-language": adguard.app.getLocale(),
                "allow-acceptable-ads": allowAcceptableAds,
                "show-blocked-ads-count": adguard.settings.showPageStatistic(),
                "autodetect-filters": adguard.settings.isAutodetectFilters(),
                "safebrowsing-enabled": adguard.settings.getSafebrowsingInfo().enabled,
                "safebrowsing-help": adguard.settings.getSafebrowsingInfo().sendStats
            }
        };

        callback(section);
    };

    /**
     * Loads extension specific settings section
     * @param callback
     */
    var loadExtensionSpecificSettingsSection = function (callback) {

        var section = {
            "extension-specific-settings": {
                "use-optimized-filters": adguard.settings.isUseOptimizedFiltersEnabled(),
                "collect-hits-count": adguard.settings.collectHitsCount(),
                "show-context-menu": adguard.settings.showContextMenu(),
                "show-info-about-adguard": adguard.settings.isShowInfoAboutAdguardFullVersion(),
                "show-app-updated-info": adguard.settings.isShowAppUpdatedNotification()
            }
        };

        callback(section);
    };

    /**
     * Saves manifest and its sections timestamps. If syncTime is passed, timestamps are updated with this value
     * @param manifest Manifest
     * @param syncTime Synchronization time
     * @param sections updated sections names array
     */
    var syncLocalManifest = function (manifest, syncTime, sections) {
        if (syncTime) {
            manifest.timestamp = syncTime;
            for (var i = 0; i < manifest.sections.length; i++) {
                var section = manifest.sections[i];
                if (sections) {
                    if (sections.indexOf(section.name) >= 0) {
                        section.timestamp = syncTime;
                    }
                } else {
                    section.timestamp = syncTime;
                }
            }
        }
        adguard.localStorage.setItem(SYNC_MANIFEST_PROP, JSON.stringify(manifest));
    };

    /**
     * Applies general section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    var applyGeneralSettingsSection = function (section, callback) {
        var syncSuppressOptions = {
            syncSuppress: true
        };

        var set = section["general-settings"];

        adguard.settings.changeShowPageStatistic(!!set["show-blocked-ads-count"], syncSuppressOptions);
        adguard.settings.changeAutodetectFilters(!!set["autodetect-filters"], syncSuppressOptions);
        adguard.settings.changeEnableSafebrowsing(!!set["safebrowsing-enabled"], syncSuppressOptions);
        adguard.settings.changeSendSafebrowsingStats(!!set["safebrowsing-help"], syncSuppressOptions);

        if (!!set["allow-acceptable-ads"]) {
            adguard.filters.addAndEnableFilters([adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID], function () {
                callback(true);
            }, syncSuppressOptions);
        } else {
            adguard.filters.disableFilters([adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID], syncSuppressOptions);
            callback(true);
        }
    };

    /**
     * Applies extension specific section settings to application
     * @param section
     * @param callback
     */
    var applyExtensionSpecificSettingsSection = function (section, callback) {
        var syncSuppressOptions = {
            syncSuppress: true
        };

        var set = section["extension-specific-settings"];

        adguard.settings.changeUseOptimizedFiltersEnabled(!!set["use-optimized-filters"], syncSuppressOptions);
        adguard.settings.changeCollectHitsCount(!!set["collect-hits-count"], syncSuppressOptions);
        adguard.settings.changeShowContextMenu(!!set["show-context-menu"], syncSuppressOptions);
        adguard.settings.changeShowInfoAboutAdguardFullVersion(!!set["show-info-about-adguard"], syncSuppressOptions);
        adguard.settings.changeShowAppUpdatedNotification(!!set["show-app-updated-info"], syncSuppressOptions);

        callback(true);
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    var applyFiltersSection = function (section, callback) {

        var syncSuppressOptions = {
            syncSuppress: true
        };

        var whiteListSection = section.filters["whitelist"] || {}; // jshint ignore:line
        var whitelistDomains = whiteListSection.domains || [];
        var blacklistDomains = whiteListSection["inverted-domains"] || [];

        // Apply whitelist/blacklist domains and whitelist mode
        adguard.whitelist.configure(whitelistDomains, blacklistDomains, !whiteListSection.inverted, syncSuppressOptions);

        var userFilterSection = section.filters["user-filter"] || {};
        var userRules = userFilterSection.rules || "";

        // Apply user rules
        adguard.userrules.updateUserRulesText(userRules, syncSuppressOptions);

        // Apply enabled filters
        var enabledFilterIds = section.filters['enabled-filters'] || [];
        adguard.filters.addAndEnableFilters(enabledFilterIds, function () {
            var enabledFilters = adguard.filters.getEnabledFilters();
            for (var i = 0; i < enabledFilters.length; i++) {
                var filterId = enabledFilters[i].filterId;
                if (enabledFilterIds.indexOf(filterId) < 0) {
                    adguard.filters.disableFilters([filterId], syncSuppressOptions);
                }
            }
            callback(true);
        }, syncSuppressOptions);
    };

    /**
     * Checks section is supported
     * @param sectionName Section name
     */
    var isSectionSupported = function (sectionName) {
        return sectionName === FILTERS_SECTION
            || sectionName === GENERAL_SECTION
            || sectionName === EXTENSION_SPECIFIC_SECTION;
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
            case GENERAL_SECTION:
                loadGeneralSettingsSection(callback);
                break;
            case EXTENSION_SPECIFIC_SECTION:
                loadExtensionSpecificSettingsSection(callback);
                break;
            default:
                adguard.console.error('Section {0} is not supported', sectionName);
                callback(false);
        }
    };

    /**
     * Apply section to application.
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
            case GENERAL_SECTION:
                applyGeneralSettingsSection(section, callback);
                break;
            case EXTENSION_SPECIFIC_SECTION:
                applyExtensionSpecificSettingsSection(section, callback);
                break;
            default:
                adguard.console.error('Section {0} is not supported', sectionName);
                callback(false);
        }
    };

    /**
     * Exports settings set in json format
     */
    var loadSettingsBackupJson = function (callback) {

        var result = {
            "protocol-version": BACKUP_PROTOCOL_VERSION
        };

        loadGeneralSettingsSection(function (section) {
            result["general-settings"] = section["general-settings"];

            loadExtensionSpecificSettingsSection(function (section) {
                result["extension-specific-settings"] = section["extension-specific-settings"];

                loadFiltersSection(function (section) {
                    result["filters"] = section["filters"];

                    callback(JSON.stringify(result));
                });
            });
        });
    };

    /**
     * Imports settings set from json format
     */
    var applySettingsBackupJson = function (json, callback) {
        function onFinished(success) {
            if (success) {
                adguard.console.info('Settings import finished successfully');
            } else {
                adguard.console.error('Error importing settings');
            }

            adguard.listeners.notifyListeners(adguard.listeners.SETTINGS_UPDATED, success);
            callback(success);
        }

        var input = null;

        try {
            input = JSON.parse(json);
        } catch (ex) {
            adguard.console.error('Error parsing input json {0}, {1}', json, ex);
            onFinished(false);
            return;
        }

        if (!input || input['protocol-version'] !== BACKUP_PROTOCOL_VERSION) {
            adguard.console.error('Json input is invalid {0}', json);
            onFinished(false);
            return;
        }

        applyGeneralSettingsSection(input, function (success) {
            if (!success) {
                onFinished(false);
                return;
            }

            applyExtensionSpecificSettingsSection(input, function (success) {
                if (!success) {
                    onFinished(false);
                    return;
                }

                applyFiltersSection(input, function (success) {
                    onFinished(success);
                });
            });
        });
    };

    // EXPOSE
    api.settingsProvider = {

        /**
         * Loads app settings manifest
         */
        loadLocalManifest: loadLocalManifest,

        /**
         * Gets empty settings manifest
         */
        getEmptyLocalManifest: getEmptyLocalManifest,

        /**
         * Saves manifest to local storage
         */
        syncLocalManifest: syncLocalManifest,

        /**
         * Checks section is supported
         */
        isSectionSupported: isSectionSupported,

        /**
         * Loads section of app settings
         */
        loadSection: loadSection,

        /**
         * Apply section to application
         */
        applySection: applySection,

        /**
         * Loads settings backup json
         */
        loadSettingsBackup: loadSettingsBackupJson,

        /**
         * Applies settings backup json
         */
        applySettingsBackup: applySettingsBackupJson
    };

})(adguard.sync, adguard);