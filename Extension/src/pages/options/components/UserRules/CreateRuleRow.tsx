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

import classNames from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';

import { type InlineActionSource } from './inline-action-source';
import { RULE_ICON_ID, RowActionButton } from './RuleRow';
import { RuleRowEditor } from './RuleRowEditor';
import { RuleIconType } from './rule-parser';

import styles from './RuleRow.module.pcss';

/**
 * Props for the {@link CreateRuleRow} component.
 */
interface CreateRuleRowProps {
    /**
     * In-progress draft to seed the inline editor with. The editor applies it
     * once on mount; the machine keeps the draft so the row can be remounted
     * without losing typed content.
     */
    draft: string;

    /**
     * Whether the create row's own save is in flight. The editor is read-only
     * while it is true so text typed after the save request cannot be silently
     * discarded when the row closes, and the save/cancel buttons are disabled.
     * Unlike {@link RuleRow}, the row has no other mutation to wait for:
     * `persistRules` orders concurrent writes, so an unrelated toggle or
     * delete must not lock the row.
     */
    inlineSaving?: boolean;

    /**
     * Whether user rules are turned off. It only changes the look of the row
     * (a gray checkbox), like the other rows of the list.
     */
    filterOff?: boolean;

    /**
     * Invoked with the editor content on every change.
     */
    onDraftChange: (value: string) => void;

    /**
     * Invoked with the interaction source when the save button is clicked or
     * Enter / Ctrl(Cmd)+S is pressed inside the editor.
     */
    onSave: (source: InlineActionSource) => void;

    /**
     * Invoked with the interaction source when the cancel button is clicked or
     * Escape is pressed inside the editor.
     */
    onCancel: (source: InlineActionSource) => void;

    /**
     * Ref to the row's root element. The list uses it to tell clicks inside
     * the row (allowed) from clicks outside it (ignored while an inline editor
     * is open).
     */
    rowRef?: React.Ref<HTMLDivElement>;
}

/**
 * Inline editing row shown at the top of the list while a new rule is being
 * created. Mirrors {@link RuleRow}'s editing layout: a checked, non-interactive
 * checkbox, the custom-rule icon and the multi-line rule editor (one rule per
 * non-empty line), with save and cancel actions on the right.
 *
 * @param props Component props.
 *
 * @returns React element representing the create row.
 */
export const CreateRuleRow = ({
    draft,
    inlineSaving = false,
    filterOff = false,
    onDraftChange,
    onSave,
    onCancel,
    rowRef,
}: CreateRuleRowProps) => (
    <div
        ref={rowRef}
        className={classNames(styles.row, filterOff && styles.rowFilterOff, styles.rowEditing)}
    >
        <div className={styles.rule}>
            <input
                type="checkbox"
                checked
                disabled
                readOnly
                className={styles.checkbox}
                aria-label={translator.getMessage('options_user_rules_create_rule')}
            />
            <Icon
                id={RULE_ICON_ID[RuleIconType.Custom]}
                className={styles.icon}
                aria-hidden="true"
            />
            <RuleRowEditor
                value={draft}
                // Multi-line so pasting several rules from a forum or another
                // list creates one rule per line instead of gluing them into a
                // single broken rule. Enter still saves, Shift-Enter adds a
                // line.
                multiline
                // Read-only while the create save is in flight: the row closes
                // as soon as the save resolves, so anything typed in the
                // meantime would be lost.
                saving={inlineSaving}
                onDraftChange={onDraftChange}
                onSave={onSave}
                onCancel={onCancel}
            />
        </div>
        <div className={styles.actions}>
            <RowActionButton
                iconId="#tick"
                iconClassName="icon--green-default"
                label={translator.getMessage('options_user_rules_save_rule')}
                onClick={onSave}
                disabled={inlineSaving}
            />
            <RowActionButton
                iconId="#cross"
                iconClassName="icon--gray-default"
                label={translator.getMessage('options_user_rules_cancel_rule_creation')}
                onClick={onCancel}
                disabled={inlineSaving}
            />
        </div>
    </div>
);
