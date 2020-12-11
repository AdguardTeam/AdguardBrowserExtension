/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import { browser } from '../extension-api/browser';
import { log } from '../../common/log';

/**
 * Local storage implementation for chromium-based browsers
 */
export const localStorageImpl = (function () {
    const ADGUARD_SETTINGS_PROP = 'adguard-settings';
    let values = null;

    /**
     * Reads data from storage.local
     * @param path Path
     */
    async function read(path) {
        const results = await browser.storage.local.get(path);
        return results ? results[path] : null;
    }

    /**
     * Writes data to storage.local
     * @param path Path
     * @param data Data to write
     */
    async function write(path, data) {
        const item = {};
        item[path] = data;
        await browser.storage.local.set(item);
    }

    /**
     * Due to async initialization of storage, we have to check it before accessing values object
     * @returns {boolean}
     */
    function isInitialized() {
        return values !== null;
    }

    /**
     * Retrieves value by key from cached values
     * @param key
     * @returns {*}
     */
    function getItem(key) {
        if (!isInitialized()) {
            return null;
        }
        return values[key];
    }

    function setItem(key, value) {
        if (!isInitialized()) {
            return;
        }
        values[key] = value;
        write(ADGUARD_SETTINGS_PROP, values);
    }

    function removeItem(key) {
        if (!isInitialized()) {
            return;
        }
        delete values[key];
        write(ADGUARD_SETTINGS_PROP, values);
    }

    function hasItem(key) {
        if (!isInitialized()) {
            return false;
        }
        return key in values;
    }

    /**
     * We can't use localStorage object anymore and we've decided to store all data into storage.local
     * localStorage is affected by cleaning tools: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/681
     * storage.local has async nature and we have to preload all key-values pairs into memory on extension startup
     */
    async function init() {
        if (isInitialized()) {
            // Already initialized
            return;
        }

        let items;
        try {
            items = await read(ADGUARD_SETTINGS_PROP);
        } catch (e) {
            log.error(e);
        }

        values = items || Object.create(null);
    }

    return {
        getItem,
        setItem,
        removeItem,
        hasItem,
        init,
        isInitialized,
    };
})();
