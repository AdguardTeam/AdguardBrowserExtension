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

import { useState, useCallback } from 'react';
import { useResizeObserver } from './useResizeObserver';

/**
 * Detects if container content is overflowed
 *
 * @param {React.Ref} ref - reference to tracking dom element
 * @param {object} track - tracking flags
 * @param {boolean} track.x - tracking overflow on x axis
 * @param {boolean} track.y - tracking overflow on y axis
 * @param {number} throttleTime - throttle time in ms
 * @returns {boolean}
 */
export const useOverflowed = (ref, track = { x: false, y: true }, throttleTime = 500) => {
    const [isOverflowed, setOverflowed] = useState(false);

    const calcIsOverflowed = useCallback(([entry]) => {
        const el = entry.target;
        let overflowedX = false;
        let overflowedY = false;
        if (track.x) {
            overflowedX = el.scrollWidth > el.offsetWidth;
        }
        if (track.y) {
            overflowedY = el.scrollHeight > el.offsetHeight;
        }

        /**
         * call setState within requestAnimationFrame to prevent inifinite loop
         */
        window.requestAnimationFrame(() => {
            if (ref && ref.current) {
                setOverflowed(overflowedX || overflowedY);
            }
        });
    }, [track, ref]);

    useResizeObserver(ref, calcIsOverflowed, throttleTime);

    return isOverflowed;
};
