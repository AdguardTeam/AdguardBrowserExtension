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
import { translator } from '../../../common/translators/translator';
import { Log } from '../../../common/log';
import {
    metadataStorage,
    pageStatsStorage,
    PageStatsStorage,
} from '../../storages';
import {
    GroupMetadata,
    PageStatsDataItem,
    pageStatsValidator,
} from '../../schema';

export type GetStatisticsDataResponse = {
    today: PageStatsDataItem[],
    lastWeek: PageStatsDataItem[],
    lastMonth: PageStatsDataItem[],
    lastYear: PageStatsDataItem[],
    overall: PageStatsDataItem[],
    blockedGroups: GetGroupsResponse,
};

export type GetGroupsResponse = (GroupMetadata | {
    groupId: string;
    groupName: string;
})[];

/**
 * Page Stats API is responsible for storing statistics of blocked requests.
 */
export class PageStatsApi {
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
            Log.warn(`Can't parse data from ${pageStatsStorage.key} storage, set default states`);
            pageStatsStorage.setData({});
        }
    }

    /**
     * Gets total count of blocked requests.
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
        const blockedGroup = metadataStorage.getGroupByFilterId(filterId);

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
     * Gets page stats and groups data from storages for popup statistics section.
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
            blockedGroups: PageStatsApi.getGroups(),
        };
    }

    /**
     * Gets groups data from storage and add synthetic 'total' group for popup statistics section.
     *
     * @returns Groups data.
     */
    private static getGroups(): GetGroupsResponse {
        const groups = metadataStorage.getGroups();

        return [{
            groupId: PageStatsStorage.TOTAL_GROUP_ID,
            groupName: translator.getMessage('popup_statistics_total'),
        }, ...groups.sort((prevGroup, nextGroup) => {
            return prevGroup.displayNumber - nextGroup.displayNumber;
        })];
    }
}
