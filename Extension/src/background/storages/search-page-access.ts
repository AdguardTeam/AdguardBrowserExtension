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

import { SEARCH_PAGE_ACCESS_KEY } from '../../common/constants';
import { logger } from '../../common/logger';
import { getZodErrorMessage } from '../../common/error';
import { searchPageAccessStorageDataValidator, type SearchPageAccessStorageData } from '../schema';
import { StringStorage } from '../utils/string-storage';

import { browserStorage } from './shared-instances';

export type { SearchPageAccessStorageData as SearchPageAccessState };

/**
 * Storage for search page access state with typed accessor methods.
 */
class SearchPageAccessStorage extends StringStorage<
    typeof SEARCH_PAGE_ACCESS_KEY,
    SearchPageAccessStorageData,
    'async'
> {
    /**
     * Creates a new SearchPageAccessStorage instance.
     */
    constructor() {
        super(SEARCH_PAGE_ACCESS_KEY, browserStorage);
    }

    /**
     * Returns cached state or loads from storage on first access.
     *
     * @returns Cached state or loaded from storage.
     */
    public async getState(): Promise<SearchPageAccessStorageData> {
        if (this.data !== undefined) {
            return this.data;
        }

        try {
            const stored = await this.read();
            if (typeof stored === 'string') {
                const parsed = searchPageAccessStorageDataValidator.parse(JSON.parse(stored));
                this.setCache(parsed);

                return parsed;
            }
        } catch (e) {
            logger.warn(`[ext.SearchPageAccessStorage.getState]: cannot parse state, using defaults: ${getZodErrorMessage(e)}`);
        }

        const defaults = searchPageAccessStorageDataValidator.parse(undefined);
        this.setCache(defaults);

        return defaults;
    }

    /**
     * Returns whether the search page access permission is granted.
     *
     * @returns True if permission is granted.
     */
    public async isPermissionGranted(): Promise<boolean> {
        return (await this.getState()).isPermissionGranted;
    }

    /**
     * Sets the permission granted status.
     *
     * @param value Whether permission is granted.
     */
    public async setIsPermissionGranted(value: boolean): Promise<void> {
        const state = await this.getState();
        await this.setData({
            ...state,
            isPermissionGranted: value,
        });
    }

    /**
     * Returns whether the notification should be shown to the user.
     *
     * @returns True if notification should be shown.
     */
    public async shouldShowNotification(): Promise<boolean> {
        return (await this.getState()).shouldShowNotification;
    }

    /**
     * Permanently disables the notification for the user.
     */
    public async dismissNotification(): Promise<void> {
        const state = await this.getState();
        await this.setData({
            ...state,
            shouldShowNotification: false,
        });
    }
}

export const searchPageAccessStorage = new SearchPageAccessStorage();
