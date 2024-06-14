import { PageStatsData } from '../../../Extension/src/background/schema';
import { PageStatsStorage } from '../../../Extension/src/background/storages/page-stats';

export const getEmptyPageStatsDataFixture = (
    updated: number,
): PageStatsData => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };
    return {
        hours: Array(PageStatsStorage.MAX_HOURS_HISTORY).fill(emptyStats),
        days: Array(PageStatsStorage.MAX_DAYS_HISTORY).fill(emptyStats),
        months: Array(PageStatsStorage.MAX_MONTHS_HISTORY).fill(emptyStats),
        updated,
    };
};
