import { GetStatisticsDataResponse } from '../../../Extension/src/background/api';
import { PageStatsStorage } from '../../../Extension/src/background/storages/page-stats';

export const getEmptyStatisticDataFixture = (): GetStatisticsDataResponse => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };

    return {
        today: Array(24).fill(emptyStats),
        lastWeek: Array(7).fill(emptyStats),
        lastMonth: Array(30).fill(emptyStats),
        lastYear: Array(3).fill(emptyStats),
        overall: Array(3).fill(emptyStats),
        blockedGroups: [
            { groupId: 'total', groupName: 'popup_statistics_total' },
            { displayNumber: 1, groupId: 1, groupName: 'Ad Blocking' },
            { displayNumber: 2, groupId: 2, groupName: 'Privacy' },
            { displayNumber: 3, groupId: 3, groupName: 'Social Widgets' },
            { displayNumber: 4, groupId: 4, groupName: 'Annoyances' },
            { displayNumber: 5, groupId: 5, groupName: 'Security' },
            { displayNumber: 6, groupId: 6, groupName: 'Other' },
            { displayNumber: 7, groupId: 7, groupName: 'Language-specific' },
            { displayNumber: 99, groupId: 0, groupName: 'options_antibanner_custom_group' },
        ],
    };
};
