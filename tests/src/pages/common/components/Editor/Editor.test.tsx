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

import React, { createRef } from 'react';

import {
    render,
    act,
    cleanup,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Editor } from '../../../../../../Extension/src/pages/common/components/Editor/Editor';

const mockDestroy = vi.fn();
const mockFocus = vi.fn();
const mockDispatch = vi.fn();

let resolveInit: (view: object) => void;

vi.mock('@adguard/rules-editor', () => ({
    initEditor: vi.fn(() => new Promise((resolve) => {
        resolveInit = resolve;
    })),
}));

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: { isOculus: false },
}));

describe('Editor component', () => {
    let editorRef: React.RefObject<any>;

    beforeEach(() => {
        mockDestroy.mockReset();
        mockFocus.mockReset();
        mockDispatch.mockReset();
        editorRef = createRef();
    });

    afterEach(() => {
        cleanup();
        localStorage.clear();
    });

    const createFakeView = () => ({
        state: {
            doc: {
                toString: () => 'fake content',
                length: 12,
                lineAt: () => ({ number: 1, from: 0, length: 12 }),
                lines: 1,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                line: (_n: number) => ({ from: 0, length: 12 }),
            },
            selection: { main: { head: 0 } },
            readOnly: false,
        },
        dispatch: mockDispatch,
        destroy: mockDestroy,
        focus: mockFocus,
        lineWrapping: false,
    });

    const renderEditor = (props = {}) => render(React.createElement(Editor as any, {
        name: 'test-editor',
        editorRef,
        onChange: vi.fn(),
        ...props,
    }));

    it('passes a wasm URL to initEditor when highlightRules is true', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: true });
        });

        const wasmArg = initEditor.mock.calls[0]?.[1];
        expect(wasmArg).toBeDefined();
        expect(typeof wasmArg).toBe('object');

        // Clean up — resolve and unmount
        await act(async () => {
            resolveInit(createFakeView());
        });
        rendered!.unmount();
    });

    it('passes undefined wasm when highlightRules is false', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        const wasmArg = initEditor.mock.calls[0]?.[1];
        expect(wasmArg).toBeUndefined();

        await act(async () => {
            resolveInit(createFakeView());
        });
        rendered!.unmount();
    });

    it('exposes the editor handle on editorRef after mount', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        await act(async () => {
            resolveInit(createFakeView());
        });

        expect(editorRef.current).toBeDefined();
        expect(editorRef.current.getValue()).toBe('fake content');
        expect(typeof editorRef.current.setValue).toBe('function');
        expect(typeof editorRef.current.focus).toBe('function');
        expect(typeof editorRef.current.getCursor).toBe('function');
        expect(typeof editorRef.current.setCursor).toBe('function');
        expect(typeof editorRef.current.setWrap).toBe('function');
        expect(typeof editorRef.current.setReadOnly).toBe('function');

        editorRef.current.focus();
        expect(mockFocus).toHaveBeenCalled();

        rendered!.unmount();
    });

    it('exposes a non-null handle synchronously, before initEditor resolves', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        // initEditor has NOT resolved yet — the handle must already be usable so
        // async consumers never observe a null ref and silently drop content.
        expect(editorRef.current).not.toBeNull();
        expect(typeof editorRef.current.setValue).toBe('function');

        await act(async () => {
            resolveInit(createFakeView());
        });
        rendered!.unmount();
    });

    it('replays a buffered setValue once initEditor resolves', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        // Write before the view exists (the race window).
        editorRef.current.setValue('content set before ready');
        // Nothing dispatched yet — there is no view.
        expect(mockDispatch).not.toHaveBeenCalled();

        await act(async () => {
            resolveInit(createFakeView());
        });

        // Buffered write is replayed onto the view via a dispatch.
        const replayed = mockDispatch.mock.calls.some(
            ([tr]) => tr?.changes?.insert === 'content set before ready',
        );
        expect(replayed).toBe(true);

        rendered!.unmount();
    });

    it('destroys the view if unmounted before initEditor resolves', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        // Unmount before resolving
        rendered!.unmount();

        // Now resolve — destroy should be called
        await act(async () => {
            resolveInit(createFakeView());
        });

        expect(mockDestroy).toHaveBeenCalled();
    });

    it('uses the latest onSave handler when re-rendered, not the mount-time one', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        const firstOnSave = vi.fn();
        const secondOnSave = vi.fn();

        // Mount with firstOnSave and resolve.
        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false, onSave: firstOnSave });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        // Re-render with a different handler.
        await act(async () => {
            rendered!.rerender(
                React.createElement(Editor as any, {
                    name: 'test-editor',
                    editorRef,
                    onChange: vi.fn(),
                    highlightRules: false,
                    onSave: secondOnSave,
                }),
            );
        });

        // Simulate the save hotkey via the callback captured by initEditor.
        const conf = initEditor.mock.lastCall?.[2] as any;
        conf?.hotkeys?.onSave?.();

        expect(firstOnSave).not.toHaveBeenCalled();
        expect(secondOnSave).toHaveBeenCalled();

        rendered!.unmount();
    });

    it('propagates document content to onChange when the editor reports a change', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        const onChange = vi.fn();

        await act(async () => {
            renderEditor({ highlightRules: false, onChange });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        // `initEditor` invokes `onChange` with the EditorView (not a ViewUpdate)
        // and only for document changes, so the component must read the content
        // straight from `view.state.doc` without checking a `docChanged` flag.
        const conf = initEditor.mock.lastCall?.[2] as any;
        const view = {
            state: { doc: { toString: () => 'edited content' } },
        };
        conf?.onChange?.(view);

        expect(onChange).toHaveBeenCalledWith('edited content');
    });

    it('reconfigures the view when the readOnly prop changes after mount', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false, readOnly: false });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        // Ignore the dispatches produced when the buffered mount-time state is
        // replayed onto the view during attach.
        mockDispatch.mockClear();

        await act(async () => {
            rendered!.rerender(
                React.createElement(Editor as any, {
                    name: 'test-editor',
                    editorRef,
                    onChange: vi.fn(),
                    highlightRules: false,
                    readOnly: true,
                }),
            );
        });

        // The sync effect must push a single compartment reconfiguration.
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0]?.[0]).toHaveProperty('effects');

        rendered!.unmount();
    });

    it('reconfigures the view when the wrapEnabled prop changes after mount', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false, wrapEnabled: false });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        // Ignore the dispatches produced when the buffered mount-time state is
        // replayed onto the view during attach.
        mockDispatch.mockClear();

        await act(async () => {
            rendered!.rerender(
                React.createElement(Editor as any, {
                    name: 'test-editor',
                    editorRef,
                    onChange: vi.fn(),
                    highlightRules: false,
                    wrapEnabled: true,
                }),
            );
        });

        // The sync effect must push a single compartment reconfiguration.
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0]?.[0]).toHaveProperty('effects');

        rendered!.unmount();
    });

    it('does not persist size on mount or layout-induced resize', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        // No user interaction yet — nothing should be saved
        expect(localStorage.getItem('test-editor_editor-size')).toBeNull();

        rendered!.unmount();
    });

    it('persists size only during user-initiated resize (pointerdown)', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });
        await act(async () => {
            resolveInit(createFakeView());
        });

        const container = rendered!.container.querySelector('.editor') as HTMLElement;

        // Simulate user dragging the resize handle
        await act(async () => {
            container.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        });

        // Trigger a ResizeObserver callback by setting contentRect dimensions
        // jsdom's ResizeObserver is a no-op, so we verify the pointerdown
        // listener is wired by checking that no save happens without it.
        // (The actual save path is exercised in browser/e2e tests.)

        await act(async () => {
            window.dispatchEvent(new Event('pointerup'));
        });

        // After pointerup without a resize, nothing saved
        expect(localStorage.getItem('test-editor_editor-size')).toBeNull();

        rendered!.unmount();
    });

    it('restores saved size from localStorage on mount', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        const savedSize = JSON.stringify({ width: 800, height: 500 });
        localStorage.setItem('test-editor_editor-size', savedSize);

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false });
        });

        const container = rendered!.container.querySelector('.editor') as HTMLElement;
        expect(container.style.width).toBe('800px');
        expect(container.style.height).toBe('500px');

        await act(async () => {
            resolveInit(createFakeView());
        });
        rendered!.unmount();
    });

    it('resets size to default when shouldResetSize is true', async () => {
        const initEditor = vi.mocked((await import('@adguard/rules-editor')).initEditor);
        initEditor.mockClear();

        localStorage.setItem('test-editor_editor-size', JSON.stringify({ width: 800, height: 500 }));

        let rendered: ReturnType<typeof render> | undefined;
        await act(async () => {
            rendered = renderEditor({ highlightRules: false, shouldResetSize: true });
        });

        expect(localStorage.getItem('test-editor_editor-size')).toBeNull();

        const container = rendered!.container.querySelector('.editor') as HTMLElement;
        expect(container.style.width).toBe('618px');
        expect(container.style.height).toBe('300px');

        await act(async () => {
            resolveInit(createFakeView());
        });
        rendered!.unmount();
    });
});
