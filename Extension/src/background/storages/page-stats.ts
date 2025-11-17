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

import {
    isSameHour,
    isSameDay,
    isSameMonth,
    differenceInHours,
    differenceInDays,
    differenceInMonths,
} from 'date-fns';

import { PAGE_STATISTIC_KEY, TOTAL_BLOCKED_STATS_GROUP_ID } from '../../common/constants';
import { StringStorage } from '../utils/string-storage';
import {
    type PageStats,
    type PageStatsData,
    type PageStatsDataItem,
} from '../schema';

import { browserStorage } from './shared-instances';

/**
 * Class for asynchronous control {@link PageStats} storage data,
 * that is persisted as string in another key value storage.
 *
 * @see {@link StringStorage}
 */
export class PageStatsStorage extends StringStorage<typeof PAGE_STATISTIC_KEY, PageStats, 'async'> {
    public static TOTAL_GROUP_ID = TOTAL_BLOCKED_STATS_GROUP_ID;

    public static MAX_HOURS_HISTORY = 24;

    public static MAX_DAYS_HISTORY = 30;

    public static MAX_MONTHS_HISTORY = 3;

    /**
     * Returns number of total blocked requests.
     *
     * @returns Number of total blocked requests or undefined, if it is not set.
     */
    public getTotalBlocked(): number | undefined {
        return this.getData().totalBlocked;
    }

    /**
     * Sets number of total blocked requests.
     *
     * @param value Number of total blocked requests.
     *
     * @returns Promise, resolved when total blocked requests number is successfully set.
     *
     * @throws Error if page stats data is not initialized.
     */
    public setTotalBlocked(value: number): Promise<void> {
        if (!this.data) {
            throw PageStatsStorage.createNotInitializedError();
        }

        this.data.totalBlocked = value;
        return this.save();
    }

    /**
     * Sets page statistics data.
     * If page statistics data is empty, creates new.
     *
     * @param data Page stats data.
     *
     * @returns Promise, resolved when data is successfully set.
     *
     * @throws Error if page stats data is not initialized.
     */
    public setStatisticsData(data: PageStatsData): Promise<void> {
        if (!this.data) {
            throw PageStatsStorage.createNotInitializedError();
        }

        this.data.data = data;
        return this.save();
    }

    /**
     * Returns page statistics data.
     * If page statistics data is not defined, creates new.
     *
     * @returns Page statistics data.
     *
     * @throws Error if page stats data is not initialized.
     */
    public getStatisticsData(): PageStatsData {
        if (!this.data) {
            throw PageStatsStorage.createNotInitializedError();
        }

        if (!this.data.data) {
            this.data.data = PageStatsStorage.createStatsData(null, 0);
        }

        return this.data.data;
    }

    /**
     * Creates page statistics data for specified stats category.
     *
     * @param categoryId Stats category.
     * @param blocked Number of request blocks.
     *
     * @returns Page statistics data.
     */
    public static createStatsData(
        categoryId: string | null,
        blocked: number,
    ): PageStatsData {
        const data: PageStatsData = {
            hours: [],
            days: [],
            months: [],
            updated: Date.now(),
        };

        for (let i = 1; i < PageStatsStorage.MAX_HOURS_HISTORY; i += 1) {
            data.hours.push(PageStatsStorage.createStatsDataItem(null, 0));
        }

        data.hours.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));

        for (let j = 1; j < PageStatsStorage.MAX_DAYS_HISTORY; j += 1) {
            data.days.push(PageStatsStorage.createStatsDataItem(null, 0));
        }

        data.days.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));

        for (let k = 1; k < PageStatsStorage.MAX_MONTHS_HISTORY; k += 1) {
            data.months.push(PageStatsStorage.createStatsDataItem(null, 0));
        }

        data.months.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));

        return data;
    }

    /**
     * Updates page statistics data for specified stats category.
     *
     * @param categoryId Stats category id.
     * @param blocked Number of request blocks.
     * @param data Current page statistics data.
     *
     * @returns Updated page statistics data.
     */
    public static updateStatsData(
        categoryId: string,
        blocked: number,
        data: PageStatsData,
    ): PageStatsData {
        const lastUpdated = data.updated;
        const timestamp = Date.now();

        const lastHourStats = data.hours[data.hours.length - 1];

        if (isSameHour(timestamp, lastUpdated) && lastHourStats) {
            data.hours[data.hours.length - 1] = PageStatsStorage.updateStatsDataItem(
                categoryId,
                blocked,
                lastHourStats,
            );
        } else {
            let diffHours = differenceInHours(timestamp, lastUpdated);

            while (diffHours >= 2) {
                data.hours.push(PageStatsStorage.createStatsDataItem(null, 0));
                diffHours -= 1;
            }

            data.hours.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));
            if (data.hours.length > PageStatsStorage.MAX_HOURS_HISTORY) {
                data.hours = data.hours.slice(-PageStatsStorage.MAX_HOURS_HISTORY);
            }
        }

        const lastDayStats = data.days[data.days.length - 1];

        if (isSameDay(timestamp, lastUpdated) && lastDayStats) {
            data.days[data.days.length - 1] = PageStatsStorage.updateStatsDataItem(
                categoryId,
                blocked,
                lastDayStats,
            );
        } else {
            let diffDays = differenceInDays(timestamp, lastUpdated);

            while (diffDays >= 2) {
                data.days.push(PageStatsStorage.createStatsDataItem(null, 0));
                diffDays -= 1;
            }

            data.days.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));
            if (data.days.length > PageStatsStorage.MAX_DAYS_HISTORY) {
                data.days = data.days.slice(-PageStatsStorage.MAX_DAYS_HISTORY);
            }
        }

        const lastMonthStats = data.months[data.months.length - 1];

        if (isSameMonth(timestamp, lastUpdated) && lastMonthStats) {
            data.months[data.months.length - 1] = PageStatsStorage.updateStatsDataItem(
                categoryId,
                blocked,
                lastMonthStats,
            );
        } else {
            let diffMonths = differenceInMonths(timestamp, lastUpdated);
            while (diffMonths >= 2) {
                data.months.push(PageStatsStorage.createStatsDataItem(null, 0));
                diffMonths -= 1;
            }

            data.months.push(PageStatsStorage.createStatsDataItem(categoryId, blocked));
        }

        data.updated = timestamp;
        return data;
    }

    /**
     * Creates page statistics data item for specified stats category.
     *
     * @param categoryId Stats category.
     * @param blocked Number of request blocks.
     *
     * @returns Updated page statistics data item.
     */
    private static createStatsDataItem(
        categoryId: string | null,
        blocked: number,
    ): PageStatsDataItem {
        const data: PageStatsDataItem = {};

        if (categoryId !== null) {
            data[String(categoryId)] = blocked;
        }

        data[PageStatsStorage.TOTAL_GROUP_ID] = blocked;
        return data;
    }

    /**
     * Updates page statistics data item for specified stats category.
     *
     * @param categoryId Stats category.
     * @param blocked Number of request blocks.
     * @param data Current page statistics data item.
     *
     * @returns Updated page statistics data item.
     */
    private static updateStatsDataItem(
        categoryId: string,
        blocked: number,
        data: PageStatsDataItem,
    ): PageStatsDataItem {
        data[String(categoryId)] = (data[String(categoryId)] || 0) + blocked;
        data[PageStatsStorage.TOTAL_GROUP_ID] = (data[PageStatsStorage.TOTAL_GROUP_ID] || 0) + blocked;

        return data;
    }

    /**
     * Helper function to create a basic {@link Error} with a custom message.
     *
     * @returns A basic {@link Error} with a custom message.
     */
    private static createNotInitializedError(): Error {
        return new Error('Page stats is not initialized');
    }
}

/**
 * {@link PageStatsStorage} Instance, that stores
 * stringified {@link PageStats} in {@link browserStorage} under
 * {@link PAGE_STATISTIC_KEY} key.
 */
export const pageStatsStorage = new PageStatsStorage(
    PAGE_STATISTIC_KEY,
    browserStorage,
);
