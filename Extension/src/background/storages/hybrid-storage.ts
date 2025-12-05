/* eslint-disable @typescript-eslint/no-explicit-any */
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
/**
 * This file implements a hybrid storage solution that abstracts over different storage mechanisms,
 * providing a unified API for storage operations. It automatically chooses between IndexedDB storage and
 * a fallback storage mechanism based on the environment's capabilities.
 */
import { type Storage } from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { SuperJSON, type SuperJSONResult } from 'superjson';
import { deleteDB, openDB } from 'idb';

import { type ExtendedStorageInterface } from './storage-interface';
import { BrowserStorage } from './browser-storage';
import { IDBStorage } from './idb-storage';

// TODO: SuperJSONValue is not exported from superjson, so we have to redefine it here.
// https://github.com/flightcontrolhq/superjson/issues/309
type SuperJSONValue = any;

/**
 * Implements a hybrid storage mechanism that can switch between IndexedDB and a fallback storage
 * based on browser capabilities and environment constraints. This class adheres to the StorageInterface,
 * allowing for asynchronous get and set operations.
 *
 * @template Data The type of the value stored in the storage.
 */
export class HybridStorage<Data = unknown> implements ExtendedStorageInterface<string, Data, 'async'> {
    /**
     * A flag indicating whether IndexedDB support has already been checked.
     */
    private static isIDBCapabilityChecked = false;

    /**
     * A promise that resolves to whether IndexedDB is supported in the environment.
     * This promise is used to cache the result of the support check to prevent multiple checks.
     */
    private static idbCapabilityCheckerPromise: Promise<boolean> | null = null;

    /**
     * A flag that stores the result of the IndexedDB support check.
     * If true, IndexedDB is supported in the environment.
     */
    private static idbSupported = false;

    /**
     * Prefix for the test IndexedDB database name.
     * This test database is used to check if IndexedDB is supported in the current environment.
     */
    private static readonly TEST_IDB_NAME_PREFIX = 'test_';

    /**
     * Version number for the test IndexedDB database.
     */
    private static readonly TEST_IDB_VERSION = 1;

    /**
     * The key used to store metadata in SuperJSON-serialized data.
     */
    private static readonly SUPERJSON_META_KEY = 'meta';

    /**
     * Holds the instance of the selected storage mechanism.
     *
     * @note We use SuperJSON to serialize and deserialize the data when using the fallback storage mechanism,
     * because it only supports storing JSON-serializable data.
     */
    private storage: IDBStorage<Data> | BrowserStorage<SuperJSONResult | Data> | null = null;

    /**
     * The storage area to use when IndexedDB is not supported.
     */
    private fallbackStorage: Storage.StorageArea;

    /**
     * Constructs an instance of the HybridStorage class.
     *
     * @param fallbackStorage The storage area to use when IndexedDB is not supported.
     */
    constructor(fallbackStorage: Storage.StorageArea) {
        this.fallbackStorage = fallbackStorage;
    }

    /**
     * Checks if the given storage is an instance of IDBStorage.
     *
     * @param storage The storage instance to check.
     *
     * @returns True if the storage is an instance of IDBStorage, false otherwise.
     */
    private static isIdbStorage(
        storage: IDBStorage<unknown> | BrowserStorage<unknown>,
    ): storage is IDBStorage<unknown> {
        return storage instanceof IDBStorage;
    }

    /**
     * Determines the appropriate storage mechanism to use. If IndexedDB is supported, it uses IDBStorage;
     * otherwise, it falls back to a generic Storage mechanism. This selection is made once and cached
     * for subsequent operations.
     *
     * @returns The storage instance to be used for data operations.
     */
    private async getStorage(): Promise<IDBStorage<Data> | BrowserStorage<SuperJSONResult | Data>> {
        if (this.storage) {
            return this.storage;
        }

        if (await HybridStorage.isIDBSupported()) {
            this.storage = new IDBStorage<Data>();
        } else {
            this.storage = new BrowserStorage<SuperJSONResult | Data>(this.fallbackStorage);
        }

        return this.storage;
    }

    /**
     * Serializes the given data using SuperJSON.
     *
     * @param data The data to serialize.
     *
     * @returns The serialized data.
     */
    public static serialize = (data: SuperJSONValue): SuperJSONResult => SuperJSON.serialize(data);

    /**
     * Deserializes the given data using SuperJSON.
     *
     * @param data The data to deserialize.
     *
     * @returns The deserialized data.
     */
    public static deserialize = (data: SuperJSONResult): SuperJSONValue => SuperJSON.deserialize(data);

    /**
     * Checks if the given value is a SuperJSONResult.
     *
     * @param value The value to check.
     *
     * @returns True if the value is a SuperJSONResult, false otherwise.
     */
    private static isSuperJSONResult(value: unknown): value is SuperJSONResult {
        return typeof value === 'object' && value !== null && HybridStorage.SUPERJSON_META_KEY in value;
    }

    /**
     * Checks if IndexedDB is supported in the current environment.
     * This is determined by trying to open a test database; if successful, IndexedDB is supported.
     * The result of this check is cached to prevent multiple checks.
     *
     * @returns True if IndexedDB is supported, false otherwise.
     */
    public static async isIDBSupported(): Promise<boolean> {
        if (HybridStorage.isIDBCapabilityChecked) {
            return HybridStorage.idbSupported;
        }

        if (HybridStorage.idbCapabilityCheckerPromise) {
            return HybridStorage.idbCapabilityCheckerPromise;
        }

        HybridStorage.idbCapabilityCheckerPromise = (async (): Promise<boolean> => {
            try {
                const testDbName = `${HybridStorage.TEST_IDB_NAME_PREFIX}${nanoid()}`;
                const testDb = await openDB(testDbName, HybridStorage.TEST_IDB_VERSION);
                testDb.close();
                await deleteDB(testDbName);
                HybridStorage.idbSupported = true;
            } catch (e) {
                HybridStorage.idbSupported = false;
            }

            HybridStorage.isIDBCapabilityChecked = true;
            return HybridStorage.idbSupported;
        })();

        return HybridStorage.idbCapabilityCheckerPromise;
    }

    /**
     * Asynchronously sets a value for a given key in the selected storage mechanism.
     *
     * @param key The key under which the value is stored.
     * @param value The value to be stored.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    async set(key: string, value: Data): Promise<void> {
        const storage = await this.getStorage();

        // If the selected storage mechanism is IndexedDB, we store the value as is,
        // as IndexedDB can store complex objects.
        if (HybridStorage.isIdbStorage(storage)) {
            return storage.set(key, value);
        }

        const serialized = HybridStorage.serialize(value);

        // If the serialized value contains a meta key, it means that the value provided
        // contains special data that are not JSON-serializable and require SuperJSON serialization,
        // like typed arrays, dates, and other complex objects.
        // In this case, we store the SuperJSON-serialized value.
        if (HybridStorage.SUPERJSON_META_KEY in serialized) {
            return storage.set(key, serialized);
        }

        // If the serialized value does not contain a meta key, it means that the value
        // provided was a primitive value or a plain object that is JSON-serializable,
        // and it does not contain any special data that requires SuperJSON serialization.
        // In this case, we store the value as is.
        return storage.set(key, value);
    }

    /**
     * Asynchronously retrieves the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be retrieved.
     *
     * @returns A promise that resolves with the retrieved value, or undefined if the key does not exist.
     */
    async get(key: string): Promise<Data | undefined> {
        const storage = await this.getStorage();

        // If the selected storage mechanism is IndexedDB, we return the value as is,
        // as IndexedDB can store complex objects.
        if (HybridStorage.isIdbStorage(storage)) {
            return storage.get(key);
        }

        const value = await storage.get(key);

        // Do not attempt to deserialize undefined values.
        if (value === undefined) {
            return undefined;
        }

        // If the value is a SuperJSON-serialized object, we need to deserialize it.
        if (HybridStorage.isSuperJSONResult(value)) {
            return HybridStorage.deserialize(value);
        }

        // Otherwise, we return the value as is.
        return value as Data;
    }

    /**
     * Asynchronously removes the value for a given key from the selected storage mechanism.
     *
     * @param key The key whose value is to be removed.
     */
    async remove(key: string): Promise<void> {
        const storage = await this.getStorage();
        await storage.remove(key);
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
    public async setMultiple(data: Record<string, Data>): Promise<boolean> {
        const storage = await this.getStorage();
        if (HybridStorage.isIdbStorage(storage)) {
            return (await storage.setMultiple(data)) ?? false;
        }

        const cloneData = Object.entries(data).reduce((acc, [key, value]) => {
            const serialized = SuperJSON.serialize(value);

            // If the serialized value contains a meta key, it means that the value provided
            // contains special data that are not JSON-serializable and require SuperJSON serialization,
            // like typed arrays, dates, and other complex objects.
            // In this case, we store the SuperJSON-serialized value.
            if (HybridStorage.SUPERJSON_META_KEY in serialized) {
                acc[key] = serialized;
                return acc;
            }

            // If the serialized value does not contain a meta key, it means that the value
            // provided was a primitive value or a plain object that is JSON-serializable,
            // and it does not contain any special data that requires SuperJSON serialization.
            // In this case, we store the value as is.
            acc[key] = value;

            return acc;
        }, {} as Record<string, SuperJSONResult | Data>);

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
    public async entries(): Promise<Record<string, Data>> {
        const storage = await this.getStorage();

        if (HybridStorage.isIdbStorage(storage)) {
            return storage.entries();
        }

        const entries = await storage.entries();

        return Object.entries(entries).reduce((acc, [key, value]) => {
            acc[key] = HybridStorage.isSuperJSONResult(value) ? HybridStorage.deserialize(value) : value;
            return acc;
        }, {} as Record<string, Data>);
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

    /**
     * Clears the storage.
     */
    public async clear(): Promise<void> {
        const storage = await this.getStorage();
        await storage.clear();
    }
}
