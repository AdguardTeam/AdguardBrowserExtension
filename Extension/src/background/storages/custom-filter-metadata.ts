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
import { StringStorage } from '../utils/string-storage';
import { settingsStorage } from './settings';
import {
    SettingOption,
    CustomFilterMetadata,
    CustomFilterMetadataStorageData,
} from '../schema';

/**
 * Class for synchronous control {@link CustomFilterMetadataStorageData},
 * that is persisted as string in another key value storage
 *
 * @see {@link StringStorage}
 */
export class CustomFilterMetadataStorage extends StringStorage<
    SettingOption.CustomFilters,
    CustomFilterMetadataStorageData,
    'sync'
> {
    /**
     * Get custom filter metadata by filter id
     *
     * @param filterId - filter id
     * @returns custom filter metadata
     */
    public getById(filterId: number): CustomFilterMetadata | undefined {
        return this.getData().find(f => f.filterId === filterId);
    }

    /**
     * Get custom filter metadata by filter subscription url
     *
     * @param url - subscription url
     * @returns custom filter metadata or undefined, if metadata is not found
     */
    public getByUrl(url: string): CustomFilterMetadata | undefined {
        return this.getData().find(f => f.customUrl === url);
    }

    /**
     * Set custom filter metadata with filterId key
     *
     * @param filter - custom filter metadata
     */
    public set(filter: CustomFilterMetadata): void {
        const data = this.getData().filter(f => f.filterId !== filter.filterId);

        data.push(filter);

        this.setData(data);
    }

    /**
     * Remove custom filter metadata
     *
     * @param filterId - filter id
     */
    public remove(filterId: number): void {
        const data = this.getData().filter(f => f.filterId !== filterId);
        this.setData(data);
    }
}

export const customFilterMetadataStorage = new CustomFilterMetadataStorage(
    SettingOption.CustomFilters,
    settingsStorage,
);
