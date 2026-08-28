/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { logger } from '../../../../common/logger';
import { browserStorage } from '../../../storages';
import { experimentSlotSchema } from '../../../schema/telemetry/sessionStartResponse';

import { type SessionStartResponse, type VariantCache } from './types';
import { EXPERIMENT_REGISTRY, VARIANTS_STORAGE_KEY } from './constants';

/**
 * Schema for the variant cache stored in browser.storage.local.
 * Maps ExperimentSlot keys to version_name strings.
 */
const variantCacheSchema = zod.record(
    experimentSlotSchema,
    zod.string(),
);

/**
 * Slot-based A/B test manager for the new split-testing platform.
 *
 * Manages experiment variant assignments via the /api/v1/session_start endpoint.
 * Caches server-assigned variants in local storage and exposes them
 * for injection into all telemetry event props.
 */
export class ABTestManager {
    /**
     * In-memory variant cache. Populated by lazy loading and processResponse().
     */
    private static variantCache: VariantCache | null = null;

    /**
     * Promise that resolves when variantCache is loaded from storage.
     */
    private static variantCachePromise: Promise<VariantCache> | null = null;

    /**
     * Ensures variantCache is loaded from storage.
     * Uses lazy loading, subsequent calls reuse the same promise.
     *
     * @returns Promise that resolves to the variant cache.
     */
    private static async getVariantsCache(): Promise<VariantCache> {
        if (ABTestManager.variantCache !== null) {
            return ABTestManager.variantCache;
        }

        if (ABTestManager.variantCachePromise === null) {
            const cachePromise = ABTestManager.loadFromStorage().then((cache) => {
                ABTestManager.variantCache = cache;
                return cache;
            });
            ABTestManager.variantCachePromise = cachePromise.catch((error: unknown) => {
                ABTestManager.variantCachePromise = null;
                throw error;
            });
        }

        return ABTestManager.variantCachePromise;
    }

    /**
     * Builds the `tests` payload for the session_start request.
     * Only includes slots from the registry that have no cached variant.
     *
     * @returns Partial record of slot → experimentId for unassigned slots.
     */
    public static async getTestsPayload(): Promise<VariantCache> {
        const cache = await ABTestManager.getVariantsCache();
        const tests: VariantCache = {};

        experimentSlotSchema.options.forEach((slot) => {
            if (!(slot in EXPERIMENT_REGISTRY) || cache[slot]) {
                return;
            }

            tests[slot] = EXPERIMENT_REGISTRY[slot];
        });

        return tests;
    }

    /**
     * Processes the session_start response, caching returned version_name values.
     * Only slots present in the registry are accepted; unknown slots are ignored.
     *
     * @param response Parsed response from the session_start endpoint.
     */
    public static async processResponse(response: SessionStartResponse): Promise<void> {
        const cache = await ABTestManager.getVariantsCache();
        let hasChanges = false;

        experimentSlotSchema.options.forEach((slot) => {
            if (!(slot in EXPERIMENT_REGISTRY)) {
                return;
            }

            const assignment = response.versions[slot];

            if (assignment?.version_name) {
                cache[slot] = assignment.version_name;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await ABTestManager.saveToStorage(cache);
        }
    }

    /**
     * Returns the current variant cache for injection into telemetry event props.
     *
     * @returns Variant cache for assigned slots only.
     */
    public static async getVariantsForProps(): Promise<VariantCache> {
        const cache = await ABTestManager.getVariantsCache();
        const result: VariantCache = {};

        experimentSlotSchema.options.forEach((slot) => {
            const versionName = cache[slot];

            if (versionName) {
                result[slot] = versionName;
            }
        });

        return result;
    }

    /**
     * Checks if a specific variant version is currently assigned.
     *
     * @param versionName Full version name to check for (e.g., 'AG-51010-limitations-browser-b').
     *
     * @returns True if the variant is assigned, false otherwise.
     */
    public static async hasVariant(versionName: string): Promise<boolean> {
        const cache = await ABTestManager.getVariantsCache();

        return Object.values(cache).includes(versionName);
    }

    /**
     * Loads the variant cache from browser.storage.local.
     * Returns an empty cache if storage is empty or the value fails validation.
     *
     * @returns Validated variant cache.
     */
    private static async loadFromStorage(): Promise<VariantCache> {
        const raw = await browserStorage.get(VARIANTS_STORAGE_KEY);

        if (!raw) {
            return {};
        }

        try {
            return variantCacheSchema.parse(raw);
        } catch (e) {
            logger.error('[ext.ABTestManager.loadFromStorage]: Failed to parse variant cache from storage', e, 'using empty cache');
            return {};
        }
    }

    /**
     * Removes cached variants for retired experiments from local storage.
     * A variant is retired when its slot is absent from the experiment registry,
     * or when its version name no longer starts with the active experiment ID
     * for that slot, such as after a slot is reused. Remaining variants are
     * persisted, or the storage key is removed when no variants remain.
     *
     * @returns Promise that resolves when retired variants are removed.
     */
    public static async removeRetiredVariants(): Promise<void> {
        const cache = await ABTestManager.getVariantsCache();
        const retiredSlots = experimentSlotSchema.options.filter((slot) => {
            const versionName = cache[slot];

            if (!versionName) {
                return false;
            }

            if (!(slot in EXPERIMENT_REGISTRY)) {
                return true;
            }

            const experimentId = EXPERIMENT_REGISTRY[slot];

            if (!experimentId) {
                return true;
            }

            return !versionName.startsWith(experimentId);
        });

        if (retiredSlots.length === 0) {
            return;
        }

        retiredSlots.forEach((slot) => {
            delete cache[slot];
        });

        if (Object.keys(cache).length === 0) {
            await browserStorage.remove(VARIANTS_STORAGE_KEY);
        } else {
            await ABTestManager.saveToStorage(cache);
        }
    }

    /**
     * Persists the variant cache to browser.storage.local.
     *
     * @param cache Variant cache to persist.
     */
    private static async saveToStorage(cache: VariantCache): Promise<void> {
        await browserStorage.set(VARIANTS_STORAGE_KEY, cache);
    }

    /**
     * Resets the in-memory cache and promise. For testing purposes only.
     */
    public static resetCache(): void {
        ABTestManager.variantCache = null;
        ABTestManager.variantCachePromise = null;
    }
}
