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

import { z } from 'zod';
import browser from 'webextension-polyfill';

import { RULE_SET_NAME_PREFIX } from '@adguard/tswebextension/mv3';

import {
    CustomFilterMetadataStorageData,
    FilterStateStorageData,
    GroupStateStorageData,
    Metadata,
    SettingOption,
    Settings,
} from '../../schema';
import { NEWLINE_CHAR_REGEX } from '../../../common/constants';
import { defaultSettings } from '../../../common/settings';
import { logger } from '../../../common/logger';
import { filteredArray } from '../../schema/zod-helpers';

/**
 * Custom filter schema from the experimental extension.
 */
const customFilterSchema = z.object({
    id: z.number(),
    rules: z.string(),
});

/**
 * Custom filter type.
 */
type CustomFilter = z.infer<typeof customFilterSchema>;

/**
 * Filter info schema from the experimental extension.
 */
const filterInfoSchema = z.object({
    description: z.string().optional(),
    enabled: z.boolean(),
    groupId: z.number(),
    id: z.number(),
    localeCodes: z.array(z.string()).optional(),
    title: z.string(),
    iconId: z.string().optional(),
    url: z.string().url().optional(),
});

type FilterInfo = z.infer<typeof filterInfoSchema>;

/**
 * Filters info schema from the experimental extension.
 */
const filtersInfoSchema = filteredArray(filterInfoSchema);

/**
 * Custom filters rules schema from the experimental extension.
 */
const customFiltersRulesSchema = z.array(customFilterSchema);

/**
 * Alias for type from extension.
 */
type RuleResource = browser.Manifest.WebExtensionManifestDeclarativeNetRequestRuleResourcesItemType;

/**
 * This module is used for migrating data from the experimental extension to the new mv3 extension.
 */
export class Experimental {
    /**
     * Checks if the passed data comes from the experimental extension.
     *
     * @param dataFromStorage Data from the storage.
     * @returns True if the data is from the experimental extension.
     */
    static isExperimental(dataFromStorage: unknown): boolean {
        // Minimal set of fields that exists in experimental settings after installation
        const markerFields = [
            'ENABLED_FILTERS_IDS',
            'custom_filters_rules',
            'user_rules',
            'user_rules_status',
        ];

        if (typeof dataFromStorage === 'object' && dataFromStorage !== null) {
            return markerFields.every((field) => field in dataFromStorage);
        }

        return false;
    }

    /**
     * Retrieves data from the user_rules field and separates it into allowlist and userrules.
     *
     * @param inputUserRules User rules string.
     * @returns UserRules array.
     */
    static getUserRules(inputUserRules: unknown): string[] {
        if (typeof inputUserRules !== 'string') {
            return [];
        }

        /**
         * Marker for disabled userrules in the experimental extension.
         */
        const DISABLED_RULE_MARKER = '!off!';

        const userRules: string[] = [];
        if (inputUserRules) {
            const lines = inputUserRules.split(NEWLINE_CHAR_REGEX);
            for (let i = 0; i < lines.length; i += 1) {
                let line = lines[i]?.trim();
                if (line) {
                    line = line.replace(DISABLED_RULE_MARKER, '!');
                    if (line) {
                        userRules.push(line);
                    }
                }
            }
        }
        return userRules;
    }

    /**
     * Retrieves data from the custom_filters_rules field and prepares it into custom filters.
     *
     * @param customFiltersRules Custom filters rules object from the experimental extension.
     * @returns Custom filters rules.
     */
    static getCustomFilters(customFiltersRules: unknown): CustomFilter[] {
        const result = customFiltersRulesSchema.safeParse(customFiltersRules);

        if (!result.success) {
            logger.info('Failed to parse custom filters rules', result.error);
            return [];
        }

        return result.data;
    }

    /**
     * Filters out any filters that do not exist in the manifest's declarative_net_request rule_resources.
     *
     * @param filters Array of FilterInfo objects to filter.
     * @param ruleResources Array of rule resources from the manifest.
     * @returns Filtered array of FilterInfo objects that exist in the manifest rule resources.
     */
    static filterExistingRules(
        filters: FilterInfo[],
        ruleResources: RuleResource[],
    ): FilterInfo[] {
        return filters.filter((filter) => {
            if (Experimental.isCustomFilter(filter)) {
                return true;
            }

            const contains = ruleResources.some((ruleResource) => {
                return ruleResource.id === `${RULE_SET_NAME_PREFIX}${filter.id}`;
            });

            if (!contains) {
                logger.debug('Filter with id is not presented in the declarative rulesets');
            }

            return contains;
        });
    }

    /**
     * Checks if the filter is a custom filter.
     *
     * @param filter Filter info object.
     * @returns True if the filter is a custom filter.
     */
    static isCustomFilter(filter: FilterInfo): boolean {
        const CUSTOM_GROUP_ID = 0;
        return filter.groupId === CUSTOM_GROUP_ID && filter.url !== undefined;
    }

    /**
     * Retrieves data from the filters_info field and prepares it into filters settings.
     *
     * @param filtersInfo Filters info object.
     * @param metadata Object with filters metadata. It is needed since a group id of a filter in
     * the experimental extension is different from in the new extension.
     * @param ruleResources Array of rule resources from the manifest.
     * @returns Filters settings.
     */
    static getFiltersSettings(
        filtersInfo: unknown,
        metadata: Metadata,
        ruleResources: RuleResource[],
    ):
        {
            filtersState: FilterStateStorageData,
            groupsState: GroupStateStorageData,
            customFiltersState: CustomFilterMetadataStorageData,
        } {
        const result = filtersInfoSchema.safeParse(filtersInfo);

        if (!result.success) {
            logger.info('Failed to parse filters info', result.error);
            return {
                filtersState: {},
                groupsState: {},
                customFiltersState: [],
            };
        }

        const parsedFilters = Experimental.filterExistingRules(result.data, ruleResources);

        const filtersState: FilterStateStorageData = {};
        parsedFilters.forEach(filter => {
            if (filter.enabled) {
                filtersState[filter.id] = {
                    enabled: filter.enabled,
                    installed: false,
                    loaded: !!filter.url,
                };
            }
        });

        const groupsState: GroupStateStorageData = {};
        parsedFilters.forEach(filter => {
            if (filter.enabled) {
                // special case for custom filters
                if (Experimental.isCustomFilter(filter)) {
                    groupsState[filter.groupId] = {
                        enabled: true,
                        touched: true,
                    };
                } else {
                    const filterMetadata = metadata.filters[filter.id];
                    if (filterMetadata !== undefined) {
                        groupsState[filterMetadata.groupId] = {
                            enabled: true,
                            touched: true,
                        };
                    }
                }
            }
        });

        const customFiltersState: CustomFilterMetadataStorageData = [];
        parsedFilters.forEach(filter => {
            if (Experimental.isCustomFilter(filter)) {
                customFiltersState.push({
                    filterId: filter.id,
                    displayNumber: 0,
                    groupId: filter.groupId,
                    name: filter.title,
                    description: filter.description || '',
                    homepage: '',
                    version: '',
                    checksum: '',
                    tags: [0],
                    customUrl: filter.url!, // url is checked in the isCustomFilter method
                    trusted: false,
                    expires: 0,
                    timeUpdated: 0,
                });
            }
        });

        return {
            filtersState,
            groupsState,
            customFiltersState,
        };
    }

    /**
     * Migrates dataFromStorage from the experimental extension to the new mv3 extension settings.
     *
     * @param dataFromStorage Data from the storage.
     * @param metadata Object with filters metadata.
     * @param ruleResources Array of rule resources from the manifest.
     * @returns Migrated data.
     */
    static migrateSettings(
        dataFromStorage: unknown,
        metadata: Metadata,
        ruleResources: RuleResource[],
    ):
        {
            userrules: string[],
            settings: Settings,
            customFilters: CustomFilter[]
        } {
        const userrules = Experimental.getUserRules((dataFromStorage as {
            user_rules?: unknown
        }).user_rules);

        const filtersSettings = Experimental.getFiltersSettings((dataFromStorage as {
            filters_info?: unknown
        }).filters_info, metadata, ruleResources);

        const settings = {
            ...defaultSettings,
            [SettingOption.FiltersState]: JSON.stringify(filtersSettings.filtersState),
            [SettingOption.GroupsState]: JSON.stringify(filtersSettings.groupsState),
            [SettingOption.CustomFilters]: JSON.stringify(filtersSettings.customFiltersState),
        };

        const customFilters = Experimental.getCustomFilters((dataFromStorage as {
            custom_filters_rules?: unknown
        }).custom_filters_rules);

        return {
            userrules,
            settings,
            customFilters,
        };
    }
}
