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

import { logger } from '../../../common/logger';

/**
 * Base class for page-level localStorage wrappers.
 *
 * Provides a consistent interface for storing and retrieving page-specific UI settings
 * that don't require extension-level persistence or cross-device synchronization.
 * Uses localStorage for storage, which persists data locally within the browser profile.
 *
 * Child classes must define DEFAULTS object with default values for all storage keys.
 *
 * @example
 * ```ts
 * class MyPageStorage extends LocalPageStorage {
 *     protected DEFAULTS = { mySetting: 'defaultValue' };
 * }
 * ```
 */
export abstract class LocalPageStorage {
    protected abstract DEFAULTS: Record<string, any>;

    /**
     * Storage object
     */
    private storage: Storage;

    constructor() {
        this.storage = localStorage;
    }

    /**
     * Set item to storage.
     *
     * @param key Key to set.
     * @param value Value to set.
     */
    setItem(key: string, value: any): void {
        try {
            this.storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            logger.error('[ext.LocalPageStorage.setItem]: error: ', e);
        }
    }

    /**
     * Get item from storage.
     *
     * @param key Key to get.
     *
     * @returns Value from storage.
     */
    getItem(key: string): any {
        let storedValue = null;
        const item = this.storage.getItem(key);
        if (item !== null) {
            try {
                storedValue = JSON.parse(item);
            } catch (e) {
                logger.error('[ext.LocalPageStorage.getItem]: error: ', e);
            }
        }

        return storedValue === null ? this.DEFAULTS[key] : storedValue;
    }
}
