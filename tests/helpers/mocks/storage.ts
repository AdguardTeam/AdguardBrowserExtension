/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import browser from 'sinon-chrome';
import sinon, { type SinonStub } from 'sinon';
import { type Storage, type Events } from 'webextension-polyfill';

/**
 * Emulated browser.storage.local
 */
class EmulatedLocalStorage implements Storage.StorageArea {
    private data: Record<string, unknown>;

    constructor(initData: Record<string, unknown> = {}) {
        this.data = initData;
    }

    onChanged = {} as Events.Event<(changes: Storage.StorageAreaOnChangedChangesType) => void>;

    /**
     * Get data from the storage
     *
     * @param keys Keys to retrieve from storage.
     */
    get(keys?: string | string[] | Record<string, unknown> | null | undefined): Promise<Record<string, unknown>> {
        if (keys === null) {
            return Promise.resolve(this.data);
        }

        if (typeof keys === 'string') {
            const data = this.data[keys];
            return Promise.resolve(data !== undefined ? { [keys]: data } : {});
        }

        if (Array.isArray(keys)) {
            return Promise.resolve(keys.reduce((result, key) => {
                const data = this.data[key];
                if (data !== undefined) {
                    result[key] = data;
                }
                return result;
            }, {} as Record<string, unknown>));
        }

        // `null` already handled above
        if (typeof keys === 'object') {
            return Promise.resolve(Object.entries(keys).reduce((result, [key]) => {
                const data = this.data[key];
                if (data !== undefined) {
                    result[key] = data;
                }
                return result;
            }, {} as Record<string, unknown>));
        }

        return Promise.resolve({});
    }

    /**
     * Set data in storage
     *
     * @param items Items to store.
     */
    set(items: Record<string, unknown>): Promise<void> {
        Object.assign(this.data, items);
        return Promise.resolve();
    }

    /**
     * Remove data from storage
     *
     * @param keys Keys to remove from storage.
     */
    remove(keys: string | string[]): Promise<void> {
        if (typeof keys === 'string') {
            delete this.data[keys];
        } else {
            keys.forEach((key) => {
                delete this.data[key];
            });
        }

        return Promise.resolve();
    }

    /**
     * Clear all data from storage
     */
    clear(): Promise<void> {
        this.data = {};
        return Promise.resolve();
    }

    /**
     * Gets the amount of space (in bytes) being used by the storage.
     *
     * @param keys Keys to get the total usage for; `null`/`undefined` for all data.
     */
    getBytesInUse(keys?: null | string | string[]): Promise<number> {
        const sizeOf = (value: unknown): number => {
            return JSON.stringify(value)?.length ?? 0;
        };

        let keyList: string[];
        if (keys === undefined || keys === null) {
            keyList = Object.keys(this.data);
        } else if (typeof keys === 'string') {
            keyList = [keys];
        } else {
            keyList = keys;
        }

        return Promise.resolve(
            keyList.reduce((total, key) => {
                if (!Object.hasOwn(this.data, key)) {
                    return total;
                }

                return total + sizeOf({ [key]: this.data[key] });
            }, 0),
        );
    }

    /**
     * Gets the keys of all items in storage.
     */
    getKeys(): Promise<string[]> {
        return Promise.resolve(Object.keys(this.data));
    }
}

/**
 * Mocks the browser.storage.local API with an instance of EmulatedLocalStorage
 *
 * @param initData - Optional initial data for the mock storage
 *
 * @returns Mocked storage instance
 */
export const mockLocalStorage = (initData?: Record<string, unknown>): Storage.StorageArea => {
    const localStorage = new EmulatedLocalStorage(initData);

    // sinon-chrome's `storage.local` getter builds a new object on every access,
    // so a property added to one snapshot (e.g. `getKeys`, which sinon-chrome
    // predates) is not visible to the code under test. Pin the getter to a
    // single object so the custom stub persists.
    const storageLocal = browser.storage.local as typeof browser.storage.local & {
        getKeys: SinonStub;
    };
    const localDescriptor = Object.getOwnPropertyDescriptor(browser.storage, 'local');
    Object.defineProperty(browser.storage, 'local', {
        configurable: true,
        enumerable: localDescriptor?.enumerable ?? true,
        get: () => storageLocal,
    });

    // sinon-chrome predates storage.local.getKeys — register our own stub.
    storageLocal.getKeys = sinon.stub().callsFake(() => localStorage.getKeys());

    // Override the sinon-chrome storage API with mocked methods
    storageLocal.get.callsFake((keys) => localStorage.get(keys));
    storageLocal.set.callsFake((items) => localStorage.set(items));
    storageLocal.remove.callsFake((keys) => localStorage.remove(keys));
    storageLocal.clear.callsFake(() => localStorage.clear());
    storageLocal.getBytesInUse.callsFake((keys) => localStorage.getBytesInUse(keys));

    // Reset spy history to avoid unwanted side effects in tests
    storageLocal.get.resetHistory();
    storageLocal.set.resetHistory();
    storageLocal.remove.resetHistory();
    storageLocal.clear.resetHistory();
    storageLocal.getBytesInUse.resetHistory();
    storageLocal.getKeys.resetHistory();

    return localStorage;
};
