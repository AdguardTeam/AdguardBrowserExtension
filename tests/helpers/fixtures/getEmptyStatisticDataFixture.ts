import { GetStatisticsDataResponse } from '../../../Extension/src/background/api';
import { PageStatsStorage } from '../../../Extension/src/background/storages/page-stats';
import { translator } from '../../../Extension/src/common/translators/translator';

export const getEmptyStatisticDataFixture = (): GetStatisticsDataResponse => {
    const emptyStats = { [PageStatsStorage.TOTAL_GROUP_ID]: 0 };

    return {
        today: Array(24).fill(emptyStats),
        lastWeek: Array(7).fill(emptyStats),
        lastMonth: Array(30).fill(emptyStats),
        lastYear: Array(3).fill(emptyStats),
        overall: Array(3).fill(emptyStats),
        blockedCategories: [
            { categoryId: 'total', categoryName: translator.getMessage('popup_statistics_all_categories') },
            { categoryId: 'Advertising', categoryName: translator.getMessage('popup_statistics_category_advertising') },
            { categoryId: 'Trackers', categoryName: translator.getMessage('popup_statistics_category_trackers') },
            {
                categoryId: 'SocialMedia',
                categoryName: translator.getMessage('popup_statistics_category_social_media'),
            },
            { categoryId: 'Cdn', categoryName: translator.getMessage('popup_statistics_category_cdn') },
            { categoryId: 'Other', categoryName: translator.getMessage('popup_statistics_category_other') },
        ],
    };
};
