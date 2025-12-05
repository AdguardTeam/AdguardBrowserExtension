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
import browser from 'webextension-polyfill';

import { type ExtendedStorageInterface } from '../../../../common/storage';

/**
 * Wrapper for browser.storage.local with dev-friendly interface.
 */
export class BrowserStorage implements ExtendedStorageInterface<string, unknown, 'async'> {
    // extension storage API
    private storage = browser.storage.local;

    /**
     * Sets data to storage.
     *
     * @param key Storage key.
     * @param value Storage value.
     */
    public async set(key: string, value: unknown): Promise<void> {
        await this.storage.set({ [key]: value });
    }

    /**
     * Returns data from storage.
     *
     * @param key Storage key.
     *
     * @returns Storage value.
     */
    public async get(key: string): Promise<unknown> {
        return (await this.storage.get(key))?.[key];
    }

    /**
     * Removes data from storage.
     *
     * @param key Storage key.
     */
    public async remove(key: string): Promise<void> {
        await this.storage.remove(key);
    }

    /**
     * Sets multiple key-value pairs in the storage.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new Storage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */
    // TODO: Implement some kind of transaction to ensure atomicity, if possible
    // Note: We only use this method for Firefox if "Never Remember History" is enabled
    public async setMultiple(data: Record<string, unknown>): Promise<boolean> {
        try {
            await this.storage.set(data);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */
    public async removeMultiple(keys: string[]): Promise<boolean> {
        await this.storage.remove(keys);
        return true;
    }

    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */
    public async entries(): Promise<Record<string, unknown>> {
        return this.storage.get(null);
    }

    /**
     * Get all keys from the storage.
     *
     * @returns Promise that resolves with all keys from the storage.
     */
    public async keys(): Promise<string[]> {
        return Object.keys(await this.entries());
    }

    /**
     * Checks if the storage has a key.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */
    public async has(key: string): Promise<boolean> {
        return this.storage.get(key).then((data) => key in data);
    }
}
