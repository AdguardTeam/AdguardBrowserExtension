import browser from 'sinon-chrome';
import { Storage } from 'webextension-polyfill';

/**
 * Emulated browser.storage.local
 */
export class EmulatedLocalStorage implements Storage.StorageArea {
    private data: Record<string, unknown>;

    constructor(initData: Record<string, unknown> = {}) {
        this.data = initData;
    }

    get(keys?: string | string[] | Record<string, unknown> | null | undefined): Promise<Record<string, unknown>> {
        if (!keys) {
            return Promise.resolve(this.data);
        }

        if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: this.data[keys] });
        }

        // TODO: other key options
        return Promise.resolve({});
    }

    set(items: Record<string, unknown>): Promise<void> {
        Object.assign(this.data, items);
        return Promise.resolve();
    }

    remove(keys: string | string[]): Promise<void> {
        if (typeof keys === 'string') {
            delete this.data[keys];
        } else {
            keys.forEach(key => {
                delete this.data[key];
            });
        }

        return Promise.resolve();
    }

    clear(): Promise<void> {
        this.data = {};
        return Promise.resolve();
    }
}

/**
 * Bounds global sinon-chrome stub for {@link browser.storage.local} with new one {@link EmulatedLocalStorage}
 *
 * returned storage instance allows to manipulate data without triggering spies
 *
 * @param initData - init storage data
 *
 * @returns storage instance
 */
export const mockLocalStorage = (initData?: Record<string, unknown>): Storage.StorageArea => {
    const localStorage = new EmulatedLocalStorage(initData);

    browser.storage.local.get.callsFake((keys) => localStorage.get(keys));
    browser.storage.local.set.callsFake((keys) => localStorage.set(keys));
    browser.storage.local.remove.callsFake((keys) => localStorage.remove(keys));
    browser.storage.local.clear.callsFake(() => localStorage.clear());

    // reset spy history
    browser.storage.local.get.resetHistory();
    browser.storage.local.set.resetHistory();
    browser.storage.local.remove.resetHistory();
    browser.storage.local.clear.resetHistory();

    return localStorage;
};
