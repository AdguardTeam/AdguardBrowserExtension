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

import { InlineRuleEditor } from './InlineRuleEditor';
import { InlineActionSource } from './inline-action-source';

/**
 * Props for the {@link RuleRowEditor}.
 */
interface RuleRowEditorProps {
    /**
     * Editor content to seed the document with.
     */
    value: string;

    /**
     * Whether the edited item is a comment block.
     */
    isComment?: boolean;

    /**
     * Whether the editor accepts multiple lines while staying a rule input.
     */
    multiline?: boolean;

    /**
     * Whether the row's save is in flight. The editor is read-only while it is
     * true, so text typed after the save request cannot be silently discarded
     * when the row closes.
     */
    saving?: boolean;

    /**
     * Called with the editor content on every change.
     */
    onDraftChange?: (value: string) => void;

    /**
     * Called with the interaction source when the editor saves.
     */
    onSave: (source: InlineActionSource) => void;

    /**
     * Called with the interaction source when the editor cancels.
     */
    onCancel: (source: InlineActionSource) => void;
}

/**
 * Shared wiring for the inline editor inside a user-rules row: maps the row's
 * save-in-flight flag to `readOnly` and tags the editor's keyboard actions with
 * {@link InlineActionSource.Keyboard}. Rule rows and the create row render this
 * instead of repeating the same save/cancel wiring, so the editor contract
 * changes in one place.
 *
 * @param props Component props.
 *
 * @returns React element representing the row's inline editor.
 */
export const RuleRowEditor = ({
    value,
    isComment = false,
    multiline = false,
    saving = false,
    onDraftChange,
    onSave,
    onCancel,
}: RuleRowEditorProps) => (
    <InlineRuleEditor
        value={value}
        isComment={isComment}
        multiline={multiline}
        readOnly={saving}
        onDraftChange={onDraftChange}
        onSave={() => onSave(InlineActionSource.Keyboard)}
        onCancel={() => onCancel(InlineActionSource.Keyboard)}
    />
);
