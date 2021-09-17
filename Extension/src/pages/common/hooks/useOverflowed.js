import { useState, useCallback } from 'react';
import { useResizeObserver } from './useResizeObserver';

/**
 * Detects if container content is overflowed
 * @param {React.Ref} ref - reference to tracking dom element
 * @param {Object} track - tracking flags
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
