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
import { debounce, isEmpty } from 'lodash-es';

import { RuleGenerator } from '@adguard/agtree';

import { getRuleSourceIndex, getRuleSourceText } from 'tswebextension';

import { AntiBannerFiltersId, CUSTOM_FILTERS_START_ID } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { hitStatsStorageDataValidator } from '../../schema';
import { filterVersionStorage, hitStatsStorage } from '../../storages';
import {
    type FilterHitStats,
    type FiltersHitStats,
    network,
} from '../network';
import { getZodErrorMessage } from '../../../common/error';
import { FiltersStoragesAdapter } from '../../storages/filters-adapter';
import { engine } from '../../engine';

/**
 * This API is used to store and track ad filters usage stats.
 * It is used if user has enabled "Send statistics for ad filters usage" option.
 * More info about ad filters stats: http://adguard.com/en/filter-rules-statistics.html.
 */
export class HitStatsApi {
    /**
     * Maximum total hits to send stats. We send stats only after reaching this limit.
     */
    private static maxTotalHits = 1000;

    /**
     * Timeout for saving hit stats.
     */
    private static saveTimeoutMs = 2000; // 2 sec

    /**
     * Saves and sends hit stats with {@link saveTimeoutMs} debounce.
     */
    private static debounceSaveAndSendHitStats = debounce(() => {
        HitStatsApi.saveAndSendHitStats();
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
            logger.error(`[ext.HitStatsApi.init]: cannot parse data from "${hitStatsStorage.key}" storage, set default states. Origin error:`, getZodErrorMessage(e));
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
        HitStatsApi.debounceSaveAndSendHitStats();
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
         *
         * @returns Transformed filter list data.
         */
        const transformFilterHits = async (
            filterId: string,
            stats: Record<string, number>,
        ): Promise<[string, FilterHitStats]> => {
            // If the filter version is not cached or it is outdated, we do not send the stats for this filter
            // (we store the version of the filter on the first hit).
            // When saving hits, we do not analyze the source map, as that would be too heavy,
            // but at this point we need to ensure consistency between the saved hits and the source map in storage
            const cachedFilterVersion = hitStats.versions?.[filterId];
            const filterIdNumber = Number(filterId);

            if (!cachedFilterVersion || cachedFilterVersion !== filterVersionStorage.get(filterIdNumber)?.version) {
                return [filterId, {}];
            }

            const filterData = await FiltersStoragesAdapter.get(filterIdNumber);

            if (!filterData) {
                return [filterId, {}];
            }

            const { rawFilterList, conversionMap, sourceMap } = filterData;

            // It is impossible to get rule text if there is no source map
            if (!sourceMap) {
                return [filterId, {}];
            }

            const ruleTexts = Object.entries(stats).map(([ruleIndex, hits]): [string, number] | null => {
                // Get line start index in the source file by rule start index in the byte array
                const lineStartIndex = getRuleSourceIndex(Number(ruleIndex), sourceMap);

                // During normal operation, this should not happen
                if (lineStartIndex === -1) {
                    let baseMessage = `[ext.HitsStatsApi.sendStats.transformFilterHits] cannot find rule source index for rule index ${ruleIndex}`;

                    const ruleNode = engine.api.retrieveRuleNode(Number(filterId), Number(ruleIndex));

                    // Note: during normal operation, ruleNode should not be null,
                    // but we handle this case just in case, and to provide type safety
                    if (ruleNode) {
                        const generatedRuleText = RuleGenerator.generate(ruleNode);
                        baseMessage += `, generated rule text: ${generatedRuleText}`;
                    }

                    // eslint-disable-next-line @adguard/logger-context/require-logger-context
                    logger.error(baseMessage);
                    return null;
                }

                const appliedRuleText = getRuleSourceText(lineStartIndex, rawFilterList);

                // During normal operation, this should not happen
                if (!appliedRuleText) {
                    let baseMessage = `[ext.HitsStatsApi.sendStats.transformFilterHits] cannot find rule text for rule index ${ruleIndex}`;

                    const ruleNode = engine.api.retrieveRuleNode(Number(filterId), Number(ruleIndex));

                    // Note: during normal operation, ruleNode should not be null,
                    // but we handle this case just in case, and to provide type safety
                    if (ruleNode) {
                        const generatedRuleText = RuleGenerator.generate(ruleNode);
                        baseMessage += `, generated rule text: ${generatedRuleText}`;
                    }

                    // eslint-disable-next-line @adguard/logger-context/require-logger-context
                    logger.error(baseMessage);
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
            }).filter((entry): entry is [string, number] => entry !== null);

            return [filterId, Object.fromEntries(ruleTexts)];
        };

        const hitStatsData: FiltersHitStats = Object.fromEntries(
            (await Promise.all(
                affectedFilterIds.map(async (filterId) => {
                    const stats = hitStats.stats?.filters?.[filterId] || {};
                    return transformFilterHits(filterId, stats);
                }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            )).filter(([_, stats]) => !isEmpty(stats)),
        );

        try {
            await network.sendHitStats({
                filters: hitStatsData,
            });
        } catch (e) {
            logger.error('[ext.HitStatsApi.sendStats]: cannot send hit stats, origin error:', e);
        }

        await HitStatsApi.cleanup();
    }

    /**
     * Saves and sends hit stats.
     */
    private static async saveAndSendHitStats(): Promise<void> {
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
