import browser from 'sinon-chrome';
import { Storage, Events } from 'webextension-polyfill';

/**
 * Emulated browser.storage.local
 */
export class EmulatedLocalStorage implements Storage.StorageArea {
    private data: Record<string, unknown>;

    constructor(initData: Record<string, unknown> = {}) {
        this.data = initData;
    }

    onChanged = {} as Events.Event<(changes: Storage.StorageAreaOnChangedChangesType) => void>;

    /**
     * Get data from the storage
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
     */
    set(items: Record<string, unknown>): Promise<void> {
        Object.assign(this.data, items);
        return Promise.resolve();
    }

    /**
     * Remove data from storage
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

    // Override the sinon-chrome storage API with mocked methods
    browser.storage.local.get.callsFake((keys) => localStorage.get(keys));
    browser.storage.local.set.callsFake((items) => localStorage.set(items));
    browser.storage.local.remove.callsFake((keys) => localStorage.remove(keys));
    browser.storage.local.clear.callsFake(() => localStorage.clear());

    // Reset spy history to avoid unwanted side effects in tests
    browser.storage.local.get.resetHistory();
    browser.storage.local.set.resetHistory();
    browser.storage.local.remove.resetHistory();
    browser.storage.local.clear.resetHistory();

    return localStorage;
};
