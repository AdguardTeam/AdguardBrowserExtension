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

import React from 'react';

import {
    render,
    cleanup,
    act,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { EditorMode } from '../../../../../../Extension/src/pages/common/components/Editor/Editor';
import { END_OF_LINE_CH } from '../../../../../../Extension/src/pages/common/components/Editor/editor-handle';
import { InlineRuleEditor } from '../../../../../../Extension/src/pages/options/components/UserRules/InlineRuleEditor';

const { editorHandle, lastEditorProps } = vi.hoisted(() => ({
    lastEditorProps: { current: null as Record<string, unknown> | null },
    editorHandle: {
        getValue: vi.fn(() => ''),
        setValue: vi.fn(),
        getCursor: vi.fn(() => ({ line: 1, ch: 0 })),
        setCursor: vi.fn(),
        setWrap: vi.fn(),
        setReadOnly: vi.fn(),
        focus: vi.fn(),
    },
}));

vi.mock(
    '../../../../../../Extension/src/pages/common/components/Editor',
    () => ({
        Editor: (props: Record<string, unknown>) => {
            lastEditorProps.current = props;
            const { editorRef } = props;
            // The component expects its ref to be populated synchronously.
            (editorRef as { current: unknown }).current = editorHandle;
            return React.createElement('div', { 'data-testid': 'editor' });
        },
    }),
);

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/InlineRuleEditor.module.pcss',
    () => ({ default: new Proxy({}, { get: (_t, prop) => String(prop) }) }),
);

describe('InlineRuleEditor', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        lastEditorProps.current = null;
    });

    it('renders the shared editor in inline single-line mode with highlighting', () => {
        render(<InlineRuleEditor value="||example.com^" onSave={vi.fn()} onCancel={vi.fn()} />);

        expect(lastEditorProps.current).toMatchObject({
            inline: true,
            mode: EditorMode.SingleLine,
            highlightRules: true,
        });
    });

    it('renders the shared editor in inline multi-line mode for comments', () => {
        render(<InlineRuleEditor value={'first\nsecond'} isComment onSave={vi.fn()} onCancel={vi.fn()} />);

        expect(lastEditorProps.current).toMatchObject({
            inline: true,
            mode: EditorMode.Multiline,
            // Comment text is plain: highlighting it with the rule grammar
            // would render `! example.com##.banner` as a cosmetic rule while
            // editing and as a comment in the list.
            highlightRules: false,
        });
    });

    it('keeps rule highlighting for a multi-line create input', () => {
        render(<InlineRuleEditor value={'||a.com^\n||b.com^'} multiline onSave={vi.fn()} onCancel={vi.fn()} />);

        expect(lastEditorProps.current).toMatchObject({
            inline: true,
            mode: EditorMode.Multiline,
            highlightRules: true,
        });
    });

    it('places the caret at the end of the last comment line', () => {
        render(<InlineRuleEditor value={'first\nsecond'} isComment onSave={vi.fn()} onCancel={vi.fn()} />);

        // The seed is passed as the editor's initial document, not written
        // through `setValue` (a setValue replacement would be undoable).
        expect(lastEditorProps.current).toMatchObject({ initialValue: 'first\nsecond' });
        expect(editorHandle.setValue).not.toHaveBeenCalled();
        expect(editorHandle.setCursor).toHaveBeenCalledWith({
            line: 2,
            ch: END_OF_LINE_CH,
        });
        expect(editorHandle.focus).toHaveBeenCalledTimes(1);
    });

    it('seeds the value, moves the caret to the end and focuses the editor', () => {
        render(<InlineRuleEditor value="||example.com^" onSave={vi.fn()} onCancel={vi.fn()} />);

        expect(lastEditorProps.current).toMatchObject({ initialValue: '||example.com^' });
        expect(editorHandle.setValue).not.toHaveBeenCalled();
        expect(editorHandle.setCursor).toHaveBeenCalledWith({
            line: 1,
            ch: END_OF_LINE_CH,
        });
        expect(editorHandle.focus).toHaveBeenCalledTimes(1);
    });

    it('forwards the read-only state to the shared editor', () => {
        const { rerender } = render(
            <InlineRuleEditor value="x" onSave={vi.fn()} onCancel={vi.fn()} />,
        );
        expect(lastEditorProps.current).toMatchObject({ readOnly: false });

        rerender(<InlineRuleEditor value="x" readOnly onSave={vi.fn()} onCancel={vi.fn()} />);
        expect(lastEditorProps.current).toMatchObject({ readOnly: true });
    });

    it('routes the editor save and cancel callbacks', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        render(<InlineRuleEditor value="x" onSave={onSave} onCancel={onCancel} />);

        (lastEditorProps.current?.onSave as () => void)();
        (lastEditorProps.current?.onExit as () => void)();

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('reports document changes through onDraftChange', () => {
        const onDraftChange = vi.fn();
        render(
            <InlineRuleEditor
                value="x"
                onDraftChange={onDraftChange}
                onSave={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        (lastEditorProps.current?.onChange as (value: string) => void)('typed');

        expect(onDraftChange).toHaveBeenCalledWith('typed');
    });

    it('applies the value only on mount so re-renders do not reset the draft', () => {
        const { rerender } = render(
            <InlineRuleEditor value="first" onSave={vi.fn()} onCancel={vi.fn()} />,
        );
        expect(lastEditorProps.current).toMatchObject({ initialValue: 'first' });

        // The owner passes the live draft through `value`; re-rendering with it
        // must not reset the document while the user is typing. The seed is
        // applied as the editor's initial document only (`defaultValue`
        // semantics in the shared editor) — nothing is written through
        // `setValue` on any render.
        rerender(<InlineRuleEditor value="second" onSave={vi.fn()} onCancel={vi.fn()} />);
        expect(lastEditorProps.current).toMatchObject({ initialValue: 'second' });
        expect(editorHandle.setValue).not.toHaveBeenCalled();
    });

    it('renders the seed text when the editor fails to initialize', () => {
        render(<InlineRuleEditor value="||example.com^" onSave={vi.fn()} onCancel={vi.fn()} />);

        act(() => {
            (lastEditorProps.current?.onInitError as () => void)();
        });

        // The row keeps its content instead of showing an empty editor shell.
        expect(screen.getByText('||example.com^')).toBeTruthy();
        expect(screen.queryByTestId('editor')).toBeNull();
    });
});
