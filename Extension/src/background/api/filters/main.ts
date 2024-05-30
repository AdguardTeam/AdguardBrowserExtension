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
import { logger } from '../../../common/logger';
import { AntibannerGroupsId, CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER } from '../../../common/constants';
import { getErrorMessage } from '../../../common/error';
import { isNumber } from '../../../common/guards';
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
    RawFiltersStorage,
} from '../../storages';
import {
    type Metadata,
    type I18nMetadata,
    type RegularFilterMetadata,
    type CustomFilterMetadata,
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
import { Categories } from './categories';

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
     * Tries to load metadata from remote source and reloads linked storages.
     * Called before filters rules are updated or loaded from backend.
     *
     * The metadata cannot be loaded individually because the all metadata needs
     * to be updated in order to, for example, update translations or track
     * the removal/addition of filters.
     *
     * If remote loading fails (due to server issues or network problems, etc.),
     * and if `shouldUseLocalAssets` is true, the method loads metadata from local assets.
     *
     * @param shouldUseLocalAssets Whether to load metadata from local assets
     * if remote loading fails. Default is false.
     */
    public static async updateMetadata(shouldUseLocalAssets = false): Promise<void> {
        try {
            await FiltersApi.loadI18nMetadataFromBackend(true);
            await FiltersApi.loadMetadataFromFromBackend(true);
        } catch (e) {
            logger.debug('Cannot load remote metadata due to: ', getErrorMessage(e));
            // loading metadata from local assets is needed to avoid the extension init stopping after the install
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
            if (shouldUseLocalAssets) {
                logger.debug('Trying to load metadata from local assets...');
                await FiltersApi.loadI18nMetadataFromBackend(false);
                await FiltersApi.loadMetadataFromFromBackend(false);
            }
        }

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
     * Update metadata from local or remote source and download rules for filters.
     *
     * If loading filters from remote failed, try to load from local resources,
     * but only those filters, for which extension has local copies in resources.
     *
     * @param filterIds Filter ids to load.
     * @param remote Whether to download metadata and filter rules from remote
     * resources or from local resources.
     *
     * @returns List of loaded filters ids.
     */
    private static async loadFilters(filterIds: number[], remote: boolean): Promise<number[]> {
        if (filterIds.length === 0) {
            return [];
        }

        if (filterIds.some((id) => !network.isFilterHasLocalCopy(id))) {
            logger.error(`In MV3, filters with ids: ${filterIds} cannot be loaded without local copy.`);
            return [];
        }

        if (remote) {
            try {
                // the arg is 'true' for loading locally stored metadata if remote loading failed.
                // needed not to stop the initialization process after the extension install
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
                await FiltersApi.updateMetadata(true);
            } catch (e) {
                // No need to throw an error here, because we still can load
                // filters using the old metadata: checking metadata needed to
                // check for updates - without fresh metadata we still can load
                // newest filter, checking it's version will be against the old,
                // local metadata, which is possible outdated.
                logger.error('Failed to update metadata due to an error:', getErrorMessage(e));
            }
        }

        const tasks = filterIds.map(async (filterId) => {
            try {
                // 'ignorePatches: true' here for loading filters without patches
                const f = await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, remote);
                return f.filterId;
            } catch (e) {
                logger.debug(`Filter rules were not loaded from backend for filter: ${filterId}, error: ${e}`);
                if (!network.isFilterHasLocalCopy(filterId)) {
                    logger.debug(
                        `Filter rules cannot be loaded because there is no local assets for filter ${filterId}.`,
                    );
                    return null;
                }
                logger.debug(`Trying to load locally stored filter rules for filter: ${filterId}...`);
                // second arg is 'false' to load locally stored filter rules if remote loading failed
                // e.g. server is not available
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
                // 'ignorePatches: true' here for loading filters without patches
                const f = await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, false);
                return f.filterId;
            }
        });

        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('Cannot load filter rules due to: ', promise.reason);
            }
        });

        return promises
            .map((p) => (p.status === 'fulfilled' ? p.value : null))
            .filter((p): p is number => isNumber(p));
    }

    /**
     * Loads and enables specified filters. Once the filters are enabled,
     * the untouched groups belonging to those filters will be enabled too.
     *
     * If method called in offline mode, some filters may not be loaded,
     * because we have local copies only for our built-in filters.
     *
     * @param filterIds Filter ids.
     * @param remote Whether to download metadata and filter rules from remote
     * resources or from local resources.
     * @param enableGroups Should enable groups that were not touched by users
     * or by code.
     */
    public static async loadAndEnableFilters(
        filterIds: number[],
        remote = false,
        enableGroups = false,
    ): Promise<void> {
        // Ignore loaded filters
        // Custom filters always have loaded state, so we don't need additional check
        const unloadedFiltersIds = filterIds.filter((id) => !FiltersApi.isFilterRulesIsLoaded(id));

        const loadedFilters = await FiltersApi.loadFilters(unloadedFiltersIds, remote);

        // Concatenate filters loaded just now with already loaded filters.
        loadedFilters.push(...filterIds.filter((id) => FiltersApi.isFilterRulesIsLoaded(id)));

        filterStateStorage.enableFilters(loadedFilters);

        if (!remote) {
            // Update the enabled filters only if loading from local resources,
            // because when loading from remote resources, the filters are already up-to-date.
            await FilterUpdateApi.checkForFiltersUpdates(loadedFilters);
        }

        if (enableGroups) {
            // we enable filters groups if it was never enabled or disabled early
            FiltersApi.enableGroupsWereNotTouched(loadedFilters);
        }
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
     * If method called in offline mode, some filters may not be loaded,
     * because we have local copies only for our built-in filters.
     */
    public static async reloadEnabledFilters(): Promise<void> {
        const filterIds = FiltersApi.getEnabledFilters();

        // Ignore custom filters
        const commonFiltersIds = filterIds.filter(id => CommonFilterApi.isCommonFilter(id));

        const loadedFiltersIds = await FiltersApi.loadFilters(commonFiltersIds, true);

        // Enable only loaded filters, because click on "use optimized filters"
        // can happen in offline mode and not every filter can be loaded, only
        // built-in filters from local extension's resources.
        filterStateStorage.enableFilters(loadedFiltersIds);
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
     * Returns enabled filters with metadata.
     *
     * @returns Enabled filters metadata array.
     */
    public static getEnabledFiltersWithMetadata(): FilterMetadata[] {
        const filters = filterStateStorage.getEnabledFilters();
        return filters
            .map(f => {
                return FiltersApi.getFilterMetadata(f);
            })
            .filter((f): f is FilterMetadata => f !== undefined);
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
     * Updates `metadata` with `i18nMetadata`, handles custom group name as well,
     * and saves it.
     *
     * @param metadata Filters, groups and tags metadata.
     * @param i18nMetadata Filters, groups and tags i18n metadata.
     */
    private static updateMetadataWithI18nMetadata(metadata: Metadata, i18nMetadata: I18nMetadata): void {
        const localizedMetadata = MetadataStorage.applyI18nMetadata(metadata, i18nMetadata);

        localizedMetadata.groups.push({
            groupId: AntibannerGroupsId.CustomFiltersGroupId,
            displayNumber: CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
            groupName: translator.getMessage('options_antibanner_custom_group'),
        });

        metadataStorage.setData(localizedMetadata);
    }

    /**
     * Loads i18n metadata from remote source and save it.
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
     * Loads metadata from remote source, applies i18n metadata, adds custom group
     * and saves it.
     *
     * @param remote If true, download data from backend, else load it from local files.
     */
    private static async loadMetadataFromFromBackend(remote: boolean): Promise<void> {
        const metadata = remote
            ? await network.downloadMetadataFromBackend()
            : await network.getLocalFiltersMetadata();

        const i18nMetadata = i18nMetadataStorage.getData();

        FiltersApi.updateMetadataWithI18nMetadata(metadata, i18nMetadata);
    }

    /**
     * Read stringified i18n metadata from settings storage.
     * If data is not exist, load it from local assets.
     * If data is exist, update cache version to faster read.
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
            logger.warn(`Cannot parse data from "${i18nMetadataStorage.key}" storage, load from local assets. Origin error: `, e);
            await FiltersApi.loadI18nMetadataFromBackend(false);
        }
    }

    /**
     * Read stringified metadata from settings storage.
     * If data is not exist, load it from local assets.
     * If data is exist, update cache version to faster read.
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
            logger.warn(`Cannot parse data from "${metadataStorage.key}" storage, load from local assets. Origin error: `, e);
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
            logger.warn(`Cannot parse data from "${filterStateStorage.key}" storage, load default states. Origin error: `, e);
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
            logger.warn(`Cannot parse data from "${groupStateStorage.key}" storage, set default states. Origin error: `, e);
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
            logger.warn(`Cannot parse data from "${filterVersionStorage.key}" storage, set default states. Origin error: `, e);
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
                await RawFiltersStorage.remove(id);

                logger.info(`Filter with id: ${id} removed from the storage`);
            });

        const promises = await Promise.allSettled(tasks);
        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('Cannot remove obsoleted filter from storage due to: ', promise.reason);
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

                const groupMetadata = Categories.getGroupByFilterId(id);
                if (!groupMetadata) {
                    return false;
                }

                const groupEnabled = enabledGroupsIds.includes(groupMetadata.groupId);
                return groupEnabled;
            });
    }
}
