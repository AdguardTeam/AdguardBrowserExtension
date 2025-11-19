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

import { type RefObject, useEffect } from 'react';

import { throttle } from 'lodash-es';

/**
 * Hook for tracking dom element resize.
 *
 * @param ref Reference to tracking dom element.
 * @param callback Tracking flag.
 * @param throttleTimeMs Throttle time in ms, default is 500ms.
 *
 * @returns
 */
export const useResizeObserver = (
    ref: RefObject<HTMLElement>,
    callback: ([entry]: any) => void,
    throttleTimeMs = 500,
) => {
    useEffect(() => {
        const target = ref.current;

        if (!target) {
            return;
        }

        const observer = new ResizeObserver(throttle(callback, throttleTimeMs));

        observer.observe(target);

        return () => {
            observer.unobserve(target);
        };
    }, [ref, callback, throttleTimeMs]);
};
