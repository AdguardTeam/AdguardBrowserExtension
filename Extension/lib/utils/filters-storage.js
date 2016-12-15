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

var Log = require('../../lib/utils/log').Log; // jshint ignore:line
var LS = require('../../lib/utils/local-storage').LS;

/**
 * Helper class for working with filters metadata storage (local storage)
 */
var FilterLSUtils = exports.FilterLSUtils = {

    FILTERS_STATE_PROP: 'filters-state',
    FILTERS_VERSION_PROP: 'filters-version',

    /**
     * Gets filter version from the local storage
     * @returns {*}
     */
    getFiltersVersionInfo: function () {
        var filters = Object.create(null);
        try {
            var json = LS.getItem(FilterLSUtils.FILTERS_VERSION_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve filters version info, cause {0}", ex);
        }
        return filters;
    },

    /**
     * Gets filters state from the local storage
     * @returns {*}
     */
    getFiltersStateInfo: function () {
        var filters = Object.create(null);
        try {
            var json = LS.getItem(FilterLSUtils.FILTERS_STATE_PROP);
            if (json) {
                filters = JSON.parse(json);
            }
        } catch (ex) {
            Log.error("Error retrieve filters state info, cause {0}", ex);
        }
        return filters;
    },

    /**
     * Updates filter version in the local storage
     *
     * @param filter Filter version metadata
     */
    updateFilterVersionInfo: function (filter) {
        var filters = FilterLSUtils.getFiltersVersionInfo();
        filters[filter.filterId] = {
            version: filter.version,
            lastCheckTime: filter.lastCheckTime,
            lastUpdateTime: filter.lastUpdateTime
        };
        LS.setItem(FilterLSUtils.FILTERS_VERSION_PROP, JSON.stringify(filters));
    },

    /**
     * Updates filter state in the local storage
     *
     * @param filter Filter state object
     */
    updateFilterStateInfo: function (filter) {
        var filters = FilterLSUtils.getFiltersStateInfo();
        filters[filter.filterId] = {
            loaded: filter.loaded,
            enabled: filter.enabled,
            installed: filter.installed
        };
        LS.setItem(FilterLSUtils.FILTERS_STATE_PROP, JSON.stringify(filters));
    }
};