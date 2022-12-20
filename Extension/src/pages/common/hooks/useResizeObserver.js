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

import { useEffect } from 'react';

import throttle from 'lodash/throttle';

/**
 * @param {HTMLElement} ref - reference to tracking dom element
 * @param {Function} callback - tracking flags
 * @param {number} throttleTime - throttle time in ms
 * @returns {void}
 */
export const useResizeObserver = (ref, callback, throttleTime = 500) => {
    useEffect(() => {
        const target = ref.current;
        const observer = new ResizeObserver(throttle(callback, throttleTime));

        observer.observe(target);

        return () => {
            observer.unobserve(target);
        };
    }, [ref, callback, throttleTime]);
};
