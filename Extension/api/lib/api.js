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

import { backend } from '../../lib/filter/filters/service-client';
import { webRequestService } from '../../lib/filter/request-blocking';
import { whitelist } from '../../lib/filter/whitelist';
import { subscriptions } from '../../lib/filter/filters/subscription';
import { log } from '../../lib/utils/log';
import { application } from '../../lib/application';
import { rulesStorage, localStorage } from '../../lib/storage';
import { listeners } from '../../lib/notifier';
import { userrules } from '../../lib/filter/userrules';
import { webrequest } from '../../lib/webrequest';
import { requestSanitizer } from '../../lib/filter/request-sanitizer';
import { localeDetect } from '../../lib/filter/services/locale-detect';
import { contentMessageHandler } from '../../lib/content-message-handler';
import { openAssistant, closeAssistant } from './assistant-manager';

/**
 * Adguard simple api
 * @type {{start, stop, configure}}
 */
export const adguardApi = (function () {
    function noopFunc() {
    }

    /**
     * Validates filters identifiers
     * @param filters Array
     */
    function validateFiltersConfiguration(filters) {
        if (!filters || filters.length === 0) {
            return;
        }
        for (let i = 0; i < filters.length; i += 1) {
            const filterId = filters[i];
            if (typeof filterId !== 'number') {
                throw new Error(`${filterId} is not a number`);
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
        for (let i = 0; i < domains.length; i += 1) {
            const domain = domains[i];
            if (typeof domain !== 'string') {
                throw new Error(`Domain ${domain} at position ${i} in ${prop} is not a string`);
            }
        }
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
     * Configures white and black lists.
     * If blacklist is not null filtration will be in inverted mode, otherwise in default mode.
     * @param configuration Configuration object: {whitelist: [], blacklist: []}
     */
    function configureWhiteBlackLists(configuration) {
        if (!configuration.force && !configuration.blacklist && !configuration.whitelist) {
            return;
        }

        let domains;
        if (configuration.blacklist) {
            whitelist.changeDefaultWhiteListMode(false);
            domains = configuration.blacklist;
        } else {
            whitelist.changeDefaultWhiteListMode(true);
            domains = configuration.whitelist;
        }
        whitelist.updateWhiteListDomains(domains || []);
    }

    /**
     * Configures enabled filters
     * @param configuration Configuration object: {filters: [...]}
     * @param callback
     */
    async function configureFilters(configuration, callback) {
        if (!configuration.force && !configuration.filters) {
            callback();
            return;
        }

        const filterIds = (configuration.filters || []).slice(0);
        for (let i = filterIds.length - 1; i >= 0; i -= 1) {
            const filterId = filterIds[i];
            const filter = subscriptions.getFilter(filterId);
            if (!filter) {
                log.error('Filter with id {0} not found. Skip it...', filterId);
                filterIds.splice(i, 1);
            }
        }

        await application.addAndEnableFilters(filterIds);

        const enabledFilters = application.getEnabledFilters();

        for (let i = 0; i < enabledFilters.length; i += 1) {
            const filter = enabledFilters[i];
            if (filterIds.indexOf(filter.filterId) < 0) {
                application.disableFilters([filter.filterId]);
            }
        }

        const listenerId = listeners.addListener((event) => {
            if (event === listeners.REQUEST_FILTER_UPDATED) {
                listeners.removeListener(listenerId);
                callback();
            }
        });
    }

    /**
     * Configures custom (user) rules
     * @param configuration Configuration object: {rules: [...]}
     */
    function configureCustomRules(configuration) {
        if (!configuration.force && !configuration.rules) {
            return;
        }

        const content = (configuration.rules || []).join('\r\n');
        userrules.updateUserRulesText(content);
    }

    /**
     * Configures backend's URLs
     * @param configuration Configuration object: {filtersMetadataUrl: '...', filterRulesUrl: '...'}
     */
    function configureFiltersUrl(configuration) {
        if (!configuration.force && !configuration.filtersMetadataUrl && !configuration.filterRulesUrl) {
            return;
        }
        backend.configure({
            filtersMetadataUrl: configuration.filtersMetadataUrl,
            filterRulesUrl: configuration.filterRulesUrl,
        });
    }

    /**
     * Configure current filtration settings
     * @param configuration Filtration configuration: {filters: [], whitelist: [], blacklist: []}
     * @param callback
     */
    const configure = function (configuration, callback) {
        if (!application.isInitialized()) {
            throw new Error('Applications is not initialized. Use \'start\' method.');
        }
        validateConfiguration(configuration);

        callback = callback || noopFunc;

        configureFiltersUrl(configuration);
        configureWhiteBlackLists(configuration);
        configureCustomRules(configuration);
        configureFilters(configuration, callback);
    };

    /**
     * Start filtration.
     * Also perform installation on first run.
     * @param configuration Configuration object
     * @param callback Callback function
     */
    const start = async function (configuration, callback) {
        validateConfiguration(configuration);

        callback = callback || noopFunc;

        // Force apply all configuration fields
        configuration.force = true;

        await rulesStorage.init();
        await localStorage.init();

        await application.start({});
        configure(configuration, callback);
    };

    /**
     * Stop filtration
     * @param callback Callback function
     */
    const stop = function (callback) {
        application.stop();
        if (callback) {
            callback();
        }
    };

    backend.configure({
        localFiltersFolder: 'adguard',
        redirectSourcesFolder: 'adguard',
        localFilterIds: [],
    });

    // Modules needed to be initiated
    webrequest.init();
    requestSanitizer.init();
    localeDetect.init();
    contentMessageHandler.init();

    return {
        start,
        stop,
        configure,
        /**
         *  Fired when a request is blocked
         *  var onBlocked = function (details) {console.log(details);};
         *  adguardApi.onRequestBlocked.addListener(onBlocked);
         *  adguardApi.onRequestBlocked.removeListener(onBlocked);
         *  details = {
         *      tabId: ...,
         *      requestUrl: "...",
         *      referrerUrl: "...",
         *      requestType: "...", see RequestTypes
         *      rule: "..." // Rule text
         *      filterId: ... // Filter identifier
         *   };
         */
        onRequestBlocked: webRequestService.onRequestBlocked,
        openAssistant,
        closeAssistant,
    };
})();

global.adguardApi = adguardApi;
