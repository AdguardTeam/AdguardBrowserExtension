/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { browser } from '../extension-api/browser';

/**
 * Filter rules storage implementation
 */
const chromeRulesStorageImpl = (() => {
    const read = async (path) => {
        const results = await browser.storage.local.get(path);
        let lines = [];
        if (results && results[path] instanceof Array) {
            lines = results[path];
        }
        return lines;
    };

    const write = async (path, data) => {
        const item = {};
        item[path] = data;
        await browser.storage.local.set(item);
    };

    const remove = async (path) => {
        await browser.storage.local.remove(path);
    };

    return {
        read,
        write,
        remove,
    };
})();

export default chromeRulesStorageImpl;
