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
    useEffect,
    useRef,
} from 'react';

import { UserAgent } from '../../../common/user-agent';
import { REACT_MODAL_OVERLAY_CLASS } from '../constants';

/**
 * Physical key code of the find shortcut key.
 */
const FIND_KEY_CODE = 'KeyF';

/**
 * Character typed by the find shortcut key on a Latin layout.
 */
const FIND_KEY = 'f';

/**
 * Matches a single Latin letter, i.e. a `key` value from a Latin layout, where
 * the typed letter defines the shortcut.
 */
const LATIN_LETTER_RE = /^[a-z]$/i;

/**
 * Checks whether a keyboard event is the browser's find shortcut: `Cmd+F` on
 * macOS and `Ctrl+F` on other platforms, without other modifiers.
 *
 * The typed character is checked before the physical key code, because the
 * code alone also matches other shortcuts on non-Latin layouts: on Dvorak
 * `KeyF` types `u`, so `Ctrl+U` would open the search as well. The code is used
 * only when `key` is not a Latin letter, i.e. on layouts such as Cyrillic where
 * the character does not identify the key.
 *
 * @param event Keyboard event to check.
 * @param isMac Whether the platform is macOS.
 *
 * @returns `true` if the event is the find shortcut.
 */
export const isFindShortcut = (event: KeyboardEvent, isMac: boolean): boolean => {
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    const otherModifier = isMac ? event.ctrlKey : event.metaKey;
    if (!modifier || otherModifier || event.altKey || event.shiftKey) {
        return false;
    }

    if (LATIN_LETTER_RE.test(event.key)) {
        return event.key.toLowerCase() === FIND_KEY;
    }

    return event.code === FIND_KEY_CODE;
};

/**
 * Options of the {@link useFindShortcut} hook.
 */
type UseFindShortcutOptions = {
    /**
     * Whether the shortcut is captured.
     */
    enabled: boolean;

    /**
     * Called instead of the browser's find when the shortcut is pressed.
     */
    onFind: () => void;

    /**
     * Element whose own keyboard handling takes precedence: the shortcut is
     * left alone when it is pressed inside it, e.g. inside a CodeMirror editor
     * that opens its own search panel.
     */
    ignoreWithinRef?: RefObject<HTMLElement>;
};

/**
 * Replaces the browser's find (`Ctrl+F` / `Cmd+F`) with a page-specific search
 * while `enabled` is set.
 *
 * The browser's find only sees the rendered DOM, while the user rules editor
 * and list render only the rows in view: CodeMirror draws the visible lines,
 * and the list is virtualized. Searching them with the browser's find misses
 * every match outside the viewport, so these views open their own search,
 * which covers the whole rule set.
 *
 * The shortcut is left to the browser (or to the focused element) when the
 * event was already handled, when a modal dialog is open, or when it is
 * pressed inside `ignoreWithinRef`.
 *
 * @param options Hook options.
 * @param options.enabled Whether the shortcut is captured.
 * @param options.onFind Called instead of the browser's find.
 * @param options.ignoreWithinRef Element whose own keyboard handling takes precedence.
 */
export const useFindShortcut = ({ enabled, onFind, ignoreWithinRef }: UseFindShortcutOptions): void => {
    // The latest callback, so the listener is not re-registered on every
    // render of the owner.
    const onFindRef = useRef(onFind);
    onFindRef.current = onFind;

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const isMac = UserAgent.isMacOs;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || !isFindShortcut(event, isMac)) {
                return;
            }

            if (document.querySelector(`.${REACT_MODAL_OVERLAY_CLASS}`) !== null) {
                return;
            }

            const ignoreWithin = ignoreWithinRef?.current;
            if (ignoreWithin && event.target instanceof Node && ignoreWithin.contains(event.target)) {
                return;
            }

            event.preventDefault();
            onFindRef.current();
        };

        // Capture phase: runs before handlers of the focused element, which
        // could otherwise stop the event before it reaches the document.
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [enabled, ignoreWithinRef]);
};
