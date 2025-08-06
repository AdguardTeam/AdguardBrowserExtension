/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
// TODO (AG-44868): Reduce code duplication across mv2 and mv3
import { filterVersionStorage, settingsStorage } from '../../../storages';
import {
    SettingOption,
    type RegularFilterMetadata,
    type CustomFilterMetadata,
} from '../../../schema';
import { DEFAULT_FILTERS_UPDATE_PERIOD } from '../../../../common/settings';
import { logger } from '../../../../common/logger';
import { FiltersUpdateTime } from '../../../../common/constants';
import { engine } from '../../../engine';
import { getZodErrorMessage } from '../../../../common/error';
import { FilterUpdateService } from '../../../services/filter-update';
import { CommonFilterUtils } from '../../../../common/common-filter-utils';
import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { CommonFilterApi } from '../common';
import { type FilterMetadata, FiltersApi } from '../main';
import { CustomFilterApi } from '../custom';

/**
 * Filter update detail.
 */
export type FilterUpdateOptions = {
    /**
     * Filter identifier.
     */
    filterId: number;
    /**
     * Should we update filters fully without patch updates or load patches to filters.
     */
    ignorePatches: boolean;
};

/**
 * List of filter update details.
 */
export type FilterUpdateOptionsList = FilterUpdateOptions[];

/**
 * API for manual and automatic (by period) filter rules updates.
 */
export class FilterUpdateApi {
    /**
     * Timeout for recently checked (added, enabled or updated by the scheduler)
     * filters - 5 minutes.
     */
    private static readonly RECENTLY_CHECKED_FILTER_TIMEOUT_MS = 1000 * 60 * 5;

    /**
     * Filters the provided filter list with {@link FilterUpdateApi.selectFiltersIdsToUpdate},
     * then gets fresh metadata from the remote server for all filters (it
     * cannot be updated selectively), and, after updating, refreshes
     * lastCheckTime for each of those selected for checking filters.
     *
     * Called:
     * - by the user's action to enable a filter or a filter group (even when
     * a filter is enabled from the Stealth menu);
     * - when the language filter is automatically turned on.
     *
     * @param filterIds List of filter ids to check.
     *
     * @returns List of metadata for updated filters.
     */
    public static async checkForFiltersUpdates(filterIds: number[]): Promise<FilterMetadata[]> {
        const filtersToCheck = FilterUpdateApi.selectFiltersIdsToUpdate(filterIds);

        // We update filters without patches when we enable groups.
        const filterDetails = filtersToCheck.map((id) => ({ filterId: id, ignorePatches: true }));

        const updatedFilters = await FilterUpdateApi.updateFilters(filterDetails);
        filterVersionStorage.refreshLastCheckTime(filterDetails);

        return updatedFilters;
    }

    /**
     * If filtering is disabled or there is no selected filter update period in
     * the settings and if it is not a forced update, it returns an empty array.
     * Otherwise it checks all installed and enabled filters and only those that
     * have their group enabled for available updates: if it is a forced
     * update - it checks for updates for those (described above) filters,
     * otherwise it additional checks those filters for possible expose by
     * comparing 'lastTimeCheck' of each filter with updatePeriod from settings
     * or by checking 'expires' field.
     *
     * After that gets fresh metadata from the remote server for all filters (it
     * cannot be updated selectively).
     *
     * 'Installed filters' are filters whose rules are loaded in
     * browser.storage.local.
     *
     * Called when user manually run update:
     * - on request from context menu;
     * - on request from popup menu;
     *
     * Or from the update scheduler @see FilterUpdateService.
     *
     * @param forceUpdate Is it a force manual check by user action or first run
     * or not.
     *
     * @returns List of metadata for updated filters.
     */
    public static async autoUpdateFilters(forceUpdate = false): Promise<FilterMetadata[]> {
        const startUpdateLogMessage = forceUpdate
            ? 'Update filters forced by user.'
            : 'Update filters by scheduler.';
        logger.info(`[ext.FilterUpdateApi.autoUpdateFilters]: ${startUpdateLogMessage}`);

        // If filtering is disabled, and it is not a forced update, it does nothing.
        const filteringDisabled = settingsStorage.get(SettingOption.DisableFiltering);
        if (filteringDisabled && !forceUpdate) {
            return [];
        }

        const updatePeriod = settingsStorage.get(SettingOption.FiltersUpdatePeriod);
        // Auto update disabled.
        if (updatePeriod === FiltersUpdateTime.Disabled && !forceUpdate) {
            return [];
        }

        // Selects to check only installed and enabled filters and only those
        // that have their group enabled.
        const installedAndEnabledFilters = FiltersApi.getInstalledAndEnabledFiltersIds();

        // If it is a force check - updates all installed and enabled filters.
        let filterUpdateDetailsToUpdate = installedAndEnabledFilters.map(
            (id) => ({ filterId: id, ignorePatches: forceUpdate }),
        );

        // If not a force check - updates only outdated filters.
        if (!forceUpdate) {
            // Select filters with diff paths and mark them for no force update
            const filtersToPatchUpdate = FilterUpdateApi
                .selectFiltersToPatchUpdate(filterUpdateDetailsToUpdate)
                .map((filterData) => ({ ...filterData, ignorePatches: false }));

            /**
             * Select filters for a forced update and mark them accordingly.
             *
             * Filters with diff path must be also full updated from time to time.
             * Full update period for such full (forced) update is determined by FiltersUpdateTime,
             * which is set in extension settings.
             */
            const filtersToFullUpdate = FilterUpdateApi.selectFiltersToFullUpdate(
                filterUpdateDetailsToUpdate,
                updatePeriod,
            ).map((filter) => ({ ...filter, ignorePatches: true }));

            // Combine both arrays
            const combinedFilters = [...filtersToPatchUpdate, ...filtersToFullUpdate];

            const uniqueFiltersMap = new Map();

            combinedFilters.forEach((filter) => {
                if (!uniqueFiltersMap.has(filter.filterId) || filter.ignorePatches) {
                    uniqueFiltersMap.set(filter.filterId, filter);
                }
            });

            filterUpdateDetailsToUpdate = Array.from(uniqueFiltersMap.values());
        }

        const updatedFilters = await FilterUpdateApi.updateFilters(filterUpdateDetailsToUpdate);

        // Updates last check time of all installed and enabled filters,
        // which where updated with force
        filterVersionStorage.refreshLastCheckTime(filterUpdateDetailsToUpdate);

        // If some filters were updated, then it is time to update the engine.
        if (updatedFilters.length > 0) {
            engine.debounceUpdate();

            // set last update time only for MV2
            // because there is no ability to update filters with patches in MV3
            await FilterUpdateService.setLastUpdateTimeMs(Date.now());
        }

        return updatedFilters;
    }

    /**
     * Updates the metadata of all filters and updates the filter contents from
     * the provided list of identifiers.
     *
     * @param filterUpdateOptionsList List of filters ids to update.
     *
     * @returns Promise with a list of updated {@link FilterMetadata filters' metadata}.
     */
    private static async updateFilters(
        filterUpdateOptionsList: FilterUpdateOptionsList,
    ): Promise<FilterMetadata[]> {
        /**
         * Reload common filters metadata from backend for correct
         * version matching on update check.
         * We do not update metadata on each check if there are no filters or only custom filters.
         */
        const shouldLoadMetadata = filterUpdateOptionsList.some((filterUpdateOptions) => {
            return filterUpdateOptions.ignorePatches
                && CommonFilterUtils.isCommonFilter(filterUpdateOptions.filterId);
        });

        if (shouldLoadMetadata) {
            try {
                await FiltersApi.updateMetadata();
            } catch (e) {
                // No need to throw an error here, because we still can load
                // filters using the old metadata: checking metadata needed to
                // check for updates - without fresh metadata we still can load
                // newest filter, checking it's version will be against the old,
                // local metadata, which is possible outdated.
                logger.error('[ext.FilterUpdateApi.updateFilters]: failed to update metadata due to an error:', getZodErrorMessage(e));
            }
        }

        const updatedFiltersMetadata: FilterMetadata[] = [];

        const updateTasks = filterUpdateOptionsList.map(async (filterData) => {
            let filterMetadata: CustomFilterMetadata | RegularFilterMetadata | null = null;

            try {
                if (CustomFilterUtils.isCustomFilter(filterData.filterId)) {
                    filterMetadata = await CustomFilterApi.updateFilter(filterData);
                } else {
                    filterMetadata = await CommonFilterApi.updateFilter(filterData);
                }
            } catch (e) {
                logger.error(`[ext.FilterUpdateApi.updateFilters]: failed to update filter id#${filterData.filterId} due to an error:`, getZodErrorMessage(e));

                return;
            }

            if (filterMetadata) {
                updatedFiltersMetadata.push(filterMetadata);
            }
        });

        await Promise.allSettled(updateTasks);

        return updatedFiltersMetadata;
    }

    /**
     * Selects from the provided list of filters only those that have not been
     * {@link RECENTLY_CHECKED_FILTER_TIMEOUT_MS recently} updated (added,
     * enabled or updated by the scheduler) and those that are custom filters.
     *
     * @param filterIds List of filter ids.
     *
     * @returns List of filter ids to update.
     */
    private static selectFiltersIdsToUpdate(filterIds: number[]): number[] {
        const filterVersions = filterVersionStorage.getData();

        return filterIds.filter((id: number) => {
            // Always check for updates for custom filters
            const isCustom = CustomFilterUtils.isCustomFilter(Number(id));

            // Select only not recently checked filters
            const filterVersion = filterVersions[Number(id)];
            const outdated = filterVersion !== undefined
                ? Date.now() - filterVersion.lastCheckTime > FilterUpdateApi.RECENTLY_CHECKED_FILTER_TIMEOUT_MS
                : true;

            return isCustom || outdated;
        });
    }

    /**
     * Selects filters to update with patches. Such filters should
     * 1. Have `diffPath`
     * 2. Not have `shouldWaitFullUpdate` flag which means that patch update failed previously.
     *
     * @param filterUpdateOptionsList Filter update details.
     *
     * @returns List with filter update details, which have diff path.
     */
    private static selectFiltersToPatchUpdate(
        filterUpdateOptionsList: FilterUpdateOptionsList,
    ): FilterUpdateOptionsList {
        const filterVersions = filterVersionStorage.getData();

        return filterUpdateOptionsList
            .filter((filterData) => {
                const filterVersion = filterVersions[filterData.filterId];
                // we do not check here expires, since @adguard/filters-downloader does it.
                return filterVersion?.diffPath
                    // filter may have diffPath but if patch update failed previously,
                    // we should not try to update it with patches again to avoid continuous failures of patch requests
                    // and wait until full update
                    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2717
                    && !filterVersion?.shouldWaitFullUpdate;
            });
    }

    /**
     * Selects outdated filters from the provided filter list for a full update.
     * The selecting is based on the provided filter update period from the settings.
     *
     * @param filterUpdateOptionsList List of filter update details.
     * @param updatePeriod Period of checking updates in ms.
     *
     * @returns List of outdated filter ids.
     */
    private static selectFiltersToFullUpdate(
        filterUpdateOptionsList: FilterUpdateOptionsList,
        updatePeriod: number,
    ): FilterUpdateOptionsList {
        const filterVersions = filterVersionStorage.getData();

        return filterUpdateOptionsList.filter((data) => {
            const filterVersion = filterVersions[data.filterId];

            if (!filterVersion) {
                return true;
            }

            const { lastCheckTime, expires } = filterVersion;

            // By default, checks the "expires" field for each filter.
            if (updatePeriod === DEFAULT_FILTERS_UPDATE_PERIOD) {
                // If it is time to check the update, adds it to the array.
                // IMPORTANT: "expires" in filter is specified in SECONDS.
                return lastCheckTime + expires * 1000 <= Date.now();
            }

            // Check, if the renewal period of each filter has passed.
            // If it is time to check the renewal, add to the array.
            return lastCheckTime + updatePeriod <= Date.now();
        });
    }
}

// TODO: remove later
// This method is exposed for the testing purposes.
// eslint-disable-next-line no-restricted-globals
Object.assign(self, {
    adguard: {
        // eslint-disable-next-line no-restricted-globals
        ...self.adguard,
        autoUpdate: FilterUpdateApi.autoUpdateFilters,
    },
});
