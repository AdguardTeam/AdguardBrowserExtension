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

import { LRUCache } from 'lru-cache';

import { RULE_INDEX_NONE } from '@adguard/tsurlfilter';

import { type ConvertedFilterList } from 'tswebextension';

import { AntiBannerFiltersId } from '../../common/constants';
import { logger } from '../../common/logger';
import { engine } from '../engine';
import { FiltersStoragesAdapter } from '../storages/filters-adapter';

/**
 * Rule text representation containing applied and optionally original rule text.
 */
export interface RuleText {
    /**
     * Applied rule text retrieved from the filter.
     */
    appliedRuleText: string;

    /**
     * Original rule text. Present if the applied rule is a converted rule.
     * If not present, the applied rule text is the same as the original rule text.
     */
    originalRuleText?: string;
}

/**
 * Service for retrieving rule text with caching support.
 * Manages memory efficiently by allowing cache to be cleared when not needed.
 */
export class RuleTextService {
    /**
     * Filter lists that are generated dynamically by TSWebExtension.
     * We don't store them in the storage, so we need to get rule AST nodes
     * and generate rule text manually.
     */
    private static readonly DYNAMIC_FILTER_LISTS = new Set([
        AntiBannerFiltersId.StealthModeFilterId,
        AntiBannerFiltersId.AllowlistFilterId,
    ]);

    /**
     * Interval for sync attempts in milliseconds.
     * We should try to sync the filter only once per 10 seconds.
     */
    private static readonly SYNC_ATTEMPTS_INTERVAL_MS = 10000;

    /**
     * Maximum number of filters to cache.
     * Typical users have 5-10 filters enabled, setting to 20 provides headroom.
     */
    private static readonly MAX_CACHED_FILTERS = 20;

    /**
     * Time-to-live for cached filters in milliseconds.
     * Filters are automatically evicted after 2 minutes of inactivity.
     * Provides safety net for memory management during filtering log sessions:
     * - Active browsing: Cache stays warm as TTL resets on each access.
     * - Inactive period: Filters auto-expire after 2 minutes, freeing memory.
     * - Manual cleanup: disableCache() provides immediate cleanup on session end.
     */
    private static readonly CACHE_TTL_MS = 2 * 60 * 1000;

    /**
     * Cache for filters data.
     * The key is the filter list id and the value is the filter data.
     * Cache is only used when enabled via {@link enableCache} (typically by filtering log).
     * Uses LRU eviction to limit memory usage - least recently used filters
     * are automatically removed when cache is full.
     * TTL-based expiration removes filters after 2 minutes of inactivity.
     * The cache can be cleared by calling {@link clear} or {@link disableCache}.
     */
    private filtersCache = new LRUCache<number, ConvertedFilterList>({
        max: RuleTextService.MAX_CACHED_FILTERS,
        ttl: RuleTextService.CACHE_TTL_MS,
        allowStale: false,
        updateAgeOnGet: true,
        updateAgeOnHas: true,
    });

    /**
     * Map of filter sync attempts. The key is the filter list id and the value
     * is the last attempt time.
     * In some rare edge cases, the filters cache may become outdated,
     * so we need to sync the filter again.
     * We only try this sync if we encounter an error while getting rule text.
     */
    private filterSyncAttempts = new Map<number, number>();

    /**
     * Flag to invert allowlist mode.
     * Updated when engine configuration changes.
     */
    private allowlistInverted = false;

    /**
     * Flag to enable/disable caching.
     * When false (default), all requests bypass cache and read directly from storage.
     * When true, requests are cached for performance.
     * This should be enabled by callers that make frequent bulk requests (e.g., filtering log).
     */
    private cachingEnabled = false;

    /**
     * Forces creation of a new string to prevent V8 string slicing memory leak.
     * When V8 slices a substring from a large string, it may keep the entire parent
     * string in memory. This forces allocation of a new string buffer.
     *
     * @param str String to copy.
     *
     * @returns New string with independent memory allocation.
     */
    private static safeStringCopy(str: string): string {
        // Force new string allocation by concatenation
        // This breaks the reference to the parent string buffer
        return str.split('').join('');
    }

    /**
     * Purges filters cache.
     *
     * @param filterIds Filter ids to remove from cache. If not provided, the whole cache will be purged.
     */
    private purgeFiltersCache(filterIds?: number[]): void {
        if (filterIds) {
            filterIds.forEach((filterId) => this.filtersCache.delete(filterId));

            logger.debug(`[ext.RuleTextService.purgeFiltersCache]: filters cache purged for filter ids: ${filterIds.join(', ')}`);
            return;
        }

        this.filtersCache.clear();

        logger.debug('[ext.RuleTextService.purgeFiltersCache]: filters cache cleared.');
    }

    /**
     * Purges filter sync attempts.
     *
     * @param filterIds Filter ids to remove from cache. If not provided, the whole cache will be purged.
     */
    private purgeFilterSyncAttempts(filterIds?: number[]): void {
        if (filterIds) {
            filterIds.forEach((filterId) => this.filterSyncAttempts.delete(filterId));
            return;
        }

        this.filterSyncAttempts.clear();
    }

    /**
     * Called when the engine is updated.
     *
     * @param allowlistInverted Whether allowlist mode is inverted.
     */
    public onEngineUpdated(allowlistInverted: boolean): void {
        this.allowlistInverted = allowlistInverted;
        // Clear cache to ensure fresh data after engine update
        this.purgeFiltersCache();
        this.purgeFilterSyncAttempts();
    }

    /**
     * Helper method to get filter data without caching.
     * Used for infrequent one-off lookups to avoid memory bloat.
     *
     * @param filterId Filter id.
     *
     * @returns Filter data or undefined if the filter is not found.
     */
    private static async getFilterDataNoCache(filterId: number): Promise<ConvertedFilterList | undefined> {
        try {
            const convertedFilterList = await FiltersStoragesAdapter.get(filterId);

            if (convertedFilterList === undefined) {
                return undefined;
            }

            return convertedFilterList;
        } catch (e) {
            logger.error(`[ext.RuleTextService.getFilterDataNoCache]: failed to get filter data for filter id ${filterId}:`, e);
        }

        return undefined;
    }

    /**
     * Helper method to get filter data with caching.
     * It handles a cache internally to speed up requests for the same filter next time.
     *
     * @param filterId Filter id.
     *
     * @returns Filter data or undefined if the filter is not found.
     */
    private async getFilterData(filterId: number): Promise<ConvertedFilterList | undefined> {
        if (this.filtersCache.has(filterId)) {
            return this.filtersCache.get(filterId);
        }

        try {
            const convertedFilterList = await FiltersStoragesAdapter.get(filterId);

            if (convertedFilterList === undefined) {
                return undefined;
            }

            this.filtersCache.set(filterId, convertedFilterList);

            return convertedFilterList;
        } catch (e) {
            logger.error(`[ext.RuleTextService.getFilterData]: failed to get filter data for filter id ${filterId}:`, e);
        }

        return undefined;
    }

    /**
     * Tries to sync the cached filter data with the storage.
     *
     * @param filterId Filter id.
     *
     * @returns Returns false if the filter was synced within the last
     * {@link RuleTextService.SYNC_ATTEMPTS_INTERVAL_MS} milliseconds.
     * Otherwise, returns true.
     */
    private attemptToSyncFilter(filterId: number): boolean {
        const lastAttemptTime = this.filterSyncAttempts.get(filterId) || 0;

        if (Date.now() - lastAttemptTime < RuleTextService.SYNC_ATTEMPTS_INTERVAL_MS) {
            return false;
        }

        this.purgeFiltersCache([filterId]);

        this.filterSyncAttempts.set(filterId, Date.now());

        return true;
    }

    /**
     * Enables caching for bulk operations.
     * Should be called by consumers that make many sequential requests (e.g., filtering log).
     * Cache will be used until explicitly disabled with {@link disableCache}.
     */
    public enableCache(): void {
        this.cachingEnabled = true;
        logger.debug('[ext.RuleTextService.enableCache]: caching enabled.');
    }

    /**
     * Disables caching and clears all caches.
     * Should be called when bulk operations are complete (e.g., filtering log closed).
     */
    public disableCache(): void {
        this.cachingEnabled = false;
        this.purgeFiltersCache();
        this.purgeFilterSyncAttempts();
        logger.debug('[ext.RuleTextService.disableCache]: caching disabled and caches cleared.');
    }

    /**
     * Gets rule text for the specified filter id and rule index.
     * If the rule is not found, returns null.
     * By default, reads directly from storage without caching.
     * Cache is only used if enabled via {@link enableCache}.
     *
     * @param filterId Filter id.
     * @param ruleIndex Rule index.
     *
     * @returns Rule text or null if the rule is not found.
     */
    public async getRuleText(
        filterId: number,
        ruleIndex: number,
    ): Promise<RuleText | null> {
        if (
            this.allowlistInverted
            && filterId === AntiBannerFiltersId.AllowlistFilterId
            && ruleIndex === RULE_INDEX_NONE
        ) {
            return null;
        }

        // Dynamic filter lists are not stored in the storage, they are created on the fly by tswebextension
        if (RuleTextService.DYNAMIC_FILTER_LISTS.has(filterId)) {
            const ruleText = engine.api.retrieveRuleText(filterId, ruleIndex);

            if (!ruleText) {
                logger.error(`[ext.RuleTextService.getRuleText]: failed to get rule node for filter id ${filterId} and rule index ${ruleIndex}`);
                return null;
            }

            return {
                appliedRuleText: ruleText,
            };
        }

        const filterData = this.cachingEnabled
            ? await this.getFilterData(filterId)
            : await RuleTextService.getFilterDataNoCache(filterId);

        if (!filterData) {
            logger.error(`[ext.RuleTextService.getRuleText]: failed to get filter data for filter id ${filterId}`);

            // Only attempt sync if caching is enabled, otherwise retry won't help
            if (this.cachingEnabled && this.attemptToSyncFilter(filterId)) {
                return this.getRuleText(filterId, ruleIndex);
            }

            return null;
        }

        const appliedRuleText = filterData.getRuleText(ruleIndex);

        if (!appliedRuleText) {
            logger.error(
                `[ext.RuleTextService.getRuleText]: failed to get applied rule text for filter id ${filterId} and rule index ${ruleIndex}`,
            );
            return null;
        }

        // Force new string allocation to prevent V8 from retaining entire filter data in memory
        const result: RuleText = {
            appliedRuleText: RuleTextService.safeStringCopy(appliedRuleText),
        };

        const originalRuleText = filterData.getOriginalRuleText(ruleIndex);

        if (originalRuleText) {
            result.originalRuleText = RuleTextService.safeStringCopy(originalRuleText);
        }

        return result;
    }

    /**
     * Clears all caches. Should be called when the service is no longer needed
     * to free up memory.
     * Note: This does not disable caching. Use {@link disableCache} for that.
     */
    public clear(): void {
        this.purgeFiltersCache();
        this.purgeFilterSyncAttempts();
    }
}

export const ruleTextService = new RuleTextService();
