/**
 * @file This file implements a hybrid storage solution that abstracts over different storage mechanisms,
 * providing a unified API for storage operations. It automatically chooses between IndexedDB storage and
 * a fallback storage mechanism based on the environment's capabilities.
 */

import { nanoid } from 'nanoid';
import * as idb from 'idb';

import { StorageInterface } from '../../common/storage';

import { Storage } from './main';
import { IDBStorage } from './idb-storage';

/**
 * Implements a hybrid storage mechanism that can switch between IndexedDB and a fallback storage
 * based on browser capabilities and environment constraints. This class adheres to the StorageInterface,
 * allowing for asynchronous get and set operations.
 */
export class HybridStorage implements StorageInterface<string, unknown, 'async'> {
    private storage: StorageInterface | null = null;

    /**
     * Determines the appropriate storage mechanism to use. If IndexedDB is supported, it uses IDBStorage;
     * otherwise, it falls back to a generic Storage mechanism. This selection is made once and cached
     * for subsequent operations.
     *
     * @returns The storage instance to be used for data operations.
     */
    private async getStorage(): Promise<StorageInterface> {
        if (this.storage) {
            return this.storage;
        }

        if (await HybridStorage.isIDBSupported()) {
            this.storage = new IDBStorage();
        } else {
            this.storage = new Storage();
        }
        return this.storage;
    }

    /**
     * Checks if IndexedDB is supported in the current environment. This is determined by trying to open
     * a test database; if successful, IndexedDB is supported.
     *
     * @returns True if IndexedDB is supported, false otherwise.
     */
    private static async isIDBSupported(): Promise<boolean> {
        try {
            await idb.openDB(`test_${nanoid()}`, 1);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Asynchronously sets a value for a given key in the selected storage mechanism.
     *
     * @param key The key under which the value is stored.
     * @param value The value to be stored.
     * @returns A promise that resolves when the operation is complete.
     */
    async set(key: string, value: unknown): Promise<void> {
        const storage = await this.getStorage();
        return storage.set(key, value);
    }

    /**
     * Asynchronously retrieves the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be retrieved.
     * @returns A promise that resolves with the retrieved value, or undefined if the key does not exist.
     */
    async get(key: string): Promise<unknown> {
        const storage = await this.getStorage();
        return storage.get(key);
    }

    /**
     * Asynchronously removes the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be removed.
     */
    async remove(key: string): Promise<void> {
        const storage = await this.getStorage();
        return storage.remove(key);
    }
}
