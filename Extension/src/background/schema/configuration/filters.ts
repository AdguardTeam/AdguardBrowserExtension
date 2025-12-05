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
import zod from 'zod';

import { customFiltersConfigValidator } from './custom-filters';
import { userFilterValidator } from './user-filter';
import { allowlistValidator } from './allowlist';

// AdGuard filters configuration
export const enum FiltersOption {
    EnabledGroups = 'enabled-groups',
    EnabledFilters = 'enabled-filters',
    CustomFilters = 'custom-filters',
    UserFilter = 'user-filter',
    Allowlist = 'allowlist',
}

export const filtersConfigValidator = zod.object({
    /**
     * List of IDs of enabled filter groups.
     */
    [FiltersOption.EnabledGroups]: zod.array(zod.number().int()),
    /**
     * List of IDs of enabled filters.
     */
    [FiltersOption.EnabledFilters]: zod.array(zod.number().int()),
    /**
     * List of objects with information about custom filters.
     */
    [FiltersOption.CustomFilters]: customFiltersConfigValidator,
    /**
     * An object with concatenated user rules and their status - enabled or not.
     */
    [FiltersOption.UserFilter]: userFilterValidator,
    /**
     * Object with the allowlist domains, the inverted allowlist domains and
     * which one applies.
     */
    [FiltersOption.Allowlist]: allowlistValidator,
});

/**
 * Contains all information about filters: regular, custom, user filter and
 * allowlist.
 */
export type FiltersConfig = zod.infer<typeof filtersConfigValidator>;
