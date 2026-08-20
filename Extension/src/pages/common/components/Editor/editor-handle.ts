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
    type Compartment,
    EditorState,
    Transaction,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { isolateHistory } from '@codemirror/commands';

/**
 * CodeMirror compartments owned by the {@link Editor} component and toggled by
 * the {@link EditorHandle}.
 */
export interface EditorCompartments {
    /**
     * Controls line wrapping ({@link EditorView.lineWrapping}).
     */
    wrap: Compartment;

    /**
     * Controls read-only / non-editable state.
     */
    readOnly: Compartment;
}

/**
 * Cursor position.
 */
export interface EditorCursor {
    /**
     * 1-based line number.
     */
    line: number;

    /**
     * 0-based character offset within the line.
     */
    ch: number;
}

/**
 * A single granular document change. All ranges of one `applyChanges` call
 * refer to the same current document and are applied in a single transaction.
 */
export interface EditorChange {
    /**
     * Start offset of the replaced range.
     */
    readonly from: number;

    /**
     * End offset of the replaced range.
     */
    readonly to: number;

    /**
     * Text to insert in place of the range. Omit for a pure deletion.
     */
    readonly insert?: string;
}

/**
 * Imperative facade exposed via `editorRef.current`, replacing the former Ace
 * editor object.
 */
export interface EditorHandle {
    /**
     * Returns the entire document content as a single string.
     *
     * @returns Current editor value.
     */
    getValue(): string;

    /**
     * Replaces the entire document content with the given value.
     *
     * @param value The new content to set.
     */
    setValue(value: string): void;

    /**
     * Applies granular external updates (e.g. rules from the filtering log)
     * without touching the undo history. Ranges refer to the current document.
     *
     * @param changes Ranges to replace, in document order.
     */
    applyChanges(changes: readonly EditorChange[]): void;

    /**
     * Returns the current cursor position.
     *
     * @returns Cursor position with 1-based line and 0-based character offset.
     */
    getCursor(): EditorCursor;

    /**
     * Moves the cursor to the given position.
     *
     * @param cursor Target cursor position with 1-based line
     * and 0-based character offset.
     */
    setCursor(cursor: EditorCursor): void;

    /**
     * Toggles line wrapping mode.
     *
     * @param enabled Whether line wrapping should be enabled.
     */
    setWrap(enabled: boolean): void;

    /**
     * Toggles read-only mode.
     *
     * @param enabled Whether the editor should be read-only.
     */
    setReadOnly(enabled: boolean): void;

    /**
     * Focuses the editor, moving keyboard input to it.
     */
    focus(): void;
}

/**
 * Builds the imperative handle around a CodeMirror {@link EditorView}.
 *
 * Returns an object literal (not a class) whose methods close over `view`
 * rather than `this`, so they stay bound when passed around detached
 * (e.g. `editorRef.current.setValue`) without manual binding.
 *
 * @param view The editor view to wrap.
 * @param compartments Compartments used for wrap/read-only reconfiguration.
 *
 * @returns The imperative editor handle.
 */
export const createEditorHandle = (
    view: EditorView,
    compartments: EditorCompartments,
): EditorHandle => ({
    /**
     * Returns the entire document content as a single string.
     *
     * @returns Current editor value.
     */
    getValue() {
        return view.state.doc.toString();
    },

    /**
     * Replaces the entire document content with the given value and inserts
     * a full history barrier so the user cannot undo past this replacement.
     *
     * @param value The new content to set.
     */
    setValue(value: string) {
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: value },
            selection: { anchor: value.length },
            annotations: isolateHistory.of('full'),
        });
    },

    /**
     * Applies granular changes in a single transaction, mapping the selection
     * through them. Excluded from the undo history: they are external updates.
     *
     * @param changes Ranges to replace, in document order.
     */
    applyChanges(changes: readonly EditorChange[]) {
        if (changes.length === 0) {
            return;
        }
        view.dispatch({
            changes: [...changes],
            annotations: Transaction.addToHistory.of(false),
        });
    },

    /**
     * Returns the current cursor position.
     *
     * @returns Cursor position with 1-based line and 0-based character offset.
     */
    getCursor() {
        const { head } = view.state.selection.main;
        const line = view.state.doc.lineAt(head);
        return { line: line.number, ch: head - line.from };
    },

    /**
     * Moves the cursor to the given position and scrolls it into view.
     * Line and character offsets are clamped to valid document bounds.
     *
     * @param cursor Target cursor position with 1-based line
     * and 0-based character offset.
     */
    setCursor({ line, ch }: EditorCursor) {
        const { doc } = view.state;
        const targetLine = doc.line(Math.min(Math.max(line, 1), doc.lines));
        const anchor = targetLine.from + Math.min(Math.max(ch, 0), targetLine.length);
        view.dispatch({
            selection: {
                anchor,
            },
            scrollIntoView: true,
        });
    },

    /**
     * Toggles line wrapping mode via the wrap compartment.
     *
     * @param enabled Whether line wrapping should be enabled.
     */
    setWrap(enabled: boolean) {
        view.dispatch({
            effects: compartments.wrap.reconfigure(enabled ? EditorView.lineWrapping : []),
        });
    },

    /**
     * Toggles read-only mode via the readOnly compartment. When enabled,
     * the editor is both non-editable and prevents cursor blinking.
     *
     * @param enabled Whether the editor should be read-only.
     */
    setReadOnly(enabled: boolean) {
        view.dispatch({
            effects: compartments.readOnly.reconfigure(
                enabled
                    ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
                    : [],
            ),
        });
    },

    /**
     * Focuses the editor, moving keyboard input to it.
     */
    focus() {
        view.focus();
    },
});

/**
 * A {@link EditorHandle} whose underlying {@link EditorView} is attached
 * asynchronously. Methods called before the view exists are buffered and
 * replayed on {@link DeferredEditorHandle.attach}.
 */
export interface DeferredEditorHandle {
    /**
     * The stable handle exposed to consumers. Safe to use immediately, before
     * the underlying view is created.
     */
    handle: EditorHandle;

    /**
     * Attaches the underlying view, replaying any buffered state.
     *
     * @param view The created editor view.
     * @param compartments Compartments used for wrap/read-only reconfiguration.
     */
    attach(view: EditorView, compartments: EditorCompartments): void;

    /**
     * Detaches the underlying view. After this, the handle is inert: all
     * methods become no-ops (writes are dropped rather than buffered, since
     * there is no subsequent `attach` to replay them). Used on unmount.
     */
    detach(): void;
}

/**
 * Builds a stable {@link EditorHandle} that can be exposed synchronously,
 * before the asynchronous {@link EditorView} is ready.
 *
 * `initEditor` resolves only after the WASM grammar is loaded, so the real
 * handle is unavailable for a tick after mount. Without buffering, async
 * consumers that fetch content over IPC and call `setValue` during that window
 * would silently drop it (the previous Ace editor applied values
 * synchronously). This handle buffers such writes and replays them in order
 * once {@link DeferredEditorHandle.attach} is called.
 *
 * Like {@link createEditorHandle}, the handle is an object literal whose methods
 * close over the surrounding scope rather than `this`, so they remain bound when
 * passed around detached (e.g. `editorRef.current.setValue`).
 *
 * @returns The deferred handle together with `attach`/`detach` controls.
 */
export const createDeferredEditorHandle = (): DeferredEditorHandle => {
    let real: EditorHandle | null = null;

    // Once detached (on unmount), the handle is dead: there is no second
    // `attach` to replay buffered state, so writes must be dropped rather than
    // captured in pending state that would never be flushed.
    let detached = false;

    // Buffered operations captured before the underlying view exists, replayed
    // in call order on attach. Each entry is a closure that already carries
    // its method and arguments with their exact types, so replaying needs no
    // narrowing, switches or casts. A single FIFO queue is used so interleaved
    // `setValue`/`applyChanges` calls replay in the exact order they were made
    // — offsets carried by `applyChanges` are only valid against the document
    // state produced by the preceding operations.
    const pending: ((handle: EditorHandle) => void)[] = [];

    // Last buffered value per reader, used before the view exists. Readers are
    // not queued as operations (they return, they don't replay), so they are
    // tracked separately by key.
    const pendingReads: {
        value: string;
        cursor: EditorCursor;
    } = {
        value: '',
        cursor: { line: 1, ch: 0 },
    };

    /**
     * Runs the operation against the live view, or buffers it for replay on
     * attach. The closure is fully typed at the call site, so no type
     * information is lost in the queue.
     *
     * @param op Operation to run or buffer.
     */
    const runOrQueue = (op: (handle: EditorHandle) => void): void => {
        if (real) {
            op(real);
        } else if (!detached) {
            pending.push(op);
        }
    };

    const handle: EditorHandle = {
        getValue() {
            return real ? real.getValue() : pendingReads.value;
        },
        setValue(value: string) {
            if (!real) {
                pendingReads.value = value;
            }
            runOrQueue((h) => h.setValue(value));
        },
        getCursor() {
            return real ? real.getCursor() : pendingReads.cursor;
        },
        setCursor(cursor: EditorCursor) {
            if (!real) {
                pendingReads.cursor = cursor;
            }
            runOrQueue((h) => h.setCursor(cursor));
        },
        setWrap(enabled: boolean) {
            runOrQueue((h) => h.setWrap(enabled));
        },
        setReadOnly(enabled: boolean) {
            runOrQueue((h) => h.setReadOnly(enabled));
        },
        focus() {
            runOrQueue((h) => h.focus());
        },
        applyChanges(changes: readonly EditorChange[]) {
            if (changes.length === 0) {
                return;
            }
            if (!real && !detached) {
                // Ranges refer to the document state before the change, so
                // apply them from last to first on the buffered value.
                for (const { from, to, insert = '' } of [...changes].reverse()) {
                    pendingReads.value = pendingReads.value.slice(0, from)
                        + insert
                        + pendingReads.value.slice(to);
                }
            }
            runOrQueue((h) => h.applyChanges(changes));
        },
    };

    return {
        handle,
        attach(view: EditorView, compartments: EditorCompartments) {
            real = createEditorHandle(view, compartments);

            // Replay buffered operations in call order. Because entries are
            // appended in the order they were made, `setValue` runs before
            // a subsequent `setCursor` — preserving the cursor position the
            // comment above relied on (setValue moves the cursor to the end).
            for (const op of pending) {
                op(real);
            }

            pending.length = 0;
        },
        detach() {
            real = null;
            detached = true;
        },
    };
};
