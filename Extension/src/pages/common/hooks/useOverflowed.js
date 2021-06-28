import {
    useState,
    useEffect,
    useCallback,
} from 'react';

import throttle from 'lodash/throttle';

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

    const calcIsOverflowed = useCallback((el) => {
        let overflowedX = false;
        let overflowedY = false;
        if (track.x) {
            overflowedX = el.scrollWidth > el.offsetWidth;
        }
        if (track.y) {
            overflowedY = el.scrollHeight > el.offsetHeight;
        }

        return overflowedX || overflowedY;
    }, [track]);

    useEffect(() => {
        const target = ref.current;
        setOverflowed(calcIsOverflowed(target));

        const observer = new ResizeObserver(throttle(([entry]) => {
            setOverflowed(calcIsOverflowed(entry.target));
        }, throttleTime));

        observer.observe(target);

        return () => {
            observer.unobserve(target);
        };
    }, [ref, calcIsOverflowed, throttleTime]);

    return isOverflowed;
};
