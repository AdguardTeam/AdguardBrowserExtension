/**
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

import { addMinDurationTime } from '../common-script';
import { MIN_LOADER_SHOWING_TIME_MS } from '../constants';

/**
 * Checks if the extension is MV3, and
 * - if so it returns a new callback and shows a loader for at least {@link MIN_LOADER_SHOWING_TIME_MS},
 * - otherwise (for MV2) it returns the callback as it is.
 *
 * @param setShowLoaderCb Callback to set the loader visibility.
 * @param callback Async callback to run.
 *
 * @returns Async callback with the loader showing for at least {@link MIN_LOADER_SHOWING_TIME_MS}.
 */
export const addMinDelayLoader = (
    setShowLoaderCb: (showLoader: boolean) => void,
    callback: (...args: any[]) => Promise<any>,
) => {
    if (!__IS_MV3__) {
        return callback;
    }

    const callbackWithMinDuration = addMinDurationTime(callback, MIN_LOADER_SHOWING_TIME_MS);

    return async (...args: unknown[]) => {
        setShowLoaderCb(true);
        try {
            const response = await callbackWithMinDuration(...args);
            setShowLoaderCb(false);
            return response;
        } catch (e) {
            setShowLoaderCb(false);
            throw e;
        }
    };
};
