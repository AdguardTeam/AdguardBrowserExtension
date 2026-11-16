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
    ChangeSet,
    EditorState,
    type Annotation,
    type Extension,
} from '@codemirror/state';

import { createInlineModeKeymap } from './inline-keymap';

/**
 * Matches any line terminator.
 */
const LINE_TERMINATOR_RE = /[\r\n]+/g;

/**
 * Rewrites every transaction that inserts a line terminator so the inserted
 * text becomes single-line. Unlike a change filter, the rest of the inserted
 * content is kept — a multi-line paste is flattened instead of being rejected.
 *
 * A spec returned from a transaction filter replaces the transaction rather
 * than extending it, so the original selection is remapped over the removed
 * terminators and the effects, annotations and `scrollIntoView` flag are copied
 * onto the replacement spec — otherwise they (and with them the post-paste
 * caret) would be dropped.
 */
const stripLineTerminators = EditorState.transactionFilter.of((transaction) => {
    if (!transaction.docChanged) {
        return transaction;
    }

    const changes: { from: number; to: number; insert: string }[] = [];
    // Removed line terminators, located in the unfiltered new document.
    const removedTerminators: { from: number; to: number; insert: string }[] = [];

    transaction.changes.iterChanges((from, to, fromB, _toB, inserted) => {
        const text = inserted.toString();
        const stripped = text.replace(LINE_TERMINATOR_RE, '');
        changes.push({ from, to, insert: stripped });

        if (stripped === text) {
            return;
        }

        // `fromB` is where the inserted text starts in the new document, so
        // each removed terminator can be recorded at its absolute position
        // there and mapped over below.
        for (const match of text.matchAll(LINE_TERMINATOR_RE)) {
            removedTerminators.push({
                from: fromB + match.index,
                to: fromB + match.index + match[0].length,
                insert: '',
            });
        }
    });

    // Keep the original transaction (including its selection, effects and
    // annotations) when there is nothing to strip.
    if (removedTerminators.length === 0) {
        return transaction;
    }

    const filteredChanges = ChangeSet.of(changes, transaction.startState.doc.length);
    // Maps the unfiltered new document onto the filtered one.
    const removedChanges = ChangeSet.of(removedTerminators, transaction.changes.newLength);
    // `Transaction.annotations` is public at runtime but left out of the public
    // type surface, and a filter spec does not inherit the transaction it
    // replaces. Read it through a narrow cast so annotations used by history
    // and input handling (e.g. `userEvent`, `isolateHistory`) survive.
    const { annotations } = transaction as unknown as {
        annotations: readonly Annotation<unknown>[];
    };

    return {
        changes: filteredChanges,
        // Pasting sets the selection explicitly; map it over the removed
        // terminators so the caret stays after the flattened text.
        selection: transaction.selection?.map(removedChanges),
        effects: transaction.effects,
        annotations,
        scrollIntoView: transaction.scrollIntoView,
    };
});

/**
 * Builds extensions that turn the shared editor into a single-line input:
 * Enter saves the value instead of inserting a newline, line terminators are
 * stripped from any insertion, and multi-line-only built-in hotkeys are
 * disabled.
 *
 * The result is meant to be appended to the editor configuration; it uses
 * `Prec.highest` to outrank the built-in `@adguard/rules-editor` keymaps.
 *
 * @param onEnter Called when Enter is pressed in the editor.
 *
 * @returns Extensions to append to the editor configuration.
 */
export const createSingleLineExtensions = (onEnter: () => void): Extension[] => {
    return [
        createInlineModeKeymap(onEnter, [
            {
                // `defaultKeymap` binds both Enter and Shift-Enter to
                // `insertNewlineAndIndent`. Without this binding, Shift-Enter
                // would insert a newline that the transaction filter below
                // rewrites into a no-op transaction; swallowing the key keeps
                // it inert instead.
                key: 'Shift-Enter',
                run: () => true,
            },
        ]),
        stripLineTerminators,
    ];
};
