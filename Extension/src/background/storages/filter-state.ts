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
import { AntiBannerFiltersId } from '../../common/constants';
import { StringStorage } from '../utils/string-storage';
import { settingsStorage } from './settings';
import {
    SettingOption,
    Metadata,
    FilterStateData,
    FilterStateStorageData,
} from '../schema';

/**
 * Class for synchronous control {@link FilterStateStorageData},
 * that is persisted as string in another key value storage
 *
 * @see {@link StringStorage}
 */
export class FilterStateStorage extends StringStorage<
    SettingOption.FiltersState,
    FilterStateStorageData,
    'sync'
> {
    // This filters have own complex state management
    private static unsupportedFiltersIds = [
        AntiBannerFiltersId.AllowlistFilterId,
        AntiBannerFiltersId.UserFilterId,
    ];

    // default filter state
    private static defaultState = {
        enabled: false,
        installed: false,
        loaded: false,
    };

    /**
     * Gets specified filter state
     *
     * @param filterId - filter id
     * @returns specified filter state
     * @throws error if filter state data is not initialized
     */
    public get(filterId: number): FilterStateData | undefined {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        return this.data[filterId];
    }

    /**
     * Sets specified filter state
     *
     * @param filterId - filter id
     * @param state - filter state
     * @throws error if filter state data is not initialized
     */
    public set(filterId: number, state: FilterStateData): void {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        this.data[filterId] = state;

        this.save();
    }

    /**
     * Deletes specified filter state
     *
     * @param filterId - filter id
     * @throws error if filter state data is not initialized
     */
    public delete(filterId: number): void {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        delete this.data[filterId];

        this.save();
    }

    /**
     * Gets list of enabled filters ids
     *
     * @returns list of enabled filters ids
     * @throws error if filter state data is not initialized
     */
    public getEnabledFilters(): number[] {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        return Object
            .entries(this.data)
            .filter(([,state]) => state.enabled)
            .map(([id]) => Number(id));
    }

    /**
     * Gets list of installed filters ids
     *
     * @returns list of installed filters ids
     * @throws error if filter state data is not initialized
     */
    public getInstalledFilters(): number[] {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        return Object
            .entries(this.data)
            .filter(([,state]) => state.installed)
            .map(([id]) => Number(id));
    }

    /**
     * Enables specified filters
     *
     * @param filtersIds - list of filters to enable
     * @throws error if filter state data is not initialized
     */
    public enableFilters(filtersIds: number[]): void {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }

        for (let i = 0; i < filtersIds.length; i += 1) {
            const filterId = filtersIds[i];

            if (!filterId) {
                continue;
            }

            const data = this.data[filterId];

            if (data) {
                data.enabled = true;
            }
        }

        this.save();
    }

    /**
     * Disables specified filters
     *
     * @param filtersIds - list of filters to disable
     * @throws error if filter state data is not initialized
     */
    public disableFilters(filtersIds: number[]): void {
        if (!this.data) {
            throw FilterStateStorage.createNotInitializedError();
        }
        for (let i = 0; i < filtersIds.length; i += 1) {
            const filterId = filtersIds[i];

            if (!filterId) {
                continue;
            }

            const data = this.data[filterId];

            if (data) {
                data.enabled = false;
            }
        }

        this.save();
    }

    /**
     * Sets {@link defaultState} for new filters, found in passed {@link Metadata}
     *
     * @param states - current {@link FilterStateStorageData}
     * @param metadata - app {@link Metadata}
     * @returns - updated {@link FilterStateStorageData}
     */
    public static applyMetadata(
        states: FilterStateStorageData,
        metadata: Metadata,
    ): FilterStateStorageData {
        const { filters } = metadata;
        /**
         * Don't create filter state context for allowlist and user rules lists
         * Their state is controlled by separate modules
         */
        const supportedFiltersMetadata = filters.filter(({ filterId }) => {
            return !FilterStateStorage.unsupportedFiltersIds.includes(filterId);
        });

        supportedFiltersMetadata.forEach(({ filterId }) => {
            if (!states[filterId]) {
                states[filterId] = { ...FilterStateStorage.defaultState };
            }
        });

        return states;
    }

    private static createNotInitializedError(): Error {
        return new Error('Filter state data is not initialized');
    }
}

/**
 * {@link FilterStateStorage} instance, that stores
 * stringified {@link FilterStateStorageData} in {@link settingsStorage} under
 * {@link SettingOption.FiltersState} key
 */
export const filterStateStorage = new FilterStateStorage(SettingOption.FiltersState, settingsStorage);
