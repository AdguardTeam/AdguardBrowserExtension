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

import { log } from '../common/log';
import { localStorageImpl } from './utils/local-storage';
import { rulesStorageImpl } from './rules-storage';

/**
 * This class manages local storage
 */
export const localStorage = (function (localStorageImpl) {
    const getItem = function (key) {
        return localStorageImpl.getItem(key);
    };

    const setItem = function (key, value) {
        try {
            localStorageImpl.setItem(key, value);
        } catch (ex) {
            log.error(`Error while saving item ${key} to the localStorage: ${ex}`);
        }
    };

    const removeItem = function (key) {
        localStorageImpl.removeItem(key);
    };

    const hasItem = function (key) {
        return localStorageImpl.hasItem(key);
    };

    const init = async function () {
        if (typeof localStorageImpl.init === 'function') {
            await localStorageImpl.init();
        }
    };

    const isInitialized = function () {
        // WebExtension storage has async initialization
        if (typeof localStorageImpl.isInitialized === 'function') {
            return localStorageImpl.isInitialized();
        }
        return true;
    };

    return {
        getItem,
        setItem,
        removeItem,
        hasItem,
        init,
        isInitialized,
    };
})(localStorageImpl);

/**
 * This class manages storage for filters.
 */
export const rulesStorage = (rulesStorageImpl => {
    function getFilePath(filterId) {
        return `filterrules_${filterId}.txt`;
    }

    /**
     * Loads filter from the storage
     *
     * @param filterId  Filter identifier
     */
    const read = async (filterId) => {
        const filePath = getFilePath(filterId);
        let rules;
        try {
            rules = await rulesStorageImpl.read(filePath);
        } catch (e) {
            log.error(`Error while reading rules from file ${filePath} cause: ${e}`);
        }
        return rules;
    };

    /**
     * Saves filter rules to storage
     *
     * @param filterId      Filter identifier
     * @param filterRules   Filter rules
     */
    const write = async (filterId, filterRules) => {
        const filePath = getFilePath(filterId);

        try {
            await rulesStorageImpl.write(filePath, filterRules);
        } catch (e) {
            log.error(`Error writing filters to file ${filePath}. Cause: ${e}`);
        }
    };

    /**
     * Removes filter from storage
     * @param filterId
     */
    const remove = async (filterId) => {
        const filePath = getFilePath(filterId);
        try {
            await rulesStorageImpl.remove(filePath);
        } catch (e) {
            log.error(`Error removing filter ${filePath}. Cause: ${e}`);
        }
    };

    /**
     * IndexedDB implementation of the rules storage requires async initialization.
     * Also in some cases IndexedDB isn't supported, so we have to replace implementation
     * with the browser.storage
     */
    const init = async () => {
        if (typeof rulesStorageImpl.init === 'function') {
            const api = await rulesStorageImpl.init();
            rulesStorageImpl = api;
        }
    };

    return {
        read,
        write,
        remove,
        init,
    };
})(rulesStorageImpl);
