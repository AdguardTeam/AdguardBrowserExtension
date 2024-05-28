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

import { MIN_LOADER_SHOWING_TIME_MS } from '../constants';

/**
 * Runs the callback function with a minimum delay to show the loader.
 *
 * Needed when the operation is too fast and the loader is not shown at all or is shown for a very short time.
 *
 * @param setShowLoader Function to set the loader visibility.
 * @param callback Callback function to run.
 */
export const handleWithMinLoaderDelay = (
    setShowLoader: (showLoader: boolean) => void,
    callback: () => void,
): void => {
    const startMs = Date.now();
    setShowLoader(true);

    callback();
    const endMs = Date.now();

    const delayMs = MIN_LOADER_SHOWING_TIME_MS - (endMs - startMs);

    setTimeout(() => {
        setShowLoader(false);
    }, delayMs);
};
