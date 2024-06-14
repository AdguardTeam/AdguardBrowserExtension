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
import { debounce } from 'lodash-es';

import { getRuleSourceIndex, getRuleSourceText } from '@adguard/tswebextension';

import { AntiBannerFiltersId, CUSTOM_FILTERS_START_ID } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { hitStatsStorageDataValidator } from '../../schema';
import { FiltersStorage, hitStatsStorage } from '../../storages';
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
            // eslint-disable-next-line max-len
            logger.warn(`Cannot parse data from "${hitStatsStorage.key}" storage, set default states. Origin error: `, e);
            hitStatsStorage.setData({});
        }
    }

    /**
     * Add 1 rule hit to stats.
     *
     * @param filterId Filter id.
     * @param ruleIndex Rule index.
     */
    public static addRuleHit(
        filterId: number,
        ruleIndex: number,
    ): void {
        // We collect hit stats only for own predefined filter lists
        if (!HitStatsApi.shouldCollectHitStats(filterId)) {
            return;
        }

        hitStatsStorage.addRuleHitToCache(filterId, ruleIndex);
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

        // In the hit stats API, we only have rule indexes, so we need to get original rule texts before sending them
        // So we transform `{ [filterId]: { [ruleIndex]: hits } `} to `{ [filterId]: { [originalRuleText]: hits } }`
        const affectedFilterIds = Object.keys(hitStats.stats?.filters ?? {});

        /**
         * Helper function to transform one filter list data from the hit stats to the format that we need.
         *
         * @param filterId Filter list id.
         * @param stats Filter list stats.
         * @returns Transformed filter list data.
         */
        const transformFilterHits = async (
            filterId: string,
            stats: Record<string, number>,
        ): Promise<[string, Record<string, number>]> => {
            const filterData = await FiltersStorage.getAllFilterData(Number(filterId));

            if (!filterData) {
                return [filterId, {}];
            }

            const { rawFilterList, conversionMap, sourceMap } = filterData;

            // It is impossible to get rule text if there is no source map
            if (!sourceMap) {
                return [filterId, {}];
            }

            const ruleTexts = (await Promise.all(
                Object.entries(stats).map(async ([ruleIndex, hits]): Promise<[string, number] | null> => {
                    // Get line start index in the source file by rule start index in the byte array
                    const lineStartIndex = getRuleSourceIndex(Number(ruleIndex), sourceMap);

                    // During normal operation, this should not happen
                    if (lineStartIndex === -1) {
                        return null;
                    }

                    const appliedRuleText = getRuleSourceText(lineStartIndex, rawFilterList);

                    // During normal operation, this should not happen
                    if (!appliedRuleText) {
                        return null;
                    }

                    // In statistics, we need the original rule text which can be found in the filter list
                    if (conversionMap) {
                        const originalRuleText = conversionMap[lineStartIndex];
                        if (originalRuleText) {
                            return [originalRuleText, hits];
                        }
                    }

                    return [appliedRuleText, hits];
                }),
            )).filter((entry): entry is [string, number] => entry !== null);

            return [filterId, Object.fromEntries(ruleTexts)];
        };

        const hitStatsData: Record<string, Record<string, number>> = Object.fromEntries(
            await Promise.all(
                affectedFilterIds.map(async (filterId) => {
                    const stats = hitStats.stats?.filters?.[filterId] || {};
                    return transformFilterHits(filterId, stats);
                }),
            ),
        );

        network.sendHitStats(JSON.stringify(hitStatsData));
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
            && filterId !== AntiBannerFiltersId.AllowlistFilterId
            && filterId !== AntiBannerFiltersId.StealthModeFilterId;
    }
}
