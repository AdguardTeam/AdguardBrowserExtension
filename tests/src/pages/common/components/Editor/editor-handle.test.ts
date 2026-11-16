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
    Compartment,
    EditorSelection,
    EditorState,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history, undo } from '@codemirror/commands';
import { searchPanelOpen } from '@codemirror/search';
import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import {
    createEditorHandle,
    createDeferredEditorHandle,
} from '../../../../../../Extension/src/pages/common/components/Editor/editor-handle';

describe('createEditorHandle', () => {
    let view: EditorView;
    let wrap: Compartment;
    let readOnly: Compartment;
    let parent: HTMLElement;

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
        wrap = new Compartment();
        readOnly = new Compartment();
        view = new EditorView({
            parent,
            state: EditorState.create({
                doc: 'line1\nline2',
                extensions: [
                    wrap.of([]),
                    readOnly.of([]),
                    history(),
                    // The rules editor enables multiple selections by default.
                    EditorState.allowMultipleSelections.of(true),
                ],
            }),
        });
    });

    afterEach(() => {
        view.destroy();
        parent.remove();
    });

    it('reads the document', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        expect(handle.getValue()).toBe('line1\nline2');
    });

    it('opens the search panel', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        expect(searchPanelOpen(view.state)).toBe(false);

        handle.openSearch();

        expect(searchPanelOpen(view.state)).toBe(true);
        expect(view.dom.querySelector('.cm-panel.cm-search input[name="search"]')).not.toBeNull();
    });

    it('replaces the document and clamps cursor to end', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setValue('new content');
        expect(handle.getValue()).toBe('new content');
        expect(handle.getCursor()).toEqual({ line: 1, ch: 'new content'.length });
    });

    it('does not let undo clear a resetValue seed', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });

        // This is the seed path for content fetched after mount: undo must not
        // be able to clear the document, otherwise Ctrl/Cmd+Z right after
        // opening an editor sends an empty value to save.
        handle.resetValue('x');
        undo(view);

        expect(handle.getValue()).toBe('x');
    });

    it('keeps setValue undoable', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });

        handle.setValue('x');
        undo(view);

        // Unlike resetValue, setValue is a normal history entry.
        expect(handle.getValue()).toBe('line1\nline2');
    });

    it('loads CRLF content and places the cursor at the normalized document end', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });

        expect(() => handle.setValue('first line\r\nsecond line')).not.toThrow();
        expect(handle.getValue()).toBe('first line\nsecond line');
        expect(handle.getCursor()).toEqual({ line: 2, ch: 'second line'.length });
    });

    it('round-trips the cursor (1-based line, 0-based ch)', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setCursor({ line: 2, ch: 3 });
        expect(handle.getCursor()).toEqual({ line: 2, ch: 3 });
    });

    it('clamps an out-of-range cursor', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setCursor({ line: 99, ch: 99 });
        const cur = handle.getCursor();
        expect(cur.line).toBe(2);
        expect(cur.ch).toBe('line2'.length);
    });

    it('reads every range of a multi-range selection', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });

        // 'line1' on the first line and 'ine' on the second one, with the
        // second range as the main one.
        view.dispatch({
            selection: EditorSelection.create([
                EditorSelection.range(0, 5),
                EditorSelection.range(7, 10),
            ], 1),
        });

        expect(handle.getSelection()).toEqual({
            ranges: [
                { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 5 } },
                { anchor: { line: 2, ch: 1 }, head: { line: 2, ch: 4 } },
            ],
            mainIndex: 1,
        });
    });

    it('restores a multi-range selection after the document was replaced', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        const selection = {
            ranges: [
                { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 3 } },
                { anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 7 } },
            ],
            mainIndex: 1,
        };

        // The whole document is replaced while saving, which drops the
        // selection, so it is restored afterwards.
        handle.setValue('new\ncontent');
        handle.setSelection(selection);

        expect(handle.getSelection()).toEqual(selection);
    });

    it('clamps an out-of-range selection', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setSelection({
            ranges: [{ anchor: { line: 99, ch: 99 }, head: { line: 99, ch: 99 } }],
            mainIndex: 0,
        });

        expect(handle.getCursor()).toEqual({ line: 2, ch: 'line2'.length });
    });

    it('toggles line wrapping via the compartment without throwing', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        // Toggle on and off — both should complete without error
        expect(() => handle.setWrap(true)).not.toThrow();
        expect(() => handle.setWrap(false)).not.toThrow();
    });

    it('toggles read-only via the compartment', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setReadOnly(true);
        expect(view.state.readOnly).toBe(true);
        handle.setReadOnly(false);
        expect(view.state.readOnly).toBe(false);
    });
});

describe('createDeferredEditorHandle', () => {
    let wrap: Compartment;
    let readOnly: Compartment;
    let parent: HTMLElement;

    const createView = (doc = 'line1\nline2') => new EditorView({
        parent,
        state: EditorState.create({
            doc,
            extensions: [
                wrap.of([]),
                readOnly.of([]),
                // The rules editor enables multiple selections by default.
                EditorState.allowMultipleSelections.of(true),
            ],
        }),
    });

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
        wrap = new Compartment();
        readOnly = new Compartment();
    });

    afterEach(() => {
        parent.remove();
    });

    it('exposes a usable handle before the view is attached', () => {
        const { handle } = createDeferredEditorHandle();
        expect(handle.getValue()).toBe('');
        expect(handle.getCursor()).toEqual({ line: 1, ch: 0 });
        expect(() => handle.setValue('buffered')).not.toThrow();
    });

    it('replays a buffered openSearch once attached', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.openSearch();

        const view = createView();
        expect(searchPanelOpen(view.state)).toBe(false);
        deferred.attach(view, { wrap, readOnly });

        expect(searchPanelOpen(view.state)).toBe(true);
        view.destroy();
    });

    it('replays a buffered setValue once attached', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setValue('content set before ready');

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(deferred.handle.getValue()).toBe('content set before ready');
        view.destroy();
    });

    it('replays buffered CRLF content once attached', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setValue('first line\r\nsecond line');

        const view = createView();

        expect(() => deferred.attach(view, { wrap, readOnly })).not.toThrow();
        expect(deferred.handle.getValue()).toBe('first line\nsecond line');
        expect(deferred.handle.getCursor()).toEqual({ line: 2, ch: 'second line'.length });
        view.destroy();
    });

    it('replays setValue before setCursor so the cursor is preserved', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setValue('alpha\nbeta');
        deferred.handle.setCursor({ line: 2, ch: 2 });

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(deferred.handle.getValue()).toBe('alpha\nbeta');
        expect(deferred.handle.getCursor()).toEqual({ line: 2, ch: 2 });
        view.destroy();
    });

    it('buffers a selection before the view is attached', () => {
        const deferred = createDeferredEditorHandle();

        // Before the view exists, the readers return a sync default.
        expect(deferred.handle.getSelection()).toEqual({
            ranges: [{ anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } }],
            mainIndex: 0,
        });

        deferred.handle.setValue('alpha\nbeta');
        deferred.handle.setSelection({
            ranges: [
                { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 2 } },
                { anchor: { line: 2, ch: 1 }, head: { line: 2, ch: 3 } },
            ],
            mainIndex: 1,
        });

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(deferred.handle.getSelection()).toEqual({
            ranges: [
                { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 2 } },
                { anchor: { line: 2, ch: 1 }, head: { line: 2, ch: 3 } },
            ],
            mainIndex: 1,
        });
        view.destroy();
    });

    it('replays buffered wrap and read-only state', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setReadOnly(true);
        deferred.handle.setWrap(true);

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(view.state.readOnly).toBe(true);
        expect(wrap.get(view.state)).toBe(EditorView.lineWrapping);
        view.destroy();
    });

    it('delegates to the live view after attach', () => {
        const deferred = createDeferredEditorHandle();
        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        deferred.handle.setValue('after attach');
        expect(deferred.handle.getValue()).toBe('after attach');
        expect(view.state.doc.toString()).toBe('after attach');
        view.destroy();
    });

    it('ignores writes after detach', () => {
        const deferred = createDeferredEditorHandle();
        const view = createView('persisted');
        deferred.attach(view, { wrap, readOnly });
        deferred.detach();

        // After detach, buffered writes are dropped instead of touching a
        // destroyed view.
        expect(() => deferred.handle.setValue('ignored')).not.toThrow();
        expect(view.state.doc.toString()).toBe('persisted');
        view.destroy();
    });
});
