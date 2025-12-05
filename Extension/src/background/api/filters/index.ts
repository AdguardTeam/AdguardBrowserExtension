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
export { FiltersApi, type FilterMetadata } from './main';
export { CommonFilterApi } from './common';
export { CustomFilterApi, type GetCustomFilterInfoResult } from './custom';
export { AllowlistApi } from './allowlist';
export { UserRulesApi } from './userrules';
export {
    FilterUpdateApi,
    type FilterUpdateOptions,
    type FilterUpdateOptionsList,
} from './update';
export {
    Categories,
    type CategoriesFilterData,
    type CategoriesGroupData,
    type CategoriesData,
} from './categories';
export { HitStatsApi } from './hit-stats';
export { annoyancesConsent } from './annoyances-consent';
