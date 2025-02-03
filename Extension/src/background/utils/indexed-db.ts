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
import { createPromiseWithTimeout } from './timeouts';

/**
 * Helper class for working with IndexedDB.
 */
export class IDBUtils {
    /**
     * Connects to IndexedDB database.
     *
     * @param name Name of the database to connect to.
     * @returns Promise, resolved with IndexedDB API interface provides a connection to a database.
     * @throws Error, if database is not opened after limit.
     */
    public static async connect(name: string): Promise<IDBDatabase> {
        return createPromiseWithTimeout(new Promise((resolve, reject) => {
            const request = indexedDB.open(name);

            request.onerror = (event: Event): void => {
                reject(new Error(`Error opening database: ${(<IDBOpenDBRequest>event.target).error}`));
            };

            request.onsuccess = (event: Event): void => {
                resolve((<IDBOpenDBRequest>event.target).result);
            };
        }));
    }

    /**
     * Gets data from IndexedDB object store.
     *
     * @param db IndexedDB API.
     * @param storeName IndexedDB Object store name.
     * @returns Promise, resolved with data from object store.
     * @throws Error, if request is not resolved after limit.
     */
    public static async getAll(db: IDBDatabase, storeName: string): Promise<unknown> {
        return createPromiseWithTimeout(new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = (event: Event): void => {
                const error = new Error(`Error getting data from object store: ${(<IDBRequest>event.target).error}`);
                reject(error);
            };

            request.onsuccess = (event: Event): void => {
                resolve((<IDBRequest>event.target).result);
            };
        }));
    }
}
