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
import { Log } from '../../../common/log';
import { AntibannerGroupsId, CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER } from '../../../common/constants';
import { translator } from '../../../common/translators/translator';
import {
    filterStateStorage,
    groupStateStorage,
    i18nMetadataStorage,
    metadataStorage,
    MetadataStorage,
    filterVersionStorage,
    FilterStateStorage,
    GroupStateStorage,
    FilterVersionStorage,
    FiltersStorage,
} from '../../storages';
import {
    Metadata,
    RegularFilterMetadata,
    CustomFilterMetadata,
    i18nMetadataValidator,
    metadataValidator,
    filterStateStorageDataValidator,
    filterVersionStorageDataValidator,
    groupStateStorageDataValidator,
} from '../../schema';
import { network } from '../network';

import { UserRulesApi } from './userrules';
import { AllowlistApi } from './allowlist';
import { CommonFilterApi } from './common';
import { CustomFilterApi } from './custom';
import { PageStatsApi } from './page-stats';
import { HitStatsApi } from './hit-stats';
import { FilterUpdateApi } from './update';

export type FilterMetadata = RegularFilterMetadata | CustomFilterMetadata;

/**
 * API for managing filters data. This class is a facade for working with
 * filters, for example, its methods are called by the handlers of user actions:
 * enabling or disabling a filter or filter group, updating, etc. It depends on
 * CommonFilterApi and CustomFilterApi.
 */
export class FiltersApi {
    /**
     * Initialize filters storages.
     * Called while filters service initialization and app resetting.
     *
     * @param isInstall Is this is an installation initialization or not.
     */
    public static async init(isInstall: boolean): Promise<void> {
        await FiltersApi.initI18nMetadata();
        await FiltersApi.initMetadata();

        await PageStatsApi.init();
        await HitStatsApi.init();
        CustomFilterApi.init();
        AllowlistApi.init();
        await UserRulesApi.init(isInstall);

        FiltersApi.loadFilteringStates();

        await FiltersApi.removeObsoleteFilters();
    }

    /**
     * Load metadata from remote source and reload linked storages.
     * Called before filters rules are updated or loaded from backend.
     * The metadata cannot be loaded individually because the all metadata needs
     * to be updated in order to, for example, update translations or track
     * the removal/addition of filters.
     *
     * @param remote Whether to download metadata from remote resources or from
     * local resources.
     */
    public static async loadMetadata(remote: boolean): Promise<void> {
        await FiltersApi.loadI18nMetadataFromBackend(remote);
        await FiltersApi.loadMetadataFromFromBackend(remote);

        FiltersApi.loadFilteringStates();

        await FiltersApi.removeObsoleteFilters();
    }

    /**
     * Checks if filter rules exist in browser storage.
     * Called while filters loading.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is loaded, else returns false.
     */
    public static isFilterRulesIsLoaded(filterId: number): boolean {
        const filterState = filterStateStorage.get(filterId);

        return !!filterState?.loaded;
    }

    /**
     * Checks if filter is enabled.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is enabled, else returns false.
     */
    public static isFilterEnabled(filterId: number): boolean {
        const filterState = filterStateStorage.get(filterId);

        return !!filterState?.enabled;
    }

    /**
     * Checks if filter is disabled by user.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is disabled by user, else returns false.
     */
    public static isFilterDisabledByUser(filterId: number): boolean {
        const filterState = filterStateStorage.get(filterId);

        return !!filterState?.disabledByUser;
    }

    /**
     * Checks if filter is trusted.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is trusted, else returns false.
     */
    public static isFilterTrusted(filterId: number): boolean {
        if (!CustomFilterApi.isCustomFilter(filterId)) {
            return true;
        }

        const metadata = CustomFilterApi.getFilterMetadata(filterId);

        return !!metadata?.trusted;
    }

    /**
     * Update metadata from external source and download rules for not installed
     * (not added to the browser storage) filters.
     *
     * @param filtersIds Filter ids to load.
     * @param remote Whether to download metadata and filter rules from remote
     * resources or from local resources.
     */
    public static async loadFilters(filtersIds: number[], remote: boolean): Promise<void> {
        // Ignore loaded filters
        // Custom filters always has loaded state, so we don't need additional check
        const unloadedFiltersIds = filtersIds.filter((id) => !FiltersApi.isFilterRulesIsLoaded(id));

        if (unloadedFiltersIds.length === 0) {
            return;
        }

        await FiltersApi.loadMetadata(remote);

        const tasks = unloadedFiltersIds.map((id) => CommonFilterApi.loadFilterRulesFromBackend(id, remote));
        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                Log.error('Cannot load filter rules due to: ', promise.reason);
            }
        });
    }

    /**
     * Loads and enables specified filters. Once the filters are enabled,
     * the untouched groups belonging to those filters will be enabled too.
     *
     * @param filtersIds Filters ids.
     * @param remote Whether to download metadata and filter rules from remote
     * resources or from local resources.
     */
    public static async loadAndEnableFilters(filtersIds: number[], remote = false): Promise<void> {
        await FiltersApi.loadFilters(filtersIds, remote);

        filterStateStorage.enableFilters(filtersIds);

        if (!remote) {
            // Checks for updates to enabled filters, unless it is a load from
            // remote resources, as in this case the filters are already
            // up to date.
            await FilterUpdateApi.checkForFiltersUpdates(filtersIds);
        }

        // we enable filters groups if it was never enabled or disabled early
        FiltersApi.enableGroupsWereNotTouched(filtersIds);
    }

    /**
     * Disables specified filters.
     * Called on filter option switch.
     *
     * @param filtersIds Filters ids.
     */
    public static disableFilters(filtersIds: number[]): void {
        filterStateStorage.disableFilters(filtersIds);
    }

    /**
     * Force reload enabled common filters metadata and rules from backend.
     * Called on "use optimized filters" setting switch.
     *
     */
    public static async reloadEnabledFilters(): Promise<void> {
        const filtersIds = FiltersApi.getEnabledFilters();

        // Ignore custom filters
        const commonFilters = filtersIds.filter(id => CommonFilterApi.isCommonFilter(id));

        await FiltersApi.loadMetadata(true);

        const tasks = commonFilters.map(id => CommonFilterApi.loadFilterRulesFromBackend(id, true));
        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                Log.error('Cannot load filter rules due to: ', promise.reason);
            }
        });

        filterStateStorage.enableFilters(filtersIds);
    }

    /**
     * Returns filter metadata from correct storage.
     *
     * Common filters metadata is stored in {@link metadataStorage.data.filters}.
     * Custom filters metadata is stored in {@link customFilterMetadataStorage}.
     *
     * @param filterId Filter id.
     *
     * @returns Filter metadata.
     */
    public static getFilterMetadata(filterId: number): FilterMetadata | undefined {
        if (CustomFilterApi.isCustomFilter(filterId)) {
            return CustomFilterApi.getFilterMetadata(filterId);
        }

        return CommonFilterApi.getFilterMetadata(filterId);
    }

    /**
     * Returns filters metadata from both {@link metadataStorage.data.filters} and {@link customFilterMetadataStorage}.
     *
     * @returns Filters metadata array.
     */
    public static getFiltersMetadata(): FilterMetadata[] {
        return [
            ...CommonFilterApi.getFiltersMetadata(),
            ...CustomFilterApi.getFiltersMetadata(),
        ];
    }

    /**
     * Returns enabled filters given the state of the group.
     *
     * @returns Filters ids array.
     */
    public static getEnabledFilters(): number[] {
        const enabledFilters = filterStateStorage.getEnabledFilters();
        const enabledGroups = groupStateStorage.getEnabledGroups();

        return enabledFilters.filter(id => {
            const filterMetadata = FiltersApi.getFilterMetadata(id);

            return enabledGroups.some(groupId => groupId === filterMetadata?.groupId);
        });
    }

    /**
     * Enable filters groups that were not touched by users or by code.
     *
     * Called on filter enabling.
     *
     * @param filtersIds Filters ids.
     */
    private static enableGroupsWereNotTouched(filtersIds: number[]): void {
        const groupIds: number[] = [];

        filtersIds.forEach((filterId) => {
            const filterMetadata = FiltersApi.getFilterMetadata(filterId);

            if (!filterMetadata) {
                return;
            }

            const { groupId } = filterMetadata;
            const group = groupStateStorage.get(groupId);

            if (!group?.touched) {
                groupIds.push(filterMetadata.groupId);
            }
        });

        if (groupIds.length > 0) {
            groupStateStorage.enableGroups(groupIds);
        }
    }

    /**
     * Load i18n metadata from remote source and save it.
     *
     * @param remote If true, download data from backend, else load it from local files.
     */
    private static async loadI18nMetadataFromBackend(remote: boolean): Promise<void> {
        const i18nMetadata = remote
            ? await network.downloadI18nMetadataFromBackend()
            : await network.getLocalFiltersI18nMetadata();

        i18nMetadataStorage.setData(i18nMetadata);
    }

    /**
     * Load metadata from remote source, apply i18n metadata, add custom group
     * and save it.
     *
     * @param remote If true, download data from backend, else load it from local files.
     */
    private static async loadMetadataFromFromBackend(remote: boolean): Promise<void> {
        const metadata = remote
            ? await network.downloadMetadataFromBackend()
            : await network.getLocalFiltersMetadata();

        const localizedMetadata = MetadataStorage.applyI18nMetadata(
            metadata,
            i18nMetadataStorage.getData(),
        );

        localizedMetadata.groups.push({
            groupId: AntibannerGroupsId.CustomFilterGroupId,
            displayNumber: CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
            groupName: translator.getMessage('options_antibanner_custom_group'),
        });

        metadataStorage.setData(localizedMetadata);
    }

    /**
     * Read stringified i18n metadata from settings storage.
     * If data is not exist, load it from local assets.
     */
    private static async initI18nMetadata(): Promise<void> {
        const storageData = i18nMetadataStorage.read();

        if (typeof storageData !== 'string') {
            await FiltersApi.loadI18nMetadataFromBackend(false);
            return;
        }

        try {
            const i18nMetadata = i18nMetadataValidator.parse(JSON.parse(storageData));
            i18nMetadataStorage.setCache(i18nMetadata);
        } catch (e) {
            // eslint-disable-next-line max-len
            Log.warn(`Cannot parse data from "${i18nMetadataStorage.key}" storage, load from local assets. Origin error: `, e);
            await FiltersApi.loadI18nMetadataFromBackend(false);
        }
    }

    /**
     * Read stringified metadata from settings storage.
     * If data is not exist, load it from local assets.
     */
    private static async initMetadata(): Promise<void> {
        const storageData = metadataStorage.read();

        if (typeof storageData !== 'string') {
            await FiltersApi.loadMetadataFromFromBackend(false);
            return;
        }

        try {
            const metadata = metadataValidator.parse(JSON.parse(storageData));
            metadataStorage.setCache(metadata);
        } catch (e) {
            // eslint-disable-next-line max-len
            Log.warn(`Cannot parse data from "${metadataStorage.key}" storage, load from local assets. Origin error: `, e);
            await FiltersApi.loadMetadataFromFromBackend(false);
        }
    }

    /**
     * Set filtering states storages based on app metadata.
     */
    private static loadFilteringStates(): void {
        const metadata = metadataStorage.getData();

        FiltersApi.initFilterStateStorage(metadata);
        FiltersApi.initGroupStateStorage(metadata);
        FiltersApi.initFilterVersionStorage(metadata);
    }

    /**
     * Read stringified filter states data from settings storage.
     * If data is not exist or partial, update filter states storage based on current metadata.
     *
     * @param metadata App metadata.
     */
    private static initFilterStateStorage(metadata: Metadata): void {
        const storageData = filterStateStorage.read();

        if (typeof storageData !== 'string') {
            filterStateStorage.setData(FilterStateStorage.applyMetadata({}, metadata));
            return;
        }

        try {
            let data = filterStateStorageDataValidator.parse(JSON.parse(storageData));
            data = FilterStateStorage.applyMetadata(data, metadata);

            filterStateStorage.setData(data);
        } catch (e) {
            // eslint-disable-next-line max-len
            Log.warn(`Cannot parse data from "${filterStateStorage.key}" storage, load default states. Origin error: `, e);
            filterStateStorage.setData(FilterStateStorage.applyMetadata({}, metadata));
        }
    }

    /**
     * Read stringified group states data from settings storage.
     * If data is not exist or partial, update group states storage based on current group metadata.
     *
     * @param metadata App metadata.
     */
    private static initGroupStateStorage(metadata: Metadata): void {
        const storageData = groupStateStorage.read();

        if (typeof storageData !== 'string') {
            groupStateStorage.setData(GroupStateStorage.applyMetadata({}, metadata));
            return;
        }

        try {
            let data = groupStateStorageDataValidator.parse(JSON.parse(storageData));
            data = GroupStateStorage.applyMetadata(data, metadata);

            groupStateStorage.setData(data);
        } catch (e) {
            // eslint-disable-next-line max-len
            Log.warn(`Cannot parse data from "${groupStateStorage.key}" storage, set default states. Origin error: `, e);
            groupStateStorage.setData(GroupStateStorage.applyMetadata({}, metadata));
        }
    }

    /**
     * Read stringified filter version data from settings storage.
     * If data is not exist or partial, update filter version storage based on current filter metadata.
     *
     * @param metadata App metadata.
     */
    private static initFilterVersionStorage(metadata: Metadata): void {
        const storageData = filterVersionStorage.read();

        if (typeof storageData !== 'string') {
            filterVersionStorage.setData(FilterVersionStorage.applyMetadata({}, metadata));
            return;
        }

        try {
            let data = filterVersionStorageDataValidator.parse(JSON.parse(storageData));
            data = FilterVersionStorage.applyMetadata(data, metadata);

            filterVersionStorage.setData(data);
        } catch (e) {
            // eslint-disable-next-line max-len
            Log.warn(`Cannot parse data from "${filterVersionStorage.key}" storage, set default states. Origin error: `, e);
            filterVersionStorage.setData(FilterVersionStorage.applyMetadata({}, metadata));
        }
    }

    /**
     * Remove if necessary obsolete filters.
     */
    private static async removeObsoleteFilters(): Promise<void> {
        const installedFiltersIds = filterStateStorage.getInstalledFilters();
        const metadataFiltersIds = FiltersApi.getFiltersMetadata().map(({ filterId }) => filterId);

        const tasks = installedFiltersIds
            .filter(id => !metadataFiltersIds.includes(id))
            .map(async id => {
                filterVersionStorage.delete(id);
                filterStateStorage.delete(id);
                await FiltersStorage.remove(id);

                Log.info(`Filter with id: ${id} removed from the storage`);
            });

        const promises = await Promise.allSettled(tasks);
        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                Log.error('Cannot remove obsoleted filter from storage due to: ', promise.reason);
            }
        });
    }

    /**
     * Selects filters ids where filters are installed and enabled and only those
     * that have their group enabled.
     *
     * @returns List of installed and enabled filters and only those
     * that have their group enabled.
     */
    public static getInstalledAndEnabledFiltersIds(): number[] {
        // Collects filters ids and their states and filters groups ids.
        const filtersStates = filterStateStorage.getData();
        const enabledGroupsIds = groupStateStorage.getEnabledGroups();
        const allFiltersIds = Object.keys(filtersStates).map((id) => Number(id));

        // Selects to check only installed and enabled filters and only those
        // that have their group enabled.
        return allFiltersIds
            .filter((id) => {
                const filterState = filtersStates[id];
                if (!filterState) {
                    return false;
                }

                const { installed, enabled } = filterState;
                if (!installed || !enabled) {
                    return false;
                }

                const groupMetadata = metadataStorage.getGroupByFilterId(id);
                if (!groupMetadata) {
                    return false;
                }

                const groupEnabled = enabledGroupsIds.includes(groupMetadata.groupId);
                return groupEnabled;
            });
    }
}
