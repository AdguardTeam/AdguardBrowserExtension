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

import { Prec, type Extension } from '@codemirror/state';
import { keymap, type KeyBinding } from '@codemirror/view';

/**
 * A hotkey to swallow in the inline editors, optionally scoped to a platform.
 *
 * Platform-specific entries leave the chord alone on the other platforms,
 * where its built-in meaning is useful.
 */
type DisabledHotkey = Pick<KeyBinding, 'key' | 'mac' | 'win' | 'linux'>;

/**
 * Built-in hotkeys that make no sense in a single-line or multi-line inline
 * editor and must be swallowed before their keymaps handle them.
 *
 * `Prec.highest` is required because `@adguard/rules-editor` installs its
 * keymaps before the caller-supplied extensions; CodeMirror checks bindings by
 * precedence, not by registration order.
 */
export const DISABLED_HOTKEYS: DisabledHotkey[] = [
    /**
     * Opens the search panel.
     */
    {
        key: 'Mod-f',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'Mod-h',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'F3',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'Shift-F3',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'Mod-g',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'Mod-Shift-g',
    },

    /**
     * Opens the search panel on Windows and Linux. Cmd-K stays available on
     * macOS, where the rules editor does not bind it.
     */
    {
        win: 'Ctrl-k',
        linux: 'Ctrl-k',
    },

    /**
     * Opens the search panel on Windows and Linux. On macOS Shift-Cmd-K
     * deletes the line, so the multi-line editors must keep it.
     */
    {
        win: 'Ctrl-Shift-k',
        linux: 'Ctrl-Shift-k',
    },

    /**
     * Opens the search panel.
     */
    {
        key: 'Mod-Alt-f',
    },

    /**
     * Opens the go-to-line dialog.
     */
    {
        key: 'Mod-l',
    },

    /**
     * Opens the go-to-line dialog.
     */
    {
        key: 'Mod-Alt-g',
    },

    /**
     * Copies the current line up on macOS. On Windows and Linux Ctrl-Alt-ArrowUp
     * only adds a cursor, so it is left alone there.
     */
    {
        mac: 'Cmd-Alt-ArrowUp',
    },

    /**
     * Copies the current line down on macOS. On Windows and Linux
     * Ctrl-Alt-ArrowDown only adds a cursor, so it is left alone there.
     */
    {
        mac: 'Cmd-Alt-ArrowDown',
    },

    /**
     * Toggles comment markers.
     */
    {
        key: 'Mod-/',
    },

    /**
     * Moves the current line up.
     */
    {
        key: 'Alt-ArrowUp',
    },

    /**
     * Moves the current line down.
     */
    {
        key: 'Alt-ArrowDown',
    },

    /**
     * Copies the current line up.
     */
    {
        key: 'Shift-Alt-ArrowUp',
    },

    /**
     * Copies the current line down.
     */
    {
        key: 'Shift-Alt-ArrowDown',
    },
];

/**
 * Builds the highest-precedence keymap shared by the inline editor modes: Enter
 * saves the value, the given mode-specific bindings are added, and the
 * multi-line-only built-in hotkeys are swallowed. Kept in one place so hotkey
 * fixes apply to every mode.
 *
 * The result is meant to be appended to the editor configuration; it uses
 * `Prec.highest` to outrank the built-in `@adguard/rules-editor` keymaps.
 *
 * @param onEnter Called when Enter is pressed in the editor.
 * @param extraBindings Mode-specific bindings to add next to Enter.
 *
 * @returns Keymap extension to append to the editor configuration.
 */
export const createInlineModeKeymap = (
    onEnter: () => void,
    extraBindings: KeyBinding[] = [],
): Extension => {
    return Prec.highest(keymap.of([
        {
            key: 'Enter',
            run: () => {
                onEnter();
                return true;
            },
        },
        ...extraBindings,
        ...DISABLED_HOTKEYS.map((hotkey): KeyBinding => ({
            ...hotkey,
            run: () => true,
        })),
    ]));
};
