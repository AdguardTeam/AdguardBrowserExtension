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
import browser from 'webextension-polyfill';
import { StorageInterface } from '../../common/storage';

/**
 * browser.storage.local wrapper with dev-friendly interface
 */
export class Storage implements StorageInterface<string, unknown, 'async'> {
    // extension storage API
    private storage = browser.storage.local;

    /**
     * Sets data to storage
     *
     * @param key - storage key
     * @param value - storage value
     */
    public async set(key: string, value: unknown): Promise<void> {
        await this.storage.set({ [key]: value });
    }

    /**
     * Gets data from storage
     *
     * @param key - storage key
     * @returns storage value
     */
    public async get(key: string): Promise<unknown> {
        return (await this.storage.get(key))?.[key];
    }

    /**
     * Removes data from storage
     *
     * @param key - storage key
     */
    public async remove(key: string): Promise<void> {
        await this.storage.remove(key);
    }
}

export const storage = new Storage();
