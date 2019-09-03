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
    const PROTOCOL_VERSION = '1.0';
    const APP_ID = 'adguard-browser-extension';

    const FILTERS_SECTION = 'filters.json';
    const GENERAL_SECTION = 'general-settings.json';
    const EXTENSION_SPECIFIC_SECTION = 'extension-specific-settings.json';

    const SYNC_MANIFEST_PROP = 'sync-manifest';

    const BACKUP_PROTOCOL_VERSION = '1.0';

    /**
     * Loads local manifest object
     */
    const loadLocalManifest = function () {
        const manifest = {
            'protocol-version': PROTOCOL_VERSION,
            'min-compatible-version': PROTOCOL_VERSION,
            'app-id': APP_ID,
            'timestamp': 0,
            'sections': [
                {
                    'name': FILTERS_SECTION,
                    'timestamp': 0,
                },
                {
                    'name': GENERAL_SECTION,
                    'timestamp': 0,
                },
                {
                    'name': EXTENSION_SPECIFIC_SECTION,
                    'timestamp': 0,
                },
            ],
        };
        const item = adguard.localStorage.getItem(SYNC_MANIFEST_PROP);
        if (!item) {
            return manifest;
        }
        try {
            const localManifest = JSON.parse(item);
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
    const getEmptyLocalManifest = function () {
        return {
            'protocol-version': PROTOCOL_VERSION,
            'min-compatible-version': PROTOCOL_VERSION,
            'app-id': APP_ID,
            'timestamp': 0,
            'sections': [
                {
                    'name': FILTERS_SECTION,
                    'timestamp': 0,
                },
                {
                    'name': GENERAL_SECTION,
                    'timestamp': 0,
                },
                {
                    'name': EXTENSION_SPECIFIC_SECTION,
                    'timestamp': 0,
                },
            ],
        };
    };

    /**
     * Collect enabled filters ids without custom filters
     * @returns {Array}
     */
    const collectEnabledFilterIds = () => {
        const enabledFilters = adguard.filters.getEnabledFilters();
        return enabledFilters
            .filter(filter => !filter.customUrl)
            .map(filter => filter.filterId);
    };

    /**
     * Collects data about added custom filters to the extension
     * @returns {CustomFilterInitial} - returns data enough to import custom filter
     */
    const collectCustomFiltersData = () => {
        const customFilters = adguard.subscriptions.getCustomFilters();
        return customFilters.map(filter => ({
            customUrl: filter.customUrl,
            enabled: filter.enabled,
            title: filter.name || '',
            trusted: filter.trusted,
        }));
    };

    const collectEnabledGroupIds = () => {
        const groups = adguard.subscriptions.getGroups();
        return groups
            .filter(group => group.enabled)
            .map(group => group.groupId);
    };

    /**
     * Loads filters settings section
     * @param callback
     */
    const loadFiltersSection = (callback) => {
        const enabledFilterIds = collectEnabledFilterIds();
        const enabledGroupIds = collectEnabledGroupIds();
        const customFiltersData = collectCustomFiltersData();

        // Collect whitelist/blacklist domains and whitelist mode
        const whiteListDomains = adguard.whitelist.getWhiteListedDomains() || [];
        const blockListDomains = adguard.whitelist.getBlockListedDomains() || [];
        const defaultWhiteListMode = !!adguard.whitelist.isDefaultMode();

        // Collect user rules
        adguard.userrules.getUserRulesText((content) => {
            const section = {
                'filters': {
                    'enabled-groups': enabledGroupIds,
                    'enabled-filters': enabledFilterIds,
                    'custom-filters': customFiltersData,
                    'user-filter': {
                        'rules': content,
                        'disabled-rules': '',
                    },
                    'whitelist': {
                        'inverted': !defaultWhiteListMode,
                        'domains': whiteListDomains,
                        'inverted-domains': blockListDomains,
                    },
                },
            };

            callback(section);
        });
    };

    /**
     * Loads general settings section
     * @param callback
     */
    const loadGeneralSettingsSection = function (callback) {
        const enabledFilterIds = collectEnabledFilterIds();
        // TODO update self search settings on filter status change
        const allowAcceptableAds = enabledFilterIds.indexOf(adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID) >= 0;

        const section = {
            'general-settings': {
                'app-language': adguard.app.getLocale(),
                'allow-acceptable-ads': allowAcceptableAds,
                'show-blocked-ads-count': adguard.settings.showPageStatistic(),
                'autodetect-filters': adguard.settings.isAutodetectFilters(),
                'safebrowsing-enabled': adguard.settings.getSafebrowsingInfo().enabled,
                'safebrowsing-help': adguard.settings.getSafebrowsingInfo().sendStats,
                'filters-update-period': adguard.settings.getFiltersUpdatePeriod(),
            },
        };

        callback(section);
    };

    /**
     * Loads extension specific settings section
     * @param callback
     */
    const loadExtensionSpecificSettingsSection = function (callback) {
        const section = {
            'extension-specific-settings': {
                'use-optimized-filters': adguard.settings.isUseOptimizedFiltersEnabled(),
                'collect-hits-count': adguard.settings.collectHitsCount(),
                'show-context-menu': adguard.settings.showContextMenu(),
                'show-info-about-adguard': adguard.settings.isShowInfoAboutAdguardFullVersion(),
                'show-app-updated-info': adguard.settings.isShowAppUpdatedNotification(),
            },
        };

        callback(section);
    };

    /**
     * Saves manifest and its sections timestamps. If syncTime is passed, timestamps are updated with this value
     * @param manifest Manifest
     * @param syncTime Synchronization time
     * @param sections updated sections names array
     */
    const syncLocalManifest = function (manifest, syncTime, sections) {
        if (syncTime) {
            manifest.timestamp = syncTime;
            for (let i = 0; i < manifest.sections.length; i++) {
                const section = manifest.sections[i];
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
    const applyGeneralSettingsSection = function (section, callback) {
        const syncSuppressOptions = {
            syncSuppress: true,
        };

        const set = section['general-settings'];

        adguard.settings.changeShowPageStatistic(!!set['show-blocked-ads-count'], syncSuppressOptions);
        adguard.settings.changeAutodetectFilters(!!set['autodetect-filters'], syncSuppressOptions);
        adguard.settings.changeEnableSafebrowsing(!!set['safebrowsing-enabled'], syncSuppressOptions);
        adguard.settings.changeSendSafebrowsingStats(!!set['safebrowsing-help'], syncSuppressOptions);
        adguard.settings.setFiltersUpdatePeriod(set['filters-update-period'], syncSuppressOptions);

        if (set['allow-acceptable-ads']) {
            adguard.filters.addAndEnableFilters([adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID], () => {
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
    const applyExtensionSpecificSettingsSection = function (section, callback) {
        const syncSuppressOptions = {
            syncSuppress: true,
        };

        const set = section['extension-specific-settings'];

        adguard.settings.changeUseOptimizedFiltersEnabled(!!set['use-optimized-filters'], syncSuppressOptions);
        adguard.settings.changeCollectHitsCount(!!set['collect-hits-count'], syncSuppressOptions);
        adguard.settings.changeShowContextMenu(!!set['show-context-menu'], syncSuppressOptions);
        adguard.settings.changeShowInfoAboutAdguardFullVersion(!!set['show-info-about-adguard'], syncSuppressOptions);
        adguard.settings.changeShowAppUpdatedNotification(!!set['show-app-updated-info'], syncSuppressOptions);

        callback(true);
    };

    /**
     * Initial data needed to add custom filter from the scratch
     * @typedef {Object} CustomFilterInitial
     * @property {string} customUrl - url of the custom filter
     * @property {boolean} enabled - state of custom filter
     * @property {number} [filterId] - identifier of the filter
     * @property {boolean} [trusted] - trusted flag of the filter
     * @property {string} [title] - title of the filter
     */

    /**
     * Add a custom filter
     * @param {CustomFilterInitial} customFilterData - initial data of imported custom filter
     * @param {{syncSuppress: boolean}} syncSuppressOptions
     * @returns {Promise<any>} SubscriptionFilter
     */
    const addCustomFilter = (customFilterData, syncSuppressOptions) => {
        const {
            customUrl, title, trusted,
        } = customFilterData;

        const { syncSuppress } = syncSuppressOptions;
        return new Promise((resolve, reject) => {
            const options = { title, trusted, syncSuppress };
            adguard.filters.loadCustomFilter(
                customUrl,
                options,
                (filter) => {
                    resolve(filter);
                },
                () => {
                    reject();
                }
            );
        });
    };

    const addCustomFilters = (absentCustomFiltersInitials, syncSuppressOptions) => absentCustomFiltersInitials
        .reduce((promiseAcc, customFilterInitial) => promiseAcc
            .then(acc => addCustomFilter(customFilterInitial, syncSuppressOptions)
                .then((customFilter) => {
                    adguard.console.info(`Settings sync: Was added custom filter: ${customFilter.customUrl}`);
                    return [...acc, { error: null, filter: customFilter }];
                })
                .catch(() => {
                    const { customUrl } = customFilterInitial;
                    const message = `Settings sync: Some error happened while downloading: ${customUrl}`;
                    adguard.console.info(message);
                    return [...acc, { error: message }];
                })), Promise.resolve([]));

    /**
     * Remove existing custom filters before adding new custom filters
     */
    const removeCustomFilters = (filterIds) => {
        filterIds.forEach((filterId) => {
            adguard.filters.removeFilter(filterId);
        });
        adguard.console.info(`Settings sync: Next filters were removed: ${filterIds}`);
    };

    /**
     * Returns filterId which not listed in the filtersToAdd list, but listed in the existingFilters
     * @param existingFilters
     * @param filtersToAdd
     * @returns {array<number>}
     */
    const getCustomFiltersToRemove = (existingFilters, filtersToAdd) => {
        const customUrlsToAdd = filtersToAdd.map(f => f.customUrl);
        const filtersToRemove = existingFilters.filter(f => !customUrlsToAdd.includes(f.customUrl));
        return filtersToRemove.map(f => f.filterId);
    };

    /**
     * Adds custom filters if there were not added one by one to the subscriptions list
     * @param {Array<CustomFilterInitial>} customFiltersInitials
     * @param {{syncSuppress: boolean}} syncSuppressOptions
     * @returns {Promise<any>} Promise object which represents array with filters
     */
    const syncCustomFilters = (customFiltersInitials, syncSuppressOptions) => {
        const presentCustomFilters = adguard.subscriptions.getCustomFilters();

        const enrichedFiltersInitials = customFiltersInitials.map((filterToAdd) => {
            presentCustomFilters.forEach((existingFilter) => {
                if (existingFilter.customUrl === filterToAdd.customUrl) {
                    filterToAdd.filterId = existingFilter.filterId;
                }
            });
            return filterToAdd;
        });

        const customFiltersToAdd = enrichedFiltersInitials.filter(f => !f.filterId);
        const existingCustomFilters = enrichedFiltersInitials.filter(f => f.filterId);
        const redundantExistingCustomFiltersIds = getCustomFiltersToRemove(presentCustomFilters, customFiltersInitials);

        if (redundantExistingCustomFiltersIds.length > 0) {
            removeCustomFilters(redundantExistingCustomFiltersIds);
        }

        if (customFiltersToAdd.length === 0) {
            return Promise.resolve(enrichedFiltersInitials);
        }

        return addCustomFilters(customFiltersToAdd, syncSuppressOptions)
            .then((customFiltersAddResult) => {
                // get results without errors, in order to do not enable filters with errors
                const addedCustomFiltersWithoutError = customFiltersAddResult
                    .filter(f => f.error === null)
                    .map(f => f.filter);

                const addedCustomFiltersIds = addedCustomFiltersWithoutError.map(f => f.filterId);
                adguard.console.info(`Settings sync: Were added custom filters: ${addedCustomFiltersIds}`);

                return [...existingCustomFilters, ...addedCustomFiltersWithoutError];
            });
    };

    /**
     * Enables filters by filterId and disables those filters which were not in the list of enabled filters
     * @param {array<number>} filterIds - ids to enable
     * @param {{syncSuppress: boolean}} syncSuppressOptions
     * @returns {Promise<any>}
     */
    const syncEnabledFilters = (filterIds, syncSuppressOptions) => new Promise((resolve) => {
        adguard.filters.addAndEnableFilters(filterIds, () => {
            const enabledFilters = adguard.filters.getEnabledFilters();
            const filtersToDisable = enabledFilters
                .filter(enabledFilter => !filterIds.includes(enabledFilter.filterId))
                .map(filter => filter.filterId);
            adguard.filters.disableFilters(filtersToDisable, syncSuppressOptions);
            resolve();
        }, syncSuppressOptions);
    });

    /**
     * Enables groups by groupId and disable those groups which were not in the list
     * @param {array<number>} enabledGroups
     * @param {{syncSuppress: boolean}} options syncSuppressOptions
     */
    const syncEnabledGroups = (enabledGroups, options) => {
        enabledGroups.forEach((groupId) => {
            adguard.filters.enableGroup(groupId, options);
        });
        adguard.console.info(`Settings sync: Next groups were enabled: ${enabledGroups}`);

        // disable groups not listed in the imported list
        const groups = adguard.subscriptions.getGroups();

        const groupIdsToDisable = groups
            .map(group => group.groupId)
            .filter(groupId => !enabledGroups.includes(groupId));

        groupIdsToDisable.forEach((groupId) => {
            adguard.filters.disableGroup(groupId, options);
        });
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyFiltersSection = function (section, callback) {
        const syncSuppressOptions = {
            syncSuppress: true,
        };

        const whiteListSection = section.filters['whitelist'] || {}; // jshint ignore:line
        const whitelistDomains = whiteListSection.domains || [];
        const blacklistDomains = whiteListSection['inverted-domains'] || [];

        // Apply whitelist/blacklist domains and whitelist mode
        adguard.whitelist.configure(whitelistDomains, blacklistDomains, !whiteListSection.inverted, syncSuppressOptions);

        const userFilterSection = section.filters['user-filter'] || {};
        const userRules = userFilterSection.rules || '';

        // Apply user rules
        adguard.userrules.updateUserRulesText(userRules, syncSuppressOptions);

        // Apply custom filters
        const customFiltersData = section.filters['custom-filters'] || [];

        // STEP 1 sync custom filters
        syncCustomFilters(customFiltersData, syncSuppressOptions)
            .then((availableCustomFilters) => {
                // STEP 2 get filters with enabled flag from export data
                const customFilterIdsToEnable = availableCustomFilters
                    .filter((availableCustomFilter) => {
                        const filterData = customFiltersData
                            .find((filter) => {
                                if (!filter.customUrl) {
                                    // eslint-disable-next-line max-len
                                    throw new Error(`Custom filter should always have custom URL: ${JSON.stringify(filter)}`);
                                }
                                return filter.customUrl === availableCustomFilter.customUrl
                            });
                        return filterData && filterData.enabled;
                    })
                    .map(filter => filter.filterId);
                // STEP 3 sync enabled filters
                const enabledFilterIds = section.filters['enabled-filters'] || [];
                return syncEnabledFilters([...enabledFilterIds, ...customFilterIdsToEnable], syncSuppressOptions);
            })
            .then(() => {
                // STEP 4 sync enabled groups
                const enabledGroups = section.filters['enabled-groups'] || [];
                syncEnabledGroups(enabledGroups, syncSuppressOptions);
                callback(true);
            })
            .catch((err) => {
                adguard.console.error(err);
            });
    };

    /**
     * Checks section is supported
     * @param sectionName Section name
     */
    const isSectionSupported = function (sectionName) {
        return sectionName === FILTERS_SECTION
            || sectionName === GENERAL_SECTION
            || sectionName === EXTENSION_SPECIFIC_SECTION;
    };

    /**
     * Constructs section from application settings
     * @param sectionName Section name
     * @param callback Finish callback
     */
    const loadSection = function (sectionName, callback) {
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
    const applySection = function (sectionName, section, callback) {
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
    const loadSettingsBackupJson = function (callback) {
        const result = {
            'protocol-version': BACKUP_PROTOCOL_VERSION,
        };

        loadGeneralSettingsSection((section) => {
            result['general-settings'] = section['general-settings'];

            loadExtensionSpecificSettingsSection((section) => {
                result['extension-specific-settings'] = section['extension-specific-settings'];

                loadFiltersSection((section) => {
                    result['filters'] = section['filters'];

                    callback(JSON.stringify(result));
                });
            });
        });
    };

    /**
     * Imports settings set from json format
     */
    const applySettingsBackupJson = function (json) {
        function onFinished(success) {
            if (success) {
                adguard.console.info('Settings import finished successfully');
            } else {
                adguard.console.error('Error importing settings');
            }

            adguard.listeners.notifyListeners(adguard.listeners.SETTINGS_UPDATED, success);
        }

        let input = null;

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

        applyGeneralSettingsSection(input, (success) => {
            if (!success) {
                onFinished(false);
                return;
            }

            applyExtensionSpecificSettingsSection(input, (success) => {
                if (!success) {
                    onFinished(false);
                    return;
                }

                applyFiltersSection(input, (success) => {
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
        loadLocalManifest,

        /**
         * Gets empty settings manifest
         */
        getEmptyLocalManifest,

        /**
         * Saves manifest to local storage
         */
        syncLocalManifest,

        /**
         * Checks section is supported
         */
        isSectionSupported,

        /**
         * Loads section of app settings
         */
        loadSection,

        /**
         * Apply section to application
         */
        applySection,

        /**
         * Loads settings backup json
         */
        loadSettingsBackup: loadSettingsBackupJson,

        /**
         * Applies settings backup json
         */
        applySettingsBackup: applySettingsBackupJson,
    };
})(adguard.sync, adguard);
