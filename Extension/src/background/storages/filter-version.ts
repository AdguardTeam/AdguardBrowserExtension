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
import {
    SettingOption,
    Metadata,
    FilterVersionStorageData,
    FilterVersionData,
} from '../schema';
import { StringStorage } from '../utils/string-storage';
import { settingsStorage } from './settings';

/**
 * Class for synchronous control {@link FilterVersionStorageData},
 * that is persisted as string in another key value storage
 *
 * @see {@link StringStorage}
 */
export class FilterVersionStorage extends StringStorage<
    SettingOption.FiltersVersion,
    FilterVersionStorageData,
    'sync'
> {
    /**
     * Gets specified filter version
     *
     * @param filterId - filter id
     * @returns specified filter state or undefined, if it is not found
     * @throws error if filter version data is not initialized
     */
    public get(filterId: number): FilterVersionData | undefined {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        return this.data[filterId];
    }

    /**
     * Sets specified filter version
     *
     * @param filterId - filter id
     * @param data - filter version data
     * @throws error if filter version data is not initialized
     */
    public set(filterId: number, data: FilterVersionData): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        this.data[filterId] = data;

        this.save();
    }

    /**
     * Deletes specified filter version
     *
     * @param filterId - filter id
     * @throws error if filter version data is not initialized
     */
    public delete(filterId: number): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        delete this.data[filterId];

        this.save();
    }

    /**
     * Update last check time stamp for specified filters with current time
     *
     * @param filtersIds - list of filters ids
     * @throws error if filter version data is not initialized
     */
    public refreshLastCheckTime(filtersIds: number[]): void {
        if (!this.data) {
            throw FilterVersionStorage.createNotInitializedError();
        }

        const now = Date.now();

        for (let i = 0; i < filtersIds.length; i += 1) {
            const filterId = filtersIds[i];

            if (!filterId) {
                continue;
            }

            const data = this.data[filterId];

            if (data) {
                data.lastCheckTime = now;
            }
        }

        this.save();
    }

    /**
     * Sets version data for new filters, found in passed {@link Metadata}
     *
     * @param data - current {@link FilterVersionStorageData}
     * @param metadata - app {@link Metadata}
     * @returns - updated {@link FilterVersionStorageData}
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
                };
            }
        });

        return data;
    }

    private static createNotInitializedError(): Error {
        return new Error('Filter version data is not initialized');
    }
}

/**
 * {@link FilterVersionStorage} instance, that stores
 * stringified {@link FilterVersionStorageData} in {@link settingsStorage} under
 * {@link SettingOption.FiltersVersion} key
 */
export const filterVersionStorage = new FilterVersionStorage(SettingOption.FiltersVersion, settingsStorage);
