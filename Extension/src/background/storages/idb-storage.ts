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

import { type IDBPDatabase, openDB } from 'idb';

import { logger } from '../../common/logger';

import { type ExtendedStorageInterface } from './storage-interface';

/**
 * Provides a storage mechanism using IndexedDB. This class implements the
 * StorageInterface with asynchronous methods to interact with the database.
 *
 * @template Data The type of the value stored in the storage.
 */
export class IDBStorage<Data = unknown> implements ExtendedStorageInterface<string, Data, 'async'> {
    /**
     * The default name of the store within the database.
     */
    public static readonly DEFAULT_STORE_NAME = 'defaultStore';

    /**
     * The default version of the database.
     */
    public static readonly DEFAULT_IDB_VERSION = 1;

    /**
     * The default name of the database.
     */
    public static readonly DEFAULT_IDB_NAME = 'adguardIDB';

    /**
     * Holds the instance of the IndexedDB database.
     */
    private db: IDBPDatabase | null = null;

    /**
     * Promise to get IndexedDB database.
     */
    private dbGetterPromise: Promise<IDBPDatabase> | null = null;

    /**
     * The name of the database.
     */
    private name: string;

    /**
     * The version of the database. Used for upgrades.
     */
    private version: number;

    /**
     * The name of the store within the database.
     */
    private store: string;

    /**
     * Constructs an instance of the IDBStorage class.
     *
     * @param [name=IDBStorage.DEFAULT_IDB_NAME] The name of the database.
     * @param [version=1] The version of the database.
     * @param [store=IDBStorage.DEFAULT_STORE_NAME] The name of the store within the database.
     */
    constructor(
        name = IDBStorage.DEFAULT_IDB_NAME,
        version = IDBStorage.DEFAULT_IDB_VERSION,
        store = IDBStorage.DEFAULT_STORE_NAME,
    ) {
        this.name = name;
        this.version = version;
        this.store = store;
    }

    /**
     * Ensures the database is opened before any operations. If the database
     * is not already opened, it opens the database.
     *
     * @returns The opened database instance.
     */
    private async getOpenedDb(): Promise<IDBPDatabase> {
        if (this.db) {
            return this.db;
        }

        if (this.dbGetterPromise) {
            return this.dbGetterPromise;
        }

        this.dbGetterPromise = (async (): Promise<IDBPDatabase> => {
            this.db = await openDB(this.name, this.version, {
                upgrade: (db) => {
                    // Make sure the store exists
                    if (!db.objectStoreNames.contains(this.store)) {
                        db.createObjectStore(this.store);
                    }
                },
            });

            this.dbGetterPromise = null;

            return this.db;
        })();

        return this.dbGetterPromise;
    }

    /**
     * Retrieves a value by key from the store.
     *
     * @param key The key of the value to retrieve.
     *
     * @returns The value associated with the key.
     */
    public async get(key: string): Promise<Data | undefined> {
        const db = await this.getOpenedDb();
        return db.get(this.store, key);
    }

    /**
     * Sets a value in the store with the specified key.
     *
     * @param key The key under which to store the value.
     * @param value The value to store.
     */
    public async set(key: string, value: unknown): Promise<void> {
        const db = await this.getOpenedDb();
        await db.put(this.store, value, key);
    }

    /**
     * Removes a value from the store by key.
     *
     * @param key The key of the value to remove.
     */
    public async remove(key: string): Promise<void> {
        const db = await this.getOpenedDb();
        await db.delete(this.store, key);
    }

    /**
     * Atomic set operation for multiple key-value pairs.
     * This method is using transaction to ensure atomicity, if any of the operations fail,
     * the entire operation is rolled back. This helps to prevent data corruption / inconsistency.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new IDBStorage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */
    public async setMultiple(data: Record<string, Data>): Promise<boolean> {
        const db = await this.getOpenedDb();
        const tx = db.transaction(this.store, 'readwrite');

        try {
            await Promise.all(Object.entries(data).map(([key, value]) => tx.store.put(value, key)));
            await tx.done;
        } catch (e) {
            logger.error('[ext.IDBStorage.setMultiple]: error while setting multiple keys in the storage:', e);
            tx.abort();
            return false;
        }

        return true;
    }

    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */
    public async removeMultiple(keys: string[]): Promise<boolean> {
        const db = await this.getOpenedDb();
        const tx = db.transaction(this.store, 'readwrite');

        try {
            await Promise.all(keys.map((key) => tx.store.delete(key)));
            await tx.done;
        } catch (e) {
            logger.error('[ext.IDBStorage.removeMultiple]: error while removing multiple keys from the storage:', e);
            tx.abort();
            return false;
        }

        return true;
    }

    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */
    public async entries(): Promise<Record<string, Data>> {
        const db = await this.getOpenedDb();
        const entries: Record<string, Data> = {};
        const tx = db.transaction(this.store, 'readonly');

        // eslint-disable-next-line no-restricted-syntax
        for await (const cursor of tx.store) {
            const key = String(cursor.key);
            entries[key] = cursor.value;
        }

        return entries;
    }

    /**
     * Get all keys in the storage.
     *
     * @returns Promise that resolves with all keys in the storage.
     */
    public async keys(): Promise<string[]> {
        const db = await this.getOpenedDb();
        const idbKeys = await db.getAllKeys(this.store);
        return idbKeys.map((key) => key.toString());
    }

    /**
     * Check if a key exists in the storage.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */
    public async has(key: string): Promise<boolean> {
        const db = await this.getOpenedDb();
        const idbKey = await db.getKey(this.store, key);
        return idbKey !== undefined;
    }

    /**
     * Clears the storage.
     */
    public async clear(): Promise<void> {
        const db = await this.getOpenedDb();
        await db.clear(this.store);
    }
}
