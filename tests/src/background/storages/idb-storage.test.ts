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
