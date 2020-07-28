/**
 * Helper class for working with filters metadata storage (local storage)
 */
adguard.filtersState = (function (adguard) {
    const FILTERS_STATE_PROP = 'filters-state';
    const FILTERS_VERSION_PROP = 'filters-version';
    const GROUPS_STATE_PROP = 'groups-state';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    const getFiltersVersion = function () {
        let filters = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error('Error retrieve filters version info, cause {0}', ex);
        }
        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    const getFiltersState = function () {
        let filters = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error('Error retrieve filters state info, cause {0}', ex);
        }
        return filters;
    };

    /**
     * Gets groups state from the local storage
     * @returns {any}
     */
    const getGroupsState = function () {
        let groups = Object.create(null);
        try {
            const json = adguard.localStorage.getItem(GROUPS_STATE_PROP);
            if (json) {
                groups = JSON.parse(json);
            }
        } catch (e) {
            adguard.console.error('Error retrieve groups state info, cause {0}', e);
        }
        return groups;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    const updateFilterVersion = function (filter) {
        const filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime,
            expires: filter.expires,
        };

        adguard.localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    const updateFilterState = function (filter) {
        const filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed,
        };
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    const removeFilter = (filterId) => {
        const filters = getFiltersState();
        delete filters[filterId];
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    /**
     * Updates group enable state in the local storage
     *
     * @param group - SubscriptionGroup object
     */
    const updateGroupState = function (group) {
        const groups = getGroupsState();
        groups[group.groupId] = {
            enabled: group.enabled,
        };
        adguard.localStorage.setItem(GROUPS_STATE_PROP, JSON.stringify(groups));
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener((event, payload) => {
        switch (event) {
            case adguard.listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(payload);
                updateFilterVersion(payload);
                break;
            case adguard.listeners.FILTER_ADD_REMOVE:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(payload);
                break;
            case adguard.listeners.FILTER_GROUP_ENABLE_DISABLE:
                updateGroupState(payload);
                break;
            default:
                break;
        }
    });

    return {
        getFiltersVersion,
        getFiltersState,
        getGroupsState,
        // These methods are used only for migrate from old versions
        updateFilterVersion,
        updateFilterState,
        removeFilter,
    };
})(adguard);
