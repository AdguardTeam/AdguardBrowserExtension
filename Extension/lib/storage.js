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

/**
 * localStorage interface. Implementation depends on browser
 */
adguard.localStorageImpl = adguard.localStorageImpl || (function () {
    function notImplemented() {
        throw new Error('Not implemented');
    }

    return {
        getItem: notImplemented,
        setItem: notImplemented,
        removeItem: notImplemented,
        hasItem: notImplemented,
    };
})();

/**
 * This class manages local storage
 */
adguard.localStorage = (function (adguard, impl) {
    const getItem = function (key) {
        return impl.getItem(key);
    };

    const setItem = function (key, value) {
        try {
            impl.setItem(key, value);
        } catch (ex) {
            adguard.console.error(`Error while saving item ${key} to the localStorage: ${ex}`);
        }
    };

    const removeItem = function (key) {
        impl.removeItem(key);
    };

    const hasItem = function (key) {
        return impl.hasItem(key);
    };

    const init = function (callback) {
        if (typeof impl.init === 'function') {
            impl.init(callback);
        } else {
            callback();
        }
    };

    const isInitialized = function () {
        // WebExtension storage has async initialization
        if (typeof impl.isInitialized === 'function') {
            return impl.isInitialized();
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
})(adguard, adguard.localStorageImpl);

/**
 * Rules storage interface. Implementation depends on browser
 */
adguard.rulesStorageImpl = adguard.rulesStorageImpl || (function () {
    function notImplemented() {
        throw new Error('Not implemented');
    }

    return {
        read: notImplemented,
        write: notImplemented,
    };
})();

/**
 * This class manages storage for filters.
 */
adguard.rulesStorage = (function (adguard, impl) {
    function getFilePath(filterId) {
        return `filterrules_${filterId}.txt`;
    }

    /**
     * Loads filter from the storage
     *
     * @param filterId  Filter identifier
     * @param callback  Called when file content has been loaded
     */
    const read = function (filterId, callback) {
        const filePath = getFilePath(filterId);
        impl.read(filePath, (e, rules) => {
            if (e) {
                adguard.console.error(`Error while reading rules from file ${filePath} cause: ${e}`);
            }
            callback(rules);
        });
    };

    /**
     * Saves filter rules to storage
     *
     * @param filterId      Filter identifier
     * @param filterRules   Filter rules
     * @param callback      Called when save operation is finished
     */
    const write = function (filterId, filterRules, callback) {
        const filePath = getFilePath(filterId);
        impl.write(filePath, filterRules, (e) => {
            if (e) {
                adguard.console.error(`Error writing filters to file ${filePath}. Cause: ${e}`);
            }
            callback();
        });
    };

    /**
     * Removes filter from storage
     * @param filterId
     * @param callback
     */
    const remove = (filterId, callback) => {
        const filePath = getFilePath(filterId);
        impl.remove(filePath, (e) => {
            if (e) {
                adguard.console.error(`Error removing filter ${filePath}. Cause: ${e}`);
            }
            callback();
        });
    };

    /**
     * IndexedDB implementation of the rules storage requires async initialization.
     * Also in some cases IndexedDB isn't supported, so we have to replace implementation
     * with the browser.storage
     *
     * @param callback
     */
    const init = function (callback) {
        if (typeof impl.init === 'function') {
            impl.init((api) => {
                impl = api;
                callback();
            });
        } else {
            callback();
        }
    };

    return {
        read,
        write,
        remove,
        init,
    };
})(adguard, adguard.rulesStorageImpl);
