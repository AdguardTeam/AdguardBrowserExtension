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
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId, RECOMMENDED_TAG_ID } from '../../../common/constants';
import {
    metadataStorage,
    filterStateStorage,
    groupStateStorage,
    filterVersionStorage,
    customFilterMetadataStorage,
} from '../../storages';
import {
    GroupMetadata,
    TagMetadata,
    RegularFilterMetadata,
    GroupStateData,
    FilterStateData,
    FilterVersionData,
    CustomFilterMetadata,
} from '../../schema';
import { logger } from '../../../common/logger';
import { CustomFilterHelper } from '../../../common/custom-filter-helper';

import { CommonFilterApi } from './common';
import { FilterMetadata, FiltersApi } from './main';
import { FilterUpdateApi } from './update';

/**
 * Filter data displayed in category section on options page.
 */
export type CategoriesFilterData = (
    (RegularFilterMetadata | CustomFilterMetadata) &
    // Optional because there is no field 'languages' in CustomFilterMetadata.
    // TODO: consider removing because RegularFilterMetadata already has 'languages' field.
    { languages?: string[] } &
    FilterStateData &
    FilterVersionData &
    { tagsDetails: TagMetadata[] }
);

/**
 * Groups data displayed on options page.
 */
export type CategoriesGroupData = (
    GroupMetadata &
    GroupStateData &
    { filters?: CategoriesFilterData[] }
);

/**
 * Aggregated data for options page.
 */
export type CategoriesData = {
    categories: CategoriesGroupData[],
    filters: CategoriesFilterData[]
};

/**
 * Class for filter groups management.
 */
export class Categories {
    private static PURPOSE_MOBILE_TAG_ID = 19;

    /**
     * Returns aggregated filters category data for option page.
     *
     * @returns Categories aggregated data.
     */
    public static getCategories(): CategoriesData {
        const groups = Categories.getGroups();
        let filters = Categories.getFilters();

        // Exclude Quick Fixes filter and custom filters from filters list
        // TODO: remove this check when Quick Fixes Filter and custom filters will be supported for MV3 again
        if (__IS_MV3__) {
            filters = filters.filter((f) => {
                return f.filterId !== AntiBannerFiltersId.QuickFixesFilterId
                    && !CustomFilterHelper.isCustomFilter(f.filterId);
            });
        }

        const categories = groups.map((group) => ({
            ...group,
            filters: Categories.selectFiltersByGroupId(group.groupId, filters),
        }));

        return {
            filters,
            categories,
        };
    }

    /**
     * Gets group state data from storage.
     *
     * @param groupId Id of group of filters.
     *
     * @returns Group state data if group is found, else returns undefined.
     */
    public static getGroupState(groupId: number): GroupStateData | undefined {
        return groupStateStorage.get(groupId);
    }

    /**
     * Enables specified group of filters and check updates for enabled filters.
     *
     * On first group activation we provide recommended filters,
     * that will be loaded end enabled before update checking.
     *
     * @param groupId Id of group of filters.
     * @param update Whether to download metadata and filter rules from remote
     * resources or from local resources and should it to check for updates.
     * @param recommendedFiltersIds Array of filters ids to enable on first time
     * the group has been activated after enabling.
     */
    public static async enableGroup(
        groupId: number,
        update: boolean,
        recommendedFiltersIds: number[] = [],
    ): Promise<void> {
        if (recommendedFiltersIds.length > 0) {
            await FiltersApi.loadAndEnableFilters(recommendedFiltersIds, update);
        }

        if (update) {
            // Always checks updates for enabled filters of the group.
            const enabledFiltersIds = Categories.getEnabledFiltersIdsByGroupId(groupId);
            await FilterUpdateApi.checkForFiltersUpdates(enabledFiltersIds);
        }

        groupStateStorage.enableGroups([groupId]);
    }

    /**
     * Disable group.
     *
     * @param groupId Group id.
     */
    public static disableGroup(groupId: number): void {
        groupStateStorage.disableGroups([groupId]);
    }

    /**
     * Returns specified group metadata by filter id.
     *
     * @param filterId Filter id.
     *
     * @returns Specified {@link GroupMetadata | group metadata }
     * or undefined.
     */
    public static getGroupByFilterId(filterId: number): GroupMetadata | undefined {
        const filter = metadataStorage.getFilter(filterId)
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2356
            || customFilterMetadataStorage.getById(filterId);

        if (!filter) {
            return;
        }

        return metadataStorage.getGroup(filter.groupId);
    }

    /**
     * Checks if filter has recommended tag.
     *
     * @param filter Filter metadata.
     *
     * @returns True, if filter has recommended tag, else returns false.
     */
    private static isRecommendedFilter(filter: FilterMetadata): boolean {
        return filter.tags.includes(RECOMMENDED_TAG_ID);
    }

    /**
     * Checks if filter has mobile tag.
     *
     * @param filter Filter metadata.
     *
     * @returns True, if filter has mobile tag, else returns false.
     */
    private static isMobileFilter(filter: FilterMetadata): boolean {
        return filter.tags.includes(Categories.PURPOSE_MOBILE_TAG_ID);
    }

    /**
     * If filter has mobile tag we check if platform is mobile, in other cases we do not check.
     *
     * @param filter Filter metadata.
     *
     * @returns True, if filter match platform, else returns false.
     */
    private static isFilterMatchPlatform(filter: FilterMetadata): boolean {
        if (Categories.isMobileFilter(filter)) {
            return !!UserAgent.isAndroid;
        }
        return true;
    }

    /**
     * Returns recommended filters, which meet next requirements:
     * 1. Filter has recommended tag;
     * 2. If filter has language tag, tag should match with user locale;
     * 3. Filter should correspond to platform mobile or desktop.
     *
     * @param groupId Group id.
     *
     * @returns Recommended filters by groupId.
     */
    public static getRecommendedFilterIdsByGroupId(groupId: number): number[] {
        const { categories } = Categories.getCategories();

        const langSuitableFilters = CommonFilterApi.getLangSuitableFilters();

        const group = categories.find((category) => category.groupId === groupId);

        if (!group?.filters) {
            return [];
        }

        const { filters } = group;

        const result: number[] = [];

        filters.forEach((filter) => {
            if (Categories.isRecommendedFilter(filter) && Categories.isFilterMatchPlatform(filter)) {
                // get ids intersection to enable recommended filters matching the lang tag
                // only if filter has language
                if (filter.languages && filter.languages.length > 0) {
                    if (langSuitableFilters.includes(filter.filterId)) {
                        result.push(filter.filterId);
                    }
                } else {
                    result.push(filter.filterId);
                }
            }
        });

        return result;
    }

    /**
     * Returns tags metadata from {@link metadataStorage}.
     *
     * @param tagsIds Tags ids.
     *
     * @returns Aggregated groups data.
     */
    private static getTagsDetails(tagsIds: number[]): TagMetadata[] {
        const tagsMetadata = metadataStorage.getTags();

        const tagsDetails: TagMetadata[] = [];

        for (let i = 0; i < tagsIds.length; i += 1) {
            const tagId = tagsIds[i];

            const tagDetails = tagsMetadata.find((tag) => tag.tagId === tagId);

            if (tagDetails) {
                if (tagDetails.keyword.startsWith('reference:')) {
                    // Hide 'reference:' tags
                    continue;
                }

                if (!tagDetails.keyword.startsWith('lang:')) {
                    // Hide prefixes except of 'lang:'
                    tagDetails.keyword = tagDetails.keyword.substring(tagDetails.keyword.indexOf(':') + 1);
                }

                tagsDetails.push(tagDetails);
            }
        }

        return tagsDetails;
    }

    /**
     * Returns filters merged data from {@link metadataStorage},
     * {@link customFilterMetadataStorage}, {@link filterStateStorage} and
     * {@link filterVersionStorage}.
     *
     * @returns Aggregated filters data.
     */
    private static getFilters(): CategoriesFilterData[] {
        const filtersMetadata = FiltersApi.getFiltersMetadata();

        const result: CategoriesFilterData[] = [];

        filtersMetadata.forEach((filterMetadata) => {
            const {
                filterId,
                tags,
                version,
                expires,
                timeUpdated,
                diffPath,
            } = filterMetadata;
            const tagsDetails = Categories.getTagsDetails(tags);

            const filterState = filterStateStorage.get(filterId);
            if (!filterState) {
                logger.error(`Cannot find filter ${filterId} state data`);
                return;
            }

            let filterVersion = filterVersionStorage.get(filterId);
            if (!filterVersion) {
                // TODO: remove this hack after we find how to reproduce this issue
                // Sometimes filter version data might be missing https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2693,
                // so we set it to values from metadata
                logger.info(`Cannot find filter ${filterId} version data, restoring it from metadata`);
                const dayAgoMs = Date.now() - 1000 * 60 * 60 * 24; // 24 hours
                filterVersion = {
                    version,
                    expires,
                    lastUpdateTime: (new Date(timeUpdated)).getTime(),
                    // this is set in the past to force update check
                    lastCheckTime: dayAgoMs,
                    lastScheduledCheckTime: dayAgoMs,
                    diffPath,
                };
                filterVersionStorage.set(filterId, filterVersion);
            }

            result.push({
                ...filterMetadata,
                ...filterState,
                ...filterVersion,
                tagsDetails,
            });
        });

        return result;
    }

    /**
     * Returns groups data from {@link metadataStorage} and {@link groupStateStorage}.
     *
     * @returns Aggregated groups data.
     */
    private static getGroups(): CategoriesGroupData[] {
        const groupsMetadata = metadataStorage.getGroups();

        const result: CategoriesGroupData[] = [];

        groupsMetadata.forEach((groupMetadata) => {
            const groupState = groupStateStorage.get(groupMetadata.groupId);

            if (!groupState) {
                logger.error(`Cannot find group ${groupMetadata.groupId} state data`);
                return;
            }

            result.push({
                ...groupMetadata,
                ...groupState,
            });
        });

        return result;
    }

    /**
     * Returns filters data for specified group.
     *
     * @param groupId Group id.
     * @param filters Aggregated filters data.
     *
     * @returns Aggregated filters data for specified group.
     */
    private static selectFiltersByGroupId(groupId: number, filters: CategoriesFilterData[]): CategoriesFilterData[] {
        return filters.filter((filter: CategoriesFilterData) => filter.groupId === groupId);
    }

    /**
     * Returns ids of enabled filters for specified group id.
     *
     * @param groupId Group id.
     *
     * @returns List of filters ids.
     */
    public static getEnabledFiltersIdsByGroupId(groupId: number): number[] {
        const filtersMetadata = FiltersApi.getFiltersMetadata();

        return filtersMetadata
            .filter((filter: FilterMetadata) => filter.groupId === groupId)
            .filter(({ filterId }) => {
                const filterState = filterStateStorage.get(filterId);

                return filterState?.enabled;
            })
            .map(({ filterId }) => filterId);
    }
}
