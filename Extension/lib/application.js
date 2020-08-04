/**
 * AdGuard application class
 */
adguard.application = (function (adguard) {
    'use strict';

    /**
     * TImeout for recently updated filters and again enabled filters - 5 minutes
     */
    const ENABLED_FILTERS_SKIP_TIMEOUT = 5 * 60 * 1000;

    const { antiBannerService } = adguard;

    const start = function (options, callback) {
        antiBannerService.start(options, callback);
    };

    const stop = function (callback) {
        antiBannerService.stop();
        callback();
    };

    /**
     * Checks application has been initialized
     * @returns {boolean}
     */
    const isInitialized = function () {
        return antiBannerService.isInitialized();
    };

    /**
     * Offer filters on extension install, select default filters and filters by locale and country
     * @param callback
     */
    const offerFilters = (callback) => {
        // These filters are enabled by default
        const filterIds = [
            adguard.utils.filters.ENGLISH_FILTER_ID,
            adguard.utils.filters.SEARCH_AND_SELF_PROMO_FILTER_ID,
        ];
        if (adguard.prefs.mobile) {
            filterIds.push(adguard.utils.filters.MOBILE_ADS_FILTER_ID);
        }
        filterIds.concat(adguard.subscriptions.getLangSuitableFilters());
        callback(filterIds);
    };

    /**
     * List of enabled filters.
     * User filter and whitelist filter are always enabled so they are excluded.
     *
     * @returns {Array} List of enabled filters
     */
    const getEnabledFilters = () => adguard.subscriptions.getFilters()
        .filter(f => f.installed && f.enabled);

    const getEnabledFiltersFromEnabledGroups = () => {
        const filters = adguard.subscriptions.getFilters();
        const enabledGroupsIds = adguard.subscriptions.getGroups()
            .filter(g => g.enabled)
            .map(g => g.groupId);
        return filters.filter(f => f.enabled && enabledGroupsIds.includes(f.groupId));
    };

    /**
     * Checks if specified filter is enabled
     *
     * @param filterId Filter identifier
     * @returns {*} true if enabled
     */
    const isFilterEnabled = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        return filter && filter.enabled;
    };

    /**
     * Checks if specified filter is installed (downloaded)
     *
     * @param filterId Filter id
     * @returns {*} true if installed
     */
    const isFilterInstalled = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        return filter && filter.installed;
    };

    /**
     * Force checks updates for filters if specified or all filters
     *
     * @param successCallback
     * @param errorCallback
     * @param {Object[]} [filters] optional list of filters
     */
    const checkFiltersUpdates = (successCallback, errorCallback, filters) => {
        if (filters) {
            // Skip recently downloaded filters
            const outdatedFilters = filters.filter(f => (f.lastCheckTime
                ? Date.now() - f.lastCheckTime > ENABLED_FILTERS_SKIP_TIMEOUT
                : true));

            if (outdatedFilters.length > 0) {
                adguard.filtersUpdate.checkAntiBannerFiltersUpdate(
                    true,
                    successCallback,
                    errorCallback,
                    outdatedFilters
                );
            }
        } else {
            adguard.filtersUpdate.checkAntiBannerFiltersUpdate(true, successCallback, errorCallback);
        }
    };

    /**
     * Enable group
     * @param {number} groupId filter group identifier
     */
    const enableGroup = function (groupId) {
        const group = adguard.subscriptions.getGroup(groupId);
        if (!group || group.enabled) {
            return;
        }
        group.enabled = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * Disable group
     * @param {number} groupId filter group identifier
     */
    const disableGroup = function (groupId) {
        const group = adguard.subscriptions.getGroup(groupId);
        if (!group || !group.enabled) {
            return;
        }
        group.enabled = false;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_GROUP_ENABLE_DISABLE, group);
    };

    /**
     * Enable filter
     *
     * @param {Number} filterId Filter identifier
     * @param {{forceGroupEnable: boolean}} [options]
     * @returns {boolean} true if filter was enabled successfully
     */
    const enableFilter = (filterId, options) => {
        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter || filter.enabled || !filter.installed) {
            return false;
        }
        filter.enabled = true;
        /**
         * we enable group if it was never enabled or disabled early
         */
        const { groupId } = filter;
        const forceGroupEnable = options && options.forceGroupEnable;
        if (!adguard.subscriptions.groupHasEnabledStatus(groupId) || forceGroupEnable) {
            enableGroup(groupId);
        }
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        return true;
    };

    /**
     * Successively add filters from filterIds and then enable successfully added filters
     * @param filterIds Filter identifiers
     * @param {{forceGroupEnable: boolean}} [options]
     * @param callback We pass list of enabled filter identifiers to the callback
     */
    const addAndEnableFilters = (filterIds, callback, options) => {
        callback = callback || function noop() {}; // empty callback

        const enabledFilters = [];

        if (!filterIds || filterIds.length === 0) {
            callback(enabledFilters);
            return;
        }

        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));
        const loadNextFilter = () => {
            if (filterIds.length === 0) {
                callback(enabledFilters);
            } else {
                const filterId = filterIds.shift();
                antiBannerService.addAntiBannerFilter(filterId, (success) => {
                    if (success) {
                        const changed = enableFilter(filterId, options);
                        if (changed) {
                            const filter = adguard.subscriptions.getFilter(filterId);
                            enabledFilters.push(filter);
                        }
                    }
                    loadNextFilter();
                });
            }
        };

        loadNextFilter();
    };

    /**
     * Disables filters by id
     *
     * @param {Array.<Number>} filterIds Filter identifiers
     * @returns {boolean} true if filter was disabled successfully
     */
    const disableFilters = function (filterIds) {
        // Copy array to prevent parameter mutation
        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));
        for (let i = 0; i < filterIds.length; i += 1) {
            const filterId = filterIds[i];
            const filter = adguard.subscriptions.getFilter(filterId);
            if (!filter || !filter.enabled || !filter.installed) {
                continue;
            }
            filter.enabled = false;
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        }
    };

    /**
     * Uninstalls filters
     *
     * @param {Array.<Number>} filterIds Filter identifiers
     * @returns {boolean} true if filter was removed successfully
     */
    const uninstallFilters = function (filterIds) {
        // Copy array to prevent parameter mutation
        filterIds = adguard.utils.collections.removeDuplicates(filterIds.slice(0));

        for (let i = 0; i < filterIds.length; i += 1) {
            const filterId = filterIds[i];
            const filter = adguard.subscriptions.getFilter(filterId);
            if (!filter || !filter.installed) {
                continue;
            }

            adguard.console.debug('Uninstall filter {0}', filter.filterId);

            filter.enabled = false;
            filter.installed = false;
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
            adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
        }
    };

    /**
     * Removes filter
     *
     * @param {Number} filterId Filter identifier
     */
    const removeFilter = function (filterId) {
        const filter = adguard.subscriptions.getFilter(filterId);
        if (!filter || filter.removed) {
            return;
        }

        if (!filter.customUrl) {
            adguard.console.error('Filter {0} is not custom and could not be removed', filter.filterId);
            return;
        }

        adguard.console.debug('Remove filter {0}', filter.filterId);

        filter.enabled = false;
        filter.installed = false;
        filter.removed = true;
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ENABLE_DISABLE, filter);
        adguard.listeners.notifyListeners(adguard.listeners.FILTER_ADD_REMOVE, filter);
    };

    /**
     * Loads filter rules from url, then tries to parse header to filter metadata
     * and adds filter object to subscriptions from it.
     * These custom filters will have special attribute customUrl, from there it could be downloaded and updated.
     *
     * @param url custom url, there rules are
     * @param options object containing title of custom filter
     * @param successCallback
     * @param errorCallback
     */
    const loadCustomFilter = function (url, options, successCallback, errorCallback) {
        adguard.console.info('Downloading custom filter from {0}', url);

        if (!url) {
            errorCallback();
            return;
        }

        adguard.subscriptions.updateCustomFilter(url, options, (filterId) => {
            if (filterId) {
                adguard.console.info('Custom filter downloaded');

                const filter = adguard.subscriptions.getFilter(filterId);
                // In case filter is loaded again and was removed before
                delete filter.removed;
                successCallback(filter);
            } else {
                errorCallback();
            }
        });
    };

    const loadCustomFilterInfo = (url, options, successCallback, errorCallback) => {
        adguard.console.info(`Downloading custom filter info from ${url}`);
        if (!url) {
            errorCallback();
            return;
        }

        adguard.subscriptions.getCustomFilterInfo(url, options, (result = {}) => {
            const { error, filter } = result;
            if (filter) {
                adguard.console.info('Custom filter data downloaded');
                successCallback(filter);
                return;
            }
            errorCallback(error);
        });
    };

    return {

        start,
        stop,
        isInitialized,

        offerFilters,

        getEnabledFilters,

        isFilterEnabled,
        isFilterInstalled,

        checkFiltersUpdates,

        addAndEnableFilters,
        disableFilters,
        uninstallFilters,
        removeFilter,

        enableGroup,
        disableGroup,

        loadCustomFilter,
        loadCustomFilterInfo,
        getEnabledFiltersFromEnabledGroups,
    };
})(adguard);
