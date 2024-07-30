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
import { LRUMap } from 'lru_map';

import { safebrowsingStorageDataValidator, type SafebrowsingCacheData } from '../schema';
import { SB_LRU_CACHE_KEY } from '../../common/constants';
import { logger } from '../../common/logger';

import { browserStorage } from './shared-instances';

/**
 * Class for control persisted {@link LRUMap} safebrowsing cache.
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

    private cache = new LRUMap<string, SafebrowsingCacheData>(1000);

    /**
     * Reads safebrowsing {@link LRUMap} stringified entries from {@link browserStorage},
     * parse it and sets to {@link cache}.
     *
     * @returns Promise, resolved when data successfully initialized.
     */
    public async init(): Promise<void> {
        const storageData = await browserStorage.get(SB_LRU_CACHE_KEY);

        if (typeof storageData !== 'string') {
            return;
        }

        const now = Date.now();

        try {
            const data = safebrowsingStorageDataValidator
                .parse(JSON.parse(storageData))
                // filter expired records
                .filter(({ value }) => typeof value.expires === 'undefined' || now < value.expires);

            this.cache.assign(data.map(({ key, value }) => [key, value]));
        } catch (e: unknown) {
            logger.error(e);
        }
    }

    /**
     * Saves stringified safebrowsing {@link cache} entries in {@link browserStorage}.
     */
    public async save(): Promise<void> {
        await browserStorage.set(SB_LRU_CACHE_KEY, JSON.stringify(this.cache.toJSON()));
    }

    /**
     * Returns value from {@link cache}.
     *
     * @param key Cache key.
     * @returns Cache value.
     */
    public get(key: string): string | undefined {
        const data = this.cache.get(key);

        if (typeof data?.expires === 'number' && data.expires < Date.now()) {
            this.cache.delete(key);
            return undefined;
        }

        return data?.list;
    }

    /**
     * Sets value to {@link cache}.
     *
     * @param key Cache key.
     * @param list Cache list value.
     * @returns Updated {@link cache} instance.
     */
    public async set(key: string, list: string): Promise<SbCache> {
        const data: SafebrowsingCacheData = { list };

        if (list !== SbCache.SB_ALLOW_LIST) {
            data.expires = Date.now() + SbCache.CACHE_TTL_MS;
        }

        this.cache.set(key, data);

        if (this.cache.size % 20 === 0) {
            await this.save();
        }

        return this;
    }

    /**
     * Clear {@link cache} and {@link browserStorage} data.
     */
    public async clear(): Promise<void> {
        this.cache.clear();
        await this.save();
    }
}

export const sbCache = new SbCache();

export const sbRequestCache = new LRUMap(1000);
