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

import { companiesDbService } from 'tswebextension';

import { logger } from '../../../common/logger';
import { translator } from '../../../common/translators/translator';
import { type PageStatsDataItem, pageStatsValidator } from '../../schema';
import { PageStatsStorage, pageStatsStorage } from '../../storages/page-stats';
import { getZodErrorMessage } from '../../../common/error';

/**
 * Statistics data.
 */
export type GetStatisticsDataResponse = {
    /**
     * Statistics for today.
     */
    today: PageStatsDataItem[];

    /**
     * Statistics for the last week.
     */
    lastWeek: PageStatsDataItem[];

    /**
     * Statistics for the last month.
     */
    lastMonth: PageStatsDataItem[];

    /**
     * Statistics for the last year.
     */
    lastYear: PageStatsDataItem[];

    /**
     * Overall statistics.
     */
    overall: PageStatsDataItem[];

    /**
     * Blocked categories data.
     */
    blockedCategories: GetCategoriesResponse;
};

/**
 * Companiesdb categories data.
 */
type GetCategoriesResponse = ({
    /**
     * Company category id.
     */
    categoryId: string;

    /**
     * Company category name.
     */
    categoryName: string;
})[];

/**
 * Supported popup stats categories.
 */
export enum PopupStatsCategories {
    Advertising = 'Advertising',
    Trackers = 'Trackers',
    SocialMedia = 'SocialMedia',
    Cdn = 'Cdn',
    Other = 'Other',
}

/**
 * Categories from companiesdb.
 *
 * @see {@link https://github.com/AdguardTeam/companiesdb/blob/a49d8ce239e240bab2dce94c6b9cc2442a61cdfd/source/trackers.json#L3-L21}
 */
enum CompaniesDbCategories {
    AudioVideoPlayer = 'audio_video_player',
    Comments = 'comments',
    CustomerInteraction = 'customer_interaction',
    Pornvertising = 'pornvertising',
    Advertising = 'advertising',
    Essential = 'essential',
    SiteAnalytics = 'site_analytics',
    SocialMedia = 'social_media',
    Misc = 'misc',
    Cdn = 'cdn',
    Hosting = 'hosting',
    Unknown = 'unknown',
    Extensions = 'extensions',
    Email = 'email',
    Consent = 'consent',
    Telemetry = 'telemetry',
    MobileAnalytics = 'mobile_analytics',
}

/**
 * Map of corresponding categories between companiesdb categories and popup stats categories.
 *
 * The same categories are used in the DNS (check comments in AG-33728).
 */
const CompaniesDbCategoriesMap: Record<string, string> = {
    [CompaniesDbCategories.AudioVideoPlayer]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Comments]: PopupStatsCategories.Other,
    [CompaniesDbCategories.CustomerInteraction]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Pornvertising]: PopupStatsCategories.Advertising,
    [CompaniesDbCategories.Advertising]: PopupStatsCategories.Advertising,
    [CompaniesDbCategories.Essential]: PopupStatsCategories.Other,
    [CompaniesDbCategories.SiteAnalytics]: PopupStatsCategories.Trackers,
    [CompaniesDbCategories.SocialMedia]: PopupStatsCategories.SocialMedia,
    [CompaniesDbCategories.Misc]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Cdn]: PopupStatsCategories.Cdn,
    [CompaniesDbCategories.Hosting]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Unknown]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Extensions]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Email]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Consent]: PopupStatsCategories.Other,
    [CompaniesDbCategories.Telemetry]: PopupStatsCategories.Other,
    [CompaniesDbCategories.MobileAnalytics]: PopupStatsCategories.Trackers,
};

/**
 * Page Stats API is responsible for storing statistics of blocked requests.
 *
 * Based on companiesdb data.
 */
export class PageStatsApi {
    /**
     * Initializes page stats storage,
     * initializes companiesDbService, and validates the service data.
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
            logger.warn(`[ext.PageStatsApi.init]: cannot parse data from "${pageStatsStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
            pageStatsStorage.setData({});
        }

        PageStatsApi.validateCategoriesData();
    }

    /**
     * Returns total count of blocked requests.
     *
     * @returns Total count of blocked requests.
     */
    public static getTotalBlocked(): number {
        return pageStatsStorage.getTotalBlocked() || 0;
    }

    /**
     * Increment total count of blocked requests.
     *
     * @param value Increment value.
     *
     * @returns Incremented total blocked value.
     */
    public static incrementTotalBlocked(value: number): number {
        let totalBlocked = PageStatsApi.getTotalBlocked();

        totalBlocked += value;

        pageStatsStorage.setTotalBlocked(totalBlocked);
        return totalBlocked;
    }

    /**
     * Resets stats.
     */
    public static async reset(): Promise<void> {
        await pageStatsStorage.setData({});
    }

    /**
     * Validates categories data from companiesDbService.
     *
     * @throws Error if categories data is invalid.
     */
    private static validateCategoriesData(): void {
        let rawCategoriesData = null;

        try {
            rawCategoriesData = companiesDbService.getCompaniesDbCategories();
        } catch (e) {
            logger.warn('[ext.PageStatsApi.validateCategoriesData]: cannot load categories data from companiesDbService. Origin error:', e);
        }

        if (!rawCategoriesData) {
            throw new Error('Cannot load categories data from companiesDbService');
        }

        const categoryIds = Object.values(rawCategoriesData);

        if (categoryIds.length === 0) {
            throw new Error('companiesDbService returned empty categories');
        }

        const unknownCompaniesDbCategoryIds = Object.values(CompaniesDbCategories)
            .filter((id) => !categoryIds.includes(id));

        if (unknownCompaniesDbCategoryIds.length > 0) {
            throw new Error(
                `companiesDbService returned unrecognizable category ids: ${unknownCompaniesDbCategoryIds.join(', ')}`,
            );
        }
    }

    /**
     * Updates stats data.
     *
     * We store last 24 hours, 30 days and all past months stats.
     *
     * @param companyCategoryId Category id.
     * @param blocked Count of blocked requests.
     *
     * @returns Promise which resolves when stats are updated.
     */
    public static async updateStats(
        companyCategoryId: string,
        blocked: number,
    ): Promise<void> {
        let statsCategoryId = CompaniesDbCategoriesMap[companyCategoryId];

        if (typeof statsCategoryId === 'undefined') {
            logger.debug(`[ext.PageStatsApi.updateStats]: not mapped category id: ${companyCategoryId}, set to "Other"`);
            statsCategoryId = PopupStatsCategories.Other;
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
            blockedCategories: PageStatsApi.getGroups(),
        };
    }

    /**
     * Returns categories data
     * with a _total_ category for combined popup statistics.
     *
     * @returns Categories data.
     */
    private static getGroups(): GetCategoriesResponse {
        return [
            {
                categoryId: PageStatsStorage.TOTAL_GROUP_ID,
                categoryName: translator.getMessage('popup_statistics_all_categories'),
            },
            {
                categoryId: PopupStatsCategories.Advertising,
                categoryName: translator.getMessage('popup_statistics_category_advertising'),
            },
            {
                categoryId: PopupStatsCategories.Trackers,
                categoryName: translator.getMessage('popup_statistics_category_trackers'),
            },
            {
                categoryId: PopupStatsCategories.SocialMedia,
                categoryName: translator.getMessage('popup_statistics_category_social_media'),
            },
            {
                categoryId: PopupStatsCategories.Cdn,
                categoryName: translator.getMessage('popup_statistics_category_cdn'),
            },
            {
                categoryId: PopupStatsCategories.Other,
                categoryName: translator.getMessage('popup_statistics_category_other'),
            },
        ];
    }
}
