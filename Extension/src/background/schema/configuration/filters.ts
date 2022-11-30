/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import zod from 'zod';

import { customFiltersConfigValidator } from './custom-filters';
import { userFilterValidator } from './user-filter';
import { allowlistValidator } from './allowlist';

// Adguard filters configuration

export const enum FiltersOption {
    EnabledGroups = 'enabled-groups',
    EnabledFilters = 'enabled-filters',
    CustomFilters = 'custom-filters',
    UserFilter = 'user-filter',
    Allowlist = 'whitelist',
}

export const filtersConfigValidator = zod.object({
    [FiltersOption.EnabledGroups]: zod.array(zod.number().int()),
    [FiltersOption.EnabledFilters]: zod.array(zod.number().int()),
    [FiltersOption.CustomFilters]: customFiltersConfigValidator,
    [FiltersOption.UserFilter]: userFilterValidator,
    [FiltersOption.Allowlist]: allowlistValidator,
});

export type FiltersConfig = zod.infer<typeof filtersConfigValidator>;
