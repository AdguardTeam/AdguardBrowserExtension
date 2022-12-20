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
import { storage } from './main';

/**
 * Encapsulates interaction with stored filter rules
 */
export class FiltersStorage {
    /**
     * Sets specified filter list to {@link storage}
     *
     * @param filterId - filter id
     * @param filter - filter rules strings
     */
    static async set(filterId: number, filter: string[]): Promise<void> {
        const key = FiltersStorage.getFilterKey(filterId);

        await storage.set(key, filter);
    }

    /**
     * Gets specified filter list from {@link storage}
     *
     * @param filterId - filter id
     *
     * @returns promise, resolved with filter rules strings
     * @throws error, if filter list data is not valid
     */
    static async get(filterId: number): Promise<string[]> {
        const key = FiltersStorage.getFilterKey(filterId);

        const data = await storage.get(key);

        return zod.string().array().parse(data);
    }

    /**
     * Removes specified filter list from {@link storage}
     *
     * @param filterId - filter id
     */
    static async remove(filterId: number): Promise<void> {
        const key = FiltersStorage.getFilterKey(filterId);
        return storage.remove(key);
    }

    /**
     * Gets {@link storage} key from specified filter list
     *
     * @param filterId - filter id
     * @returns storage key from specified filter list
     */
    private static getFilterKey(filterId: number): string {
        return `filterrules_${filterId}.txt`;
    }
}
