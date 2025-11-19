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
import zod from 'zod';

import { logger } from '../../common/logger';
import { FILTER_LIST_EXTENSION } from '../../common/constants';
import { getZodErrorMessage } from '../../common/error';

import { hybridStorage } from './shared-instances';

/**
 * Prefix for storage keys where raw filter lists are stored.
 * These filter lists are stored in raw format, and they are used in the diff update process.
 *
 * @example
 * raw_filterrules_1.txt
 */
export const RAW_FILTER_KEY_PREFIX = 'raw_filterrules_';

/**
 * Regular expression that helps to extract filter id from the key.
 */
const RE_FILTER_KEY = new RegExp(`^${RAW_FILTER_KEY_PREFIX}(?<filterId>\\d+)${FILTER_LIST_EXTENSION}$`);

/**
 * Zod schema for string array.
 */
const stringArraySchema = zod.string().optional().transform((data) => data ?? undefined);

/**
 * Encapsulates interaction with stored filter rules before applying directives.
 */
export class RawFiltersStorage {
    /**
     * Sets specified filter list to {@link hybridStorage}.
     *
     * @param filterId Filter id.
     * @param filter Filter rules strings.
     */
    static async set(filterId: number, filter: string): Promise<void> {
        const key = RawFiltersStorage.getFilterKey(filterId);

        await hybridStorage.set(key, filter);
    }

    /**
     * Retrieves raw filter from the {@link hybridStorage}. Parses it and returns string if data is
     * valid or undefined otherwise.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved with filter rules strings or undefined if data is invalid.
     */
    static async get(filterId: number): Promise<string | undefined> {
        const key = RawFiltersStorage.getFilterKey(filterId);

        const data = await hybridStorage.get(key);

        const parseResult = stringArraySchema.safeParse(data);

        if (!parseResult.success) {
            logger.info('[ext.RawFiltersStorage.get]: received data had a format that was not expected:', getZodErrorMessage(parseResult.error));
            return undefined;
        }

        return parseResult.data;
    }

    /**
     * Removes specified filter list from {@link hybridStorage}.
     *
     * @param filterId Filter id.
     *
     * @returns Promise, resolved when filter list is removed.
     */
    static async remove(filterId: number): Promise<void> {
        const key = RawFiltersStorage.getFilterKey(filterId);
        return hybridStorage.remove(key);
    }

    /**
     * Returns {@link hybridStorage} key from specified filter list.
     *
     * @param filterId Filter id.
     *
     * @returns Storage key from specified filter list.
     */
    private static getFilterKey(filterId: number): string {
        return `${RAW_FILTER_KEY_PREFIX}${filterId}${FILTER_LIST_EXTENSION}`;
    }

    /**
     * Helper method to extract filter id from the key.
     *
     * @param key Storage key.
     *
     * @returns Filter id or `null` if the key is invalid.
     */
    static extractFilterIdFromFilterKey(key: string): number | null {
        const match = key.match(RE_FILTER_KEY);
        return match ? parseInt(match.groups?.filterId ?? '', 10) : null;
    }
}
