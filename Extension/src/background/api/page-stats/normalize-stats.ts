/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { type PageStatsData, type PageStatsDataItem } from '../../schema';
import { PageStatsStorage } from '../../storages/page-stats';

/**
 * Creates an empty stats data item (all zeros).
 *
 * @returns A PageStatsDataItem with only the total group set to 0.
 */
function createEmptyItem(): PageStatsDataItem {
    return PageStatsStorage.createStatsDataItem(null, 0);
}

/**
 * Pads and trims a rolling array to account for elapsed time.
 *
 * @param arr The current bucket array.
 * @param gap Number of time periods elapsed since last update (e.g. hours, days, months).
 * @param maxSize Maximum window size for this array.
 * @param isSamePeriod Whether `now` is in the same time period as `data.updated`.
 *
 * @returns A new array of length `maxSize`, padded with empty buckets and trimmed.
 */
function padAndTrim(
    arr: PageStatsDataItem[],
    gap: number,
    maxSize: number,
    isSamePeriod: boolean,
): PageStatsDataItem[] {
    if (isSamePeriod) {
        return arr;
    }

    // If the gap exceeds the window, all existing data is outside the window.
    if (gap >= maxSize) {
        return Array.from({ length: maxSize }, () => createEmptyItem());
    }

    // Append (gap - 1) empty buckets for the skipped periods,
    // plus 1 empty bucket for the current period.
    const padded = [...arr];
    for (let i = 1; i < gap; i += 1) {
        padded.push(createEmptyItem());
    }
    padded.push(createEmptyItem());

    // Trim to keep only the most recent `maxSize` buckets.
    if (padded.length > maxSize) {
        return padded.slice(-maxSize);
    }

    return padded;
}

/**
 * Normalizes rolling statistics arrays to the current time.
 *
 * If `data.updated` is older than the current hour/day/month, empty buckets
 * are appended and oldest buckets trimmed to maintain fixed window sizes
 * (24h / 30d / 3mo).
 *
 * This is a pure function — it does not read from or write to storage.
 *
 * @param data The raw page statistics data from storage.
 * @param now The current timestamp in milliseconds.
 *
 * @returns A new PageStatsData object normalized to `now`.
 */
export function normalizeStatsData(data: PageStatsData, now: number): PageStatsData {
    const { updated } = data;

    const sameHour = isSameHour(now, updated);
    const sameDay = isSameDay(now, updated);
    const sameMonth = isSameMonth(now, updated);

    // Fast path: nothing to normalize.
    if (sameHour && sameDay && sameMonth) {
        return data;
    }

    const hourGap = differenceInHours(now, updated);
    const dayGap = differenceInDays(now, updated);
    const monthGap = differenceInMonths(now, updated);

    const hours = padAndTrim(
        data.hours,
        hourGap,
        PageStatsStorage.MAX_HOURS_HISTORY,
        sameHour,
    );

    const days = padAndTrim(
        data.days,
        dayGap,
        PageStatsStorage.MAX_DAYS_HISTORY,
        sameDay,
    );

    const months = padAndTrim(
        data.months,
        monthGap,
        PageStatsStorage.MAX_MONTHS_HISTORY,
        sameMonth,
    );

    return {
        hours,
        days,
        months,
        updated: now,
    };
}
