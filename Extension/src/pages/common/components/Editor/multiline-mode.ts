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

import { type Extension } from '@codemirror/state';

import { createInlineModeKeymap } from './inline-keymap';

/**
 * Builds extensions that turn the shared editor into a multi-line input: Enter
 * saves the value, Shift-Enter inserts a newline (the default binding), and
 * multi-line-only built-in hotkeys are disabled.
 *
 * Unlike the single-line extensions, inserted line terminators are kept, so a
 * comment block or a multi-rule create draft can grow and shrink freely.
 *
 * The result is meant to be appended to the editor configuration; the shared
 * {@link createInlineModeKeymap} gives it the precedence needed to outrank the
 * built-in `@adguard/rules-editor` keymaps.
 *
 * @param onEnter Called when Enter is pressed in the editor.
 *
 * @returns Extensions to append to the editor configuration.
 */
export const createMultilineModeExtensions = (onEnter: () => void): Extension[] => {
    return [
        // Shift-Enter is intentionally not bound: `defaultKeymap` inserts a
        // newline for it, which is exactly what a multi-line input needs.
        createInlineModeKeymap(onEnter),
    ];
};
