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

import { addMinDurationTime } from '../../../common/common-script';
import { MIN_LOADER_SHOWING_TIME_MS } from '../constants';

/**
 * Checks if the extension is MV3, and
 * - if so it returns a new callback that starts showing a loader for at least {@link MIN_LOADER_SHOWING_TIME_MS},
 * - otherwise (for MV2) it returns the callback as it is.
 *
 * Note: it may happen that async callback is passed but it is not awaited, e.g. FiltersService.enableFilter,
 * that's why if the callback succeeds, the function does not hide the loader
 * and it should be done on options page data update (should be fixed later AG-33293);
 * if the callback throws an error, the function hides the loader and rethrows the error.
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
            // TODO: some async callback are not awaited, e.g. FiltersService.enableFilter,
            // so the loader should not be hidden here, but on options page data update; should be fixed later AG-33293
            // setShowLoaderCb(false);
            return response;
        } catch (e) {
            setShowLoaderCb(false);
            throw e;
        }
    };
};

/**
 * Similar to {@link addMinDelayLoader}, but hides the loader after the callback is executed.
 *
 * @param setShowLoaderCb Callback to set the loader visibility.
 * @param callback Async callback to run.
 *
 * @returns Async callback with the loader showing for at least {@link MIN_LOADER_SHOWING_TIME_MS}.
 */
export const addMinDelayLoaderAndRemove = (
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
