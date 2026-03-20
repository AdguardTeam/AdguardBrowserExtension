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
    describe,
    it,
    expect,
} from 'vitest';

import { type PageStatsData } from '../../../../Extension/src/background/schema';
import { PageStatsStorage } from '../../../../Extension/src/background/storages/page-stats';
import { normalizeStatsData } from '../../../../Extension/src/background/api/page-stats/normalize-stats';

/**
 * Creates a PageStatsData fixture with all-zero buckets at a given timestamp.
 *
 * @param updated Timestamp in ms for the `updated` field.
 *
 * @returns PageStatsData with empty buckets.
 */
function createEmptyStatsData(updated: number): PageStatsData {
    const emptyItem = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };
    return {
        hours: Array.from({ length: PageStatsStorage.MAX_HOURS_HISTORY }, () => ({ ...emptyItem })),
        days: Array.from({ length: PageStatsStorage.MAX_DAYS_HISTORY }, () => ({ ...emptyItem })),
        months: Array.from({ length: PageStatsStorage.MAX_MONTHS_HISTORY }, () => ({ ...emptyItem })),
        updated,
    };
}

/**
 * Creates a non-zero stats data item for testing.
 *
 * @param count The blocked count for the "Other" category.
 *
 * @returns A stats data item with the given count.
 */
function createNonZeroItem(count: number): Record<string, number> {
    return {
        Other: count,
        [PageStatsStorage.TOTAL_GROUP_ID]: count,
    };
}

describe('normalizeStatsData', () => {
    // Task 1.1: Day gap — updated yesterday, popup opens today
    describe('day gap alignment', () => {
        it('pads one empty day when updated was yesterday', () => {
            // "Yesterday at 15:00" → "Today at 15:00" — 1 day gap.
            const yesterday = new Date(2026, 2, 17, 15, 0, 0).getTime(); // Mar 17
            const now = new Date(2026, 2, 18, 15, 0, 0).getTime(); // Mar 18

            const data = createEmptyStatsData(yesterday);
            // Put a non-zero count in yesterday's last daily bucket.
            data.days[data.days.length - 1] = createNonZeroItem(42);

            const result = normalizeStatsData(data, now);

            // Last element (today) should be zero.
            expect(result.days[result.days.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // Second-to-last (yesterday) should retain the count.
            expect(result.days[result.days.length - 2]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(42);
            // Array length must remain MAX_DAYS_HISTORY.
            expect(result.days).toHaveLength(PageStatsStorage.MAX_DAYS_HISTORY);
            // Updated timestamp should be advanced to now.
            expect(result.updated).toBe(now);
        });

        it('pads 3 empty days when updated was 3 days ago', () => {
            const threeDaysAgo = new Date(2026, 2, 15, 10, 0, 0).getTime();
            const now = new Date(2026, 2, 18, 10, 0, 0).getTime();

            const data = createEmptyStatsData(threeDaysAgo);
            data.days[data.days.length - 1] = createNonZeroItem(100);

            const result = normalizeStatsData(data, now);

            // Last 3 elements should be zero.
            expect(result.days[result.days.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            expect(result.days[result.days.length - 2]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            expect(result.days[result.days.length - 3]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // 4th from last retains the count.
            expect(result.days[result.days.length - 4]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(100);
            expect(result.days).toHaveLength(PageStatsStorage.MAX_DAYS_HISTORY);
        });
    });

    // Task 1.2: Hour gap — updated 2 hours ago, same day
    describe('hour gap alignment', () => {
        it('pads empty hours when updated was 2 hours ago', () => {
            const twoHoursAgo = new Date(2026, 2, 18, 13, 0, 0).getTime();
            const now = new Date(2026, 2, 18, 15, 0, 0).getTime();

            const data = createEmptyStatsData(twoHoursAgo);
            data.hours[data.hours.length - 1] = createNonZeroItem(10);

            const result = normalizeStatsData(data, now);

            // Current hour bucket should be zero.
            expect(result.hours[result.hours.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // The gap hour should also be zero.
            expect(result.hours[result.hours.length - 2]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // The original bucket should be shifted back.
            expect(result.hours[result.hours.length - 3]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(10);
            expect(result.hours).toHaveLength(PageStatsStorage.MAX_HOURS_HISTORY);
            expect(result.updated).toBe(now);
        });
    });

    // Task 1.3: Month gap — updated 2 months ago
    describe('month gap alignment', () => {
        it('pads empty months when updated was 2 months ago', () => {
            const twoMonthsAgo = new Date(2026, 0, 18, 12, 0, 0).getTime(); // Jan 18
            const now = new Date(2026, 2, 18, 12, 0, 0).getTime(); // Mar 18

            const data = createEmptyStatsData(twoMonthsAgo);
            data.months[data.months.length - 1] = createNonZeroItem(500);

            const result = normalizeStatsData(data, now);

            // Last element (current month) should be zero.
            expect(result.months[result.months.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // Second-to-last (gap month) should be zero.
            expect(result.months[result.months.length - 2]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
            // Third-to-last should have the original count (shifted from the end).
            expect(result.months[result.months.length - 3]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(500);
            expect(result.months).toHaveLength(PageStatsStorage.MAX_MONTHS_HISTORY);
        });
    });

    // Task 1.4: Edge cases
    describe('edge cases', () => {
        it('returns data unchanged when updated is in the current hour/day/month', () => {
            const now = new Date(2026, 2, 18, 15, 30, 0).getTime();
            // Updated 10 minutes ago — same hour, same day, same month.
            const tenMinutesAgo = now - 10 * 60 * 1000;

            const data = createEmptyStatsData(tenMinutesAgo);
            data.hours[data.hours.length - 1] = createNonZeroItem(5);
            data.days[data.days.length - 1] = createNonZeroItem(5);
            data.months[data.months.length - 1] = createNonZeroItem(5);

            const result = normalizeStatsData(data, now);

            // Data should be unchanged (except updated timestamp may advance).
            expect(result.hours[result.hours.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(5);
            expect(result.days[result.days.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(5);
            expect(result.months[result.months.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(5);
            expect(result.hours).toHaveLength(PageStatsStorage.MAX_HOURS_HISTORY);
            expect(result.days).toHaveLength(PageStatsStorage.MAX_DAYS_HISTORY);
            expect(result.months).toHaveLength(PageStatsStorage.MAX_MONTHS_HISTORY);
        });

        it('fills entire arrays with empties when gap exceeds window size (31+ days)', () => {
            const longAgo = new Date(2026, 0, 1, 0, 0, 0).getTime(); // Jan 1
            const now = new Date(2026, 2, 18, 15, 0, 0).getTime(); // Mar 18 (77 days later)

            const data = createEmptyStatsData(longAgo);
            data.hours[data.hours.length - 1] = createNonZeroItem(999);
            data.days[data.days.length - 1] = createNonZeroItem(999);

            const result = normalizeStatsData(data, now);

            // All hourly buckets should be zero (gap > 24h).
            const allHoursZero = result.hours.every(
                (item) => item[PageStatsStorage.TOTAL_GROUP_ID] === 0,
            );
            expect(allHoursZero).toBe(true);

            // All daily buckets should be zero (gap > 30d).
            const allDaysZero = result.days.every(
                (item) => item[PageStatsStorage.TOTAL_GROUP_ID] === 0,
            );
            expect(allDaysZero).toBe(true);

            expect(result.hours).toHaveLength(PageStatsStorage.MAX_HOURS_HISTORY);
            expect(result.days).toHaveLength(PageStatsStorage.MAX_DAYS_HISTORY);
            expect(result.months).toHaveLength(PageStatsStorage.MAX_MONTHS_HISTORY);
            expect(result.updated).toBe(now);
        });

        it('handles updated = 0 by filling all arrays with empties', () => {
            const now = new Date(2026, 2, 18, 15, 0, 0).getTime();

            const data = createEmptyStatsData(0);
            data.hours[data.hours.length - 1] = createNonZeroItem(1);

            const result = normalizeStatsData(data, now);

            const allHoursZero = result.hours.every(
                (item) => item[PageStatsStorage.TOTAL_GROUP_ID] === 0,
            );
            expect(allHoursZero).toBe(true);
            expect(result.hours).toHaveLength(PageStatsStorage.MAX_HOURS_HISTORY);
            expect(result.days).toHaveLength(PageStatsStorage.MAX_DAYS_HISTORY);
            expect(result.months).toHaveLength(PageStatsStorage.MAX_MONTHS_HISTORY);
            expect(result.updated).toBe(now);
        });
    });
});
