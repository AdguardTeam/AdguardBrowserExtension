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
    [FiltersOption.EnabledGroups]: zod.array(zod.number().int()),
    [FiltersOption.EnabledFilters]: zod.array(zod.number().int()),
    [FiltersOption.CustomFilters]: customFiltersConfigValidator,
    [FiltersOption.UserFilter]: userFilterValidator,
    [FiltersOption.Allowlist]: allowlistValidator,
});

export type FiltersConfig = zod.infer<typeof filtersConfigValidator>;
