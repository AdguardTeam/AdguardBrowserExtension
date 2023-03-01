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
import { StorageInterface } from '../../../common/storage';

/**
 * This is a fake storage stub that will be replaced during webpack compilation
 * by the corresponding browser implementation 'implementation/storage.chrome'
 * or 'implementations/storage.firefox'.
 */
class BrowserDependentStorage implements StorageInterface<string, unknown, 'async'> {
    /**
     * Sets data to storage.
     *
     * @param key Storage key.
     * @param value Storage value.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
    public async set(key: string, value: unknown): Promise<void> {
        throw new Error('Not implemented');
    }

    /**
     * Returns data from storage.
     *
     * @param key Storage key.
     *
     * @returns Storage value.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
    public async get(key: string): Promise<unknown> {
        throw new Error('Not implemented');
    }

    /**
     * Removes data from storage.
     *
     * @param key Storage key.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
    public async remove(key: string): Promise<void> {
        throw new Error('Not implemented');
    }
}

export const storage = new BrowserDependentStorage();
