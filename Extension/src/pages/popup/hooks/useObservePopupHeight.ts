/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react';

/**
 * Minimum height for the popup. Value is based on calculation:
 * Android Extension Window Height = clamp(Popup Height, 15% of viewport height, 70% of viewport height)
 *
 * We took average mobile viewport height as 785px from:
 * {@link https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide}
 *
 * 70% of 785px = 550px
 */
export const POPUP_MIN_HEIGHT = 550;

/**
 * Base height of popup in desktop extension.
 */
export const POPUP_DEFAULT_HEIGHT = 600;

/**
 * Hook to observe popup height on Android browsers.
 *
 * @param isAndroidBrowser If the browser is Android browser.
 * @param callback Callback to be called when popup height is changed.
 * @param androidCleanUpCallback Cleanup callback for Android browsers.
 * @param cleanUpCallback Cleanup callback for non-Android browsers.
 */
export function useObservePopupHeight(
    isAndroidBrowser: boolean,
    callback: (newHeight: number) => void,
    androidCleanUpCallback: () => void,
    cleanUpCallback?: () => void,
) {
    // Use refs only to avoid unnecessary re-renders
    const callbackRef = useRef(callback);
    const androidCleanUpCallbackRef = useRef(androidCleanUpCallback);
    const cleanUpCallbackRef = useRef(cleanUpCallback);
    const prevHeight = useRef<number | null>(null);

    useLayoutEffect(() => {
        if (!isAndroidBrowser) {
            androidCleanUpCallbackRef.current();

            return () => {
                if (cleanUpCallbackRef.current) {
                    cleanUpCallbackRef.current();
                }
            };
        }

        const resizePopupHeight = () => {
            /**
             * From observation on Android browsers, popup's `windows.innerHeight` is properly set only on third time:
             * 1. Initially equal to 0
             * 2. After that it is set to 15% (approx) of viewport height
             * 3. Finally it calculates properly fixed at 70% (approx) of viewport height.
             *
             * Example if viewport height is 840px:
             * 0px -> 126px (15% of 840px) -> 588px (70% of 840px)
             *
             * Example if viewport height is 770px:
             * 0px -> 115px (15% of 770px) -> 550px (we ignore 539px (70% of 770px) because it's smaller than 550px)
             *
             * This is needed to display the popup properly on Android browsers.
             */
            if (window.innerHeight < POPUP_MIN_HEIGHT) {
                return;
            }

            // Update prev height and call the callback only if height is changed
            const isHeightChanged = prevHeight.current !== window.innerHeight;
            if (isHeightChanged) {
                prevHeight.current = window.innerHeight;
                callbackRef.current(window.innerHeight);
            }
        };

        // Resize on initial render
        resizePopupHeight();

        // Add resize event listener
        // NOTE: Do not use `once` option because it may cause unexpected
        // behavior on Android browsers when keyboard is opened.
        window.addEventListener('resize', resizePopupHeight);

        // Cleanup: Remove the height property and event listener after unmount
        return () => {
            androidCleanUpCallbackRef.current();
            window.removeEventListener('resize', resizePopupHeight);
        };
    }, [isAndroidBrowser]);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        androidCleanUpCallbackRef.current = androidCleanUpCallback;
    }, [androidCleanUpCallback]);

    useEffect(() => {
        cleanUpCallbackRef.current = cleanUpCallback;
    }, [cleanUpCallback]);
}
