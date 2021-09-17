/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { subscriptions } from './subscription';
import { listeners } from '../../notifier';
import { backend } from './service-client';
import { antiBannerService } from '../antibanner';
import { log } from '../../../common/log';
import { settings } from '../../settings/user-settings';
import { browserUtils } from '../../utils/browser-utils';
import { customFilters } from './custom-filters';

/**
 * Filters update service
 */
export const filtersUpdate = (() => {
    /**
     * Delay before doing first filters update check -- 5 minutes
     */
    const UPDATE_FILTERS_DELAY = 5 * 60 * 1000;

    // Get filters update period
    let filtersUpdatePeriod = settings.getFiltersUpdatePeriod();

    /**
     * Gets expires in sec end return in ms
     * If expires was less then minimumExpiresTime or we couldn't parse its value,
     * then return minimumExpiresTime
     * @param {*} expires
     * @returns {number}
     */
    const normalizeExpires = (expires) => {
        const minimumExpiresSec = 60 * 60;

        expires = Number.parseInt(expires, 10);

        if (Number.isNaN(expires) || expires < minimumExpiresSec) {
            expires = minimumExpiresSec;
        }

        return expires * 1000;
    };

    /**
     * Select filters for update. It depends on the time of last update,
     * on the filter enable status and group enable status
     * @param forceUpdate Force update flag.
     * @param filtersToUpdate Optional array of filters
     * @returns object
     */
    const selectFilterIdsToUpdate = (forceUpdate, filtersToUpdate) => {
        const filterIds = [];
        const customFilterIds = [];
        const filters = filtersToUpdate || subscriptions.getFilters();

        const needUpdate = (filter) => {
            const { lastCheckTime } = filter;
            let { expires } = filter;

            if (!lastCheckTime) {
                return true;
            }

            expires = normalizeExpires(expires);
            if (filtersUpdatePeriod === settings.DEFAULT_FILTERS_UPDATE_PERIOD) {
                return lastCheckTime + expires <= Date.now();
            }

            return lastCheckTime + filtersUpdatePeriod <= Date.now();
        };

        for (let i = 0; i < filters.length; i += 1) {
            const filter = filters[i];
            const group = subscriptions.getGroup(filter.groupId);
            if (filter.installed && filter.enabled && group.enabled) {
                if (forceUpdate || needUpdate(filter)) {
                    if (filter.customUrl) {
                        customFilterIds.push(filter.filterId);
                    } else {
                        filterIds.push(filter.filterId);
                    }
                }
            }
        }

        return {
            filterIds,
            customFilterIds,
        };
    };

    /**
     * Loads filter versions from remote server
     *
     * @param filterIds Filter identifiers
     * @private
     */
    const loadFiltersMetadataFromBackend = async (filterIds) => {
        if (filterIds.length === 0) {
            return [];
        }

        try {
            const filterMetadataList = await subscriptions.getFiltersMetadata(filterIds);
            log.debug(
                'Retrieved response from server for {0} filters, result: {1} metadata',
                filterIds.length,
                filterMetadataList.length,
            );
            return filterMetadataList;
        } catch (e) {
            const errorMessage = `Error retrieved response from server for filters ${filterIds}, cause: ${e.message}`;
            log.error(errorMessage);
            throw new Error(errorMessage);
        }
    };

    /**
     * Loads filter rules
     *
     * @param filterMetadata Filter metadata
     * @param forceRemote Force download filter rules from remote server
     * (if false try to download local copy of rules if it's possible)
     * @private
     */
    async function loadFilterRules(filterMetadata, forceRemote) {
        const filter = subscriptions.getFilter(filterMetadata.filterId);

        filter._isDownloading = true;
        listeners.notifyListeners(listeners.START_DOWNLOAD_FILTER, filter);

        let filterRules;
        try {
            filterRules = await backend.downloadFilterRules(
                filter.filterId,
                forceRemote,
                settings.isUseOptimizedFiltersEnabled(),
            );
        } catch (e) {
            log.error(
                'Error retrieving response from the server for filter {0}, cause: {1}:',
                filter.filterId,
                e || '',
            );
            delete filter._isDownloading;
            listeners.notifyListeners(listeners.ERROR_DOWNLOAD_FILTER, filter);
            return false;
        }

        log.info('Retrieved response from server for filter {0}, rules count: {1}',
            filter.filterId,
            filterRules.length);
        delete filter._isDownloading;
        filter.version = filterMetadata.version;
        filter.lastUpdateTime = filterMetadata.timeUpdated;
        filter.lastCheckTime = forceRemote ? Date.now() : filterMetadata.timeUpdated;
        filter.loaded = true;
        filter.expires = filterMetadata.expires;
        // notify listeners
        listeners.notifyListeners(listeners.SUCCESS_DOWNLOAD_FILTER, filter);
        listeners.notifyListeners(listeners.UPDATE_FILTER_RULES, filter, filterRules);
        return true;
    }

    /**
     * Loads filters (ony-by-one) from the remote server
     *
     * @param filterMetadataList List of filter metadata to load
     * @private
     */
    const loadFiltersFromBackend = async (filterMetadataList) => {
        const promises = filterMetadataList.map(async (filterMetadata) => {
            const result = await loadFilterRules(filterMetadata, true);

            if (result) {
                return filterMetadata.filterId;
            }

            throw new Error('An error occurred');
        });

        const filterIds = await Promise.all(promises);
        return filterIds;
    };

    /**
     * Update filters with custom urls
     *
     * @param customFilterIds
     */
    async function updateCustomFilters(customFilterIds) {
        if (customFilterIds.length === 0) {
            return [];
        }

        const promises = customFilterIds.map(async (filterId) => {
            const filter = subscriptions.getFilter(filterId);
            const updatedFilterId = await customFilters.updateCustomFilter(filter.customUrl, {});
            if (updatedFilterId) {
                return filter;
            }
            return null;
        });

        const filters = await Promise.all(promises);
        const updatedFilters = filters.filter(f => f);
        if (updatedFilters.length > 0) {
            const filterIdsString = updatedFilters.map(f => f.filterId).join(', ');
            log.info(`Updated custom filters with ids: ${filterIdsString}`);
        }

        return updatedFilters;
    }

    /**
     * Filters update options
     * @typedef {Object} UpdateProps
     * @property [boolean] forceUpdate - if should ignore update period
     * @property [boolean] ignoreVersion - if should ignore filter version, used on switch of optimized filters
     * @property [Filter[]] filters - array of filters to update
     */

    /**
     * Downloads and saves metadata from backend
     * @return {Promise<void>}
     */
    const updateMetadata = async () => {
        log.info('Downloading metadata from backend..');

        await subscriptions.reloadMetadataFromBackend();
        await subscriptions.reloadI18nMetadataFromBackend();

        log.info('Metadata updated from backend');
    };

    /**
     * Checks filters updates.
     *
     * @param [UpdateProps]
     */
    const checkAntiBannerFiltersUpdate = async ({ forceUpdate, ignoreVersion, filters } = {}) => {
        // Don't update in background if request filter isn't running
        if (!forceUpdate && !antiBannerService.isRunning()) {
            return [];
        }

        // On force initiated on first run on by user's direct call
        if (forceUpdate && !filters) {
            await updateMetadata();
        }

        log.info('Start checking filters updates');

        // Select filters for update
        const toUpdate = selectFilterIdsToUpdate(forceUpdate, filters);
        const filterIdsToUpdate = toUpdate.filterIds;
        const customFilterIdsToUpdate = toUpdate.customFilterIds;

        const totalToUpdate = filterIdsToUpdate.length + customFilterIdsToUpdate.length;
        if (totalToUpdate === 0) {
            log.info('There is no filters to update');
            return [];
        }

        log.info('Checking updates for {0} filters', totalToUpdate);

        /**
         * Loads filters with changed version
         * @param filterMetadataList
         */
        const loadFiltersFromBackendCallback = async (filterMetadataList) => {
            const filterIds = await loadFiltersFromBackend(filterMetadataList);
            const filters = filterIds.map(subscriptions.getFilter).filter(f => f);

            const customFilters = await updateCustomFilters(customFilterIdsToUpdate);
            return filters.concat(customFilters);
        };

        /**
         * Method is called after we have got server response
         * Now we check filters version and update filter if needed
         * @param filterMetadataList
         * @param forceUpdate
         */
        const selectFilterMetadataListToUpdate = (filterMetadataList, forceUpdate) => {
            const filterMetadataListToUpdate = [];
            for (let i = 0; i < filterMetadataList.length; i += 1) {
                const filterMetadata = filterMetadataList[i];
                const filter = subscriptions.getFilter(filterMetadata.filterId);
                if (filter && filterMetadata) {
                    if (forceUpdate
                        || (filterMetadata.version
                            && browserUtils.isGreaterVersion(
                                filterMetadata.version,
                                filter.version,
                            ))) {
                        log.info(`Updating filter ${filter.filterId} to version ${filterMetadata.version}`);
                        filter.lastUpdateTime = Date.now();
                        filterMetadataListToUpdate.push(filterMetadata);
                    } else {
                        // remember that this filter version was checked
                        filter.lastCheckTime = Date.now();
                    }
                }
            }
            return filterMetadataListToUpdate;
        };

        // Retrieve current filters metadata for update
        const filterMetadataList = await loadFiltersMetadataFromBackend(filterIdsToUpdate);
        const filterMetadataListToUpdate = selectFilterMetadataListToUpdate(filterMetadataList, ignoreVersion);

        const loadedFilters = await loadFiltersFromBackendCallback(filterMetadataListToUpdate);

        return loadedFilters;
    };

    // Scheduling job
    let scheduleUpdateTimeoutId;
    function scheduleUpdate() {
        const checkTimeout = 1000 * 60 * 30;
        if (scheduleUpdateTimeoutId) {
            clearTimeout(scheduleUpdateTimeoutId);
        }

        // don't update filters if filters update period is equal to 0
        if (filtersUpdatePeriod === 0) {
            return;
        }

        scheduleUpdateTimeoutId = setTimeout(async () => {
            try {
                await checkAntiBannerFiltersUpdate();
            } catch (ex) {
                log.error('Error update filters, cause {0}', ex);
            }
            scheduleUpdate();
        }, checkTimeout);
    }

    /**
     * Schedules filters update job
     *
     * @param isFirstRun App first run flag
     * @private
     */
    function scheduleFiltersUpdate(isFirstRun) {
        filtersUpdatePeriod = settings.getFiltersUpdatePeriod();
        // First run delay
        if (isFirstRun) {
            setTimeout(checkAntiBannerFiltersUpdate, UPDATE_FILTERS_DELAY, { forceUpdate: isFirstRun });
        }

        scheduleUpdate();
    }

    return {
        checkAntiBannerFiltersUpdate,
        scheduleFiltersUpdate,
        loadFilterRules,
    };
})();
