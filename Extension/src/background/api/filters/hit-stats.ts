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
import { debounce } from 'lodash';

import { AntiBannerFiltersId, CUSTOM_FILTERS_START_ID } from '../../../common/constants';
import { Log } from '../../../common/log';
import { hitStatsStorageDataValidator } from '../../schema';
import { hitStatsStorage } from '../../storages';
import { network } from '../network';

/**
 * This API is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 * More info about ad filters stats: http://adguard.com/en/filter-rules-statistics.html.
 */
export class HitStatsApi {
    private static maxTotalHits = 1000;

    private static saveTimeoutMs = 2000; // 2 sec

    /**
     * Saves and sends hit stats with {@link saveTimeoutMs} debounce.
     */
    private static debounceSaveAndSaveHitStats = debounce(() => {
        HitStatsApi.saveAndSaveHitStats();
    }, HitStatsApi.saveTimeoutMs);

    /**
     * Init hit stats storage.
     */
    public static async init(): Promise<void> {
        try {
            const storageData = await hitStatsStorage.read();
            if (typeof storageData === 'string') {
                const data = hitStatsStorageDataValidator.parse(JSON.parse(storageData));
                hitStatsStorage.setCache(data);
            } else {
                hitStatsStorage.setData({});
            }
        } catch (e) {
            Log.warn(`Can't parse data from ${hitStatsStorage.key} storage, set default states`);
            hitStatsStorage.setData({});
        }
    }

    /**
     * Add 1 rule hit to stats.
     *
     * @param ruleText Rule test.
     * @param filterId Filter id.
     */
    public static addRuleHit(
        ruleText: string,
        filterId: number,
    ): void {
        // We collect hit stats only for own predefined filter lists
        if (!HitStatsApi.shouldCollectHitStats(filterId)) {
            return;
        }

        hitStatsStorage.addRuleHitToCache(ruleText, filterId);
        HitStatsApi.debounceSaveAndSaveHitStats();
    }

    /**
     * Cleanup stats.
     *
     * @returns Promise, resolved when storage is cleaned.
     */
    public static cleanup(): Promise<void> {
        return hitStatsStorage.setData({});
    }

    /**
     * Sends hit stats to backend server.
     */
    private static async sendStats(): Promise<void> {
        const hitStats = hitStatsStorage.getData();
        const overallViews = hitStats.totalHits || 0;

        if (overallViews < HitStatsApi.maxTotalHits) {
            return;
        }

        network.sendHitStats(JSON.stringify(hitStats.stats));
        await HitStatsApi.cleanup();
    }

    /**
     * Saves and sends hit stats.
     */
    private static async saveAndSaveHitStats(): Promise<void> {
        await hitStatsStorage.save();
        await HitStatsApi.sendStats();
    }

    /**
     * Checks if hit stats should be collected.
     *
     * We collect statistics only for own predefined filter lists.
     *
     * @param filterId Filter list id.
     *
     * @returns True, if hit stats should be collected.
     */
    private static shouldCollectHitStats(filterId: number): boolean {
        return filterId < CUSTOM_FILTERS_START_ID
            && filterId !== AntiBannerFiltersId.UserFilterId
            && filterId !== AntiBannerFiltersId.AllowlistFilterId;
    }
}
