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
import { browserStorage } from '../../storages';

/**
 * Service for scheduling filters update checks.
 *
 * After initialization scheduler checks filter updates
 * {@link CHECK_PERIOD_MS every 5 minutes}.
 */
export abstract class FilterUpdateServiceCommon {
    /**
     * Storage key for storing last filters update time in the storage.
     *
     * Needed to send `filters_last_update` during issue reporting.
     */
    private static LAST_UPDATE_KEY = 'filters-last-update';

    /**
     * Storage key for storing the last filters check time in the storage.
     *
     * Used in MV3 to display "Last checked" date on the Filters tab.
     */
    private static LAST_CHECK_KEY = 'filters-last-check';

    /**
     * Sets the last filters **update** (not just *check*) time in the storage
     * for version which supports diff updates, i.e. MV2.
     * For MV3 this method is used only to record the last update time during
     * issue reporting.
     *
     * @param timestampMs The timestamp in milliseconds.
     */
    public static async setLastUpdateTimeMs(timestampMs: number): Promise<void> {
        await browserStorage.set(FilterUpdateServiceCommon.LAST_UPDATE_KEY, timestampMs);
    }

    /**
     * Gets the last filters **update** (not just *check*) time from the storage
     * for version which supports diff updates, i.e. MV2.
     *
     * @returns The timestamp in milliseconds or `null` if the value is not set.
     */
    public static async getLastUpdateTimeMs(): Promise<number | null> {
        const lastUpdateTimeMs = await browserStorage.get(FilterUpdateServiceCommon.LAST_UPDATE_KEY);

        if (lastUpdateTimeMs === undefined) {
            return null;
        }

        return Number(lastUpdateTimeMs);
    }

    /**
     * Sets the last filters **check** time in the storage.
     *
     * Used in MV3 to persist "Last checked" date across page reloads.
     *
     * @param timestampMs The timestamp in milliseconds.
     */
    public static async setLastCheckTimeMs(timestampMs: number): Promise<void> {
        await browserStorage.set(FilterUpdateServiceCommon.LAST_CHECK_KEY, timestampMs);
    }

    /**
     * Gets the last filters **check** time from the storage.
     *
     * @returns The timestamp in milliseconds.
     */
    public static async getLastCheckTimeMs(): Promise<number> {
        const lastCheckTimeMs = await browserStorage.get(FilterUpdateServiceCommon.LAST_CHECK_KEY);

        return Number(lastCheckTimeMs || 0);
    }
}
