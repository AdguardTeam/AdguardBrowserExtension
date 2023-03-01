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
import { filterVersionStorage, settingsStorage } from '../../storages';
import {
    SettingOption,
    RegularFilterMetadata,
    CustomFilterMetadata,
} from '../../schema';
import { DEFAULT_FILTERS_UPDATE_PERIOD } from '../../../common/settings';
import { Log } from '../../../common/log';

import { FilterMetadata, FiltersApi } from './main';
import { CustomFilterApi } from './custom';
import { CommonFilterApi } from './common';

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
     * Filters the provided filter list with {@link selectFiltersIdsToUpdate},
     * then gets fresh metadata from the remote server for all filters (it
     * cannot be updated selectively), and, after updating, refreshes
     * lastCheckTime for each of those selected for checking filters.
     *
     * Called:
     * - by the user's action to enable a filter or a filter group (even when
     * a filter is enabled from the Stealth menu);
     * - when the language filter is automatically turned on.
     *
     * @param filtersIds List of filters ids to check.
     *
     * @returns List of metadata for updated filters.
     */
    public static async checkForFiltersUpdates(filtersIds: number[]): Promise<FilterMetadata[]> {
        const filtersToCheck = FilterUpdateApi.selectFiltersIdsToUpdate(filtersIds);

        const updatedFilters = await FilterUpdateApi.updateFilters(filtersToCheck);

        filterVersionStorage.refreshLastCheckTime(filtersToCheck);

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
     */
    public static async autoUpdateFilters(forceUpdate: boolean = false): Promise<FilterMetadata[]> {
        // If filtering is disabled and it is not a forced update, it does nothing.
        const filteringDisabled = settingsStorage.get(SettingOption.DisableFiltering);
        if (filteringDisabled && !forceUpdate) {
            return [];
        }

        const updatePeriod = settingsStorage.get(SettingOption.FiltersUpdatePeriod);
        // Auto update disabled.
        if (updatePeriod === 0 && !forceUpdate) {
            return [];
        }

        // Selects to check only installed and enabled filters and only those
        // that have their group enabled.
        const installedAndEnabledFilters = FiltersApi.getInstalledAndEnabledFiltersIds();

        // If it is a force check - updates all installed and enabled filters.
        let filtersIdsToUpdate = installedAndEnabledFilters;

        // If not a force check - updates only outdated filters.
        if (!forceUpdate) {
            filtersIdsToUpdate = FilterUpdateApi.selectExpiredFilters(updatePeriod, installedAndEnabledFilters);
        }

        const updatedFilters = await FilterUpdateApi.updateFilters(filtersIdsToUpdate);

        // Updates last check time of all installed and enabled filters.
        filterVersionStorage.refreshLastCheckTime(filtersIdsToUpdate);

        return updatedFilters;
    }

    /**
     * Updates the metadata of all filters and updates the filter contents from
     * the provided list of identifiers.
     *
     * @param filtersIds List of filters ids to update.
     *
     * @returns Promise with a list of updated {@link FilterMetadata filters' metadata}.
     */
    private static async updateFilters(filtersIds: number[]): Promise<FilterMetadata[]> {
        /**
         * Reload common filters metadata from backend for correct
         * version matching on update check.
         */
        await FiltersApi.loadMetadata(true);

        const updatedFiltersMetadata: FilterMetadata[] = [];

        const updateTasks = filtersIds.map(async (filterId) => {
            let filterMetadata: CustomFilterMetadata | RegularFilterMetadata | null;

            if (CustomFilterApi.isCustomFilter(filterId)) {
                filterMetadata = await CustomFilterApi.updateFilter(filterId);
            } else {
                filterMetadata = await CommonFilterApi.updateFilter(filterId);
            }

            if (filterMetadata) {
                updatedFiltersMetadata.push(filterMetadata);
            }
        });

        const promises = await Promise.allSettled(updateTasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                Log.error('Cannot update filter due to: ', promise.reason);
            }
        });

        return updatedFiltersMetadata;
    }

    /**
     * Selects from the provided list of filters only those that have not been
     * {@link RECENTLY_CHECKED_FILTER_TIMEOUT_MS recently} updated (added,
     * enabled or updated by the scheduler) and those that are custom filters.
     *
     * @param filtersIds List of filter ids.
     *
     * @returns List of filter ids to update.
     */
    private static selectFiltersIdsToUpdate(filtersIds: number[]): number[] {
        const filtersVersions = filterVersionStorage.getData();

        return filtersIds.filter((id: number) => {
            // Always check for updates for custom filters
            const isCustom = CustomFilterApi.isCustomFilter(Number(id));

            // Select only not recently checked filters
            const filterVersion = filtersVersions[Number(id)];
            const outdated = filterVersion !== undefined
                ? Date.now() - filterVersion.lastCheckTime > FilterUpdateApi.RECENTLY_CHECKED_FILTER_TIMEOUT_MS
                : true;

            return isCustom || outdated;
        });
    }

    /**
     * Selects only outdated filters from the provided filter list, based on the
     * provided filter update period from the settings.
     *
     * @param updatePeriod Period of checking updates in ms.
     * @param filterIds List of filter ids.
     *
     * @returns List of outdated filter ids.
     */
    private static selectExpiredFilters(updatePeriod: number, filterIds: number[]): number[] {
        const filtersVersions = filterVersionStorage.getData();

        return filterIds.filter((id: number) => {
            const filterVersion = filtersVersions[id];
            if (!filterVersion) {
                return false;
            }

            const { lastCheckTime, expires } = filterVersion;

            // By default, checks the expires field for each filter.
            if (updatePeriod === DEFAULT_FILTERS_UPDATE_PERIOD) {
                // If it is time to check the update, adds it to the array.
                return lastCheckTime + expires <= Date.now();
            }

            // Check, if the renewal period of each filter has passed.
            // If it is time to check the renewal, add to the array.
            return lastCheckTime + updatePeriod <= Date.now();
        });
    }
}
