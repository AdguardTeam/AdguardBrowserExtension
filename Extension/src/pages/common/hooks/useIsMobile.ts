/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { useState, useEffect } from 'react';

import { debounce } from 'lodash-es';

import { MOBILE_BREAKPOINT_PX } from '../constants';

/**
 * Debounce delay for resize events in milliseconds.
 */
const RESIZE_DEBOUNCE_MS = 200;

/**
 * Hook to detect if the current viewport is mobile-sized.
 *
 * @returns True if viewport width is less than or equal to mobile breakpoint, false otherwise.
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT_PX);

    useEffect(() => {
        const handleResize = debounce(() => {
            setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT_PX);
        }, RESIZE_DEBOUNCE_MS);

        window.addEventListener('resize', handleResize);
        return () => {
            handleResize.cancel();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return isMobile;
};
