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
