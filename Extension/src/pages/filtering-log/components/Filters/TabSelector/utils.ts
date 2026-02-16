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

import { WASTE_CHARACTERS } from '../../../../../common/constants';
import { type SelectorTab } from '../../../stores/LogStore';

/**
 * Filters tabs based on search value.
 * Searches in both title and domain fields.
 *
 * @param tabs Array of tabs to filter
 * @param searchValue Search query string
 *
 * @returns Filtered array of tabs
 */
export const filterTabsBySearch = (tabs: SelectorTab[], searchValue: string): SelectorTab[] => {
    if (!searchValue) {
        return tabs;
    }

    const searchValueString = searchValue.replace(WASTE_CHARACTERS, '\\$&');
    const searchQuery = new RegExp(searchValueString, 'ig');

    return tabs.filter((tab) => {
        const { title, domain } = tab;
        return title.match(searchQuery) || (domain && domain.match(searchQuery));
    });
};
