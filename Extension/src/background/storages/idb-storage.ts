/**
 * @file IndexedDB storage implementation.
 */

import * as idb from 'idb';

import { StorageInterface } from '../../common/storage';

const DEFAULT_STORE_NAME = 'defaultStore';

/**
 * Provides a storage mechanism using IndexedDB. This class implements the
 * StorageInterface with asynchronous methods to interact with the database.
 */
export class IdbStorage implements StorageInterface<string, unknown, 'async'> {
    /**
     * Holds the instance of the IndexedDB database.
     *
     * @private
     * @type {(idb.IDBPDatabase | null)}
     */
    private db: idb.IDBPDatabase | null = null;

    /**
     * The name of the database.
     *
     * @private
     * @type {string}
     */
    private name: string;

    /**
     * The version of the database. Used for upgrades.
     *
     * @private
     * @type {number}
     */
    private version: number;

    /**
     * The name of the store within the database.
     *
     * @private
     * @type {string}
     */
    private store: string;

    /**
     * Constructs an instance of the IdbStorage class.
     *
     * @param {string} name The name of the database.
     * @param {number} [version=1] The version of the database.
     * @param {string} [store=DEFAULT_STORE_NAME] The name of the store.
     */
    constructor(name: string, version = 1, store = DEFAULT_STORE_NAME) {
        this.name = name;
        this.version = version;
        this.store = store;
    }

    /**
     * Ensures the database is opened before any operations. If the database
     * is not already opened, it opens the database.
     *
     * @private
     * @returns {Promise<idb.IDBPDatabase>} The opened database instance.
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
     * @param {string} key The key of the value to retrieve.
     * @returns {Promise<unknown>} The value associated with the key.
     */
    public async get(key: string): Promise<unknown> {
        const db = await this.getOpenedDb();
        return db.get(this.store, key);
    }

    /**
     * Sets a value in the store with the specified key.
     *
     * @param {string} key The key under which to store the value.
     * @param {unknown} value The value to store.
     * @returns {Promise<void>}
     */
    public async set(key: string, value: unknown): Promise<void> {
        const db = await this.getOpenedDb();
        db.put(this.store, value, key);
    }

    /**
     * Removes a value from the store by key.
     *
     * @param {string} key The key of the value to remove.
     * @returns {Promise<void>}
     */
    public async remove(key: string): Promise<void> {
        const db = await this.getOpenedDb();
        db.delete(this.store, key);
    }
}
