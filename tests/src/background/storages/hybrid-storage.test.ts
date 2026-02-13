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

import browser, { type Storage } from 'webextension-polyfill';
import { cloneDeep } from 'lodash-es';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { HybridStorage } from '../../../../Extension/src/background/storages/hybrid-storage';
import { IDBStorage } from '../../../../Extension/src/background/storages/idb-storage';
import { BrowserStorage } from '../../../../Extension/src/background/storages/browser-storage';
import { mockLocalStorage } from '../../../helpers';

vi.mock('idb', { spy: true });

describe('HybridStorage', () => {
    let storageLocal: Storage.StorageArea;
    let storage: HybridStorage<any>;

    beforeEach(() => {
        storageLocal = mockLocalStorage();
    });

    afterEach(async () => {
        await storageLocal.clear();
        await storage.clear();
        vi.clearAllMocks();
    });

    describe('When IndexedDB is supported', () => {
        beforeEach(() => {
            storage = new HybridStorage(browser.storage.local);
        });

        test('IDBStorage is used when IndexedDB is supported', async () => {
            const dummyStorage = new HybridStorage(browser.storage.local);

            // We need to make some operation to trigger the IndexedDB check, because its lazy
            // and only happens when the storage is used
            expect(dummyStorage).toBeInstanceOf(HybridStorage);
            await expect(dummyStorage.keys()).resolves.toEqual([]);

            const descriptor = Object.getOwnPropertyDescriptor(dummyStorage, 'storage');
            expect(descriptor?.value).toBeInstanceOf(IDBStorage);
        });

        // HybridStorage.isIDBSupported creates a test database to check if IndexedDB is supported,
        // and we need to check if its deleted after the check
        test('test database deleted', async () => {
            const dummyStorage = new HybridStorage(browser.storage.local);

            // We need to make some operation to trigger the IndexedDB check, because its lazy
            // and only happens when the storage is used
            expect(dummyStorage).toBeInstanceOf(HybridStorage);
            await expect(dummyStorage.keys()).resolves.toEqual([]);

            // Test database name: prefix + random nanoid, but nanoid is mocked to return 1
            const descriptor = Object.getOwnPropertyDescriptor(dummyStorage, 'TEST_IDB_NAME_PREFIX');
            const testDbName = `${descriptor?.value}1`;
            const databases = await indexedDB.databases();

            expect(databases).not.toContainEqual(expect.objectContaining({ name: testDbName }));
        });

        test('set and get', async () => {
            await storage.set('key1', 'value1');
            const value = await storage.get('key1');
            expect(value).toBe('value1');
        });

        test('remove', async () => {
            await storage.set('key2', 'value2');
            await expect(storage.get('key2')).resolves.toBe('value2');
            await storage.remove('key2');
            await expect(storage.get('key2')).resolves.toBeUndefined();
        });

        test('setMultiple', async () => {
            const data = { key3: 'value3', key4: 'value4' };
            const result = await storage.setMultiple(data);
            expect(result).toBe(true);
            const value3 = await storage.get('key3');
            const value4 = await storage.get('key4');
            expect(value3).toBe('value3');
            expect(value4).toBe('value4');
        });

        test('removeMultiple', async () => {
            await storage.set('key5', 'value5');
            await storage.set('key6', 'value6');
            const result = await storage.removeMultiple(['key5', 'key6']);
            expect(result).toBe(true);
            const value5 = await storage.get('key5');
            const value6 = await storage.get('key6');
            expect(value5).toBeUndefined();
            expect(value6).toBeUndefined();
        });

        test('entries', async () => {
            await storage.set('key7', 'value7');
            await storage.set('key8', 'value8');
            const entries = await storage.entries();
            expect(entries).toEqual({ key7: 'value7', key8: 'value8' });
        });

        test('keys', async () => {
            await storage.set('key9', 'value9');
            await storage.set('key10', 'value10');
            const keys = await storage.keys();
            expect(keys).toEqual(expect.arrayContaining(['key9', 'key10']));
        });

        test('has', async () => {
            await storage.set('key11', 'value11');
            const hasKey = await storage.has('key11');
            expect(hasKey).toBe(true);
            const hasKey12 = await storage.has('key12');
            expect(hasKey12).toBe(false);
        });

        test('clear', async () => {
            await storage.set('key13', 'value13');
            await storage.set('key14', 'value14');
            await storage.clear();
            const entries = await storage.entries();
            expect(entries).toEqual({});
        });
    });

    describe('When IndexedDB is not supported', () => {
        beforeAll(() => {
            // Reset static cache members, otherwise previous tests will affect this one

            /**
             * Change a value via Object.defineProperty.
             *
             * @param obj Reference to the object.
             * @param key Key to change.
             * @param value New value.
             */
            const changeValue = (obj: object, key: PropertyKey, value: unknown): void => {
                const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (descriptor) {
                    Object.defineProperty(obj, key, Object.assign(descriptor, { value }));
                }
            };

            changeValue(HybridStorage, 'isIDBCapabilityChecked', false);
            changeValue(HybridStorage, 'idbCapabilityCheckerPromise', null);
            changeValue(HybridStorage, 'idbSupported', false);
        });

        beforeEach(() => {
            // Mock idb.openDB to throw an error, simulating that IndexedDB is not supported
            // vi.spyOn(idb, 'openDB').mockImplementation(() => {
            //     throw new Error('IndexedDB not supported');
            // });
            vi.spyOn(HybridStorage, 'isIDBSupported').mockResolvedValue(false);

            storage = new HybridStorage(browser.storage.local);
        });

        test('BrowserStorage is used when IndexedDB is not supported', async () => {
            const dummyStorage = new HybridStorage(browser.storage.local);

            // We need to make some operation to trigger the IndexedDB check, because its lazy
            // and only happens when the storage is used
            expect(dummyStorage).toBeInstanceOf(HybridStorage);
            await expect(dummyStorage.keys()).resolves.toEqual([]);

            const descriptor = Object.getOwnPropertyDescriptor(dummyStorage, 'storage');
            expect(descriptor?.value).toBeInstanceOf(BrowserStorage);
        });

        // IndexedDB supports more data types, so if we use BrowserStorage, we need to use a
        // serialization library like SuperJSON to handle these data types.
        // In this test, we just check that this extra serialization step is working correctly.
        test('set and get handles special values, like Uint8Array', async () => {
            const uint8Array = new Uint8Array([1, 2, 3]);
            await storage.set('key1', uint8Array);
            const value = await storage.get('key1');

            // Reference should be different, but the value should be the same
            expect(value).not.toBe(uint8Array);
            expect(value).toEqual(cloneDeep(uint8Array));
        });

        test('set and get', async () => {
            await storage.set('key1', 'value1');
            const value = await storage.get('key1');
            expect(value).toBe('value1');
        });

        test('set and get with non-JSON-serializable data', async () => {
            const arr = new Uint8Array([1, 2, 3]);
            await storage.set('key1', arr);
            const value = await storage.get('key1');
            expect(value).toEqual(arr);
        });

        test('remove', async () => {
            await storage.set('key2', 'value2');
            await expect(storage.get('key2')).resolves.toBe('value2');
            await storage.remove('key2');
            await expect(storage.get('key2')).resolves.toBeUndefined();
        });

        test('setMultiple', async () => {
            const data = { key3: 'value3', key4: 'value4' };
            const result = await storage.setMultiple(data);
            expect(result).toBe(true);
            const value3 = await storage.get('key3');
            const value4 = await storage.get('key4');
            expect(value3).toBe('value3');
            expect(value4).toBe('value4');
        });

        test('removeMultiple', async () => {
            await storage.set('key5', 'value5');
            await storage.set('key6', 'value6');
            const result = await storage.removeMultiple(['key5', 'key6']);
            expect(result).toBe(true);
            const value5 = await storage.get('key5');
            const value6 = await storage.get('key6');
            expect(value5).toBeUndefined();
            expect(value6).toBeUndefined();
        });

        test('entries', async () => {
            await storage.set('key7', 'value7');
            await storage.set('key8', 'value8');
            const entries = await storage.entries();
            expect(entries).toEqual({ key7: 'value7', key8: 'value8' });
        });

        test('keys', async () => {
            await storage.set('key9', 'value9');
            await storage.set('key10', 'value10');
            const keys = await storage.keys();
            expect(keys).toEqual(expect.arrayContaining(['key9', 'key10']));
        });

        test('has', async () => {
            await storage.set('key11', 'value11');
            const hasKey = await storage.has('key11');
            expect(hasKey).toBe(true);
            const hasKey12 = await storage.has('key12');
            expect(hasKey12).toBe(false);
        });

        test('clear', async () => {
            await storage.set('key13', 'value13');
            await storage.set('key14', 'value14');
            await storage.clear();
            const entries = await storage.entries();
            expect(entries).toEqual({});
        });

        test('should read data correctly if browser storage already has data', async () => {
            // Important: browser storage may contain data that is not SuperJSON-serialized,
            // in this case, we still need to read it correctly
            const browserStorage = new BrowserStorage(browser.storage.local);
            await browserStorage.set('key15', 'value15');
            await browserStorage.set('key16', 'value16');

            const hybridStorage = new HybridStorage(browser.storage.local);
            const entries = await hybridStorage.entries();
            expect(entries).toEqual(await browser.storage.local.get(null));
        });
    });
});
