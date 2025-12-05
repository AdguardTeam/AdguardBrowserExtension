/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import browser from 'webextension-polyfill';

import {
    AntiBannerFiltersId,
    AntibannerGroupsId,
    CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
    SEPARATE_ANNOYANCE_FILTER_IDS,
} from '../../../../common/constants';
import { CommonFilterUtils } from '../../../../common/common-filter-utils';
import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { logger } from '../../../../common/logger';
import { getZodErrorMessage } from '../../../../common/error';
import { isNumber } from '../../../../common/guards';
import { translator } from '../../../../common/translators/translator';
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
} from '../../../storages';
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
} from '../../../schema';
import { network } from '../../network';
import { getFilterName } from '../../../../pages/helpers';
import { UserRulesApi } from '../userrules';
import { AllowlistApi } from '../allowlist';
import { CommonFilterApi } from '../common';
import { CustomFilterApi } from '../custom';
import { FilterUpdateApi } from '../update';
import { Categories } from '../categories';

export type FilterMetadata = RegularFilterMetadata | CustomFilterMetadata;

/**
 * API for managing filters data. This class is a facade for working with
 * filters, for example, its methods are called by the handlers of user actions:
 * enabling or disabling a filter or filter group, updating, etc. It depends on
 * CommonFilterApi and CustomFilterApi.
 */
export class FiltersApiCommon {
    /**
     * Initialize filters storages.
     * Called while filters service initialization and app resetting.
     *
     * @param isInstall Is this is an installation initialization or not.
     */
    public static async init(isInstall: boolean): Promise<void> {
        await FiltersApiCommon.initI18nMetadata();
        await FiltersApiCommon.initMetadata();

        CustomFilterApi.init(network);
        AllowlistApi.init();
        await UserRulesApi.init(isInstall);

        FiltersApiCommon.loadFilteringStates();

        await FiltersApiCommon.removeObsoleteFilters();
        await FiltersApiCommon.migrateDeprecatedFilters();
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
            await FiltersApiCommon.loadI18nMetadataFromBackend(true);
            await FiltersApiCommon.loadMetadataFromFromBackend(true);
        } catch (e) {
            logger.debug('[ext.FiltersApiCommon.updateMetadata]: cannot load remote metadata due to:', getZodErrorMessage(e));
            // loading metadata from local assets is needed to avoid the extension init stopping after the install
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
            if (shouldUseLocalAssets) {
                logger.debug('[ext.FiltersApiCommon.updateMetadata]: trying to load metadata from local assets...');
                await FiltersApiCommon.loadI18nMetadataFromBackend(false);
                await FiltersApiCommon.loadMetadataFromFromBackend(false);
            }
        }

        FiltersApiCommon.loadFilteringStates();

        await FiltersApiCommon.removeObsoleteFilters();
        await FiltersApiCommon.migrateDeprecatedFilters();
    }

    /**
     * Checks if filter rules exist in browser storage.
     * Called while filters loading.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is loaded, else returns false.
     */
    public static isFilterLoaded(filterId: number): boolean {
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
        if (!CustomFilterUtils.isCustomFilter(filterId)) {
            return true;
        }

        const metadata = CustomFilterApi.getFilterMetadata(filterId);

        return !!metadata?.trusted;
    }

    /**
     * Checks if group is enabled.
     *
     * @param groupId Group id.
     *
     * @returns True, if group is enabled, else returns false.
     */
    public static isGroupEnabled(groupId: number): boolean {
        const groupState = groupStateStorage.get(groupId);

        return !!groupState?.enabled;
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
    protected static async loadFilters(filterIds: number[], remote: boolean): Promise<number[]> {
        if (filterIds.length === 0) {
            return [];
        }

        if (remote) {
            try {
                // the arg is 'true' for loading locally stored metadata if remote loading failed.
                // needed not to stop the initialization process after the extension install
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
                await FiltersApiCommon.updateMetadata(true);
            } catch (e) {
                // No need to throw an error here, because we still can load
                // filters using the old metadata: checking metadata needed to
                // check for updates - without fresh metadata we still can load
                // newest filter, checking it's version will be against the old,
                // local metadata, which is possible outdated.
                logger.error('[ext.FiltersApiCommon.loadFilters]: failed to update metadata due to an error:', getZodErrorMessage(e));
            }
        }

        const tasks = filterIds.map(async (filterId) => {
            try {
                // 'ignorePatches: true' here for loading filters without patches
                const f = await CommonFilterApi.loadFilterRulesFromBackend({ filterId, ignorePatches: true }, remote);
                return f.filterId;
            } catch (e) {
                logger.debug(`[ext.FiltersApiCommon.loadFilters]: filter rules were not loaded from backend for filter: ${filterId}, error:`, getZodErrorMessage(e));
                if (!network.isFilterHasLocalCopy(filterId)) {
                    logger.debug(`[ext.FiltersApiCommon.loadFilters]: filter rules cannot be loaded because there is no local assets for filter ${filterId}.`);
                    return null;
                }
                logger.debug(`[ext.FiltersApiCommon.loadFilters]: trying to load locally stored filter rules for filter: ${filterId}...`);
                // second arg is 'false' to load locally stored filter rules if remote loading failed
                // e.g. server is not available
                // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2761
                // 'ignorePatches: true' here for loading filters without patches
                try {
                    const f = await CommonFilterApi.loadFilterRulesFromBackend(
                        {
                            filterId,
                            ignorePatches: true,
                        },
                        false,
                    );
                    return f.filterId;
                } catch (e) {
                    logger.debug(`[ext.FiltersApiCommon.loadFilters]: Filter rules were not loaded from local assets for filter: ${filterId}, error: ${e}`);
                    return null;
                }
            }
        });

        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('[ext.FiltersApiCommon.loadFilters]: cannot load filter rules due to:', getZodErrorMessage(promise.reason));
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
     * If the method is called in offline mode, some filters may not be loaded
     * because we have local copies only for our built-in filters.
     *
     * @param filterIds Array of filter ids to load and enable.
     * @param remote Whether to download metadata and filter rules from remote
     * resources or from local resources.
     * **IMPORTANT NOTE:** We don't want to update the filters in MV3 version,
     * because it will lead to situation, where extension will use old rulesets
     * from local resources, but newest filter with text rules from remote resources
     * (which will be loaded to tsurlfilter for cosmetic rules).
     * @param enableGroups Should enable groups that were not touched by users
     * or by code.
     */
    public static async loadAndEnableFilters(
        filterIds: number[],
        remote = false,
        enableGroups = false,
    ): Promise<void> {
        // Ignore already loaded filters
        // Custom filters always have a loaded state, so we don't need additional checks
        const unloadedFiltersIds = filterIds.filter((id) => !FiltersApiCommon.isFilterLoaded(id));
        const alreadyLoadedFilterIds = filterIds.filter((id) => FiltersApiCommon.isFilterLoaded(id));

        const loadedFilters = await FiltersApiCommon.loadFilters(unloadedFiltersIds, remote);

        // Concatenate filters loaded just now with already loaded filters
        loadedFilters.push(...alreadyLoadedFilterIds);

        filterStateStorage.enableFilters(loadedFilters);
        const loadedFiltersToLog = loadedFilters.map((id) => {
            const filterName = FiltersApiCommon.getFilterName(id);
            return `id='${id}', name='${filterName}'`;
        });
        logger.info(`[ext.FiltersApiCommon.loadAndEnableFilters]: enabled filters: ${loadedFiltersToLog.join('; ')}`);

        if (!remote) {
            // Update the enabled filters only if loading happens from local resources
            // When loading from remote resources, the filters are already up-to-date,
            // except for the previously loaded filters, which we update below
            await FilterUpdateApi.checkForFiltersUpdates(loadedFilters);
        } else if (alreadyLoadedFilterIds.length > 0) {
            // Update previously loaded filters because they won't be loaded,
            // but still need to be updated to the latest versions
            await FilterUpdateApi.checkForFiltersUpdates(alreadyLoadedFilterIds);
        }

        if (enableGroups) {
            // Enable filter groups if they were never enabled or disabled earlier
            FiltersApiCommon.enableGroupsWereNotTouched(loadedFilters);
        }
    }

    /**
     * Disables specified filters.
     * Called on filter option switch.
     *
     * Note: this method **does not update the engine**.
     *
     * @param filtersIds Filters ids.
     */
    public static disableFilters(filtersIds: number[]): void {
        filterStateStorage.disableFilters(filtersIds);
        const disabledFiltersToLog = filtersIds.map((id) => {
            const filterName = FiltersApiCommon.getFilterName(id);
            return `id='${id}', name='${filterName}'`;
        });
        logger.info(`[ext.FiltersApiCommon.disableFilters]: disabled filters: ${disabledFiltersToLog.join('; ')}`);
    }

    /**
     * Force reload enabled common filters metadata and rules from backend.
     * Called on "use optimized filters" setting switch.
     *
     * If method called in offline mode, some filters may not be loaded,
     * because we have local copies only for our built-in filters.
     */
    public static async reloadEnabledFilters(): Promise<void> {
        const filterIds = FiltersApiCommon.getEnabledFilters();

        // Ignore custom filters
        const commonFiltersIds = filterIds.filter((id) => CommonFilterUtils.isCommonFilter(id));

        const loadedFiltersIds = await FiltersApiCommon.loadFilters(commonFiltersIds, true);

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
        if (CustomFilterUtils.isCustomFilter(filterId)) {
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
     * Returns the name of a filter given its ID.
     *
     * @param filterId The ID of the filter to get the name for.
     *
     * @returns The name of the filter, or 'Unknown' if the filter ID is not found.
     */
    public static getFilterName(filterId: number): string {
        // Filter name should always be defined; using 'Unknown' as a fallback just in case.
        const UNKNOWN_FILTER_NAME = 'Unknown';

        const filtersMetadata = FiltersApiCommon.getFiltersMetadata();
        const filterName = getFilterName(filterId, filtersMetadata) || UNKNOWN_FILTER_NAME;

        return filterName;
    }

    /**
     * Returns enabled filters given the state of the group.
     *
     * @returns Filters ids array.
     */
    public static getEnabledFilters(): number[] {
        const enabledFilters = filterStateStorage.getEnabledFilters();
        const enabledGroups = groupStateStorage.getEnabledGroups();

        return enabledFilters.filter((id) => {
            const filterMetadata = FiltersApiCommon.getFilterMetadata(id);

            return enabledGroups.some((groupId) => groupId === filterMetadata?.groupId);
        });
    }

    /**
     * Returns enabled filters with metadata.
     *
     * @returns Enabled filters metadata array.
     */
    public static getEnabledFiltersWithMetadata(): FilterMetadata[] {
        return FiltersApiCommon.getEnabledFilters()
            .map((f) => FiltersApiCommon.getFilterMetadata(f))
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
            const filterMetadata = FiltersApiCommon.getFilterMetadata(filterId);

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
            logger.info(`[ext.FiltersApiCommon.enableGroupsWereNotTouched]: enabled groups: ${groupIds.map((id) => Categories.getGroupName(id)).join('; ')}`);
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

        const customFiltersGroup = localizedMetadata.groups.find((group) => {
            return group.groupId === AntibannerGroupsId.CustomFiltersGroupId;
        });

        if (!customFiltersGroup) {
            localizedMetadata.groups.push({
                groupId: AntibannerGroupsId.CustomFiltersGroupId,
                displayNumber: CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER,
                groupName: translator.getMessage('options_antibanner_custom_group'),
                groupDescription: translator.getMessage('options_antibanner_custom_group_description'),
            });
        }

        metadataStorage.setData(localizedMetadata);
    }

    /**
     * Loads i18n metadata from remote source and save it.
     *
     * @param remote If true, download data from backend, else load it from local files.
     */
    protected static async loadI18nMetadataFromBackend(remote: boolean): Promise<void> {
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
    protected static async loadMetadataFromFromBackend(remote: boolean): Promise<void> {
        const rawMetadata = remote
            ? await network.downloadMetadataFromBackend()
            : await network.getLocalFiltersMetadata();

        const validFilters: RegularFilterMetadata[] = [];

        rawMetadata.filters.forEach((filter) => {
            if (filter.deprecated) {
                logger.info(`[ext.FiltersApiCommon.loadMetadataFromFromBackend]: Filter with id ${filter.filterId} is deprecated and shall not be used.`);
                // do not filter out deprecated filter metadata as it may be needed later
                // e.g. during settings import
            }

            validFilters.push(filter);
        });

        const metadata = {
            ...rawMetadata,
            filters: validFilters,
        };

        const i18nMetadata = i18nMetadataStorage.getData();

        FiltersApiCommon.updateMetadataWithI18nMetadata(metadata, i18nMetadata);
    }

    /**
     * Read stringified i18n metadata from settings storage.
     * If data is not exist, load it from local assets.
     * If data is exist, update cache version to faster read.
     */
    private static async initI18nMetadata(): Promise<void> {
        const storageData = i18nMetadataStorage.read();

        if (typeof storageData !== 'string') {
            await FiltersApiCommon.loadI18nMetadataFromBackend(false);
            return;
        }

        try {
            const i18nMetadata = i18nMetadataValidator.parse(JSON.parse(storageData));
            i18nMetadataStorage.setCache(i18nMetadata);
        } catch (e) {
            logger.warn(`[ext.FiltersApiCommon.initI18nMetadata]: cannot parse data from "${i18nMetadataStorage.key}" storage, load from local assets. Origin error:`, getZodErrorMessage(e));
            await FiltersApiCommon.loadI18nMetadataFromBackend(false);
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
            await FiltersApiCommon.loadMetadataFromFromBackend(false);
            return;
        }

        try {
            const metadata = metadataValidator.parse(JSON.parse(storageData));
            const currentLocale = browser.i18n.getUILanguage();
            if (metadata.locale === currentLocale) {
                metadataStorage.setCache(metadata);
                return;
            }

            logger.info(`[ext.FiltersApiCommon.initMetadata]: stored locale ${metadata.locale} ≠ ${currentLocale}; refreshing metadata`);
            // fall through to load from backend below
        } catch (e) {
            logger.warn(`[ext.FiltersApiCommon.initMetadata]: cannot parse data from "${metadataStorage.key}" storage, load from local assets. Origin error:`, getZodErrorMessage(e));
            // fall through to load from backend below
        }

        await FiltersApiCommon.loadMetadataFromFromBackend(false);
    }

    /**
     * Set filtering states storages based on app metadata.
     */
    protected static loadFilteringStates(): void {
        const metadata = metadataStorage.getData();

        FiltersApiCommon.initFilterStateStorage(metadata);
        FiltersApiCommon.initGroupStateStorage(metadata);
        FiltersApiCommon.initFilterVersionStorage(metadata);
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
            logger.warn(`[ext.FiltersApiCommon.initFilterStateStorage]: cannot parse data from "${filterStateStorage.key}" storage, load default states. Origin error:`, getZodErrorMessage(e));
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
            logger.warn(`[ext.FiltersApiCommon.initGroupStateStorage]: cannot parse data from "${groupStateStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
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
            logger.warn(`[ext.FiltersApiCommon.initFilterVersionStorage]: cannot parse data from "${filterVersionStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
            filterVersionStorage.setData(FilterVersionStorage.applyMetadata({}, metadata));
        }
    }

    /**
     * Removes filter from storages.
     *
     * @param filterId Filter id to remove.
     *
     * @throws Error if anything goes wrong during the process.
     */
    private static async removeFilter(filterId: number): Promise<void> {
        filterVersionStorage.delete(filterId);
        filterStateStorage.delete(filterId);
        await FiltersStorage.remove(filterId);
        await RawFiltersStorage.remove(filterId);
    }

    /**
     * Migrates deprecated filters:
     * - if they are ***installed*** (which always happens for regular filters)
     *   but **not *enabled*** — removes them from the list of regular filters;
     * - if they are ***enabled*** — moves them to custom filters group.
     *
     * There are few exceptions:
     * 1. AdGuard DNS filter is simply removed with no special migration.
     * 2. Large AdGuard Annoyances filter is replaced with separate Annoyances filters.
     *
     * @returns Array of deprecated filters ids.
     */
    private static async migrateDeprecatedFilters(): Promise<number[]> {
        const commonFiltersMetadata = CommonFilterApi.getFiltersMetadata();

        const installedFiltersIds = filterStateStorage.getInstalledFilters();
        const enabledFilters = FiltersApiCommon.getEnabledFilters();

        const deprecatedFilterIds: number[] = [];

        const installedDeprecatedFilters: RegularFilterMetadata[] = [];

        commonFiltersMetadata.forEach((filter) => {
            if (!filter.deprecated) {
                return;
            }

            deprecatedFilterIds.push(filter.filterId);

            if (installedFiltersIds.includes(filter.filterId)) {
                installedDeprecatedFilters.push(filter);
            }
        });

        const tasks = installedDeprecatedFilters.map(async ({ filterId, subscriptionUrl }) => {
            await FiltersApiCommon.removeFilter(filterId);
            logger.info(`[ext.FiltersApiCommon.migrateDeprecatedFilters]: Filter with id ${filterId} removed from the regular filters storage since it is deprecated`);

            // AdGuard DNS filter can be simply removed with no special migration
            if (filterId === AntiBannerFiltersId.DnsFilterId) {
                return;
            }

            // migrate large Annoyances filter only if it is enabled
            if (
                filterId === AntiBannerFiltersId.AnnoyancesCombinedFilterId
                && enabledFilters.includes(filterId)
            ) {
                logger.info(`[ext.FiltersApiCommon.migrateDeprecatedFilters]: Filter with id ${filterId} will be replaced with separate Annoyances filters`);
                await FiltersApiCommon.loadAndEnableFilters(SEPARATE_ANNOYANCE_FILTER_IDS);
                return;
            }

            // for any other enabled deprecated filter, move it to custom group
            if (enabledFilters.includes(filterId)) {
                await CustomFilterApi.createFilter({
                    customUrl: subscriptionUrl,
                    trusted: true,
                    enabled: true,
                });
                logger.info(`[ext.FiltersApiCommon.migrateDeprecatedFilters]: Filter with id ${filterId} moved to custom group`);
            }
        });

        const promises = await Promise.allSettled(tasks);

        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('[ext.FiltersApiCommon.migrateDeprecatedFilters]: Cannot remove obsoleted filter from storage or create a new custom filter due to: ', promise.reason);
            }
        });

        return deprecatedFilterIds;
    }

    /**
     * Removes obsolete filters if there is any.
     *
     * Obsolete filters are those that are not present in the metadata
     * but are installed in the storage.
     */
    protected static async removeObsoleteFilters(): Promise<void> {
        const installedFiltersIds = filterStateStorage.getInstalledFilters();
        const metadataFiltersIds = FiltersApiCommon.getFiltersMetadata().map(({ filterId }) => filterId);

        const tasks = installedFiltersIds
            .filter((id) => !metadataFiltersIds.includes(id))
            .map(async (id) => {
                try {
                    await FiltersApiCommon.removeFilter(id);
                    logger.info(`[ext.FiltersApiCommon.removeObsoleteFilters]: Filter with id ${id} removed from the storage since it is obsolete`);
                } catch (e) {
                    logger.error(`[ext.FiltersApiCommon.removeObsoleteFilters]: Cannot remove obsoleted filter ${id} from storage due to: `, e);
                }
            });

        await Promise.allSettled(tasks);
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
