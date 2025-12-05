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

import { isString } from 'lodash-es';

import { type ConversionData, ConvertedFilterList } from 'tswebextension';

import { hybridStorage } from './shared-instances';

/**
 * Encapsulates interaction with stored filter rules.
 */
export class FiltersStorage {
    public static readonly KEY_COMBINER = '_';

    public static readonly KEY_FILTER_CONTENT = 'filterContent';

    public static readonly KEY_CONVERSION_DATA = 'conversionData';

    /**
     * Returns key with prefix.
     * Key format: <prefix>_<filterId>, e.g. `filterList_1`.
     *
     * @param keyPrefix Key prefix.
     * @param filterId Filter id.
     *
     * @returns Key with prefix.
     */
    private static getKey(keyPrefix: string, filterId: number | string): string {
        return `${keyPrefix}${FiltersStorage.KEY_COMBINER}${filterId}`;
    }

    /**
     * Sets specified filter list with the specified ID in the storage.
     *
     * @param filterId Filter id.
     * @param filter Raw filter list or preprocessed filter list.
     *
     * @throws Error if the transaction failed.
     */
    public static async set(filterId: number, filter: string | ConvertedFilterList): Promise<void> {
        let converted: ConvertedFilterList;

        if (isString(filter)) {
            converted = new ConvertedFilterList(filter);
        } else {
            converted = filter;
        }

        const succeeded = await hybridStorage.setMultiple({
            [FiltersStorage.getKey(FiltersStorage.KEY_FILTER_CONTENT, filterId)]: converted.getContent(),
            [FiltersStorage.getKey(FiltersStorage.KEY_CONVERSION_DATA, filterId)]: converted.getConversionData(),
        });

        if (!succeeded) {
            throw new Error('Transaction failed');
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
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_FILTER_CONTENT, filterId);
        return hybridStorage.has(storageKey);
    }

    /**
     * Gets the whole preprocessed filter list for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Preprocessed filter list or `undefined` if the filter list does not exist.
     */
    static async get(filterId: number): Promise<ConvertedFilterList | undefined> {
        // eslint-disable-next-line prefer-const
        let [filterContent, conversionData] = await Promise.all([
            FiltersStorage.getFilterContent(filterId),
            FiltersStorage.getConversionData(filterId),
        ]);

        if (filterContent === undefined) {
            return undefined;
        }

        if (conversionData === undefined) {
            conversionData = ConvertedFilterList.createEmptyConversionData();
        }

        return new ConvertedFilterList(filterContent, conversionData);
    }

    /**
     * Removes the filter list with the specified ID from the storage.
     *
     * @note This method does nothing in MV3 version if the filter ID is a static filter ID,
     * because static filters are managed by TSWebExtension.
     *
     * @param filterId Filter id.
     */
    public static async remove(filterId: number): Promise<void> {
        await hybridStorage.removeMultiple([
            FiltersStorage.getKey(FiltersStorage.KEY_FILTER_CONTENT, filterId),
            FiltersStorage.getKey(FiltersStorage.KEY_CONVERSION_DATA, filterId),
        ]);
    }

    /**
     * Gets the filter content for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Filter content or `undefined` if the filter content does not exist.
     */
    public static async getFilterContent(filterId: number): Promise<string | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_FILTER_CONTENT, filterId);
        return hybridStorage.get(storageKey) as Promise<string | undefined>;
    }

    /**
     * Gets the conversion data for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Conversion data or `undefined` if the conversion data does not exist.
     */
    public static async getConversionData(
        filterId: number,
    ): Promise<ConversionData | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_CONVERSION_DATA, filterId);
        return hybridStorage.get(storageKey) as Promise<ConversionData | undefined>;
    }
}
