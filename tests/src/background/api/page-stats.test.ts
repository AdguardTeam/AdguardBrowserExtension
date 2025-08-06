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
});
