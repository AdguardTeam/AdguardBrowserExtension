import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';

import { PageStatsApiMv2 } from '../../../../../Extension/src/background/api/page-stats/page-stats-mv2';
import { App } from '../../../../../Extension/src/background/app';
import { PageStatsStorage } from '../../../../../Extension/src/background/storages';
import {
    AntiBannerFiltersId,
    AntibannerGroupsId,
    PAGE_STATISTIC_KEY,
} from '../../../../../Extension/src/common/constants';
import {
    getEmptyPageStatsDataFixture,
    getEmptyStatisticDataFixture,
    mockLocalStorage,
} from '../../../../helpers';

jest.mock('../../../../../Extension/src/background/engine');

describe('Page Stats Api', () => {
    let storage: Storage.StorageArea;

    beforeEach(() => {
        storage = mockLocalStorage();
    });

    it('inits', async () => {
        await PageStatsApiMv2.init();

        expect(await browser.storage.local.get(PAGE_STATISTIC_KEY))
            .toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('gets total blocked count', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 42 }) });

        await PageStatsApiMv2.init();

        expect(PageStatsApiMv2.getTotalBlocked()).toBe(42);
    });

    it('increments total blocked count', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 41 }) });

        await PageStatsApiMv2.init();

        PageStatsApiMv2.incrementTotalBlocked(1);

        expect(PageStatsApiMv2.getTotalBlocked()).toBe(42);
    });

    it('resets page stats data', async () => {
        await storage.set({ [PAGE_STATISTIC_KEY]: JSON.stringify({ totalBlocked: 42 }) });

        await PageStatsApiMv2.init();

        await PageStatsApiMv2.reset();

        expect(await storage.get(PAGE_STATISTIC_KEY)).toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({}) });
    });

    it('updates stats', async () => {
        await App.init();
        await PageStatsApiMv2.init();

        const updated = Date.now();

        const pageStatsData = getEmptyPageStatsDataFixture(updated);

        const { hours, days, months } = pageStatsData;

        const expectedHits = 1;

        const expectedStatItem = {
            [AntibannerGroupsId.AdBlockingFiltersGroupId]: expectedHits,
            [PageStatsStorage.TOTAL_GROUP_ID]: expectedHits,
        };

        hours[hours.length - 1] = expectedStatItem;
        days[days.length - 1] = expectedStatItem;
        months[months.length - 1] = expectedStatItem;

        jest.spyOn(Date, 'now').mockImplementation(() => updated);

        await PageStatsApiMv2.updateStats(AntiBannerFiltersId.EnglishFilterId, 1);

        expect(await storage.get(PAGE_STATISTIC_KEY))
            .toStrictEqual({ [PAGE_STATISTIC_KEY]: JSON.stringify({ data: pageStatsData }) });
    });

    it('gets stats', async () => {
        await App.init();
        await PageStatsApiMv2.init();

        expect(PageStatsApiMv2.getStatisticsData()).toStrictEqual(getEmptyStatisticDataFixture());
    });
});
