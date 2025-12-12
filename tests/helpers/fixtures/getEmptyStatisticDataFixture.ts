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

import { type GetStatisticsDataResponse } from '../../../Extension/src/background/api';
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
