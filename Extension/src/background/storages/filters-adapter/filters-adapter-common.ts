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

import { type ConversionData, FilterList } from '@adguard/tsurlfilter';

import { logger } from '../../../common/logger';
import { FiltersStorage as BrowserExtensionFiltersStorage } from '../filters';

/**
 * The `FiltersStoragesAdapter` is a high-level class responsible for ensuring that
 * the appropriate filter storage is invoked for different types of filters.
 */
export class FiltersStoragesAdapterCommon {
    /**
     * Sets specified filter list with the specified ID in the storage.
     *
     * @param filterId Filter id.
     * @param filter Raw filter list or preprocessed filter list.
     */
    public static async set(filterId: number, filter: string | FilterList): Promise<void> {
        try {
            await BrowserExtensionFiltersStorage.set(filterId, filter);
        } catch (error: unknown) {
            logger.error(`[ext.FiltersStoragesAdapterCommon.set]: failed to set filter list for filter id ${filterId}, got error:`, error);
            throw error;
        }
    }

    /**
     * Checks if the filter list with the specified ID exists in the storage.
     *
     * @param filterId Filter id.
     *
     * @returns `true` if the filter list exists, `false` otherwise.
     */
    public static async has(filterId: number): Promise<boolean> {
        return BrowserExtensionFiltersStorage.has(filterId);
    }

    /**
     * Gets the whole preprocessed filter list for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Preprocessed filter list or `undefined` if the filter list does not exist.
     */
    public static async get(filterId: number): Promise<FilterList | undefined> {
        // eslint-disable-next-line prefer-const
        let [filterContent, conversionData] = await Promise.all([
            FiltersStoragesAdapterCommon.getFilterContent(filterId),
            FiltersStoragesAdapterCommon.getConversionData(filterId),
        ]);

        if (filterContent === undefined) {
            return undefined;
        }

        if (conversionData === undefined) {
            conversionData = FilterList.createEmptyConversionData();
        }

        return new FilterList(filterContent, conversionData);
    }

    /**
     * Removes the filter list with the specified ID from the storage.
     *
     * @param filterId Filter id.
     */
    public static async remove(filterId: number): Promise<void> {
        await BrowserExtensionFiltersStorage.remove(filterId);
    }

    /**
     * Gets the raw filter list content for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Raw filter list content or `undefined` if the filter list does not exist.
     */
    public static async getFilterContent(filterId: number): Promise<string | undefined> {
        return BrowserExtensionFiltersStorage.getFilterContent(filterId);
    }

    /**
     * Gets the conversion map for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Conversion map or `undefined` if the filter list does not exist.
     */
    public static async getConversionData(filterId: number): Promise<ConversionData | undefined> {
        return BrowserExtensionFiltersStorage.getConversionData(filterId);
    }

    /**
     * Returns original filter list text for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved with original user rules strings.
     */
    static async getOriginalFilterList(filterId: number): Promise<string | undefined> {
        const filterList = await FiltersStoragesAdapterCommon.get(filterId);

        if (filterList === undefined) {
            return undefined;
        }

        return filterList.getOriginalContent();
    }
}
