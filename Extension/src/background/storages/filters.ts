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

import { FilterConverter } from '../utils/rule-converter';
import { Log } from '../../common/log';
import { AntiBannerFiltersId } from '../../common/constants';

import { storage } from './main';

const FILTER_KEY_PREFIX = 'filterrules_';
const ORIGINAL_FILTER_KEY_PREFIX = 'originalfilterrules_'; // needed for user rules
const CONVERSION_MAP_PREFIX = 'conversionmap_';
const FILTER_LIST_EXTENSION = '.txt';

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
        const filterKey = FiltersStorage.getFilterKey(filterId);
        const conversionMapKey = FiltersStorage.getConversionMapKey(filterId);

        // FIXME: This process is may heavy, we should consider to move it to
        // a web worker, if possible.
        // We can use web workers if the following conditions are met:
        //   1. MV3 service worker supports web workers.
        //   2. Firefox event page supports web workers.

        // FIXME: We also should optimize the conversion process itself,
        // especially the cloning issues.

        // Convert filter rules to AdGuard format where it's possible.
        // We need conversion map to show original rule text in the filtering log if a converted rule is applied.
        const { filter: convertedFilter, conversionMap } = FilterConverter.convertFilter(filter);

        await storage.set(filterKey, convertedFilter);
        await storage.set(conversionMapKey, conversionMap);

        // Special case: user rules — we need to store original rules as well.
        // This is needed for the editor UI and for exporting user rules.
        // Conversion map is not enough because it can't convert back multiple
        // rules to the same single rule easily.
        // Think about the following example:
        //  example.com#$#abp-snippet1; abp-snippet2; abp-snippet3
        if (filterId === AntiBannerFiltersId.UserFilterId) {
            const originalFilterKey = FiltersStorage.getFilterKey(filterId, true);
            await storage.set(originalFilterKey, filter);
        }
    }

    /**
     * Returns specified filter list from {@link storage}.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved with filter rules strings.
     * @throws Error, if filter list data is not valid.
     */
    static async get(filterId: number): Promise<string[]> {
        const filterKey = FiltersStorage.getFilterKey(filterId);

        const data = await storage.get(filterKey);

        return zod.string().array().parse(data);
    }

    /**
     * Removes specified filter list from {@link storage}.
     *
     * @param filterId Filter id.
     */
    static async remove(filterId: number): Promise<void> {
        const filterKey = FiltersStorage.getFilterKey(filterId);
        return storage.remove(filterKey);
    }

    /**
     * Returns {@link storage} key from specified filter list.
     *
     * @param filterId Filter id.
     * @param original If `true`, returns key for original filter list. Especially needed for user rules.
     * Defaults to `false`.
     * @returns Storage key from specified filter list.
     */
    private static getFilterKey(filterId: number, original = false): string {
        return `${original ? ORIGINAL_FILTER_KEY_PREFIX : FILTER_KEY_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Returns {@link storage} key to conversion map from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key to conversion map from specified filter list.
     */
    private static getConversionMapKey(filterId: number): string {
        return `${CONVERSION_MAP_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Returns original user rules from {@link storage}.
     *
     * @returns Promise, resolved with original user rules strings.
     * @throws Error, if filter list data is not valid.
     */
    static async getOriginalUserRules(): Promise<string[]> {
        // Special case: user rules have original rules stored separately
        const originalFilterKey = FiltersStorage.getFilterKey(AntiBannerFiltersId.UserFilterId, true);

        const data = await storage.get(originalFilterKey);

        // Error tolerance: if we can't read original rules, we just return empty array
        try {
            return zod.string().array().parse(data);
        } catch (error: unknown) {
            return [];
        }
    }

    /**
     * Returns original rule text from the specified filter list and converted rule text.
     *
     * @param filterId Filter id.
     * @param convertedRuleText Converted rule text.
     * @returns Promise, resolved with the original rule text or `undefined` if the original rule text cannot be found.
     */
    static async getOriginalRuleText(filterId: number, convertedRuleText: string): Promise<string | undefined> {
        // FIXME: Remove debug logging
        Log.debug(`Getting original rule text for ${convertedRuleText}`);

        const conversionMapKey = FiltersStorage.getConversionMapKey(filterId);

        const data = await storage.get(conversionMapKey);

        try {
            const conversionMap = zod.record(zod.string(), zod.string()).parse(data);

            Log.debug(`Conversion map for ${FiltersStorage.getFilterKey(filterId)}: ${JSON.stringify(conversionMap)}`);

            return conversionMap[convertedRuleText];
        } catch (error: unknown) {
            Log.debug(`Failed to get original rule text for ${convertedRuleText}`, (error as Error).message);

            return undefined;
        }
    }
}
