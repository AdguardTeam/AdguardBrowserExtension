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

import browser from 'sinon-chrome';
import { type Storage } from 'webextension-polyfill';
import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { PageStatsApi } from '../../../../Extension/src/background/api/page-stats';
import { App } from '../../../../Extension/src/background/app';
import { PageStatsStorage } from '../../../../Extension/src/background/storages';
import { PAGE_STATISTIC_KEY } from '../../../../Extension/src/common/constants';
import {
    getEmptyPageStatsDataFixture,
    getEmptyStatisticDataFixture,
    mockLocalStorage,
} from '../../../helpers';

vi.mock('../../../../Extension/src/background/engine');
vi.mock('../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../Extension/src/background/storages/notification');
vi.mock('../../../../Extension/src/background/storages/settings', () => ({
    SettingsStorage: {
        init: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockReturnValue({}),
        isInitialized: vi.fn().mockReturnValue(true),
    },
    settingsStorage: {
        init: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockReturnValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        isInitialized: vi.fn().mockReturnValue(true),
    },
}));
vi.mock('../../../../Extension/src/background/api/settings', () => ({
    SettingsApi: {
        init: vi.fn().mockResolvedValue(undefined),
        getSettings: vi.fn().mockResolvedValue({}),
        getSetting: vi.fn().mockReturnValue(false),
    },
}));

describe('Page Stats Api', () => {
    let storage: Storage.StorageArea;

    beforeEach(() => {
        storage = mockLocalStorage();
    });

    it('inits', async () => {
        await PageStatsApi.init();

        expect(await browser.storage.local.get(PAGE_STATISTIC_KEY))
            .toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('gets total blocked count', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 42 }) });

        await PageStatsApi.init();

        expect(PageStatsApi.getTotalBlocked()).toBe(42);
    });

    it('increments total blocked count', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 41 }) });

        await PageStatsApi.init();

        PageStatsApi.incrementTotalBlocked(1);

        expect(PageStatsApi.getTotalBlocked()).toBe(42);
    });

    it('resets page stats data', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 42 }) });

        await PageStatsApi.init();

        await PageStatsApi.reset();

        expect(await storage.get(PAGE_STATISTIC_KEY)).toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('updates stats', async () => {
        await App.init();
        await PageStatsApi.init();

        const OTHER_STATS_CATEGORY_ID = 'Other';

        const updated = Date.now();

        const pageStatsData = getEmptyPageStatsDataFixture(updated);

        const { hours, days, months } = pageStatsData;

        const expectedHits = 1;

        const expectedStatItem = {
            [PageStatsStorage.TOTAL_GROUP_ID]: expectedHits,
            [OTHER_STATS_CATEGORY_ID]: expectedHits,
        };

        hours[hours.length - 1] = expectedStatItem;
        days[days.length - 1] = expectedStatItem;
        months[months.length - 1] = expectedStatItem;

        vi.spyOn(Date, 'now').mockImplementation(() => updated);

        await PageStatsApi.updateStats(OTHER_STATS_CATEGORY_ID, 1);

        expect(await storage.get(PAGE_STATISTIC_KEY))
            .toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({ data: pageStatsData }) });
    });

    it('gets stats', async () => {
        await App.init();
        await PageStatsApi.init();

        const stats = await PageStatsApi.getStatisticsData();

        const expectedStats = getEmptyStatisticDataFixture();

        expect(stats).toStrictEqual(expectedStats);
    });

    // Regression test for AG-48836: without normalization on the write path,
    // both day-1 and day-3 counts would merge into the same last bucket,
    // causing the stats counter to "move with" the current date instead of
    // staying pinned to the day it was recorded.
    it('places blocked counts in separate daily buckets after a time gap', async () => {
        await App.init();
        await PageStatsApi.init();

        const OTHER_STATS_CATEGORY_ID = 'Other';

        // Day 1: accumulate 3 blocked requests.
        const day1 = new Date(2026, 2, 17, 12, 0, 0).getTime();
        vi.spyOn(Date, 'now').mockImplementation(() => day1);
        await PageStatsApi.updateStats(OTHER_STATS_CATEGORY_ID, 3);

        // Day 3: shift time +2 days, accumulate 5 more.
        const day3 = new Date(2026, 2, 19, 12, 0, 0).getTime();
        vi.spyOn(Date, 'now').mockImplementation(() => day3);
        await PageStatsApi.updateStats(OTHER_STATS_CATEGORY_ID, 5);

        const stats = PageStatsApi.getStatisticsData();
        const { lastMonth } = stats;

        // Current day (last bucket) should have only the day-3 count.
        expect(lastMonth[lastMonth.length - 1]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(5);
        // Day 2 (gap) should be zero.
        expect(lastMonth[lastMonth.length - 2]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(0);
        // Day 1 should have only the day-1 count.
        expect(lastMonth[lastMonth.length - 3]![PageStatsStorage.TOTAL_GROUP_ID]).toBe(3);
    });

    it('preserves totalBlocked when loading existing storage data', async () => {
        const existingData = {
            totalBlocked: 12345,
            data: {
                hours: Array(24).fill({ [PageStatsStorage.TOTAL_GROUP_ID]: 0 }),
                days: Array(30).fill({ [PageStatsStorage.TOTAL_GROUP_ID]: 0 }),
                months: Array(3).fill({ [PageStatsStorage.TOTAL_GROUP_ID]: 0 }),
                updated: Date.now(),
            },
        };

        await storage.set({
            [PAGE_STATISTIC_KEY]: JSON.stringify(existingData),
        });

        await PageStatsApi.init();

        expect(PageStatsApi.getTotalBlocked()).toBe(12345);

        const stats = PageStatsApi.getStatisticsData();
        expect(stats.today).toHaveLength(24);
        expect(stats.lastWeek).toHaveLength(7);
        expect(stats.lastMonth).toHaveLength(30);
    });
});
