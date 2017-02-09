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

    'use strict';

    function noOpFunc() {
    }

    /**
     * Validates configuration
     * @param configuration Configuration object
     */
    function validateConfiguration(configuration) {
        if (!configuration) {
            throw new Error('"configuration" parameter is required');
        }
        validateFiltersConfiguration(configuration.filters);
        validateDomains(configuration.whitelist, 'whitelist');
        validateDomains(configuration.blacklist, 'blacklist');
    }

    /**
     * Validates filters identifiers
     * @param filters Array
     */
    function validateFiltersConfiguration(filters) {
        if (!filters || filters.length === 0) {
            return;
        }
        for (var i = 0; i < filters.length; i++) {
            var filterId = filters[i];
            if (typeof filterId !== 'number') {
                throw new Error(filterId + ' is not a number');
            }
        }
    }

    /**
     * Validate domains
     * @param domains Array
     * @param prop Property name (whitelist or blacklist)
     */
    function validateDomains(domains, prop) {
        if (!domains || domains.length === 0) {
            return;
        }
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            if (typeof domain !== 'string') {
                throw new Error('Domain ' + domain + ' at position ' + i + ' in ' + prop + ' is not a string');
            }
        }
    }

    /**
     * Configures white and black lists.
     * If blacklist is not null filtration will be in inverted mode, otherwise in default mode.
     * @param configuration Configuration object: {whitelist: [], blacklist: []}
     */
    function configureWhiteBlackLists(configuration) {

        if (!configuration.force && !configuration.blacklist && !configuration.whitelist) {
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
        if (domains) {
            adguard.whitelist.addToWhiteListArray(domains);
        }
    }

    /**
     * Configures enabled filters
     * @param configuration Configuration object: {filters: [...]}
     * @param callback
     */
    function configureFilters(configuration, callback) {

        if (!configuration.force && !configuration.filters) {
            callback();
            return;
        }

        var filterIds = (configuration.filters || []).slice(0);
        for (var i = filterIds.length - 1; i >= 0; i--) {
            var filterId = filterIds[i];
            var metadata = adguard.subscriptions.getFilterMetadata(filterId);
            if (!metadata) {
                adguard.console.error('Filter with id {0} not found. Skip it...', filterId);
                filterIds.splice(i, 1);
            }
        }

        adguard.filters.addAndEnableFilters(filterIds, function () {
            var enabledFilters = adguard.filters.getEnabledFilters();
            for (var i = 0; i < enabledFilters.length; i++) {
                var filter = enabledFilters[i];
                if (filterIds.indexOf(filter.filterId) < 0) {
                    adguard.filters.disableFilter(filter.filterId);
                }
            }
            callback();
        });
    }

    /**
     * Configures backend's URLs
     * @param configuration Configuration object: {filtersMetadataUrl: '...', filterRulesUrl: '...'}
     */
    function configureFiltersUrl(configuration) {
        if (!configuration.force && !configuration.filtersMetadataUrl && !configuration.filterRulesUrl) {
            return;
        }
        adguard.backend.configure({
            filtersMetadataUrl: configuration.filtersMetadataUrl,
            filterRulesUrl: configuration.filterRulesUrl
        });
    }

    /**
     * Start filtration.
     * Also perform installation on first run.
     * @param configuration Configuration object
     * @param callback Callback function
     */
    var start = function (configuration, callback) {

        validateConfiguration(configuration);

        callback = callback || noOpFunc;

        // Force apply all configuration fields
        configuration.force = true;

        adguard.filters.start({}, function () {
            configure(configuration, callback);
        });
    };

    /**
     * Stop filtration
     * @param callback Callback function
     */
    var stop = function (callback) {
        adguard.filters.stop(callback || noOpFunc);
    };

    /**
     * Configure current filtration settings
     * @param configuration Filtration configuration: {filters: [], whitelist: [], blacklist: []}
     * @param callback
     */
    var configure = function (configuration, callback) {

        if (!adguard.filters.isInitialized()) {
            throw new Error('Applications is not initialized. Use \'start\' method.');
        }
        validateConfiguration(configuration);

        callback = callback || noOpFunc;

        configureFiltersUrl(configuration);
        configureWhiteBlackLists(configuration);
        configureFilters(configuration, callback);
    };

    adguard.backend.configure({
        localFiltersFolder: 'adguard',
        localFilterIds: []
    });

    global.adguardApi = {
        start: start,
        stop: stop,
        configure: configure,
        /**
         *  Fired when a request is blocked
         *  var onBlocked = function (details) {console.log(details);};
         *  adguardApi.onRequestBlocked.addListener(onBlocked);
         *  adguardApi.onRequestBlocked.removeListener(onBlocked);
         *  details = {
         *      tabId: ...,
         *      requestUrl: "...",
         *      referrerUrl: "...",
         *      requestType: "...", see adguard.RequestTypes
         *      rule: "..." // Rule text
         *   };
         */
        onRequestBlocked: adguard.webRequestService.onRequestBlocked
    };

})(adguard, window);