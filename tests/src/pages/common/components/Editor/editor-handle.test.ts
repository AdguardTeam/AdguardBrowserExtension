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

import { EditorState, Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
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
                extensions: [wrap.of([]), readOnly.of([])],
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

    it('replaces the document and clamps cursor to end', () => {
        const handle = createEditorHandle(view, { wrap, readOnly });
        handle.setValue('new content');
        expect(handle.getValue()).toBe('new content');
        expect(handle.getCursor()).toEqual({ line: 1, ch: 'new content'.length });
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
            extensions: [wrap.of([]), readOnly.of([])],
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

    it('replays a buffered setValue once attached', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setValue('content set before ready');

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(deferred.handle.getValue()).toBe('content set before ready');
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

    it('replays buffered wrap and read-only state', () => {
        const deferred = createDeferredEditorHandle();
        deferred.handle.setReadOnly(true);
        deferred.handle.setWrap(true);

        const view = createView();
        deferred.attach(view, { wrap, readOnly });

        expect(view.state.readOnly).toBe(true);
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
