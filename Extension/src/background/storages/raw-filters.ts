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

import { logger } from '../../common/logger';

import { storage } from './main';

const stringArraySchema = zod.string().optional().transform(data => data ?? undefined);

/**
 * Encapsulates interaction with stored filter rules before applying directives.
 */
export class RawFiltersStorage {
    /**
     * Sets specified filter list to {@link storage}.
     *
     * @param filterId Filter id.
     * @param filter Filter rules strings.
     */
    static async set(filterId: number, filter: string): Promise<void> {
        const key = RawFiltersStorage.getFilterKey(filterId);

        await storage.set(key, filter);
    }

    /**
     * Retrieves raw filter from the {@link storage}. Parses it and returns string if data is
     * valid or undefined otherwise.
     *
     * @param filterId Filter id.
     * @returns Promise, resolved with filter rules strings or undefined if data is invalid.
     */
    static async get(filterId: number): Promise<string | undefined> {
        const key = RawFiltersStorage.getFilterKey(filterId);

        const data = await storage.get(key);

        const parseResult = stringArraySchema.safeParse(data);

        if (!parseResult.success) {
            logger.info('Received data had a format that was not expected:', parseResult.error.message);
            return undefined;
        }

        return parseResult.data;
    }

    /**
     * Removes specified filter list from {@link storage}.
     *
     * @param filterId Filter id.
     */
    static async remove(filterId: number): Promise<void> {
        const key = RawFiltersStorage.getFilterKey(filterId);
        return storage.remove(key);
    }

    /**
     * Returns {@link storage} key from specified filter list.
     *
     * @param filterId Filter id.
     * @returns Storage key from specified filter list.
     */
    private static getFilterKey(filterId: number): string {
        return `raw_filterrules_${filterId}.txt`;
    }
}
