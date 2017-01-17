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
 * Adguard simple api
 * @type {{start, stop, configure}}
 */
(function (adguard, global) {

    /**
     * Configures white and black lists.
     * If blacklist is not null filtration will be in inverted mode, otherwise in default mode.
     * @param configuration Filtration configuration: {whitelist: [], blacklist: []}
     */
    function configureWhiteBlackLists(configuration) {

        if (!configuration.blacklist && !configuration.whitelist) {
            return;
        }

        var domains;
        if (configuration.blacklist) {
            adguard.whitelist.changeDefaultWhiteListMode(false);
            domains = configuration.blacklist;
        } else {
            adguard.whitelist.changeDefaultWhiteListMode(true);
            domains = configuration.whitelist;
        }
        adguard.whitelist.clearWhiteList();
        adguard.whitelist.addToWhiteListArray(domains || []);
    }

    /**
     * Start filtration.
     * Also perform installation on first run.
     * @param configuration Install configuration: {filters: [], whitelist: [], blacklist: []}
     * @param callback Start callback
     */
    var start = function (configuration, callback) {
        configuration = configuration || {};
        adguard.filters.start({
            onInstall: function (installCallback) {
                var filterIds = configuration.filters || [];
                configureWhiteBlackLists(configuration);
                adguard.filters.addAndEnableFilters(filterIds, installCallback);
            }
        }, callback);
    };

    /**
     * Stop filtration
     * @param callback
     */
    var stop = function (callback) {
        adguard.filters.stop();
        if (typeof callback == 'function') {
            callback();
        }
    };

    /**
     * Configure current filtration settings
     * @param configuration Filtration configuration: {filters: [], whitelist: [], blacklist: []}
     * @param callback
     */
    var configure = function (configuration, callback) {

        var callbackWrapper = function (configuration) {
            configureWhiteBlackLists(configuration);
            if (typeof callback === 'function') {
                callback();
            }
        };

        if (configuration.filters) {
            var filterIds = configuration.filters || [];
            adguard.filters.addAndEnableFilters(filterIds, function () {
                var enabledFilters = adguard.filters.getEnabledFilters();
                for (var i = 0; i < enabledFilters.length; i++) {
                    var filter = enabledFilters[i];
                    if (filterIds.indexOf(filter.filterId) < 0) {
                        adguard.filters.disableFilter(filter.filterId);
                    }
                }
                callbackWrapper(configuration);
            });
        } else {
            callbackWrapper(configuration);
        }
    };

    global.adguardApi = {
        start: start,
        stop: stop,
        configure: configure
    };

})(adguard, window);