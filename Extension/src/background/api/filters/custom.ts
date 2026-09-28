/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import MD5 from 'crypto-js/md5';

import { BrowserUtils } from '../../utils/browser-utils';
import { createPromiseWithTimeout } from '../../utils/timeouts';
import {
    AntibannerGroupsId,
    CUSTOM_FILTERS_START_ID,
    CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS,
    NEWLINE_CHAR_UNIX,
} from '../../../common/constants';
import { logger } from '../../../common/logger';
import {
    type CustomFilterMetadata,
    customFilterMetadataStorageDataValidator,
    type FilterStateData,
    type FilterVersionData,
} from '../../schema';
import { customFilterMetadataStorage } from '../../storages/custom-filter-metadata';
import { filterStateStorage } from '../../storages/filter-state';
import { groupStateStorage } from '../../storages/group-state';
import { filterVersionStorage } from '../../storages/filter-version';
import { FiltersStoragesAdapter } from '../../storages/filters-adapter';
import { type Network } from '../network';
import { CustomFilterUtils } from '../../../common/custom-filter-utils';
import { getZodErrorMessage } from '../../../common/error';

import { type FilterUpdateOptions } from './update';
import { type FilterParsedData, FilterParser } from './parser';
import { type FilterMetadata } from './main';
import { type CategoriesFilterData } from './categories';
import { isHtmlContent } from './content-validator';

/**
 * Data transfer object for {@link CustomFilterApi} methods.
 */
export type CustomFilterDTO = {
    /**
     * Custom filter subscription url.
     */
    customUrl: string;

    /**
     * Custom filter title.
     */
    title?: string;

    /**
     * Whether the custom filter is trusted.
     */
    trusted: boolean;

    /**
     * Whether the custom filter is enabled.
     */
    enabled: boolean;
};

/**
 * Full info about downloaded custom filter, returned
 * in 'Add custom filter' modal window if filter was not added before.
 */
type CustomFilterInfo = FilterParsedData & {
    customUrl: string;
    rulesCount: number;
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window with data,
 * returned on creating new custom filter.
 */
type CreateCustomFilterResponse = {
    filter: CustomFilterInfo;
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window with data,
 * returned if custom filter with subscription url has already existed.
 */
type CustomFilterAlreadyExistResponse = {
    errorAlreadyExists: boolean;
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window with data,
 * returned if the downloaded content is an HTML document instead of a filter list.
 */
type CustomFilterHtmlContentResponse = {
    errorHtmlContent: boolean;
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window.
 */
export type GetCustomFilterInfoResult =
    | CreateCustomFilterResponse
    | CustomFilterAlreadyExistResponse
    | CustomFilterHtmlContentResponse;

/**
 * Parsed custom filter data from remote source.
 * It is downloaded while creating and updating custom filter in {@link CustomFilterApi.getRemoteFilterData}.
 */
type GetRemoteCustomFilterResult = {
    rawRules: string;
    rules: string[];
    checksum: string | null;
    parsed: FilterParsedData;
    isFullUpdate: boolean;
};

/**
 * Download mode selected for a custom filter update.
 * - `patch` - a differential update on top of the stored raw base.
 * - `full` - the whole filter is downloaded from the remote source.
 */
type CustomFilterUpdateMode = 'patch' | 'full';

/**
 * API for managing custom filters data.
 *
 * Custom filter subscription is divided into several stages:
 * - User requests custom filter data by subscription url;
 * - App downloads filter data and check, if filter was loaded before;
 * - App shows 'Add custom filter' modal window with parsed data;
 * - If user confirms subscription, filter data will be saved in app storages.
 *
 * This class also provided methods for updating and removing custom filters.
 *
 * Custom metadata is stored in {@link customFilterMetadataStorage}.
 * Filters states is stored in {@link filterStateStorage}.
 * Filters versions is stored in {@link filterVersionStorage}.
 * Filters rules is stored in {@link FiltersStoragesAdapter}.
 * Raw filter rules (before applying directives) is saved in {@link FiltersStoragesAdapter}.
 */
export class CustomFilterApi {
    private static network: Network;

    /**
     * Reads stringified {@link CustomFilterMetadata} array from persisted storage
     * and saves it in cache.
     * If data is not exist, set empty array.
     *
     * @param network Network instance, needed for correct DI and exclude
     * circular dependencies.
     */
    public static init(network: Network): void {
        CustomFilterApi.network = network;

        try {
            const storageData = customFilterMetadataStorage.read();
            if (typeof storageData === 'string') {
                const data = customFilterMetadataStorageDataValidator.parse(JSON.parse(storageData));
                customFilterMetadataStorage.setCache(data);
            } else {
                customFilterMetadataStorage.setData([]);
            }
        } catch (e) {
            logger.warn('[ext.CustomFilterApi.init]: cannot parse custom filter metadata from persisted storage, reset to default. Origin error:', getZodErrorMessage(e));
            customFilterMetadataStorage.setData([]);
        }
    }

    /**
     * Returns Custom filter info for modal window.
     * Checks if custom filter with passed url is exist.
     * If url is new, downloads filter data from remote source, parse it and create new {@link CustomFilterInfo}.
     *
     * @param url Filter subscription url.
     * @param title User-defined filter title.
     *
     * @returns
     * One of three options:
     * - {@link CreateCustomFilterResponse} on new filter subscription.
     * - {@link CustomFilterAlreadyExistResponse} if custom filter was added before.
     * - {@link CustomFilterHtmlContentResponse} if URL returned HTML content instead of filter rules.
     *
     * @throws Error if filter rules could not be downloaded.
     */
    public static async getFilterInfo(url: string, title?: string): Promise<GetCustomFilterInfoResult> {
        // Check if filter from this url was added before
        if (customFilterMetadataStorage.getByUrl(url)) {
            return { errorAlreadyExists: true };
        }

        const downloadResult = await CustomFilterApi.network.downloadFilterRulesBySubscriptionUrl(
            url,
            undefined,
            undefined,
            CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS,
        );

        if (isHtmlContent(downloadResult.filter)) {
            logger.warn('[ext.CustomFilterApi.getFilterInfo]: URL returned HTML content instead of filter rules:', url);
            return { errorHtmlContent: true };
        }

        const parsedData = FilterParser.parseFilterDataFromHeader(
            downloadResult.filter,
            downloadResult.headers?.lastModified,
        );

        const filter = {
            ...parsedData,
            name: parsedData.name ? parsedData.name : title as string,
            timeUpdated: parsedData.timeUpdated,
            customUrl: url,
            rulesCount: downloadResult.filter.filter((rule) => rule.trim().indexOf('!') !== 0).length,
        };

        return { filter };
    }

    /**
     * Creates and save new custom filter data in linked storages from passed {@link CustomFilterDTO}.
     *
     * Downloads filter data by {@link CustomFilterDTO.customUrl} and parse it.
     * Create new {@link CustomFilterMetadata} record and save it in {@link customFilterMetadataStorage},
     * Based on parsed data.
     * Creates new {@link FilterStateData} and save it in {@link filterStateStorage}.
     * Creates new {@link FilterVersionData} and save it in {@link filterVersionStorage}.
     * Filters rules are saved in {@link FiltersStorage}.
     * Raw filter rules (before applying directives) are saved in {@link RawFiltersStorage}.
     *
     * If the custom filter group has never been enabled, turn it on.
     *
     * @param filterData Custom filter data transfer object, received from modal window.
     *
     * @returns Created filter metadata.
     */
    public static async createFilter(filterData: CustomFilterDTO): Promise<CategoriesFilterData> {
        const { customUrl, trusted, enabled } = filterData;

        // download and parse custom filter data
        const {
            rawRules,
            rules,
            parsed,
            checksum,
        } = await CustomFilterApi.getRemoteFilterData(customUrl);

        // create new filter id
        const filterId = CustomFilterApi.genFilterId();

        logger.info(`[ext.CustomFilterApi.createFilter]: create new custom filter with id ${filterId}`);

        const name = filterData.title ? filterData.title : parsed.name;

        const {
            description,
            homepage,
            expires,
            timeUpdated,
            version,
            diffPath,
        } = parsed;

        const filterMetadata: CustomFilterMetadata = {
            filterId,
            displayNumber: 0,
            groupId: AntibannerGroupsId.CustomFiltersGroupId,
            name,
            description,
            homepage,
            version,
            checksum,
            tags: [0],
            customUrl,
            trusted,
            expires: Number(expires),
            timeUpdated: new Date(timeUpdated).getTime(),
        };
        customFilterMetadataStorage.set(filterMetadata);

        const filterVersionData: FilterVersionData = {
            version,
            diffPath,
            expires: filterMetadata.expires,
            lastUpdateTime: filterMetadata.timeUpdated,
            lastCheckTime: Date.now(),
            lastScheduledCheckTime: Date.now(),
        };
        filterVersionStorage.set(filterId, filterVersionData);

        const filterStateData: FilterStateData = {
            loaded: true,
            installed: true,
            enabled,
            disabledAsUnused: false,
        };
        filterStateStorage.set(filterId, filterStateData);

        // Note: we should join array of rules here, because they contain
        // preprocessed directives, e.g. including another filter via `!#include`
        // directive.
        await FiltersStoragesAdapter.set(filterId, rules.join(NEWLINE_CHAR_UNIX));
        await FiltersStoragesAdapter.setRaw(filterId, rawRules);

        const group = groupStateStorage.get(filterMetadata.groupId);

        // If group has never been enabled - enables it.
        if (group && !group.touched) {
            groupStateStorage.enableGroups([filterMetadata.groupId]);
        }

        const resultCustomFilterData: CategoriesFilterData = {
            ...filterMetadata,
            ...filterVersionData,
            loaded: true,
            installed: true,
            enabled,
            disabledAsUnused: false,
        };

        return resultCustomFilterData;
    }

    /**
     * Creates new custom filters from the passed DTO array.
     *
     * @param filtersData Array of {@link CustomFilterDTO}.
     */
    public static async createFilters(filtersData: CustomFilterDTO[]): Promise<void> {
        const tasks = filtersData.map(async (filterData) => {
            try {
                await CustomFilterApi.createFilter(filterData);
            } catch (e) {
                logger.error('[ext.CustomFilterApi.createFilters]: cannot create filter: ', filtersData, e);
            }
        });

        await Promise.allSettled(tasks);
    }

    /**
     * Updates custom filters data by ids.
     *
     * Returns subscription url from {@link customFilterMetadataStorage}.
     * Downloads data from remote source.
     * Checks, if new filters versions available.
     * If filters need for update, save new filters data in storages.
     *
     * @param filtersUpdateOptions Filters update detail.
     *
     * @returns Metadata of successfully updated filters.
     */
    public static async updateFilters(
        filtersUpdateOptions: FilterUpdateOptions[],
    ): Promise<FilterMetadata[]> {
        logger.info('[ext.CustomFilterApi.updateFilters]: Checking custom filters for updates');

        const results = await Promise.allSettled(
            filtersUpdateOptions.map((options) => CustomFilterApi.updateFilter(options)),
        );
        const updatedFiltersMetadata: FilterMetadata[] = [];

        for (const [index, { filterId }] of filtersUpdateOptions.entries()) {
            const result = results[index];
            if (result?.status === 'rejected') {
                logger.error(`[ext.CustomFilterApi.updateFilters]: failed to update custom filter ${filterId}:`, result.reason);
            } else if (result?.status === 'fulfilled' && result.value) {
                logger.info(`[ext.CustomFilterApi.updateFilters]: Filter ${filterId} updated [${result.value.version}]`);
                updatedFiltersMetadata.push(result.value);
            }
        }

        logger.info(`[ext.CustomFilterApi.updateFilters]: Finished checking custom filters, updated ${updatedFiltersMetadata.length} filters`);

        return updatedFiltersMetadata;
    }

    /**
     * Updates custom filter data by id.
     *
     * Returns subscription url from {@link customFilterMetadataStorage}.
     * Downloads data from remote source.
     * Checks, if new filter version available.
     * If filter need for update, save new filter data in storages.
     *
     * @param filterUpdateOptions Filter update detail.
     *
     * @returns Updated filter metadata, or null if no update can be applied.
     *
     * @throws Error if the filter download fails.
     */
    public static async updateFilter(
        filterUpdateOptions: FilterUpdateOptions,
    ): Promise<CustomFilterMetadata | null> {
        logger.info(`[ext.CustomFilterApi.updateFilter]: update custom filter ${filterUpdateOptions.filterId} ...`);

        const filterMetadata = customFilterMetadataStorage.getById(filterUpdateOptions.filterId);

        if (!filterMetadata) {
            logger.error(`[ext.CustomFilterApi.updateFilter]: cannot find custom filter ${filterUpdateOptions.filterId} metadata`);
            return null;
        }

        const filterRemoteData = await CustomFilterApi.getFilterUpdateData(filterMetadata, filterUpdateOptions);
        if (!filterRemoteData) {
            return null;
        }

        if (!CustomFilterApi.isFilterNeedUpdate(filterMetadata, filterRemoteData)) {
            const filterVersion = filterVersionStorage.get(filterUpdateOptions.filterId);
            if (filterRemoteData.isFullUpdate && filterVersion) {
                await CustomFilterApi.persistUnchangedFullUpdate(
                    filterUpdateOptions.filterId,
                    filterMetadata,
                    filterVersion,
                    filterRemoteData,
                );
            }
            logger.info(`[ext.CustomFilterApi.updateFilter]: custom filter ${filterUpdateOptions.filterId} is already updated`);
            return null;
        }

        logger.info(`[ext.CustomFilterApi.updateFilter]: successfully update custom filter ${filterUpdateOptions.filterId}`);
        return CustomFilterApi.updateFilterData(filterMetadata, filterRemoteData);
    }

    /**
     * Removes custom filter data from storages,
     * and returns boolean value whether the filter was enabled.
     *
     * Note: this method **does not update the engine**.
     *
     * @param filterId Custom filter id.
     *
     * @returns True if removed filter was enabled, otherwise false.
     */
    public static async removeFilter(filterId: number): Promise<boolean> {
        logger.info(`[ext.CustomFilterApi.removeFilter]: removing a custom filter ${filterId}...`);

        customFilterMetadataStorage.remove(filterId);
        filterVersionStorage.delete(filterId);

        const filterState = filterStateStorage.get(filterId);

        filterStateStorage.delete(filterId);

        await FiltersStoragesAdapter.remove(filterId);

        logger.info('[ext.CustomFilterApi.removeFilter]: custom filter removed');

        return filterState?.enabled ?? false;
    }

    /**
     * Check if filter is custom.
     *
     * @param filter Filter metadata.
     *
     * @returns True, if filter is custom, else returns false.
     */
    public static isCustomFilterMetadata(filter: FilterMetadata): filter is CustomFilterMetadata {
        return CustomFilterUtils.isCustomFilter(filter.filterId);
    }

    /**
     * Returns custom filter metadata for {@link customFilterMetadataStorage}.
     *
     * @param filterId Custom filter id.
     *
     * @returns Custom filter metadata or undefined, if custom filter doesn't exist.
     */
    public static getFilterMetadata(filterId: number): CustomFilterMetadata | undefined {
        return customFilterMetadataStorage.getById(filterId);
    }

    /**
     * Returns metadata for all custom filters.
     *
     * @returns Array of metadata records for all custom filters.
     */
    public static getFiltersMetadata(): CustomFilterMetadata[] {
        return customFilterMetadataStorage.getData();
    }

    /**
     * Returns saved custom filters data transfer objects.
     *
     * @returns Array of existed custom filters DTO's.
     */
    public static getFiltersData(): CustomFilterDTO[] {
        const filtersMetadata = CustomFilterApi.getFiltersMetadata();

        return filtersMetadata.map(({
            filterId,
            customUrl,
            name,
            trusted,
        }) => ({
            customUrl,
            title: name,
            trusted,
            enabled: !!filterStateStorage.get(filterId)?.enabled,
        }));
    }

    /**
     * Save new custom version, state and stored rules on update.
     *
     * @param filterMetadata Current custom filter metadata.
     * @param downloadedData Downloaded filter data.
     *
     * @returns Updated custom filter metadata.
     */
    private static async updateFilterData(
        filterMetadata: CustomFilterMetadata,
        downloadedData: GetRemoteCustomFilterResult,
    ): Promise<CustomFilterMetadata> {
        const { filterId } = filterMetadata;
        const {
            rules,
            rawRules,
            checksum,
            parsed: { version, timeUpdated },
        } = downloadedData;

        filterVersionStorage.set(
            filterId,
            CustomFilterApi.buildUpdatedFilterVersion(
                filterVersionStorage.get(filterId),
                downloadedData,
            ),
        );

        const newFilterMetadata = {
            ...filterMetadata,
            version,
            checksum,
            timeUpdated: new Date(timeUpdated).getTime(),
        };

        customFilterMetadataStorage.set(newFilterMetadata);

        // Note: we should join array of rules here, because they contain
        // preprocessed directives, e.g. including another filter via `!#include`
        // directive.
        await FiltersStoragesAdapter.set(filterId, rules.join(NEWLINE_CHAR_UNIX));
        await FiltersStoragesAdapter.setRaw(filterId, rawRules);

        return newFilterMetadata;
    }

    /**
     * Builds version data after a successful download.
     *
     * Patch updates keep the previous expiry and last full check time, so they
     * cannot postpone the next full sync. Full downloads instead advance the
     * clock through {@link CustomFilterApi.advanceFullSyncClock}, which also
     * clears the patch suspension.
     *
     * @param currentVersion Version data before the update, if any.
     * @param downloadedData Downloaded filter data.
     *
     * @returns Updated filter version data.
     */
    private static buildUpdatedFilterVersion(
        currentVersion: FilterVersionData | undefined,
        downloadedData: GetRemoteCustomFilterResult,
    ): FilterVersionData {
        const { parsed, isFullUpdate } = downloadedData;
        const {
            version,
            expires,
            timeUpdated,
            diffPath,
        } = parsed;

        const patchVersion: FilterVersionData = {
            version,
            diffPath,
            expires: currentVersion?.expires ?? Number(expires),
            lastUpdateTime: new Date(timeUpdated).getTime(),
            lastCheckTime: currentVersion?.lastCheckTime ?? Date.now(),
            lastScheduledCheckTime: Date.now(),
            shouldWaitFullUpdate: false,
        };

        if (!isFullUpdate) {
            return patchVersion;
        }

        return CustomFilterApi.advanceFullSyncClock(patchVersion, expires);
    }

    /**
     * Advances the full-sync clock after a successful full download: refreshes
     * `expires` and both check timestamps and clears the patch suspension.
     *
     * Patch updates must not use this helper, so they cannot postpone the next
     * full sync.
     *
     * @param filterVersion Version data to update.
     * @param expires Expires value of the downloaded filter, in seconds.
     *
     * @returns Version data with the advanced full-sync clock.
     */
    private static advanceFullSyncClock(
        filterVersion: FilterVersionData,
        expires: number,
    ): FilterVersionData {
        return {
            ...filterVersion,
            expires: Number(expires),
            lastCheckTime: Date.now(),
            lastScheduledCheckTime: Date.now(),
            shouldWaitFullUpdate: false,
        };
    }

    /**
     * Persists the result of a full download that did not change the filter:
     * advances the full-sync clock and, when the download really carries the
     * stored version with a refreshed raw base, saves the fresh raw base.
     *
     * The fresh raw base carries the current `Diff-Path` header, which may
     * differ from the stored one even when the filter version is unchanged,
     * e.g. after the subscription URL was redirected. Without persisting it,
     * the next patch update would keep resolving the stale `Diff-Path`
     * against the old raw base and the broken patch chain would never
     * recover, contradicting the fallback mechanism of the differential
     * updates spec: a full sync must restore the filter to a state where
     * differential updates work again.
     *
     * The base is not replaced when the download carries an older version
     * (e.g. the remote list was rolled back), since then it would no longer
     * match the stored rules, nor when it is already identical to the stored
     * one, to avoid rewriting it on every manual update.
     *
     * @param filterId Custom filter id.
     * @param filterMetadata Current custom filter metadata.
     * @param filterVersion Version data before the update.
     * @param downloadedData Downloaded filter data.
     */
    private static async persistUnchangedFullUpdate(
        filterId: number,
        filterMetadata: CustomFilterMetadata,
        filterVersion: FilterVersionData,
        downloadedData: GetRemoteCustomFilterResult,
    ): Promise<void> {
        const advancedVersion = CustomFilterApi.advanceFullSyncClock(
            filterVersion,
            downloadedData.parsed.expires,
        );

        const storedRaw = await FiltersStoragesAdapter.getOriginal(filterId);
        if (
            storedRaw === downloadedData.rawRules
            || !CustomFilterApi.isDownloadedVersionSameAsStored(filterMetadata, downloadedData)
        ) {
            filterVersionStorage.set(filterId, advancedVersion);
            return;
        }

        await FiltersStoragesAdapter.setRaw(filterId, downloadedData.rawRules);
        filterVersionStorage.set(filterId, {
            ...advancedVersion,
            diffPath: downloadedData.parsed.diffPath,
        });
    }

    /**
     * Checks whether the downloaded data carries the same filter version as
     * the stored metadata: versions are compared when both are comparable
     * semver values, checksums otherwise (mirroring
     * {@link CustomFilterApi.isFilterNeedUpdate}).
     *
     * @param filterMetadata Current custom filter metadata.
     * @param downloadedData Downloaded filter data.
     *
     * @returns True if the download carries the stored filter version.
     */
    private static isDownloadedVersionSameAsStored(
        filterMetadata: CustomFilterMetadata,
        { checksum, parsed }: GetRemoteCustomFilterResult,
    ): boolean {
        if (CustomFilterApi.areVersionsComparable(filterMetadata.version, parsed.version)) {
            return BrowserUtils.isGreaterOrEqualsVersion(filterMetadata.version, parsed.version)
                && BrowserUtils.isGreaterOrEqualsVersion(parsed.version, filterMetadata.version);
        }

        return !!filterMetadata.checksum && checksum === filterMetadata.checksum;
    }

    /**
     * Checks whether the stored and downloaded filter versions can be compared
     * as semver values.
     *
     * @param storedVersion Version from the stored filter metadata.
     * @param downloadedVersion Version from the downloaded filter data.
     *
     * @returns True if both versions are non-empty semver strings.
     */
    private static areVersionsComparable(
        storedVersion: unknown,
        downloadedVersion: unknown,
    ): storedVersion is string {
        return typeof storedVersion === 'string'
            && storedVersion.length > 0
            && BrowserUtils.isSemver(storedVersion)
            && BrowserUtils.isSemver(downloadedVersion);
    }

    /**
     * Generates new filter id for new custom filter.
     *
     * Custom filters ids starts from {@link CUSTOM_FILTERS_START_ID}.
     * Every new custom filter id is incremented on 1 from last one.
     *
     * @returns Generated filter id.
     */
    private static genFilterId(): number {
        let max = 0;
        customFilterMetadataStorage.getData().forEach((f) => {
            if (f.filterId > max) {
                max = f.filterId;
            }
        });

        return max >= CUSTOM_FILTERS_START_ID ? max + 1 : CUSTOM_FILTERS_START_ID;
    }

    /**
     * Counts MD5 checksum for the filter rules content.
     *
     * @param rules Array of filter rules lines.
     *
     * @returns MD5 checksum of filter rules text.
     */
    private static getChecksum(rules: string[]): string {
        const rulesText = rules.join(NEWLINE_CHAR_UNIX);
        return MD5(rulesText).toString();
    }

    /**
     * Checks if custom filter data need to update.
     *
     * @param filter Current custom filter metadata.
     * @param downloadedData Downloaded filter data.
     * @param downloadedData.checksum Checksum of downloaded filter text.
     * @param downloadedData.parsed New parsed data.
     *
     * @returns True, if filter data need to update, else returns false.
     */
    private static isFilterNeedUpdate(
        filter: CustomFilterMetadata,
        { checksum, parsed }: GetRemoteCustomFilterResult,
    ): boolean {
        logger.info(`[ext.CustomFilterApi.isFilterNeedUpdate]: check if custom filter ${filter.filterId} need to update`);

        // If filter has version, we simply compare it with the new one.
        // Sometimes version field is not available (e.g. for some custom filters),
        // in this case, we should check only checksum.
        // If checksum is also not available, we should update filter anyway.
        if (CustomFilterApi.areVersionsComparable(filter.version, parsed.version)) {
            return !BrowserUtils.isGreaterOrEqualsVersion(filter.version, parsed.version);
        }

        if (!filter.checksum) {
            return true;
        }

        return checksum !== filter.checksum;
    }

    /**
     * Downloads a custom filter update, suspending failed patch chains until a full sync.
     *
     * @param filterMetadata Current custom filter metadata.
     * @param filterUpdateOptions Filter update options selected by the caller's update schedule.
     *
     * @returns Downloaded data, or null if patch updates are suspended or their stored base has changed.
     *
     * @throws Error if the download fails.
     */
    private static async getFilterUpdateData(
        filterMetadata: CustomFilterMetadata,
        filterUpdateOptions: FilterUpdateOptions,
    ): Promise<GetRemoteCustomFilterResult | null> {
        const { filterId, customUrl } = filterMetadata;
        const rawFilter = await FiltersStoragesAdapter.getOriginal(filterId);
        const updateMode = CustomFilterApi.selectUpdateMode(
            rawFilter,
            filterVersionStorage.get(filterId),
            filterUpdateOptions,
        );

        if (updateMode === null) {
            logger.info(`[ext.CustomFilterApi.getFilterUpdateData]: custom filter ${filterId} is waiting for a full update`);
            return null;
        }

        const force = updateMode === 'full';

        try {
            const downloadedData = await CustomFilterApi.getRemoteFilterData(customUrl, rawFilter, force);

            if (!force && !await CustomFilterApi.isStoredBaseUnchanged(filterId, rawFilter)) {
                logger.info(`[ext.CustomFilterApi.getFilterUpdateData]: ignoring an outdated patch result for custom filter ${filterId}, its base has changed`);
                return null;
            }

            return downloadedData;
        } catch (e) {
            if (!force && await CustomFilterApi.isStoredBaseUnchanged(filterId, rawFilter)) {
                CustomFilterApi.suspendPatchUpdates(filterId);
                logger.warn(`[ext.CustomFilterApi.getFilterUpdateData]: patch update failed for custom filter ${filterId} (${customUrl}), waiting for a full update:`, e);
            }
            throw e;
        }
    }

    /**
     * Selects the download mode for a custom filter update.
     *
     * Patch updates require a stored raw base with a `Diff-Path` header — the
     * same condition the downloader checks itself — otherwise a full download
     * is forced, so its result is not misreported as a patch update.
     *
     * @param rawFilter Stored raw base, if any.
     * @param filterVersion Current filter version data, if any.
     * @param filterUpdateOptions Filter update options selected by the caller's update schedule.
     *
     * @returns Selected download mode, or null if patch updates are suspended until a full sync.
     */
    private static selectUpdateMode(
        rawFilter: string | undefined,
        filterVersion: FilterVersionData | undefined,
        filterUpdateOptions: FilterUpdateOptions,
    ): CustomFilterUpdateMode | null {
        const force = filterUpdateOptions.ignorePatches
            || !rawFilter
            || !CustomFilterApi.hasDiffPath(rawFilter);

        if (!force && filterVersion?.shouldWaitFullUpdate) {
            return null;
        }

        return force ? 'full' : 'patch';
    }

    /**
     * Checks whether the stored raw base has a `Diff-Path` header, which is
     * required for patch updates.
     *
     * @param rawFilter Stored raw filter content.
     *
     * @returns True if the raw base has a `Diff-Path` header.
     */
    private static hasDiffPath(rawFilter: string): boolean {
        const { diffPath } = FilterParser.parseFilterDataFromRawHeader(rawFilter);
        return !!diffPath;
    }

    /**
     * Checks whether the stored raw base of a custom filter is still the same
     * as the one the download was based on.
     *
     * @param filterId Custom filter id.
     * @param rawFilter Raw base used for the download.
     *
     * @returns True if the stored base is unchanged; false if it has changed or cannot be read.
     */
    private static async isStoredBaseUnchanged(
        filterId: number,
        rawFilter: string | undefined,
    ): Promise<boolean> {
        try {
            return rawFilter === await FiltersStoragesAdapter.getOriginal(filterId);
        } catch (e) {
            logger.warn(`[ext.CustomFilterApi.isStoredBaseUnchanged]: failed to re-read the stored base of custom filter ${filterId}:`, e);
            return false;
        }
    }

    /**
     * Marks the filter as waiting for a full update, so patch updates are
     * skipped until the next full sync.
     *
     * @param filterId Custom filter id.
     */
    private static suspendPatchUpdates(filterId: number): void {
        const filterVersion = filterVersionStorage.get(filterId);

        if (!filterVersion) {
            return;
        }

        filterVersionStorage.set(filterId, {
            ...filterVersion,
            shouldWaitFullUpdate: true,
        });
    }

    /**
     * Loads filter data from specified url and parse it.
     *
     * If the filter lacks a `! TimeUpdated:` metadata tag,
     * the HTTP `Last-Modified` response header is used as a fallback timestamp
     * for the filter's update time.
     *
     * @param url Custom filter subscription url.
     * @param rawFilter Optional raw filter rules.
     * @param force If true filter data will be downloaded directly, not through patches.
     *
     * @returns Downloaded and parsed filter data.
     *
     * @throws Error if the download or patch update fails or exceeds
     * {@link CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS}.
     */
    private static async getRemoteFilterData(
        url: string,
        rawFilter?: string,
        force?: boolean,
    ): Promise<GetRemoteCustomFilterResult> {
        logger.info(`[ext.CustomFilterApi.getRemoteFilterData]: get custom filter data from ${url}`);

        const downloadResult = await createPromiseWithTimeout(
            CustomFilterApi.network.downloadFilterRulesBySubscriptionUrl(
                url,
                rawFilter,
                force,
                CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS,
            ),
            CUSTOM_FILTER_DOWNLOAD_TIMEOUT_MS,
            'Fetch timeout is over',
        );

        if (downloadResult.isPatchUpdateFailed) {
            throw new Error(`Patch update failed for custom filter at ${url}`);
        }

        const parsed = FilterParser.parseFilterDataFromHeader(
            downloadResult.filter,
            downloadResult.headers?.lastModified,
        );

        const { version } = parsed;

        const checksum = !version || !BrowserUtils.isSemver(version)
            ? CustomFilterApi.getChecksum(downloadResult.filter)
            : null;

        return {
            rawRules: downloadResult.rawFilter,
            rules: downloadResult.filter,
            parsed,
            checksum,
            isFullUpdate: !!force || !rawFilter,
        };
    }
}
