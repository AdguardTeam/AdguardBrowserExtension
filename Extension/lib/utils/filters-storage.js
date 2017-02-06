/* global require, exports */
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

adguard.filtersState = (function (adguard) {

    var FILTERS_STATE_PROP = 'filters-state';
    var FILTERS_VERSION_PROP = 'filters-version';

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    var getFiltersVersion = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters version info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    var getFiltersState = function () {
        var filters = Object.create(null);
        try {
            var json = adguard.localStorage.getItem(FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            adguard.console.error("Error retrieve filters state info, cause {0}", ex);
        }
        return filters;
    };

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    var updateFilterVersion = function (filter) {
        var filters = getFiltersVersion();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };
        adguard.localStorage.setItem(FILTERS_VERSION_PROP, JSON.stringify(filters));
    };

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    var updateFilterState = function (filter) {
        var filters = getFiltersState();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };
        adguard.localStorage.setItem(FILTERS_STATE_PROP, JSON.stringify(filters));
    };

    // Add event listener to persist filter metadata to local storage
    adguard.listeners.addListener(function (event, filter) {
        switch (event) {
            case adguard.listeners.SUCCESS_DOWNLOAD_FILTER:
                updateFilterState(filter);
                updateFilterVersion(filter);
                break;
            case adguard.listeners.FILTER_ADD_REMOVE:
            case adguard.listeners.FILTER_ENABLE_DISABLE:
                updateFilterState(filter);
                break;
        }
    });

    return {
        getFiltersVersion: getFiltersVersion,
        getFiltersState: getFiltersState,
        // These methods are used only for migrate from old versions
        updateFilterVersion: updateFilterVersion,
        updateFilterState: updateFilterState
    };

})(adguard);