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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import { EditorSelection, EditorState } from '@codemirror/state';
import { type EditorView, runScopeHandlers } from '@codemirror/view';

import { initEditor } from '@adguard/rules-editor';

/**
 * Regression tests for the editor behavior the user rules editor relies on
 * from `@adguard/rules-editor` (AdguardBrowserExtension#3607): multi-cursor
 * editing and the Ace-style delete-line shortcut. They run against the real
 * library, without syntax highlighting (no WASM in tests).
 */
describe('@adguard/rules-editor hotkeys used by the user rules editor', () => {
    let parent: HTMLElement;
    let view: EditorView;

    beforeEach(async () => {
        // jsdom does not implement `Range.getClientRects`, which CodeMirror
        // calls when it scrolls the selection into view after an edit.
        if (!Range.prototype.getClientRects) {
            Object.defineProperty(Range.prototype, 'getClientRects', {
                configurable: true,
                value: () => [],
            });
        }

        parent = document.createElement('div');
        const textarea = document.createElement('textarea');
        textarea.value = 'line1\nline2\nline3';
        parent.appendChild(textarea);
        document.body.appendChild(parent);

        view = await initEditor(textarea, undefined, {
            highlight: 'none',
            autofocus: false,
            hotkeys: { mode: 'windows' },
        });
    });

    afterEach(() => {
        view.destroy();
        parent.remove();
    });

    /**
     * Runs the editor keymaps for a keydown, the way CodeMirror does for a key
     * pressed in the editor.
     *
     * @param init Keyboard event options.
     *
     * @returns Whether a key binding handled the event.
     */
    const pressKey = (init: KeyboardEventInit): boolean => runScopeHandlers(
        view,
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }),
        'editor',
    );

    it('allows multiple selections, so Ctrl/Cmd+click adds a cursor', () => {
        expect(view.state.facet(EditorState.allowMultipleSelections)).toBe(true);

        // Two cursors, as placed by Ctrl+click, edit both lines at once.
        view.dispatch({
            selection: EditorSelection.create([
                EditorSelection.cursor(0),
                EditorSelection.cursor('line1\n'.length),
            ]),
        });
        expect(view.state.selection.ranges).toHaveLength(2);

        view.dispatch(view.state.replaceSelection('!'));

        expect(view.state.doc.toString()).toBe('!line1\n!line2\nline3');
    });

    it('deletes the current line on Ctrl+D', () => {
        view.dispatch({ selection: { anchor: 'line1\n'.length + 2 } });

        expect(pressKey({ key: 'd', code: 'KeyD', ctrlKey: true })).toBe(true);

        expect(view.state.doc.toString()).toBe('line1\nline3');
    });

    it('deletes every line with a cursor on Ctrl+D', () => {
        view.dispatch({
            selection: EditorSelection.create([
                EditorSelection.cursor(0),
                EditorSelection.cursor('line1\nline2\n'.length),
            ]),
        });

        pressKey({ key: 'd', code: 'KeyD', ctrlKey: true });

        expect(view.state.doc.toString()).toBe('line2');
    });
});
