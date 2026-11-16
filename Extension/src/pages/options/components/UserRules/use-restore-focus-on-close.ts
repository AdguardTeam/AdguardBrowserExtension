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

import {
    type RefObject,
    useLayoutEffect,
    useRef,
} from 'react';

/**
 * Restores focus to the referenced element when the component that owned it
 * closes: when `open` flips from `true` to `false`, focus returns to the
 * element — unless something else claimed it in the meantime (the active
 * element is no longer `<body>`) or focusing is currently `blocked` (e.g. the
 * element is disabled), in which case the restore is deferred and retried once
 * `blocked` clears.
 *
 * Used by the user rules list for the row edit buttons and the Create rule
 * button: closing an editor unmounts it, and without this the focus would drop
 * to `<body>`, losing the keyboard user's place.
 *
 * @param open Whether the component that owns the focus is open.
 * @param blocked Whether focusing the target is currently impossible (e.g. the
 * element is disabled, or a save is in flight).
 * @param ref Ref to the element that should receive focus back.
 */
export const useRestoreFocusOnClose = (
    open: boolean,
    blocked: boolean,
    ref: RefObject<HTMLButtonElement | null>,
): void => {
    const wasOpenRef = useRef(open);
    // Whether leaving the open state should return focus to the button. The
    // restore is deferred while `blocked` is true (e.g. the button is disabled
    // during a save) and retried once it clears.
    const shouldRestoreRef = useRef(false);

    useLayoutEffect(() => {
        if (wasOpenRef.current && !open) {
            shouldRestoreRef.current = true;
        }
        wasOpenRef.current = open;

        if (!shouldRestoreRef.current || blocked) {
            return;
        }
        shouldRestoreRef.current = false;

        // Only take focus back when nothing else claimed it in the meantime
        // (e.g. the search input).
        const { activeElement } = document;
        if (activeElement === document.body || activeElement === null) {
            ref.current?.focus();
        }
    }, [open, blocked, ref]);
};
