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

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import classNames from 'classnames';

import { Editor } from '../../../common/components/Editor';
import { EditorMode } from '../../../common/components/Editor/Editor';
import { END_OF_LINE_CH, type EditorHandle } from '../../../common/components/Editor/editor-handle';

import styles from './InlineRuleEditor.module.pcss';

/**
 * Props for the {@link InlineRuleEditor} component.
 */
interface InlineRuleEditorProps {
    /**
     * Editor content to seed the document with: the row's displayed text with
     * its `!off` or comment marker stripped (the marker is fixed context and is
     * restored when the draft is saved), or the in-progress draft. Applied once
     * on mount; the editor is uncontrolled afterwards.
     */
    value: string;

    /**
     * Whether the edited row is a comment block. Comment editors are
     * multi-line: Enter saves and Shift-Enter inserts a newline, while rule
     * editors strip line terminators and stay single-line. Comments are plain
     * text: highlighting them with the rule grammar would render
     * `! example.com##.banner` as a cosmetic rule while editing and as a
     * comment in the list.
     */
    isComment?: boolean;

    /**
     * Whether the editor accepts multiple lines while staying a rule input
     * (used by the create row, where pasting several rules creates one rule per
     * line). Unlike a comment editor it keeps rule highlighting.
     */
    multiline?: boolean;

    /**
     * Called with the whole document content on every change, so the owner can
     * keep the draft while the row is mounted.
     */
    onDraftChange?: (value: string) => void;

    /**
     * Called when the user presses Enter or Ctrl/Cmd+S.
     */
    onSave: () => void;

    /**
     * Called when the user presses Escape.
     */
    onCancel: () => void;

    /**
     * Whether the editor content is read-only. Used while a save is in flight
     * so text typed after the save is not silently discarded when the editor
     * unmounts.
     */
    readOnly?: boolean;
}

/**
 * Single-line editor for rule rows, multi-line editor for comment blocks and
 * the create row, embedded into a user rules list row.
 *
 * Multi-line editors use {@link EditorMode.Multiline}: Enter saves,
 * Shift-Enter adds a line, and line terminators are kept. Comment editors
 * additionally hide the `!`/`#` markers (the row restores them on save) and
 * edit plain text without rule highlighting, because a comment line such as
 * `! example.com##.banner` would otherwise be highlighted as a cosmetic rule
 * while the list shows it as a comment. The create row keeps rule highlighting
 * because it holds rules, one per line.
 *
 * The editor is uncontrolled: {@link InlineRuleEditorProps.value} seeds the
 * document once, on mount, and the row unmounts the component to leave
 * editing mode. The owner keeps the draft and passes it back through `value`,
 * so a row remounted after a rebase resumes with the draft instead of the
 * stored text.
 *
 * @param props Component props.
 *
 * @returns React element representing the inline editor.
 */
export const InlineRuleEditor = ({
    value,
    isComment = false,
    multiline = false,
    onDraftChange,
    onSave,
    onCancel,
    readOnly = false,
}: InlineRuleEditorProps) => {
    const editorRef = useRef<EditorHandle | null>(null);
    const [hasInitError, setHasInitError] = useState(false);
    const isMultiline = isComment || multiline;

    useEffect(() => {
        // The seed text is passed to the editor as its initial document (see
        // `initialValue` below) instead of being written through `setValue`: a
        // `setValue` replacement stays undoable, so the first Ctrl/Cmd+Z after
        // opening would clear the field and Enter would then delete the rule.
        //
        // The deferred handle buffers these writes until CodeMirror finishes
        // loading (see Editor), so they are safe to issue right after mount.
        // Put the caret at the end of the text and scroll it into view: the
        // last line for a comment block, the only line for a rule.
        const lastLine = value.split('\n').length;
        editorRef.current?.setCursor({ line: lastLine, ch: END_OF_LINE_CH });
        editorRef.current?.focus();
        // The seed and caret are applied once on purpose: re-running this on
        // every prop change would reset the document while the user is typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When the editor cannot initialize (e.g. the WASM grammar failed to
    // load), keep the seed text visible instead of leaving an empty shell.
    // The row's save/cancel buttons still exit editing mode.
    if (hasInitError) {
        return (
            <span className={classNames(styles.fallback, isComment && styles.fallbackComment)}>
                {value}
            </span>
        );
    }

    return (
        <Editor
            name="inline-user-rule"
            editorRef={editorRef}
            initialValue={value}
            inline
            mode={isMultiline ? EditorMode.Multiline : EditorMode.SingleLine}
            highlightRules={!isComment}
            readOnly={readOnly}
            onChange={onDraftChange}
            onSave={onSave}
            onExit={onCancel}
            onInitError={() => setHasInitError(true)}
        />
    );
};
