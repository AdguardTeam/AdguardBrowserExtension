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

import { sortBy } from 'lodash-es';

import type { CategoriesFilterData, CategoriesGroupData } from '../../../../background/api';

/**
 * Sorts filters by enabled status and displayNumber
 *
 * @param filters Filters to sort.
 *
 * @returns Sorted filters.
 */
export const sortFilters = (filters: CategoriesFilterData[]) => {
    const sorted = [...filters]
        .sort((a, b) => {
            // sort by enabled
            const enabledA = !!a.enabled;
            const enabledB = !!b.enabled;
            if (enabledA !== enabledB) {
                return Number(enabledB) - Number(enabledA);
            }

            // sort by groupId
            if (a.groupId !== b.groupId) {
                return a.groupId - b.groupId;
            }

            // sort by display number
            if (a.displayNumber && b.displayNumber) {
                return a.displayNumber - b.displayNumber;
            }

            if (a.displayNumber) {
                return 1;
            }

            if (b.displayNumber) {
                return -1;
            }

            return 0;
        });

    return sorted;
};

/**
 * Updates filters state without changing order
 *
 * @param currentFilters
 * @param newFilters
 *
 * @returns Filters with updated state.
 */
export const updateFilters = (
    currentFilters: CategoriesFilterData[],
    newFilters: CategoriesFilterData[],
): CategoriesFilterData[] => {
    const updatedFilters = [...currentFilters];

    newFilters.forEach((newFilter) => {
        const currentFilterIdx = currentFilters.findIndex((currentFilter) => {
            return currentFilter.filterId === newFilter.filterId;
        });

        if (currentFilterIdx < 0) {
            updatedFilters.push(newFilter);
        } else {
            updatedFilters[currentFilterIdx] = newFilter;
        }
    });

    return updatedFilters;
};

/**
 * Updates groups state without changing order
 *
 * @param currentGroups
 * @param newGroups
 *
 * @returns Groups with updated state.
 */
export const updateGroups = (
    currentGroups: CategoriesGroupData[],
    newGroups: CategoriesGroupData[],
): CategoriesGroupData[] => {
    const updatedGroups = [...currentGroups];

    newGroups.forEach((newGroup) => {
        const currentGroupIdx = currentGroups.findIndex((currentGroup) => {
            return currentGroup.groupId === newGroup.groupId;
        });

        if (currentGroupIdx < 0) {
            updatedGroups.push(newGroup);
        } else {
            updatedGroups[currentGroupIdx] = newGroup;
        }
    });

    return updatedGroups;
};

export const sortGroupsOnSearch = (groups: CategoriesGroupData[]) => {
    const sortedGroups = sortBy(groups, 'displayNumber')
        .sort((a, b) => {
            // enabled first
            if (a.enabled && !b.enabled) {
                return -1;
            }
            if (!a.enabled && b.enabled) {
                return 1;
            }
            return 0;
        });
    return sortedGroups;
};

/**
 * Formats `date` to string.
 *
 * @param dateMs Date to format.
 *
 * @returns Formatted date.
 */
export const formatDate = (dateMs: number) => {
    const dateObj = new Date(dateMs);
    const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return dateObj.toLocaleDateString('default', formatOptions);
};
