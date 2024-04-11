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
import MD5 from 'crypto-js/md5';

import { BrowserUtils } from '../../../utils/browser-utils';
import { AntibannerGroupsId, CUSTOM_FILTERS_START_ID } from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { CustomFilterMetadata, customFilterMetadataStorageDataValidator } from '../../../schema';
import {
    customFilterMetadataStorage,
    filterStateStorage,
    FiltersStorage,
    RawFiltersStorage,
    filterVersionStorage,
    groupStateStorage,
} from '../../../storages';
import { Engine } from '../../../engine';
import { network } from '../../network';
import type { FilterUpdateOptions } from '../update';
import { FilterParsedData, FilterParser } from '../parser';

import { CustomFilterLoader } from './loader';

/**
 * Data transfer object for {@link CustomFilterApi} methods.
 */
export type CustomFilterDTO = {
    customUrl: string;
    title?: string;
    trusted: boolean;
    enabled: boolean;
};

/**
 * Full info about downloaded custom filter, returned
 * in 'Add custom filter' modal window if filter was not added before.
 */
export type CustomFilterInfo = FilterParsedData & {
    customUrl: string,
    rulesCount: number,
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window with data,
 * returned on creating new custom filter.
 */
export type CreateCustomFilterResponse = {
    filter: CustomFilterInfo
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window with data,
 * returned if custom filter with subscription url has already existed.
 */
export type CustomFilterAlreadyExistResponse = {
    errorAlreadyExists: boolean
};

/**
 * Response of {@link CustomFilterApi.getFilterInfo} for 'Add custom filter' modal window.
 */
export type GetCustomFilterInfoResult = CreateCustomFilterResponse | CustomFilterAlreadyExistResponse | null;

/**
 * Parsed custom filter data from remote source.
 * It is downloaded while creating and updating custom filter in {@link CustomFilterApi.getRemoteFilterData}.
 */
export type GetRemoteCustomFilterResult = {
    rawRules: string,
    rules: string[],
    checksum: string | null,
    parsed: FilterParsedData,
};

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
 * Filters rules is stored in {@link FiltersStorage}.
 * Raw filter rules (before applying directives) is saved in {@link FiltersStorage}.
 */
export class CustomFilterApi {
    /**
     * Reads stringified {@link CustomFilterMetadata} array from persisted storage
     * and saves it in cache.
     * If data is not exist, set empty array.
     */
    public static init(): void {
        try {
            const storageData = customFilterMetadataStorage.read();
            if (typeof storageData === 'string') {
                const data = customFilterMetadataStorageDataValidator.parse(JSON.parse(storageData));
                customFilterMetadataStorage.setCache(data);
            } else {
                customFilterMetadataStorage.setData([]);
            }
        } catch (e) {
            logger.warn(
                'Cannot parse custom filter metadata from persisted storage, reset to default. Origin error: ',
                e,
            );
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
     * - {@link CreateCustomFilterResponse} on new filter subscription,
     * - {@link CustomFilterAlreadyExistResponse} if custom filter was added before
     * - null, if filter rules are not downloaded.
     */
    public static async getFilterInfo(url: string, title?: string): Promise<GetCustomFilterInfoResult> {
        // Check if filter from this url was added before
        if (customFilterMetadataStorage.getByUrl(url)) {
            return { errorAlreadyExists: true };
        }

        const rules = await network.downloadFilterRulesBySubscriptionUrl(url);

        if (!rules) {
            return null;
        }

        const parsedData = FilterParser.parseFilterDataFromHeader(rules.filter);

        const filter = {
            ...parsedData,
            name: parsedData.name ? parsedData.name : title as string,
            timeUpdated: parsedData.timeUpdated ? parsedData.timeUpdated : new Date().toISOString(),
            customUrl: url,
            rulesCount: rules.filter.filter(rule => rule.trim().indexOf('!') !== 0).length,
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
    public static async createFilter(filterData: CustomFilterDTO): Promise<CustomFilterMetadata> {
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

        logger.info(`Create new custom filter with id ${filterId}`);

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

        filterVersionStorage.set(filterId, {
            version,
            diffPath,
            expires: filterMetadata.expires,
            lastUpdateTime: filterMetadata.timeUpdated,
            lastCheckTime: Date.now(),
            lastScheduledCheckTime: Date.now(),
        });

        filterStateStorage.set(filterId, {
            loaded: true,
            installed: true,
            enabled,
        });

        await FiltersStorage.set(filterId, rules);
        await RawFiltersStorage.set(filterId, rawRules);

        const group = groupStateStorage.get(filterMetadata.groupId);

        // If group has never been enabled - enables it.
        if (group && !group.touched) {
            groupStateStorage.enableGroups([filterMetadata.groupId]);
        }

        return filterMetadata;
    }

    /**
     * Creates new custom filters from the passed DTO array.
     *
     * @param filtersData Array of {@link CustomFilterDTO}.
     */
    public static async createFilters(filtersData: CustomFilterDTO[]): Promise<void> {
        const tasks = filtersData.map(filterData => CustomFilterApi.createFilter(filterData));

        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('Cannot create filter due to: ', promise.reason);
            }
        });
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
     * @returns Updated filter metadata or null, if filter is not existed
     * or new version is not available.
     */
    public static async updateFilter(
        filterUpdateOptions: FilterUpdateOptions,
    ): Promise<CustomFilterMetadata | null> {
        logger.info(`Update Custom filter ${filterUpdateOptions.filterId} ...`);

        const filterMetadata = customFilterMetadataStorage.getById(filterUpdateOptions.filterId);

        if (!filterMetadata) {
            logger.error(`Cannot find custom filter ${filterUpdateOptions.filterId} metadata`);
            return null;
        }

        const { customUrl } = filterMetadata;

        const rawFilter = await RawFiltersStorage.get(filterUpdateOptions.filterId);
        const filterRemoteData = await CustomFilterApi.getRemoteFilterData(
            customUrl,
            rawFilter,
            filterUpdateOptions.ignorePatches,
        );

        if (!CustomFilterApi.isFilterNeedUpdate(filterMetadata, filterRemoteData)) {
            logger.info(`Custom filter ${filterUpdateOptions.filterId} is already updated`);
            return null;
        }

        logger.info(`Successfully update custom filter ${filterUpdateOptions.filterId}`);
        return CustomFilterApi.updateFilterData(filterMetadata, filterRemoteData);
    }

    /**
     * Remove custom filter data from storages.
     *
     * If custom filter was enabled, reload filter engine after removing.
     *
     * @param filterId Custom filter id.
     */
    public static async removeFilter(filterId: number): Promise<void> {
        logger.info(`Remove Custom filter ${filterId} ...`);

        customFilterMetadataStorage.remove(filterId);
        filterVersionStorage.delete(filterId);

        const filterState = filterStateStorage.get(filterId);

        filterStateStorage.delete(filterId);

        await FiltersStorage.remove(filterId);
        await RawFiltersStorage.remove(filterId);

        if (filterState?.enabled) {
            Engine.debounceUpdate();
        }
    }

    /**
     * Check if filter is custom.
     *
     * @param filterId Filter id.
     *
     * @returns True, if filter is custom, else returns false.
     */
    public static isCustomFilter(filterId: number): boolean {
        return filterId >= CUSTOM_FILTERS_START_ID;
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
     * @param downloadedData.rules New rules.
     * @param downloadedData.checksum New checksum.
     * @param downloadedData.parsed New parsed data.
     * @param downloadedData.rawRules New raw rules.
     *
     * @returns Updated custom filter metadata.
     */
    private static async updateFilterData(
        filterMetadata: CustomFilterMetadata,
        {
            rawRules,
            rules,
            checksum,
            parsed,
        }: GetRemoteCustomFilterResult,
    ): Promise<CustomFilterMetadata> {
        const { filterId } = filterMetadata;

        const {
            version,
            expires,
            timeUpdated,
            diffPath,
        } = parsed;

        filterVersionStorage.set(filterId, {
            version,
            diffPath,
            expires: Number(expires),
            lastUpdateTime: new Date(timeUpdated).getTime(),
            lastCheckTime: Date.now(),
            lastScheduledCheckTime: Date.now(),
        });

        const newFilterMetadata = {
            ...filterMetadata,
            version,
            checksum,
        };

        customFilterMetadataStorage.set(newFilterMetadata);

        await FiltersStorage.set(filterId, rules);
        await RawFiltersStorage.set(filterId, rawRules);

        return newFilterMetadata;
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
        const rulesText = rules.join('\n');
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
        logger.info(`Check if custom filter ${filter.filterId} need to update`);

        if (BrowserUtils.isSemver(filter.version) && BrowserUtils.isSemver(parsed.version)) {
            return !BrowserUtils.isGreaterOrEqualsVersion(filter.version, parsed.version);
        }

        if (!filter.checksum) {
            return true;
        }

        return checksum !== filter.checksum;
    }

    /**
     * Loads filter data from specified url and parse it.
     *
     * @param url Custom filter subscription url.
     *
     * @param rawFilter Optional raw filter rules.
     * @param force If true filter data will be downloaded directly, not through patches.
     * @returns Downloaded and parsed filter data.
     */
    private static async getRemoteFilterData(
        url: string,
        rawFilter?: string,
        force?: boolean,
    ): Promise<GetRemoteCustomFilterResult> {
        logger.info(`Get custom filter data from ${url}`);

        const downloadResult = await CustomFilterLoader.downloadRulesWithTimeout(url, rawFilter, force);

        const parsed = FilterParser.parseFilterDataFromHeader(downloadResult.filter);

        const { version } = parsed;

        const checksum = !version || !BrowserUtils.isSemver(version)
            ? CustomFilterApi.getChecksum(downloadResult.filter)
            : null;

        return {
            rawRules: downloadResult.rawFilter,
            rules: downloadResult.filter,
            parsed,
            checksum,
        };
    }
}
