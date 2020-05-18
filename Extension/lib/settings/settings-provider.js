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
(function (api, adguard) {
    const FILTERS_SECTION = 'filters.json';
    const GENERAL_SECTION = 'general-settings.json';
    const EXTENSION_SPECIFIC_SECTION = 'extension-specific-settings.json';

    const SYNC_MANIFEST_PROP = 'sync-manifest';

    const BACKUP_PROTOCOL_VERSION = '1.0';

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
                'safebrowsing-enabled': adguard.settings.safebrowsingInfoEnabled(),
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
     * Applies general section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyGeneralSettingsSection = function (section, callback) {
        const set = section['general-settings'];

        adguard.settings.changeShowPageStatistic(!!set['show-blocked-ads-count']);
        adguard.settings.changeAutodetectFilters(!!set['autodetect-filters']);
        adguard.settings.changeEnableSafebrowsing(!!set['safebrowsing-enabled']);
        adguard.settings.setFiltersUpdatePeriod(set['filters-update-period']);

        if (set['allow-acceptable-ads']) {
            adguard.filters.addAndEnableFilters([adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID], () => {
                callback(true);
            });
        } else {
            adguard.filters.disableFilters([adguard.utils.filters.ids.SEARCH_AND_SELF_PROMO_FILTER_ID]);
            callback(true);
        }
    };

    /**
     * Applies extension specific section settings to application
     * @param section
     * @param callback
     */
    const applyExtensionSpecificSettingsSection = function (section, callback) {
        const set = section['extension-specific-settings'];

        adguard.settings.changeUseOptimizedFiltersEnabled(!!set['use-optimized-filters']);
        adguard.settings.changeCollectHitsCount(!!set['collect-hits-count']);
        adguard.settings.changeShowContextMenu(!!set['show-context-menu']);
        adguard.settings.changeShowInfoAboutAdguardFullVersion(!!set['show-info-about-adguard']);
        adguard.settings.changeShowAppUpdatedNotification(!!set['show-app-updated-info']);

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
     * @returns {Promise<any>} SubscriptionFilter
     */
    const addCustomFilter = (customFilterData) => {
        const {
            customUrl, title, trusted,
        } = customFilterData;

        return new Promise((resolve, reject) => {
            const options = { title, trusted };
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

    const addCustomFilters = absentCustomFiltersInitials => absentCustomFiltersInitials
        .reduce((promiseAcc, customFilterInitial) => promiseAcc
            .then(acc => addCustomFilter(customFilterInitial)
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
     * @returns {Promise<any>} Promise object which represents array with filters
     */
    const syncCustomFilters = (customFiltersInitials) => {
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

        return addCustomFilters(customFiltersToAdd)
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
     * @returns {Promise<any>}
     */
    const syncEnabledFilters = filterIds => new Promise((resolve) => {
        adguard.filters.addAndEnableFilters(filterIds, () => {
            const enabledFilters = adguard.filters.getEnabledFilters();
            const filtersToDisable = enabledFilters
                .filter(enabledFilter => !filterIds.includes(enabledFilter.filterId))
                .map(filter => filter.filterId);
            adguard.filters.disableFilters(filtersToDisable);
            resolve();
        });
    });

    /**
     * Enables groups by groupId and disable those groups which were not in the list
     * @param {array<number>} enabledGroups
     */
    const syncEnabledGroups = (enabledGroups) => {
        enabledGroups.forEach((groupId) => {
            adguard.filters.enableGroup(groupId);
        });
        adguard.console.info(`Settings sync: Next groups were enabled: ${enabledGroups}`);

        // disable groups not listed in the imported list
        const groups = adguard.subscriptions.getGroups();

        const groupIdsToDisable = groups
            .map(group => group.groupId)
            .filter(groupId => !enabledGroups.includes(groupId));

        groupIdsToDisable.forEach((groupId) => {
            adguard.filters.disableGroup(groupId);
        });
    };

    /**
     * Applies filters section settings to application
     * @param section Section
     * @param callback Finish callback
     */
    const applyFiltersSection = function (section, callback) {
        const whiteListSection = section.filters['whitelist'] || {};
        const whitelistDomains = whiteListSection.domains || [];
        const blacklistDomains = whiteListSection['inverted-domains'] || [];

        // Apply whitelist/blacklist domains and whitelist mode
        adguard.whitelist.configure(whitelistDomains, blacklistDomains, !whiteListSection.inverted);

        const userFilterSection = section.filters['user-filter'] || {};
        const userRules = userFilterSection.rules || '';

        // Apply user rules
        adguard.userrules.updateUserRulesText(userRules);

        // Apply custom filters
        const customFiltersData = section.filters['custom-filters'] || [];

        // STEP 1 sync custom filters
        syncCustomFilters(customFiltersData)
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
                                return filter.customUrl === availableCustomFilter.customUrl;
                            });
                        return filterData && filterData.enabled;
                    })
                    .map(filter => filter.filterId);
                // STEP 3 sync enabled filters
                const enabledFilterIds = section.filters['enabled-filters'] || [];
                return syncEnabledFilters([...enabledFilterIds, ...customFilterIdsToEnable]);
            })
            .then(() => {
                // STEP 4 sync enabled groups
                const enabledGroups = section.filters['enabled-groups'] || [];
                syncEnabledGroups(enabledGroups);
                callback(true);
            })
            .catch((err) => {
                adguard.console.error(err);
            });
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
     * @param {string} json
     * @param {function} cb
     */
    const applySettingsBackupJson = function (json, cb) {
        function onFinished(success) {
            if (success) {
                adguard.console.info('Settings import finished successfully');
            } else {
                adguard.console.error('Error importing settings');
            }

            adguard.listeners.notifyListeners(adguard.listeners.SETTINGS_UPDATED, success);

            if (cb) {
                cb(success);
            }
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
         * Loads settings backup json
         */
        loadSettingsBackup: loadSettingsBackupJson,

        /**
         * Applies settings backup json
         */
        applySettingsBackup: applySettingsBackupJson,
    };
})(adguard.sync, adguard);
