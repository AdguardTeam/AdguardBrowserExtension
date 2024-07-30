/**
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

import { CompaniesDbStatsApi } from 'tswebextension';

import { COMPANIES_DB_OUTPUT_FILE } from '../../../../../constants';
import { logger } from '../../../common/logger';
import { translator } from '../../../common/translators/translator';
import { pageStatsValidator } from '../../schema';
import { PageStatsStorage, pageStatsStorage } from '../../storages';
import { isNumber } from '../../../common/guards';

import type { GetGroupsResponse, GetStatisticsDataResponse } from './types';
import { PageStatsApi } from './page-stats-abstract';

/**
 * Supported popup stats categories for MV3.
 */
enum PopupStatsCategoriesMv3 {
    Advertising = 0,
    SocialMedia = 1,
    Cdn = 2,
    WebHosting = 3,
    Trackers = 4,
    Other = 5,
}

/**
 * Categories from companiesdb.
 *
 * @see {@link https://github.com/AdguardTeam/companiesdb/blob/a49d8ce239e240bab2dce94c6b9cc2442a61cdfd/source/trackers.json#L3-L21}
 */
enum CompaniesDbCategories {
    AudioVideoPlayer = 0,
    Comments = 1,
    Customer = 2,
    Pornvertising = 3,
    Advertising = 4,
    Essential = 5,
    SiteAnalytics = 6,
    SocialMedia = 7,
    Misc = 8,
    Cdn = 9,
    Hosting = 10,
    Unknown = 11,
    Extensions = 12,
    Email = 13,
    Consent = 14,
    Telemetry = 15,
    MobileAnalytics = 101,
}

/**
 * Map of corresponding categories between companiesdb categories and popup stats categories.
 */
const CompaniesDbCategoriesMap: Record<number, number> = {
    [CompaniesDbCategories.AudioVideoPlayer]: PopupStatsCategoriesMv3.Cdn,
    [CompaniesDbCategories.Comments]: PopupStatsCategoriesMv3.Cdn,
    [CompaniesDbCategories.Customer]: PopupStatsCategoriesMv3.Cdn,
    [CompaniesDbCategories.Pornvertising]: PopupStatsCategoriesMv3.Advertising,
    [CompaniesDbCategories.Advertising]: PopupStatsCategoriesMv3.Advertising,
    [CompaniesDbCategories.Essential]: PopupStatsCategoriesMv3.Other,
    [CompaniesDbCategories.SiteAnalytics]: PopupStatsCategoriesMv3.Trackers,
    [CompaniesDbCategories.SocialMedia]: PopupStatsCategoriesMv3.SocialMedia,
    [CompaniesDbCategories.Misc]: PopupStatsCategoriesMv3.Other,
    [CompaniesDbCategories.Cdn]: PopupStatsCategoriesMv3.Cdn,
    [CompaniesDbCategories.Hosting]: PopupStatsCategoriesMv3.WebHosting,
    [CompaniesDbCategories.Unknown]: PopupStatsCategoriesMv3.Other,
    [CompaniesDbCategories.Extensions]: PopupStatsCategoriesMv3.Other,
    [CompaniesDbCategories.Email]: PopupStatsCategoriesMv3.Other,
    [CompaniesDbCategories.Consent]: PopupStatsCategoriesMv3.Trackers,
    [CompaniesDbCategories.Telemetry]: PopupStatsCategoriesMv3.Trackers,
    [CompaniesDbCategories.MobileAnalytics]: PopupStatsCategoriesMv3.Trackers,
};

/**
 * Page Stats API is responsible for storing statistics of blocked requests.
 *
 * Based on companiesdb data, used for MV3.
 */
export class PageStatsApiMv3 extends PageStatsApi {
    /**
     * Initializes page stats storage
     * and starts CompaniesDbStatsApi to load categories data, and validates the data.
     */
    public static async init(): Promise<void> {
        try {
            const storageData = await pageStatsStorage.read();

            if (typeof storageData === 'string') {
                const data = pageStatsValidator.parse(JSON.parse(storageData));
                pageStatsStorage.setCache(data);
            } else {
                pageStatsStorage.setData({});
            }
        } catch (e) {
            logger.warn(
                `Cannot parse data from "${pageStatsStorage.key}" storage, set default states. Origin error: `,
                e,
            );
            pageStatsStorage.setData({});
        }

        await CompaniesDbStatsApi.start(COMPANIES_DB_OUTPUT_FILE);

        PageStatsApiMv3.validateCategoriesData();
    }

    /**
     * Validates categories data from CompaniesDbStatsApi.
     *
     * @throws Error if categories data is invalid.
     */
    private static validateCategoriesData(): void {
        let rawCategoriesData = null;

        try {
            rawCategoriesData = CompaniesDbStatsApi.getCategories();
        } catch (e) {
            logger.warn(
                'Cannot load categories data from CompaniesDbStatsApi. Origin error: ',
                e,
            );
        }

        if (!rawCategoriesData) {
            throw new Error('Cannot load categories data from CompaniesDbStatsApi');
        }

        const categoryIds = Object.keys(rawCategoriesData).map((key) => Number(key));

        if (categoryIds.length === 0) {
            throw new Error('CompaniesDbStatsApi returned empty categories');
        }

        const unknownCompaniesDbCategoryIds = Object.values(CompaniesDbCategories)
            .filter(isNumber)
            .filter((id) => !categoryIds.includes(id));

        if (unknownCompaniesDbCategoryIds.length > 0) {
            throw new Error(
                `CompaniesDbStatsApi returned unrecognizable category ids: ${unknownCompaniesDbCategoryIds.join(', ')}`,
            );
        }
    }

    /**
     * Updates stats data.
     *
     * We store last 24 hours, 30 days and all past months stats.
     *
     * @param companyCategory Category id.
     * @param blocked Count of blocked requests.
     */
    public static async updateStats(
        companyCategory: number,
        blocked: number,
    ): Promise<void> {
        let statsCategoryId = CompaniesDbCategoriesMap[companyCategory];

        if (!statsCategoryId) {
            logger.debug(`Not mapped category id: ${companyCategory}, set to "Other"`);
            statsCategoryId = PopupStatsCategoriesMv3.Other;
        }

        const stats = pageStatsStorage.getStatisticsData();

        if (stats) {
            const updated = PageStatsStorage.updateStatsData(statsCategoryId, blocked, stats);
            return pageStatsStorage.setStatisticsData(updated);
        }

        const created = PageStatsStorage.createStatsData(statsCategoryId, blocked);
        await pageStatsStorage.setStatisticsData(created);
    }

    /**
     * Returns page stats and groups data from storages for popup statistics section.
     *
     * @returns Full statistics data record.
     */
    public static getStatisticsData(): GetStatisticsDataResponse {
        const stats = pageStatsStorage.getStatisticsData();

        return {
            today: stats.hours,
            lastWeek: stats.days.slice(-7),
            lastMonth: stats.days.slice(-30),
            lastYear: stats.months.slice(-12),
            overall: stats.months,
            blockedGroups: PageStatsApiMv3.getGroups(),
        };
    }

    /**
     * Returns categories data
     * with a synthetic _total_ group with id `999` for combined popup statistics.
     *
     * @returns Categories data.
     */
    private static getGroups(): GetGroupsResponse {
        return [
            {
                groupId: PageStatsStorage.TOTAL_GROUP_ID,
                groupName: translator.getMessage('popup_statistics_total'),
            },
            {
                groupId: PopupStatsCategoriesMv3.Advertising,
                groupName: translator.getMessage('popup_statistics_category_advertising'),
            },
            {
                groupId: PopupStatsCategoriesMv3.SocialMedia,
                groupName: translator.getMessage('popup_statistics_category_social_media'),
            },
            {
                groupId: PopupStatsCategoriesMv3.Cdn,
                groupName: translator.getMessage('popup_statistics_category_cdn'),
            },
            {
                groupId: PopupStatsCategoriesMv3.WebHosting,
                groupName: translator.getMessage('popup_statistics_category_web_hosting'),
            },
            {
                groupId: PopupStatsCategoriesMv3.Trackers,
                groupName: translator.getMessage('popup_statistics_category_trackers'),
            },
            {
                groupId: PopupStatsCategoriesMv3.Other,
                groupName: translator.getMessage('popup_statistics_category_other'),
            },
        ];
    }
}
