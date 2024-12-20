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
import { LRUCache } from 'lru-cache';
import { ZodError } from 'zod';

import { safebrowsingStorageDataValidator, type SafebrowsingCacheData } from '../schema';
import { SB_LRU_CACHE_KEY } from '../../common/constants';
import { logger } from '../../common/logger';

import { browserStorage } from './shared-instances';

/**
 * Class for control persisted {@link LRUCache} safebrowsing cache.
 */
export class SbCache {
    /**
     * A key that indicates that the domain is in the allow list.
     */
    public static readonly SB_ALLOW_LIST = 'allowlist';

    /**
     * Time to live of cache record.
     * This time: 40 minutes.
     */
    public static readonly CACHE_TTL_MS = 40 * 60 * 1000;

    /**
     * Number of maximum allowed cache records.
     */
    public static readonly CACHE_LIMIT = 1000;

    /**
     * {@link LRUCache} instance.
     */
    private cache: LRUCache<string, SafebrowsingCacheData>;

    /**
     * Constructor.
     */
    constructor() {
        this.cache = new LRUCache({
            max: SbCache.CACHE_LIMIT,
            allowStale: false,
        });
    }

    /**
     * Reads safebrowsing {@link LRUCache} stringified entries from {@link browserStorage},
     * parse it and sets to {@link this.cache}.
     *
     * @returns Promise, resolved when data successfully initialized.
     */
    public async init(): Promise<void> {
        const storageData = await browserStorage.get(SB_LRU_CACHE_KEY);

        if (typeof storageData !== 'string') {
            return;
        }

        try {
            const rawData = JSON.parse(storageData);
            const data = safebrowsingStorageDataValidator.parse(rawData);

            this.cache.load(data);
            // Note: `.load()` method doesn't remove stale records, so we need to do it manually
            this.cache.purgeStale();
        } catch (e: unknown) {
            logger.error('Failed to initialize safebrowsing storage', e);

            // if data is corrupted, purge it
            // if error is json parsing error or zod validation error
            if (e instanceof SyntaxError || e instanceof ZodError) {
                await SbCache.purgeStorage();
                logger.info('Safebrowsing storage was purged, because of data corruption');
            }
        }
    }

    /**
     * Purges {@link browserStorage} data.
     */
    private static async purgeStorage(): Promise<void> {
        try {
            await browserStorage.remove(SB_LRU_CACHE_KEY);
        } catch (e: unknown) {
            logger.error('Failed to purge safebrowsing storage', e);
        }
    }

    /**
     * Saves stringified safebrowsing {@link this.cache} entries in {@link browserStorage}.
     */
    public async save(): Promise<void> {
        await browserStorage.set(SB_LRU_CACHE_KEY, JSON.stringify(this.cache.dump()));
    }

    /**
     * Returns value from {@link this.cache}.
     *
     * @param key Cache key.
     * @returns Cache value.
     */
    public get(key: string): string | undefined {
        return this.cache.get(key);
    }

    /**
     * Sets value to {@link this.cache}.
     *
     * @param key Cache key.
     * @param list Cache list value.
     * @returns Updated {@link this.cache} instance.
     */
    public async set(key: string, list: string): Promise<SbCache> {
        const data: SafebrowsingCacheData = list;

        let options;

        if (list !== SbCache.SB_ALLOW_LIST) {
            options = {
                ttl: SbCache.CACHE_TTL_MS,
            };
        }

        this.cache.set(key, data, options);

        if (this.cache.size % 20 === 0) {
            await this.save();
        }

        return this;
    }

    /**
     * Clear {@link this.cache} and {@link browserStorage} data.
     */
    public async clear(): Promise<void> {
        this.cache.clear();
        await this.save();
    }
}

export const sbCache = new SbCache();

export const sbRequestCache = new LRUCache({ max: SbCache.CACHE_LIMIT });
