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

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import { IDBStorage } from '../../../../Extension/src/background/storages/idb-storage';

describe('IDBStorage', () => {
    let storage: IDBStorage<any>;

    beforeEach(() => {
        storage = new IDBStorage();
    });

    afterEach(async () => {
        await storage.clear();
        vi.clearAllMocks();
    });

    test('set and get', async () => {
        await storage.set('key1', 'value1');
        const value = await storage.get('key1');
        expect(value).toBe('value1');
    });

    test('remove', async () => {
        await storage.set('key1', 'value1');
        await storage.remove('key1');
        const value = await storage.get('key1');
        expect(value).toBeUndefined();
    });

    test('setMultiple', async () => {
        const data = { key1: 'value1', key2: 'value2' };
        const result = await storage.setMultiple(data);
        expect(result).toBe(true);
        const value1 = await storage.get('key1');
        const value2 = await storage.get('key2');
        expect(value1).toBe('value1');
        expect(value2).toBe('value2');
    });

    test('removeMultiple', async () => {
        await storage.set('key1', 'value1');
        await storage.set('key2', 'value2');
        const result = await storage.removeMultiple(['key1', 'key2']);
        expect(result).toBe(true);
        const value1 = await storage.get('key1');
        const value2 = await storage.get('key2');
        expect(value1).toBeUndefined();
        expect(value2).toBeUndefined();
    });

    test('entries', async () => {
        await storage.set('key1', 'value1');
        await storage.set('key2', 'value2');
        const entries = await storage.entries();
        expect(entries).toEqual({ key1: 'value1', key2: 'value2' });
    });

    test('keys', async () => {
        await storage.set('key1', 'value1');
        await storage.set('key2', 'value2');
        const keys = await storage.keys();
        expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
    });

    test('has', async () => {
        await storage.set('key1', 'value1');
        const hasKey = await storage.has('key1');
        expect(hasKey).toBe(true);
        const hasKey1 = await storage.has('key2');
        expect(hasKey1).toBe(false);
    });

    test('clear', async () => {
        await storage.set('key1', 'value1');
        await storage.set('key2', 'value2');
        await storage.clear();
        const entries = await storage.entries();
        expect(entries).toEqual({});
    });

    // TODO: Add tests to check error handling in setMultiple and removeMultiple
});
