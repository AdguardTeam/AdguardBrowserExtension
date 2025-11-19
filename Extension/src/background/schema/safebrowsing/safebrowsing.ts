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
import zod from 'zod';

/**
 * Safebrowsing cache data schema validator.
 */
const safebrowsingCacheDataValidator = zod.string();

/**
 * Safebrowsing cache data type inferred from {@link safebrowsingCacheDataValidator} schema.
 */
export type SafebrowsingCacheData = zod.infer<typeof safebrowsingCacheDataValidator>;

/**
 * Safebrowsing persisted storage data schema validator.
 */
export const safebrowsingStorageDataValidator = zod.tuple([
    /**
     * Cache key.
     */
    zod.string(),

    /**
     * Cache value.
     *
     * @note lru-cache using `.dump()` method to export cache data and `.load()` to import it,
     * and both methods use the following data structure:
     * {@link http://isaacs.github.io/node-lru-cache/interfaces/LRUCache.Entry.html}
     */
    zod.object({
        /**
         * Size of cache record.
         */
        size: zod.number().optional(),

        /**
         * Record creation time in milliseconds.
         */
        start: zod.number().optional(),

        /**
         * TTL of cache record in milliseconds.
         */
        ttl: zod.number().optional(),

        /**
         * Cache data.
         */
        value: safebrowsingCacheDataValidator,
    }).strict(),
]).array();

/**
 * Safebrowsing persisted storage data type inferred from {@link safebrowsingStorageDataValidator} schema.
 */
export type SafebrowsingStorageData = zod.infer<typeof safebrowsingStorageDataValidator>;
