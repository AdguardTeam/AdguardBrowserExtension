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

/**
 * Props accepted by the mocked `InlineRuleEditor`.
 */
type InlineRuleEditorMockProps = {
    /**
     * Editor content passed by the row.
     */
    value: string;

    /**
     * Whether the row is a comment block.
     */
    // eslint-disable-next-line react/require-default-props
    isComment?: boolean;

    /**
     * Called with the editor content on change.
     */
    // eslint-disable-next-line react/require-default-props
    onDraftChange?: (value: string) => void;

    /**
     * Called when the save button is clicked.
     */
    onSave: () => void;

    /**
     * Called when the cancel button is clicked.
     */
    onCancel: () => void;

    /**
     * Whether the editor content is read-only.
     */
    // eslint-disable-next-line react/require-default-props
    readOnly?: boolean;
};

/**
 * Shared `InlineRuleEditor` mock for the user rules list suites: renders the
 * seed value plus buttons that invoke the save, cancel and draft-change
 * callbacks, so tests can drive the inline editing lifecycle without booting
 * CodeMirror.
 *
 * @param props Component props.
 *
 * @returns React element representing the mocked editor.
 */
export function InlineRuleEditor({
    value,
    isComment = false,
    onDraftChange,
    onSave,
    onCancel,
    readOnly = false,
}: InlineRuleEditorMockProps) {
    // Seed captured at mount, so tests can type back to the original text and
    // assert that the draft is no longer considered changed.
    const seedRef = React.useRef(value);

    return React.createElement(
        'div',
        {
            // Mirrors CodeMirror's focusable content element so the list's
            // keyboard blocker can return focus to the editor.
            className: 'cm-content',
            tabIndex: 0,
            'data-testid': 'inline-editor',
            'data-value': value,
            'data-comment': String(isComment),
            'data-readonly': String(readOnly),
        },
        React.createElement('button', { type: 'button', 'data-testid': 'inline-editor-save', onClick: onSave }),
        React.createElement('button', { type: 'button', 'data-testid': 'inline-editor-cancel', onClick: onCancel }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft',
            onClick: () => onDraftChange?.('edited text'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-multiline',
            onClick: () => onDraftChange?.('line one\nline two'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-renamed',
            onClick: () => onDraftChange?.('renamed text'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-comments',
            onClick: () => onDraftChange?.('! one\n! two'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-comment',
            onClick: () => onDraftChange?.('! personal note'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-comment-text',
            onClick: () => onDraftChange?.('personal note'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-older-comment',
            onClick: () => onDraftChange?.('old header'),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-whitespace',
            onClick: () => onDraftChange?.('   '),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-reset',
            onClick: () => onDraftChange?.(seedRef.current),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-draft-trailing-space',
            onClick: () => onDraftChange?.(`${seedRef.current}   `),
        }),
        React.createElement('button', {
            type: 'button',
            'data-testid': 'inline-editor-clear',
            onClick: () => onDraftChange?.(''),
        }),
    );
}
