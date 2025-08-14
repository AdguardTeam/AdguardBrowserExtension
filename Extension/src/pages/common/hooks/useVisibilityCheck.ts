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

import {
    useCallback,
    useEffect,
    useState,
} from 'react';

/**
 * Custom hook that checks a condition when the tab becomes visible or window gains focus.
 *
 * @param checkFn Function that returns the current state to check.
 *
 * @returns Current state value that updates when visibility or focus changes.
 */
export const useVisibilityCheck = <T>(checkFn: () => T): T => {
    const [state, setState] = useState<T>(checkFn());

    /**
     * Function to check if state has changed to avoid unnecessary re-renders.
     */
    const checkState = useCallback(() => {
        const currentState = checkFn();
        if (currentState !== state) {
            setState(currentState);
        }
    }, [checkFn, state]);

    /**
     * Initial check on component mount.
     */
    useEffect(() => {
        checkState();
    }, [checkState]);

    useEffect(() => {
        /**
         * Handler for visibility change events.
         */
        const handleVisibilityChange = () => {
            // Only check when page becomes visible again
            if (document.visibilityState === 'visible') {
                checkState();
            }
        };

        /**
         * Handler for window focus events.
         */
        const handleWindowFocus = () => {
            checkState();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [checkState]);

    return state;
};
