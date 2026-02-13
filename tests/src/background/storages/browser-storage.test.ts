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
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { BrowserStorage } from '../../../../Extension/src/background/storages/browser-storage';
import { mockLocalStorage } from '../../../helpers';

describe('BrowserStorage', () => {
    let storageLocal: Storage.StorageArea;
    let storage: BrowserStorage<any>;

    beforeEach(() => {
        storageLocal = mockLocalStorage();
        storage = new BrowserStorage(browser.storage.local);
    });

    afterEach(async () => {
        await storageLocal.clear();
        await storage.clear();
        vi.clearAllMocks();
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

    test('setMultiple handles errors', async () => {
        const descriptor = Object.getOwnPropertyDescriptor(storage, 'storage');

        if (descriptor === undefined) {
            throw new Error('Storage descriptor is undefined');
        }

        // Simulate an error in browser.storage.local.set
        const mock = vi.spyOn(descriptor.value, 'set').mockRejectedValueOnce(
            new Error('Error while setting multiple keys in the storage'),
        );

        const data = { key1: 'value1', errorKey: 'value2' };
        const result = await storage.setMultiple(data);
        expect(result).toBe(false);

        mock.mockRestore();
    });
});
