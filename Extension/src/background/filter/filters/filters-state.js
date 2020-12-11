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

import { localStorage } from '../../storage';
import { log } from '../../../common/log';
import { listeners } from '../../notifier';

/**
 * Helper class for working with filters metadata storage (local storage)
 */
export const filtersState = (function () {
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
            const json = localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters version info, cause {0}', ex);
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
            const json = localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            log.error('Error retrieve filters state info, cause {0}', ex);
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
            const json = localStorage.getItem(GROUPS_STATE_PROP);
            if (json) {
                groups = JSON.parse(json);
            }
        } catch (e) {
            log.error('Error retrieve groups state info, cause {0}', e);
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

        localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
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
        localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    const removeFilter = (filterId) => {
        const filters = getFiltersState();
        delete filters[filterId];
        localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
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
        localStorage.setItem(GROUPS_STATE_PROP, JSON.stringify(groups));
    };

    // Add event listener to persist filter metadata to local storage
    listeners.addListener((event, payload) => {
        switch (event) {
            case listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(payload);
                updateFilterVersion(payload);
                break;
            case listeners.FILTER_ADD_REMOVE:
            case listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(payload);
                break;
            case listeners.FILTER_GROUP_ENABLE_DISABLE:
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
})();
