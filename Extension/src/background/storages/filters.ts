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
import { FilterListPreprocessor, type PreprocessedFilterList } from 'tswebextension';

import { hybridStorage } from './shared-instances';

/**
 * Encapsulates interaction with stored filter rules.
 */
export class FiltersStorage {
    public static readonly KEY_COMBINER = '_';

    /**
     * Key for the filter list.
     * Should be the same as in `PreprocessedFilterList`.
     */
    public static readonly KEY_FILTER_LIST = 'filterList';

    public static readonly KEY_RAW_FILTER_LIST = 'rawFilterList';

    public static readonly KEY_CONVERSION_MAP = 'conversionMap';

    public static readonly KEY_SOURCE_MAP = 'sourceMap';

    /**
     * Returns key with prefix.
     * Key format: <prefix>_<filterId>, e.g. `filterList_1`.
     *
     * @param keyPrefix Key prefix.
     * @param filterId Filter id.
     *
     * @returns Key with prefix.
     */
    public static getKey(keyPrefix: string, filterId: number | string): string {
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
    static async set(filterId: number, filter: string | PreprocessedFilterList): Promise<void> {
        const data: Record<string, unknown> = {};

        let preprocessed: PreprocessedFilterList;

        if (typeof filter === 'string') {
            preprocessed = FilterListPreprocessor.preprocess(filter);
        } else {
            preprocessed = filter;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(preprocessed)) {
            const storageKey = FiltersStorage.getKey(key, filterId);
            data[storageKey] = value;
        }

        const succeeded = await hybridStorage.setMultiple(data);

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
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_FILTER_LIST, filterId);
        return hybridStorage.has(storageKey);
    }

    /**
     * Gets the whole preprocessed filter list for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Preprocessed filter list or `undefined` if the filter list does not exist.
     */
    static async get(filterId: number): Promise<PreprocessedFilterList | undefined> {
        // eslint-disable-next-line prefer-const
        let [rawFilterList, filterList, conversionMap, sourceMap] = await Promise.all([
            FiltersStorage.getRawFilterList(filterId),
            FiltersStorage.getFilterList(filterId),
            FiltersStorage.getConversionMap(filterId),
            FiltersStorage.getSourceMap(filterId),
        ]);

        if (rawFilterList === undefined || filterList === undefined || sourceMap === undefined) {
            return undefined;
        }

        if (conversionMap === undefined) {
            conversionMap = {};
        }

        return {
            filterList,
            rawFilterList,
            conversionMap,
            sourceMap,
        };
    }

    /**
     * Removes the filter list with the specified ID from the storage.
     *
     * @note This method does nothing in MV3 version if the filter ID is a static filter ID,
     * because static filters are managed by TSWebExtension.
     *
     * @param filterId Filter id.
     */
    static async remove(filterId: number): Promise<void> {
        await hybridStorage.removeMultiple([
            FiltersStorage.getKey(FiltersStorage.KEY_FILTER_LIST, filterId),
            FiltersStorage.getKey(FiltersStorage.KEY_RAW_FILTER_LIST, filterId),
            FiltersStorage.getKey(FiltersStorage.KEY_CONVERSION_MAP, filterId),
            FiltersStorage.getKey(FiltersStorage.KEY_SOURCE_MAP, filterId),
        ]);
    }

    /**
     * Gets the raw filter list for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Raw filter list or `undefined` if the filter list does not exist.
     */
    public static async getRawFilterList(
        filterId: number,
    ): Promise<PreprocessedFilterList['rawFilterList'] | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_RAW_FILTER_LIST, filterId);
        return hybridStorage.get(
            storageKey,
        ) as Promise<PreprocessedFilterList[typeof FiltersStorage.KEY_RAW_FILTER_LIST] | undefined>;
    }

    /**
     * Gets the byte array of the filter list for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Byte array of the filter list or `undefined` if the filter list does not exist.
     */
    public static async getFilterList(
        filterId: number,
    ): Promise<PreprocessedFilterList['filterList'] | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_FILTER_LIST, filterId);
        return hybridStorage.get(
            storageKey,
        ) as Promise<PreprocessedFilterList[typeof FiltersStorage.KEY_FILTER_LIST] | undefined>;
    }

    /**
     * Gets the conversion map for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Conversion map or `undefined` if the filter list does not exist.
     */
    public static async getConversionMap(
        filterId: number,
    ): Promise<PreprocessedFilterList['conversionMap'] | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_CONVERSION_MAP, filterId);
        return hybridStorage.get(
            storageKey,
        ) as Promise<PreprocessedFilterList[typeof FiltersStorage.KEY_CONVERSION_MAP] | undefined>;
    }

    /**
     * Gets the source map for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Source map or `undefined` if the filter list does not exist.
     */
    public static async getSourceMap(
        filterId: number,
    ): Promise<PreprocessedFilterList['sourceMap'] | undefined> {
        const storageKey = FiltersStorage.getKey(FiltersStorage.KEY_SOURCE_MAP, filterId);
        return hybridStorage.get(
            storageKey,
        ) as Promise<PreprocessedFilterList[typeof FiltersStorage.KEY_SOURCE_MAP] | undefined>;
    }
}
