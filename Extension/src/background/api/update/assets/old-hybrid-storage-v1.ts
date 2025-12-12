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

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This file implements a hybrid storage solution that abstracts over different storage mechanisms,
 * providing a unified API for storage operations. It automatically chooses between IndexedDB storage and
 * a fallback storage mechanism based on the environment's capabilities.
 */

import { nanoid } from 'nanoid';
import * as idb from 'idb';
import { isObject } from 'lodash-es';

import { type ExtendedStorageInterface } from '../../../../common/storage';

import { BrowserStorage } from './old-browser-storage-v1';
import { IDBStorage } from './old-idb-storage-v1';

/**
 * Prefix for the test IndexedDB database name.
 * This test database is used to check if IndexedDB is supported in the current environment.
 */
const TEST_IDB_NAME_PREFIX = 'test_';

/**
 * Implements a hybrid storage mechanism that can switch between IndexedDB and a fallback storage
 * based on browser capabilities and environment constraints. This class adheres to the StorageInterface,
 * allowing for asynchronous get and set operations.
 */
export class HybridStorage implements ExtendedStorageInterface<string, unknown, 'async'> {
    /**
     * Holds the instance of the selected storage mechanism.
     */
    private storage: ExtendedStorageInterface<string, unknown, 'async'> | null = null;

    /**
     * Returns true if the selected storage mechanism is IndexedDB.
     *
     * @returns True if the selected storage mechanism is IndexedDB, false otherwise.
     */
    private isIdb(): boolean {
        return this.storage instanceof IDBStorage;
    }

    /**
     * Determines the appropriate storage mechanism to use. If IndexedDB is supported, it uses IDBStorage;
     * otherwise, it falls back to a generic Storage mechanism. This selection is made once and cached
     * for subsequent operations.
     *
     * @returns The storage instance to be used for data operations.
     */
    private async getStorage(): Promise<ExtendedStorageInterface<string, unknown, 'async'>> {
        if (this.storage) {
            return this.storage;
        }

        if (await HybridStorage.isIDBSupported()) {
            this.storage = new IDBStorage();
        } else {
            this.storage = new BrowserStorage();
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
            const testDbName = `${TEST_IDB_NAME_PREFIX}${nanoid()}`;
            const testDb = await idb.openDB(testDbName, 1);
            testDb.close();
            await idb.deleteDB(testDbName);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Helper function to serialize Uint8Array members of an object.
     * This workaround is needed because by default chrome.storage API doesn't support Uint8Array,
     * and we use it to store serialized filter lists.
     *
     * @param value Object to serialize.
     *
     * @returns Serialized object.
     */
    private serialize = (value: unknown): unknown => {
        if (value instanceof Uint8Array) {
            return { __type: 'Uint8Array', data: Array.from(value) };
        }

        if (Array.isArray(value)) {
            return value.map(this.serialize);
        }

        if (isObject(value)) {
            const serializedObject: { [key: string]: unknown } = {};
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, val] of Object.entries(value)) {
                serializedObject[key] = this.serialize(val);
            }
            return serializedObject;
        }

        return value;
    };

    /**
     * Helper function to deserialize Uint8Array members of an object.
     * This workaround is needed because by default chrome.storage API doesn't support Uint8Array,
     * and we use it to store serialized filter lists.
     *
     * @param value Object to deserialize.
     *
     * @returns Deserialized object.
     */
    private deserialize = (value: unknown): unknown => {
        const isObj = isObject(value);

        if (isObj && (value as any).__type === 'Uint8Array') {
            return new Uint8Array((value as any).data);
        }

        if (Array.isArray(value)) {
            return value.map(this.deserialize);
        }

        if (isObj) {
            const deserializedObject: { [key: string]: unknown } = {};
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, val] of Object.entries(value)) {
                deserializedObject[key] = this.deserialize(val);
            }
            return deserializedObject;
        }

        return value;
    };

    /**
     * Asynchronously sets a value for a given key in the selected storage mechanism.
     *
     * @param key The key under which the value is stored.
     * @param value The value to be stored.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    async set(key: string, value: unknown): Promise<void> {
        const storage = await this.getStorage();

        if (this.isIdb()) {
            return storage.set(key, value);
        }

        const rawValue = this.serialize(value);
        return storage.set(key, rawValue);
    }

    /**
     * Asynchronously retrieves the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be retrieved.
     *
     * @returns A promise that resolves with the retrieved value, or undefined if the key does not exist.
     */
    async get(key: string): Promise<unknown> {
        const storage = await this.getStorage();
        const value = await storage.get(key);

        if (this.isIdb()) {
            return value;
        }

        return this.deserialize(value);
    }

    /**
     * Asynchronously removes the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be removed.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    async remove(key: string): Promise<void> {
        const storage = await this.getStorage();
        return storage.remove(key);
    }

    /**
     * Atomic set operation for multiple key-value pairs.
     * This method are using transaction to ensure atomicity, if any of the operations fail,
     * the entire operation is rolled back. This helps to prevent data corruption / inconsistency.
     *
     * @param data The key-value pairs to set.
     *
     * @returns True if all operations were successful, false otherwise.
     *
     * @example
     * ```ts
     * const storage = new HybridStorage();
     * await storage.setMultiple({
     *    key1: 'value1',
     *    key2: 'value2',
     * });
     * ```
     */
    public async setMultiple(data: Record<string, unknown>): Promise<boolean> {
        const storage = await this.getStorage();
        if (this.isIdb()) {
            return (await storage.setMultiple(data)) ?? false;
        }

        const cloneData = { ...data };
        Object.entries(cloneData).forEach(([key, value]) => {
            cloneData[key] = this.serialize(value);
        });
        return (await storage.setMultiple(cloneData)) ?? false;
    }

    /**
     * Removes multiple key-value pairs from the storage.
     *
     * @param keys The keys to remove.
     *
     * @returns True if all operations were successful, false otherwise.
     */
    public async removeMultiple(keys: string[]): Promise<boolean> {
        const storage = await this.getStorage();
        return (await storage.removeMultiple(keys)) ?? false;
    }

    /**
     * Get the entire contents of the storage.
     *
     * @returns Promise that resolves with the entire contents of the storage.
     */
    public async entries(): Promise<Record<string, unknown>> {
        const storage = await this.getStorage();
        return storage.entries();
    }

    /**
     * Get all keys from the storage.
     *
     * @returns Promise that resolves with all keys from the storage.
     */
    public async keys(): Promise<string[]> {
        const storage = await this.getStorage();
        return storage.keys();
    }

    /**
     * Check if a key exists in the storage.
     *
     * @param key The key to check.
     *
     * @returns True if the key exists, false otherwise.
     */
    public async has(key: string): Promise<boolean> {
        const storage = await this.getStorage();
        return storage.has(key);
    }
}
