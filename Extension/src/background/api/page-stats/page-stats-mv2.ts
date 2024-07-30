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

import { logger } from '../../../common/logger';
import { translator } from '../../../common/translators/translator';
import { pageStatsValidator } from '../../schema';
import {
    metadataStorage,
    PageStatsStorage,
    pageStatsStorage,
} from '../../storages';
import { Categories } from '../filters/categories';

import { PageStatsApi } from './page-stats-abstract';
import type { GetGroupsResponse, GetStatisticsDataResponse } from './types';

/**
 * Page Stats API is responsible for storing statistics of blocked requests.
 *
 * Based on filter groups, used for MV2.
 */
export class PageStatsApiMv2 extends PageStatsApi {
    /**
     * Initializes page stats storage.
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
    }

    /**
     * Updates stats data.
     *
     * We store last 24 hours, 30 days and all past months stats.
     *
     * @param filterId Filter id.
     * @param blocked Count of blocked requests.
     */
    public static async updateStats(
        filterId: number,
        blocked: number,
    ): Promise<void> {
        const blockedGroup = Categories.getGroupByFilterId(filterId);

        if (!blockedGroup) {
            return;
        }

        const { groupId } = blockedGroup;

        const stats = pageStatsStorage.getStatisticsData();

        if (stats) {
            const updated = PageStatsStorage.updateStatsData(groupId, blocked, stats);
            return pageStatsStorage.setStatisticsData(updated);
        }

        const created = PageStatsStorage.createStatsData(groupId, blocked);
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
            blockedGroups: PageStatsApiMv2.getGroups(),
        };
    }

    /**
     * Returns groups data from storage,
     * and adds a synthetic _total_ group with id `999` for combined popup statistics.
     *
     * @returns Groups data.
     */
    private static getGroups(): GetGroupsResponse {
        const groups = metadataStorage.getGroups();

        return [
            {
                groupId: PageStatsStorage.TOTAL_GROUP_ID,
                groupName: translator.getMessage('popup_statistics_total'),
            },
            ...groups.sort((prevGroup, nextGroup) => {
                return prevGroup.displayNumber - nextGroup.displayNumber;
            }),
        ];
    }
}
