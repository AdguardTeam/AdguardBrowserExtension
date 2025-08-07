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
// TODO (AG-44868): Reduce code duplication across mv2 and mv3
import { browserStorage, metadataStorage } from '../../storages';
import { logger } from '../../../common/logger';

/**
 * Service for scheduling filters update checks.
 *
 * After initialization scheduler checks filter updates
 * {@link CHECK_PERIOD_MS every 5 minutes}.
 */
export class FilterUpdateService {
    /**
     * Storage key for storing last filters update time in the storage.
     *
     * Needed to send `filters_last_update` during issue reporting.
     */
    private static LAST_UPDATE_KEY = 'filters-last-update';

    /**
     * Initially starts checking filters update.
     */
    // eslint-disable-next-line class-methods-use-this
    public async init(): Promise<void> {
        const dnrRulesetsBuildTimestampMs = metadataStorage.getDnrRulesetsBuildTimestampMs();
        if (dnrRulesetsBuildTimestampMs === undefined) {
            logger.warn('[ext.FilterUpdateService.init]: DNR rulesets build timestamp is not available.');
            return;
        }
        // We set last update time in MV3 during issue reporting.
        await FilterUpdateService.setLastUpdateTimeMs(dnrRulesetsBuildTimestampMs);
    }

    /**
     * Sets the last filters **update** (not just *check*) time in the storage
     * for version which supports diff updates, i.e. MV2.
     * For MV3 this method is used only to record the last update time during
     * issue reporting.
     *
     * @param timestampMs The timestamp in milliseconds.
     */
    public static async setLastUpdateTimeMs(timestampMs: number): Promise<void> {
        await browserStorage.set(FilterUpdateService.LAST_UPDATE_KEY, timestampMs);
    }

    /**
     * Gets the last filters **update** (not just *check*) time from the storage
     * for version which supports diff updates, i.e. MV2.
     *
     * @returns The timestamp in milliseconds or `null` if the value is not set.
     */
    public static async getLastUpdateTimeMs(): Promise<number | null> {
        const lastUpdateTimeMs = await browserStorage.get(FilterUpdateService.LAST_UPDATE_KEY);

        if (lastUpdateTimeMs === undefined) {
            return null;
        }

        return Number(lastUpdateTimeMs);
    }
}

export const filterUpdateService = new FilterUpdateService();
