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
import { logger } from '../../common/logger';
import {
    SettingOption,
    type Metadata,
    type FilterVersionStorageData,
    type FilterVersionData,
} from '../schema';
import { StringStorage } from '../utils/string-storage';
import { type FilterUpdateOptionsList } from '../api';

import { settingsStorage } from './settings';

/**
 * Class for synchronous control {@link FilterVersionStorageData},
 * that is persisted as string in another key value storage.
 *
 * @see {@link StringStorage}
 */
export class FilterVersionStorage extends StringStorage<
    SettingOption.FiltersVersion,
    FilterVersionStorageData,
    'sync'
> {
    /**
     * Returns specified filter version.
     *
     * @param filterId Filter id.
     *
     * @returns Specified filter state or undefined, if it is not found.
     *
     * @throws Error if filter version data is not initialized.
     */
    public get(filterId: number): FilterVersionData | undefined {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        return this.data[filterId];
    }

    /**
     * Sets specified filter version.
     *
     * @param filterId Filter id.
     * @param data Filter version data.
     *
     * @throws Error if filter version data is not initialized.
     */
    public set(filterId: number, data: FilterVersionData): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        this.data[filterId] = data;

        this.save();
    }

    /**
     * Deletes specified filter version.
     *
     * @param filterId Filter id.
     *
     * @throws Error if filter version data is not initialized.
     */
    public delete(filterId: number): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        delete this.data[filterId];

        this.save();
    }

    /**
     * Update last check time stamp for specified filters with current time.
     *
     * @param filterDetails List of filter details to update check time for.
     *
     * @throws Error if filter version data is not initialized.
     */
    public refreshLastCheckTime(filterDetails: FilterUpdateOptionsList): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        const now = Date.now();

        for (let i = 0; i < filterDetails.length; i += 1) {
            const filterDetail = filterDetails[i];

            if (!filterDetail) {
                continue;
            }

            const { filterId, ignorePatches } = filterDetail;

            const data = this.data[filterId];

            if (!data) {
                logger.warn(`[ext.FilterVersionStorage.refreshLastCheckTime]: failed to refresh last check time for filter ${filterId}.`);
                continue;
            }

            if (ignorePatches) {
                data.lastCheckTime = now;
            } else {
                data.lastScheduledCheckTime = now;
            }
        }

        this.save();
    }

    /**
     * Sets version data for new filters, found in passed {@link Metadata}.
     *
     * @param data Current {@link FilterVersionStorageData}.
     * @param metadata App {@link Metadata}.
     *
     * @returns Updated {@link FilterVersionStorageData}.
     */
    public static applyMetadata(
        data: FilterVersionStorageData,
        metadata: Metadata,
    ): FilterVersionStorageData {
        const { filters } = metadata;

        filters.forEach(({
            filterId,
            version,
            expires,
            timeUpdated,
        }) => {
            if (!data[filterId]) {
                data[filterId] = {
                    version,
                    expires,
                    lastUpdateTime: new Date(timeUpdated).getTime(),
                    lastCheckTime: Date.now(),
                    lastScheduledCheckTime: Date.now(),
                };
            }
        });

        return data;
    }

    /**
     * Helper function to create a basic {@link Error} with a custom message.
     *
     * @returns A basic {@link Error} with a custom message.
     */
    private static createNotInitializedError(): Error {
        return new Error('Filter version data is not initialized');
    }
}

/**
 * {@link FilterVersionStorage} Instance, that stores
 * stringified {@link FilterVersionStorageData} in {@link settingsStorage} under
 * {@link SettingOption.FiltersVersion} key.
 */
export const filterVersionStorage = new FilterVersionStorage(SettingOption.FiltersVersion, settingsStorage);
