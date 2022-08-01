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

import { browser } from '../background/extension-api/browser';

export const runtimeImpl = (() => {
    return {
        onMessage: browser.runtime.onMessage,
        sendMessage: browser.runtime.sendMessage,
    };
})();

// eslint-disable-next-line prefer-destructuring
export const i18n = browser.i18n;

/**
 * Sleeps given period of time
 * @param wait
 * @returns {Promise<unknown>}
 */
export const sleep = (wait) => {
    return new Promise((resolve) => {
        setTimeout(resolve, wait);
    });
};

/**
 * Sleeps necessary period of time if minimum duration didn't pass since entry time
 * @param {number} entryTimeMs
 * @param {number} minDurationMs
 * @returns {Promise<void>}
 */
export const sleepIfNecessary = async (entryTimeMs, minDurationMs) => {
    if (Date.now() - entryTimeMs < minDurationMs) {
        await sleep(minDurationMs - (Date.now() - entryTimeMs));
    }
};

/**
 * Executes async function with at least required time
 * @param fn
 * @param minDurationMs
 */
export const addMinDurationTime = (fn, minDurationMs) => {
    return async (...args) => {
        const start = Date.now();

        try {
            const response = await fn(...args);
            await sleepIfNecessary(start, minDurationMs);
            return response;
        } catch (e) {
            await sleepIfNecessary(start, minDurationMs);
            throw e;
        }
    };
};
