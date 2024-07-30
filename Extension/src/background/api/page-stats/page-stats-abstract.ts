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

import { pageStatsStorage } from '../../storages';

import type { GetStatisticsDataResponse } from './types';

/**
 * Abstract class for Page Stats API.
 *
 * Methods `getTotalBlocked()` and `incrementTotalBlocked()` are implemented in this class as common,
 * other methods should be implemented in specific version - mv2 or mv3.
 */
export abstract class PageStatsApi {
    /**
     * Initializes the api.
     */
    public static async init(): Promise<void> {
        throw new Error('Method init() should be implemented for specific version - mv2 or mv3');
    }

    /**
     * Returns total count of blocked requests.
     *
     * @returns Total count of blocked requests.
     */
    public static getTotalBlocked(): number {
        return pageStatsStorage.getTotalBlocked() || 0;
    }

    /**
     * Increment total count of blocked requests.
     *
     * @param value Increment value.
     *
     * @returns Incremented total blocked value.
     */
    public static incrementTotalBlocked(value: number): number {
        let totalBlocked = PageStatsApi.getTotalBlocked();

        totalBlocked += value;

        pageStatsStorage.setTotalBlocked(totalBlocked);
        return totalBlocked;
    }

    /**
     * Resets stats.
     */
    public static async reset(): Promise<void> {
        await pageStatsStorage.setData({});
    }

    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    public static async updateStats(filterId: number, blocked: number): Promise<void> {
        throw new Error('Method updateStats() should be implemented for specific version - mv2 or mv3');
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    public static getStatisticsData(): GetStatisticsDataResponse {
        throw new Error('Method getStatisticsData() should be implemented for specific version - mv2 or mv3');
    }
}
