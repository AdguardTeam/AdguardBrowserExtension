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

import { type GroupMetadata, type PageStatsDataItem } from '../../schema';

/**
 * Statistics data.
 */
export type GetStatisticsDataResponse = {
    /**
     * Statistics for today.
     */
    today: PageStatsDataItem[],

    /**
     * Statistics for the last week.
     */
    lastWeek: PageStatsDataItem[],

    /**
     * Statistics for the last month.
     */
    lastMonth: PageStatsDataItem[],

    /**
     * Statistics for the last year.
     */
    lastYear: PageStatsDataItem[],

    /**
     * Overall statistics.
     */
    overall: PageStatsDataItem[],

    /**
     * Blocked groups data.
     */
    blockedGroups: GetGroupsResponse,
};

/**
 * Groups data.
 *
 * Filter groups are used for MV2, companiesdb categories are used for MV3.
 */
export type GetGroupsResponse = (GroupMetadata | {
    groupId: number;
    groupName: string;
})[];
