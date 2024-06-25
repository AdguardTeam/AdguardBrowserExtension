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
import type { Manifest } from 'webextension-polyfill';

import { filteredArray } from '../../schema/zod-helpers';
import {
    Settings,
    type CustomFilterMetadataStorageData,
    type FilterStateStorageData,
    type GroupStateStorageData,
} from '../../schema';

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

export type FilterInfo = z.infer<typeof filterInfoSchema>;

/**
 * Filters info schema from the experimental extension.
 */
export const filtersInfoSchema = filteredArray(filterInfoSchema);

/**
 * Alias for type from extension.
 */
export type RuleResource = Manifest.WebExtensionManifestDeclarativeNetRequestRuleResourcesItemType;

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
export type CustomFilter = z.infer<typeof customFilterSchema>;

/**
 * Custom filters rules schema from the experimental extension.
 */
export const customFiltersRulesSchema = z.array(customFilterSchema);

/**
 * Data of filters settings from the experimental extension.
 */
export type FiltersSettings = {
    filtersState: FilterStateStorageData,
    groupsState: GroupStateStorageData,
    customFiltersState: CustomFilterMetadataStorageData,
};

/**
 * Data of settings migrated from the experimental extension.
 */
export type MigratedData = {
    userrules: string[],
    settings: Settings,
    customFilters: CustomFilter[]
};
