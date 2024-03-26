/**
 * @file IndexedDB storage implementation.
 */

import * as idb from 'idb';

import { StorageInterface } from '../../common/storage';

const DEFAULT_STORE_NAME = 'defaultStore';
const DEFAULT_IDB_NAME = 'adguardIDB';

/**
 * Provides a storage mechanism using IndexedDB. This class implements the
 * StorageInterface with asynchronous methods to interact with the database.
 */
export class IDBStorage implements StorageInterface<string, unknown, 'async'> {
    /**
     * Holds the instance of the IndexedDB database.
     *
     * @private
     */
    private db: idb.IDBPDatabase | null = null;

    /**
     * The name of the database.
     *
     * @private
     */
    private name: string;

    /**
     * The version of the database. Used for upgrades.
     *
     * @private
     */
    private version: number;

    /**
     * The name of the store within the database.
     *
     * @private
     */
    private store: string;

    /**
     * Constructs an instance of the IDBStorage class.
     *
     * @param name The name of the database.
     * @param [version=1] The version of the database.
     * @param [store=DEFAULT_STORE_NAME] The name of the store.
     */
    constructor(name = DEFAULT_IDB_NAME, version = 1, store = DEFAULT_STORE_NAME) {
        this.name = name;
        this.version = version;
        this.store = store;
    }

    /**
     * Ensures the database is opened before any operations. If the database
     * is not already opened, it opens the database.
     *
     * @private
     * @returns The opened database instance.
     */
    private async getOpenedDb(): Promise<idb.IDBPDatabase> {
        if (!this.db) {
            this.db = await idb.openDB(this.name, this.version);
        }
        return this.db;
    }

    /**
     * Retrieves a value by key from the store.
     *
     * @param key The key of the value to retrieve.
     * @returns The value associated with the key.
     */
    public async get(key: string): Promise<unknown> {
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
}
