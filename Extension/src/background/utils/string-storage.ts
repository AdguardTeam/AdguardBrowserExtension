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
import { StorageInterface } from '../../common/storage';

/**
 * Class for managing data that is persisted as string in another key value storage
 */
export class StringStorage<K, V, Mode extends 'sync' | 'async'> {
    // parent storage key
    public key: K;

    // parent storage
    protected storage: StorageInterface<K, unknown, Mode>;

    // cached parsed data
    protected data: V | undefined;

    constructor(
        key: K,
        storage: StorageInterface<K, unknown, Mode>,
    ) {
        this.key = key;
        this.storage = storage;
    }

    /**
     * Gets cached data
     *
     * @returns cached data
     * @throws error, if cache is not initialized
     */
    public getData(): V {
        if (!this.data) {
            throw new Error('Data is not set!');
        }
        return this.data;
    }

    /**
     * Sets parsed data to cache
     *
     * @param data - parsed storage data
     */
    public setCache(data: V): void {
        this.data = data;
    }

    /**
     * Sets {@link data} to cache and saves it's stringified version in {@link storage}
     *
     * @param data - parsed data
     *
     * @returns promise, resolved when stringified {@link data} is saved in {@link storage} and {@link Mode} is async
     */
    public setData(data: V): Mode extends 'async' ? Promise<void> : void {
        this.setCache(data);
        return this.save();
    }

    /**
     * Saves stringified {@link data} in {@link storage}
     *
     * @returns promise, resolved when stringified {@link data} is saved in {@link storage} and {@link Mode} is async
     */
    public save(): Mode extends 'async' ? Promise<void> : void {
        return this.storage.set(this.key, JSON.stringify(this.data));
    }

    /**
     * Reads raw data from {@link storage}
     *
     * Note: this method returns 'unknown', because in fact we don't know, what data stored in {@link storage}.
     * You should validate it after reading by this method.
     * In case of {@link StringStorage} we expect string.
     *
     * @returns promise, resolved with raw data from {@link storage}, if {@link Mode} is async,
     * else returns raw data.
     */
    public read(): Mode extends 'async' ? Promise<unknown> : unknown {
        return this.storage.get(this.key);
    }
}
