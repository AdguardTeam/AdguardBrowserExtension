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
import { isNumber } from '../../../common/guards';
import { logger } from '../../../common/logger';
import { isUserScriptsApiSupported } from '../../../common/user-scripts-api';
import { FilterUpdateApi } from '../../api/filters/update';

/**
 * Service for scheduling filters update checks.
 *
 * After initialization scheduler checks filter updates
 * {@link CHECK_PERIOD_MS every 5 minutes}.
 */
export class FilterUpdateService {
    /**
     * Storage key for storing last update *check* time in the storage.
     */
    private static UPDATE_CHECK_TIME_KEY = 'updateCheckTimeMs';

    /**
     * Storage key for storing last filters update time in the storage.
     *
     * Needed to send `filters_last_update` during issue reporting.
     */
    private static LAST_UPDATE_KEY = 'filters-last-update';

    /**
     * Checking period
     * That timer should check every specified period of time if it is time to update filters.
     */
    private static readonly CHECK_PERIOD_MS = 1000 * 60 * 5; // 5 min

    /**
     * Filter update period.
     * This means that filters should be updated if it was updated more than the specified value.
     * We set 1 hour because currently we generate patches for our filter once an hour and
     * for third-party filters once every 4 hours.
     */
    private static readonly FILTER_UPDATE_PERIOD_MS = 1000 * 60 * 60; // 1 hour

    /**
     * Stores scheduler timer id for checking update in every
     * {@link CHECK_PERIOD_MS} time.
     */
    private schedulerTimerId: number | undefined;

    /**
     * Creates new {@link FilterUpdateService}.
     */
    constructor() {
        this.update = this.update.bind(this);
    }

    /**
     * Initially starts checking filters update.
     */
    public async init(): Promise<void> {
        await this.update();

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

    /**
     * Checks every {@link CHECK_PERIOD_MS} period whether the enabled filters
     * should be updated with setTimeout which saved to {@link schedulerTimerId}.
     */
    private async update(): Promise<void> {
        // eslint-disable-next-line no-restricted-globals
        self.clearTimeout(this.schedulerTimerId);

        const prevCheckTimeMs = await browserStorage.get(FilterUpdateService.UPDATE_CHECK_TIME_KEY);

        /**
         * Check updates if prevCheckTimeMs is not set or
         * if it is set and last check was more than {@link CHECK_PERIOD_MS} ago.
         */
        const shouldCheckUpdates = !prevCheckTimeMs
            || (isNumber(prevCheckTimeMs)
                && Date.now() - prevCheckTimeMs > FilterUpdateService.FILTER_UPDATE_PERIOD_MS);

        if (shouldCheckUpdates) {
            try {
                // In MV3, filters update is only allowed if userscripts API is granted
                if (!isUserScriptsApiSupported()) {
                    throw new Error('Userscripts API is not granted');
                }
                await FilterUpdateApi.autoUpdateFilters();
            } catch (e) {
                logger.error('[ext.FilterUpdateService.update]: an error occurred during filters update:', e);
            }
            // Saving current time to storage is required in the cases
            // when background page is often unloaded,
            // for example, in the cases of service workers.
            await browserStorage.set(FilterUpdateService.UPDATE_CHECK_TIME_KEY, Date.now());
        }

        // eslint-disable-next-line no-restricted-globals
        this.schedulerTimerId = self.setTimeout(async () => {
            await this.update();
        }, FilterUpdateService.CHECK_PERIOD_MS);
    }
}

export const filterUpdateService = new FilterUpdateService();
