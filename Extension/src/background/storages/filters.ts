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
import zod from 'zod';

import { FilterListPreprocessor, type PreprocessedFilterList } from 'tswebextension';

import { FILTER_LIST_EXTENSION } from '../../common/constants';
import { logger } from '../../common/logger';

import { hybridStorage } from './shared-instances';

/**
 * Storage prefix for raw preprocessed filter lists.
 */
export const FILTER_KEY_PREFIX = 'filterrules_';

/**
 * Storage prefix for binary serialized preprocessed filter lists.
 */
export const BINARY_FILTER_KEY_PREFIX = 'binaryfilterrules_';

/**
 * Storage prefix for conversion map.
 * Conversion map is used to get original user rules from the preprocessed filter list.
 */
export const CONVERSION_MAP_PREFIX = 'conversionmap_';

/**
 * Storage prefix for source map.
 * Source map is used to map binary serialized rules to the raw preprocessed filter list.
 */
export const SOURCE_MAP_PREFIX = 'sourcemap_';

/**
 * Schema for the conversion map.
 */
const CONVERSION_MAP_SCHEMA = zod.record(zod.string(), zod.string()).default({});

/**
 * Schema for the source map.
 */
const SOURCE_MAP_SCHEMA = zod.record(zod.string(), zod.number()).default({});

/**
 * Regular expression that helps to extract filter id from the key.
 */
const RE_FILTER_KEY = new RegExp(
    `^(${FILTER_KEY_PREFIX})(?<filterId>\\d+)${FILTER_LIST_EXTENSION}$`,
);

/**
 * Encapsulates interaction with stored filter rules.
 */
export class FiltersStorage {
    /**
     * Sets specified filter list to {@link storage}.
     *
     * @param filterId Filter id.
     * @param filter Filter rules strings.
     */
    static async set(filterId: number, filter: string[]): Promise<void> {
        const data = FiltersStorage.prepareFilterForStorage(filterId, filter);
        await hybridStorage.setMultiple(data);
    }

    /**
     * Helper method to get data to set to the storage for the specified filter list.
     *
     * @param filterId Filter id.
     * @param filter Filter rules strings.
     * @returns Record with data to set to the storage.
     */
    static prepareFilterForStorage(filterId: number, filter: string[]): Record<string, unknown> {
        const {
            rawFilterList,
            filterList,
            conversionMap,
            sourceMap,
        } = FilterListPreprocessor.preprocess(filter.join('\n'));

        const result: Record<string, unknown> = {
            [FiltersStorage.getFilterKey(filterId)]: rawFilterList,
            [FiltersStorage.getBinaryFilterKey(filterId)]: filterList,
            [FiltersStorage.getConversionMapKey(filterId)]: conversionMap,
            [FiltersStorage.getSourceMapKey(filterId)]: sourceMap,
        };

        return result;
    }

    /**
     * Returns specified filter list from {@link hybridStorage}.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved with filter rules strings.
     * @throws Error, if filter list data is not valid.
     */
    static async get(filterId: number): Promise<Uint8Array[]> {
        const binaryFilterKey = FiltersStorage.getBinaryFilterKey(filterId);
        const data = await hybridStorage.get(binaryFilterKey);
        return zod.array(zod.instanceof(Uint8Array)).parse(data);
    }

    /**
     * Returns raw preprocessed filter list for the specified filter id.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with preprocessed filter list.
     * @throws Error, if filter list data is not valid.
     */
    static async getRawPreprocessedFilterList(filterId: number): Promise<string> {
        const filterKey = FiltersStorage.getFilterKey(filterId);
        const data = await hybridStorage.get(filterKey);
        return zod.string().parse(data);
    }

    /**
     * Returns source map for the specified filter list.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with source map.
     * @throws Error, if source map data is not valid.
     */
    static async getSourceMap(filterId: number): Promise<Record<string, number>> {
        const sourceMapKey = FiltersStorage.getSourceMapKey(filterId);
        const data = await hybridStorage.get(sourceMapKey);
        return SOURCE_MAP_SCHEMA.parse(data);
    }

    /**
     * Returns conversion map for the specified filter list.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with conversion map.
     * @throws Error, if conversion map data is not valid.
     */
    static async getConversionMap(filterId: number): Promise<Record<string, string>> {
        const conversionMapKey = FiltersStorage.getConversionMapKey(filterId);
        const data = await hybridStorage.get(conversionMapKey);
        return CONVERSION_MAP_SCHEMA.parse(data);
    }

    /**
     * Returns original user rules from {@link hybridStorage}.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with original user rules strings.
     * @throws Error, if filter list data is not valid.
     */
    static async getOriginalRules(filterId: number): Promise<string[]> {
        const [rawFilterList, conversionMap] = await Promise.all([
            FiltersStorage.getRawPreprocessedFilterList(filterId),
            FiltersStorage.getConversionMap(filterId),
        ]);

        return FilterListPreprocessor.getOriginalRules({
            rawFilterList,
            conversionMap,
        });
    }

    /**
     * Returns original filter list text for the specified filter id.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with original filter list text.
     * @throws Error, if filter list data is not valid.
     */
    static async getOriginalFilterListText(filterId: number): Promise<string> {
        const [rawFilterList, conversionMap] = await Promise.all([
            FiltersStorage.getRawPreprocessedFilterList(filterId),
            FiltersStorage.getConversionMap(filterId),
        ]);

        return FilterListPreprocessor.getOriginalFilterListText({
            rawFilterList,
            conversionMap,
        });
    }

    /**
     * Get all filter data, including conversion map and source map.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved with filter data or `null` if filter is not
     * found or some part of the data is missing.
     */
    static async getAllFilterData(filterId: number): Promise<PreprocessedFilterList | null> {
        try {
            const [filterList, rawFilterList, conversionMap, sourceMap] = await Promise.all([
                FiltersStorage.get(filterId),
                FiltersStorage.getRawPreprocessedFilterList(filterId),
                FiltersStorage.getConversionMap(filterId),
                FiltersStorage.getSourceMap(filterId),
            ]);

            return {
                filterList,
                rawFilterList,
                conversionMap,
                sourceMap,
            };
        } catch (e) {
            logger.error('Failed to get all filter data', e);

            return null;
        }
    }

    /**
     * Removes specified filter list from {@link hybridStorage}.
     *
     * @param filterId Filter id.
     */
    static async remove(filterId: number): Promise<void> {
        await hybridStorage.removeMultiple([
            FiltersStorage.getBinaryFilterKey(filterId),
            FiltersStorage.getFilterKey(filterId),
            FiltersStorage.getConversionMapKey(filterId),
            FiltersStorage.getSourceMapKey(filterId),
        ]);
    }

    /**
     * Returns {@link hybridStorage} key from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key from specified filter list.
     */
    private static getFilterKey(filterId: number): string {
        return `${FILTER_KEY_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Helper method to extract filter id from the key.
     *
     * @param key Storage key.
     * @returns Filter id or `null` if the key is invalid.
     */
    static extractFilterIdFromFilterKey(key: string): number | null {
        const match = key.match(RE_FILTER_KEY);
        return match ? parseInt(match.groups?.filterId ?? '', 10) : null;
    }

    /**
     * Returns {@link hybridStorage} key to conversion map from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key to conversion map from specified filter list.
     */
    private static getConversionMapKey(filterId: number): string {
        return `${CONVERSION_MAP_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Returns {@link hybridStorage} key to source map from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key to source map from specified filter list.
     */
    private static getSourceMapKey(filterId: number): string {
        return `${SOURCE_MAP_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Returns {@link hybridStorage} key to binary filter list from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key to binary filter list from specified filter list.
     */
    private static getBinaryFilterKey(filterId: number): string {
        return `${BINARY_FILTER_KEY_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }
}
