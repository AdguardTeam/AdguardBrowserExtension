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

/**
 * Keys of options for custom filter in the configuration.
 */
export const enum CustomFilterOption {
    CustomUrl = 'customUrl',
    Title = 'title',
    Trusted = 'trusted',
    Enabled = 'enabled',
}

export const customFiltersConfigValidator = zod.array(
    zod.object({
        /**
         * The filter subscription URL from which the application retrieved
         * the rules when adding the filter and should retrieve the rules when
         * updating it.
         */
        [CustomFilterOption.CustomUrl]: zod.string(),
        /**
         * Name of the filter.
         */
        [CustomFilterOption.Title]: zod.string().optional(),
        /**
         * If this filter is not trusted - tsurlfilter will not execute JS rules
         * and will not apply header removal rules from this filter.
         * Otherwise, no restrictions.
         *
         * @see https://adguard.com/kb/general/ad-filtering/create-own-filters/#trusted-filters.
         */
        [CustomFilterOption.Trusted]: zod.boolean(),
        /**
         * Is filter enabled or not.
         */
        [CustomFilterOption.Enabled]: zod.boolean(),
    }),
);
