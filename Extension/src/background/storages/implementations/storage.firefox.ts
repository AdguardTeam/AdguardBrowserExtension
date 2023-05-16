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
import { Log } from '../../../common/log';
import { getErrorMessage } from '../../../common/error';
import { StorageInterface } from '../../../common/storage';

import { storage as browserLocalStorage } from './storage.chrome';

/**
 * Wrapper for the IndexedDB with dev-friendly interface.
 * In all implemented methods from the StorageInterface interface, this
 * implementation will wait for the IndexedDB instance to be initialized and
 * then perform the intended action: read, delete or update.
 *
 * We have to use indexedDB instead of browser.storage.local due to some
 * problems with the latest one.
 * Browser.storage.local has high memory and disk utilization.
 *
 * Https://bugzilla.mozilla.org/show_bug.cgi?id=1371255
 * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/892.
 */
export class IndexedDBStorage implements StorageInterface<string, unknown, 'async'> {
    /**
     * IndexedDB key.
     */
    private static readonly STORAGE_NAME = 'AdguardRulesStorage';

    /**
     * Instance of the Indexed DB.
     */
    private database: IDBDatabase | undefined;

    /**
     * Is IndexedDB initialized or not.
     */
    private initialized = false;

    /**
     * If the initialization of IndexedDB fails, we fallbacks to browser.storage.local.
     */
    private fallback = false;

    /**
     * A promise with IndexedDB initialization.
     */
    private promiseInitialize: Promise<void> | undefined;

    /**
     * Callback for logging an error.
     *
     * @param error Some error object with a message or something else.
     */
    static onError(error: unknown): void {
        Log.error('AdGuard rulesStorage error: ', getErrorMessage(error));
    }

    /**
     * Gets value from the database by key.
     *
     * @param key Database key.
     *
     * @returns Database value.
     */
    private getFromDatabase(key: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (!this.database) {
                reject(new Error('Database not exists'));
                return;
            }

            const transaction = this.database.transaction(IndexedDBStorage.STORAGE_NAME);
            const table = transaction.objectStore(IndexedDBStorage.STORAGE_NAME);

            const request = table.get(key);

            const eventHandler = (): void => {
                if (request.error) {
                    reject(request.error);
                    return;
                }
                let lines = [];
                const { result } = request;
                if (result && result.value) {
                    lines = result.value.split(/\r?\n/);
                }
                resolve(lines);
            };

            request.onsuccess = eventHandler;
            request.onerror = eventHandler;
        });
    }

    /**
     * Puts key and value to the database.
     *
     * @param key Database key.
     * @param value Value to insert to the database.
     */
    private putToDatabase(key: string, value: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.database) {
                reject(new Error('Database not exists'));
                return;
            }

            const transaction = this.database.transaction(IndexedDBStorage.STORAGE_NAME, 'readwrite');
            const table = transaction.objectStore(IndexedDBStorage.STORAGE_NAME);

            const request = table.put({
                key,
                value: value.join('\n'),
            });

            const eventHandler = (): void => {
                if (request.error) {
                    reject(request.error);
                } else {
                    resolve();
                }
            };

            request.onsuccess = eventHandler;
            request.onerror = eventHandler;
        });
    }

    /**
     * Deletes value from the database.
     *
     * @param key Database key.
     */
    private deleteFromDatabase(key: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.database) {
                reject(new Error('Database not exists'));
                return;
            }

            const transaction = this.database.transaction(IndexedDBStorage.STORAGE_NAME, 'readwrite');
            const table = transaction.objectStore(IndexedDBStorage.STORAGE_NAME);

            const request = table.delete(key);

            const eventHandler = (): void => {
                if (request.error) {
                    reject(request.error);
                } else {
                    resolve();
                }
            };

            request.onsuccess = eventHandler;
            request.onerror = eventHandler;
        });
    }

    /**
     * Sets data to storage.
     *
     * @param key Storage key.
     * @param value Storage value.
     */
    public async set(key: string, value: string[]): Promise<void> {
        await this.checkAndWaitForInit();

        return this.fallback
            ? browserLocalStorage.set(key, value)
            : this.putToDatabase(key, value);
    }

    /**
     * Returns data from storage.
     *
     * @param key Storage key.
     * @returns Storage value.
     */
    public async get(key: string): Promise<unknown> {
        await this.checkAndWaitForInit();

        return this.fallback
            ? browserLocalStorage.get(key)
            : this.getFromDatabase(key);
    }

    /**
     * Removes data from storage.
     *
     * @param key Storage key.
     */
    public async remove(key: string): Promise<void> {
        await this.checkAndWaitForInit();

        return this.fallback
            ? browserLocalStorage.remove(key)
            : this.deleteFromDatabase(key);
    }

    /**
     * Checks if indexedDB is not initialized then waits until initialization is complete.
     */
    private async checkAndWaitForInit(): Promise<void> {
        if (!this.initialized) {
            if (!this.promiseInitialize) {
                this.promiseInitialize = this.init();
            }

            await this.promiseInitialize;
            this.initialized = true;
        }
    }

    /**
     * Initializes an IndexDB instance with promisification.
     */
    private async init(): Promise<void> {
        return new Promise((resolve) => {
            // TODO: Find out what the bottom comment is about.
            // Failed in private browsing mode.
            const request = indexedDB.open(IndexedDBStorage.STORAGE_NAME, 1);

            // Called when version of database was changed: from no database
            // to first version, first version to second version and etc.
            request.onupgradeneeded = (): void => {
                this.database = request.result;
                this.database.onerror = IndexedDBStorage.onError;
                this.database.onabort = IndexedDBStorage.onError;
                // DB doesn't exist => creates new storage
                const table = this.database.createObjectStore(IndexedDBStorage.STORAGE_NAME, { keyPath: 'key' });
                table.createIndex('value', 'value', { unique: false });
            };

            // Called by default on every request: even if the database
            // schemas has not been changed
            request.onsuccess = (): void => {
                this.database = request.result;
                this.database.onerror = IndexedDBStorage.onError;
                this.database.onabort = IndexedDBStorage.onError;

                resolve();
            };

            const onRequestError = (): void => {
                // Logs error
                IndexedDBStorage.onError(request.error);

                // Fallback to the browser.storage.local API
                this.fallback = true;

                resolve();
            };

            request.onerror = onRequestError;
            request.onblocked = onRequestError;
        });
    }
}
export const storage = new IndexedDBStorage();
