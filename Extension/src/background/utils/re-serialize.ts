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
import { FILTER_LIST_EXTENSION } from '../../common/constants';
import { logger } from '../../common/logger';
import {
    BINARY_FILTER_KEY_PREFIX,
    CONVERSION_MAP_PREFIX,
    FILTER_KEY_PREFIX,
    FiltersStorage,
    SOURCE_MAP_PREFIX,
    hybridStorage,
} from '../storages';

/**
 * Prefixes for filter-related keys in storage.
 */
const FILTER_PREFIXES = [
    FILTER_KEY_PREFIX,
    BINARY_FILTER_KEY_PREFIX,
    CONVERSION_MAP_PREFIX,
    SOURCE_MAP_PREFIX,
];

/**
 * Helper function to get all filter IDs from storage
 * by iterating over all keys and extracting IDs from filter-related keys.
 *
 * @returns Promise with an array of filter IDs.
 */
const getAllFilterIds = async (): Promise<number[]> => {
    const ids = new Set<number>();

    try {
        const keys = await hybridStorage.keys();

        keys.forEach((key) => {
            FILTER_PREFIXES.forEach((prefix) => {
                if (key.startsWith(prefix)) {
                    // To get the raw ID, we need to remove the prefix and the extension suffix,
                    // e.g. filterrules_10.txt -> 10
                    //      ------------  ----
                    //      prefix        extension
                    const id = parseInt(key.slice(prefix.length, -FILTER_LIST_EXTENSION.length), 10);
                    if (!Number.isNaN(id)) {
                        ids.add(id);
                    }
                }
            });
        });
    } catch (e) {
        logger.error('Failed to get all filter IDs from storage', e);
    }

    return Array.from(ids);
};

/**
 * Re-serialize the filter list identified by the specified ID.
 * This function retrieves the original filter list rules from storage and re-stores them,
 * which triggers re-serialization.
 * This process is necessary if the binary schema changes following an update,
 * causing AGTree to become incompatible with the old schema.
 *
 * @param filterId Filter ID.
 * @returns Promise that resolves when the filter list is re-serialized.
 */
const reSerializeFilterList = async (filterId: number): Promise<void> => {
    try {
        const originalRules = await FiltersStorage.getOriginalRules(filterId);
        await FiltersStorage.set(filterId, originalRules);
    } catch (e) {
        logger.error(`Failed to re-serialize filter list with ID ${filterId}`, e);
    }
};

/**
 * Re-serialize all filter lists in storage.
 * This function retrieves the original filter list rules from storage and re-stores them,
 * which triggers re-serialization.
 * This process is necessary if the binary schema changes following an update,
 * causing AGTree to become incompatible with the old schema.
 *
 * @returns Promise that resolves when all filter lists are re-serialized.
 */
export const reSerializeAllFilterLists = async (): Promise<void> => {
    const filterIds = await getAllFilterIds();
    await Promise.all(filterIds.map(reSerializeFilterList));
};
