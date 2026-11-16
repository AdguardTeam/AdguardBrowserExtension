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

export enum OptionsPageSections {
    general = '',
    filters = 'filters',
    stealth = 'stealth',
    allowlist = 'allowlist',
    userFilter = 'user-filter',
    miscellaneous = 'miscellaneous',
    ruleLimits = 'rule-limits',
    about = 'about',
}

/**
 * Query parameter of the Filters section which selects a filter group.
 */
export const FILTERS_GROUP_QUERY_PARAM = 'group';

/**
 * Returns the options page route of a filter group.
 *
 * @param groupId Filter group id.
 *
 * @returns Route without a leading slash or hash, e.g. `filters?group=0`.
 */
export const getFiltersGroupPath = (groupId: number): string => {
    return `${OptionsPageSections.filters}?${FILTERS_GROUP_QUERY_PARAM}=${groupId}`;
};
