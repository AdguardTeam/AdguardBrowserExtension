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

import React, { useRef } from 'react';

import classNames from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';

import { CommentBlockLines } from './CommentBlockLines';
import { HighlightedText } from './HighlightedText';
import { RuleRowEditor } from './RuleRowEditor';
import { isCommentBlockAboveVirtualizationThreshold } from './comment-block-virtualization';
import { InlineActionSource } from './inline-action-source';
import { type RuleHtmlRenderer } from './rule-highlighter';
import {
    type RuleLineGroup,
    RuleIconType,
    classifyRule,
    getInlineEditorGroupSeed,
} from './rule-parser';
import { ROW_PADDING_TOP_PX, TEXT_OFFSET_TOP_PX } from './rule-row-constants';
import { useRestoreFocusOnClose } from './use-restore-focus-on-close';

import styles from './RuleRow.module.pcss';

/**
 * Maps a {@link RuleIconType} to its sprite symbol id.
 */
export const RULE_ICON_ID: Record<RuleIconType, string> = {
    [RuleIconType.Blocking]: '#blocking-rule',
    [RuleIconType.Exclusion]: '#exclusion-rule',
    [RuleIconType.Custom]: '#custom-rule',
    [RuleIconType.Comment]: '#comment',
};

/**
 * Props for the {@link RowActionButton} component.
 */
interface RowActionButtonProps {
    /**
     * Sprite symbol id of the button icon.
     */
    iconId: string;

    /**
     * Additional classes for the icon, e.g. a color utility class.
     */
    iconClassName?: string;

    /**
     * Translated accessible label. Resolved with a literal key at the call
     * site so the locale static analysis can detect it.
     */
    label: string;

    /**
     * Invoked with the interaction source when the button is activated. A
     * keyboard activation of the focused button (Enter / Space) is reported as
     * {@link InlineActionSource.Keyboard}, so callers can tell it apart from a
     * pointer click.
     */
    onClick: (source: InlineActionSource) => void;

    /**
     * Whether the button is disabled.
     */
    disabled: boolean;

    /**
     * Ref to the underlying button element.
     */
    buttonRef?: React.Ref<HTMLButtonElement>;
}

/**
 * Icon-only action button used by the row's hover and inline editing actions.
 *
 * Keyboard activation of a focused button (Enter / Space) fires the same
 * `click` event as a pointer click, so the interaction source is derived from
 * `MouseEvent.detail`: it is `0` for keyboard and programmatic activation and
 * `>= 1` for real pointer clicks.
 *
 * @param props Component props.
 *
 * @returns React element representing the action button.
 */
export const RowActionButton = ({
    iconId,
    iconClassName,
    label,
    onClick,
    disabled,
    buttonRef,
}: RowActionButtonProps) => (
    <button
        ref={buttonRef}
        type="button"
        className={styles.actionButton}
        onClick={(event) => onClick(
            event.detail === 0 ? InlineActionSource.Keyboard : InlineActionSource.Click,
        )}
        disabled={disabled}
        aria-label={label}
    >
        <Icon
            id={iconId}
            className={classNames(styles.actionIcon, iconClassName)}
            aria-hidden="true"
        />
    </button>
);

/**
 * Props for the {@link RuleRow} component.
 */
interface RuleRowProps {
    /**
     * The rule line group to render.
     */
    group: RuleLineGroup;

    /**
     * Search term for highlighting (optional).
     */
    searchTerm?: string;

    /**
     * Renders a rule line to colorized HTML, optionally highlighting a search
     * term. When omitted the row falls back to plain search-match highlighting.
     */
    highlightHtml?: RuleHtmlRenderer;

    /**
     * Toggle handler invoked when the rule's checkbox state changes. Receives the
     * raw line index of the toggled rule and the new disabled state
     * (`true` = rule was turned off).
     */
    onToggle?: (lineIndex: number, disabled: boolean) => void;

    /**
     * Invoked with this row's group when the Edit button is clicked.
     */
    onEdit?: (group: RuleLineGroup) => void;

    /**
     * Invoked with this row's group when the Delete button is clicked.
     */
    onDelete?: (group: RuleLineGroup) => void;

    /**
     * Whether this row is currently being edited inline.
     */
    editing?: boolean;

    /**
     * In-progress draft to seed the inline editor with. When omitted, the row's
     * own seed is used: the displayed text with the `!off` or comment marker
     * stripped, since the marker is fixed context and is restored on save. The
     * list passes its stored draft here so a row remounted after a rebase (or
     * during a save) resumes with the typed content.
     */
    inlineDraft?: string;

    /**
     * Invoked with the inline editor content on every change while editing.
     */
    onInlineDraftChange?: (value: string) => void;

    /**
     * Invoked with this row's group and the interaction source when the inline
     * save button is clicked or the save hotkey is used inside the inline
     * editor.
     */
    onInlineSave?: (group: RuleLineGroup, source: InlineActionSource) => void;

    /**
     * Invoked with the interaction source when the inline cancel button is
     * clicked or Escape is pressed inside the inline editor.
     */
    onInlineCancel?: (source: InlineActionSource) => void;

    /**
     * Whether user rules are turned off. It only changes the look of the row
     * (dimmed text and a gray checkbox); every action stays available.
     */
    filterOff?: boolean;

    /**
     * Whether a rule mutation is in flight. Mutation actions (edit, delete,
     * toggle) are disabled while it is true, but the inline editing actions
     * stay enabled: leaving editing mode is allowed during a save and the
     * keyboard shortcuts would keep working regardless.
     */
    saving?: boolean;

    /**
     * Whether this row's own inline save is in flight. The editor is read-only
     * while it is true, so text typed after the save request cannot be silently
     * discarded when the editor closes, and the save/cancel buttons are
     * disabled.
     */
    inlineSaving?: boolean;

    /**
     * Ref to the row's root element. The list uses it to tell clicks inside the
     * row being edited (allowed) from clicks outside it (ignored while
     * editing).
     */
    rowRef?: React.Ref<HTMLDivElement>;

    /**
     * Document-space top of the row (`virtualItem.start` of the outer window
     * virtualizer), used to derive the scroll margin of the nested line
     * virtualizer of large comment blocks. When omitted, large blocks fall
     * back to rendering all lines.
     */
    rowDocumentTop?: number;
}

/**
 * Renders a single rule or comment block as a list row.
 *
 * Comment groups render a comment icon and their comment lines stacked
 * vertically. Blocks above the virtualization threshold render only the lines
 * intersecting the viewport through a nested window virtualizer. Rule groups
 * render a checkbox to toggle the rule on/off, a rule-type icon, and the rule
 * text.
 *
 * Memoized: the virtualizer re-renders {@link UserRulesList} on every scroll
 * range change, but each row's props (`group` from a memoized list, the
 * singleton `highlightHtml`, and the debounced `searchTerm`) are stable across
 * keystrokes, so a shallow comparison skips the expensive WASM highlighting
 * re-computation for unchanged rows.
 *
 * Note: mutations such as toggling a single rule re-run
 * `parseRuleLines`/`groupLines`/`filterGroups`, allocating brand-new group
 * objects for *every* line. That defeats this component's shallow `group`
 * prop check on all rows, so the expensive per-line highlighting lives in the
 * memoized {@link HighlightedText} child, which keys off the immutable string
 * values rather than the parent object references.
 *
 * @param props Component props.
 *
 * @returns React element representing the row.
 */
export const RuleRow = React.memo(({
    group,
    searchTerm = '',
    highlightHtml,
    onEdit,
    onDelete,
    onToggle,
    editing = false,
    inlineDraft,
    onInlineDraftChange,
    onInlineSave,
    onInlineCancel,
    filterOff = false,
    saving = false,
    inlineSaving = false,
    rowRef,
    rowDocumentTop,
}: RuleRowProps) => {
    const { isComment, lines } = group;
    const term = searchTerm.trim();
    // Mutations are blocked while another one is in flight, but leaving inline
    // editing stays available so the buttons match Enter/Escape/Ctrl+S.
    //
    // Turning the user rules off does not block anything: like the Edit view,
    // the rules can still be toggled, edited, created and deleted, and an open
    // inline editor is not cancelled — its draft is kept so unsaved work is not
    // lost.
    const mutationDisabled = saving;
    const editButtonRef = useRef<HTMLButtonElement | null>(null);

    // Leaving inline editing unmounts the editor; the hook returns focus to
    // the row's edit button so keyboard users keep their place.
    useRestoreFocusOnClose(editing, mutationDisabled, editButtonRef);

    const inlineEditor = (
        <RuleRowEditor
            value={inlineDraft ?? getInlineEditorGroupSeed(group)}
            isComment={isComment}
            saving={inlineSaving}
            onDraftChange={onInlineDraftChange}
            onSave={(source) => onInlineSave?.(group, source)}
            onCancel={(source) => onInlineCancel?.(source)}
        />
    );

    const actions = editing ? (
        <div className={styles.actions}>
            <RowActionButton
                iconId="#tick"
                iconClassName="icon--green-default"
                label={translator.getMessage('options_user_rules_save_rule')}
                onClick={(source) => onInlineSave?.(group, source)}
                disabled={inlineSaving}
            />
            <RowActionButton
                iconId="#cross"
                iconClassName="icon--gray-default"
                label={translator.getMessage('options_user_rules_cancel_rule_editing')}
                onClick={(source) => onInlineCancel?.(source)}
                disabled={inlineSaving}
            />
        </div>
    ) : (
        <div className={styles.actions}>
            <RowActionButton
                iconId="#switch-to-editor"
                label={translator.getMessage('options_user_rules_edit_rule')}
                onClick={() => onEdit?.(group)}
                disabled={mutationDisabled}
                buttonRef={editButtonRef}
            />
            <RowActionButton
                iconId="#trash"
                iconClassName="icon--red-default"
                label={translator.getMessage('options_user_rules_delete_rule')}
                onClick={() => onDelete?.(group)}
                disabled={mutationDisabled}
            />
        </div>
    );

    if (isComment) {
        // Comment blocks above the virtualization threshold render only
        // their visible lines through a nested window virtualizer; the block
        // stays one item of the outer list virtualizer and one editing unit.
        // Without the row's document-space top the nested virtualizer cannot
        // align with the window scroll, so such blocks fall back to rendering
        // all lines as before.
        const isVirtualizedCommentBlock = !editing
            && isCommentBlockAboveVirtualizationThreshold(group)
            && rowDocumentTop !== undefined;

        let commentContent: React.ReactNode;
        if (editing) {
            // The shared seed policy strips the comment markers:
            // they are fixed context, restored on save.
            commentContent = inlineEditor;
        } else if (isVirtualizedCommentBlock) {
            commentContent = (
                <CommentBlockLines
                    lines={lines}
                    viewportDocumentTop={rowDocumentTop + ROW_PADDING_TOP_PX + TEXT_OFFSET_TOP_PX}
                    term={term}
                    highlightHtml={highlightHtml}
                />
            );
        } else {
            commentContent = lines.map((line) => (
                <span key={line.lineIndex} className={styles.commentLine}>
                    <HighlightedText
                        htmlInput={line.trimmedText}
                        plainText={line.displayText}
                        term={term}
                        highlightHtml={highlightHtml}
                        stripMarker
                    />
                </span>
            ));
        }

        return (
            <div
                ref={rowRef}
                className={classNames(
                    styles.row,
                    filterOff && styles.rowFilterOff,
                    editing && styles.rowEditing,
                )}
            >
                <div className={classNames(
                    styles.comment,
                    editing && styles.commentEditing,
                    isVirtualizedCommentBlock && styles.commentVirtualized,
                )}
                >
                    <Icon
                        id={RULE_ICON_ID[RuleIconType.Comment]}
                        className={styles.icon}
                        aria-hidden="true"
                    />
                    <div className={classNames(
                        styles.commentText,
                        editing && styles.commentTextEditing,
                        isVirtualizedCommentBlock && styles.commentTextVirtualized,
                    )}
                    >
                        {commentContent}
                    </div>
                </div>
                {actions}
            </div>
        );
    }

    // Non-comment groups always contain exactly one line.
    const ruleLine = lines[0];
    if (!ruleLine) {
        return null;
    }
    const ruleIconType = classifyRule(ruleLine.displayText);
    const { isDisabled, lineIndex } = ruleLine;

    const handleToggle = () => {
        onToggle?.(lineIndex, !isDisabled);
    };

    return (
        <div
            ref={rowRef}
            className={classNames(
                styles.row,
                isDisabled && styles.disabledRule,
                filterOff && styles.rowFilterOff,
                editing && styles.rowEditing,
            )}
        >
            <div className={styles.rule}>
                <input
                    type="checkbox"
                    checked={!isDisabled}
                    onChange={onToggle ? handleToggle : undefined}
                    disabled={mutationDisabled || onToggle === undefined}
                    className={styles.checkbox}
                    aria-label={ruleLine.displayText}
                />
                <Icon
                    id={RULE_ICON_ID[ruleIconType]}
                    className={styles.icon}
                    aria-hidden="true"
                />
                {editing ? (
                    inlineEditor
                ) : (
                    <span className={styles.ruleText} title={ruleLine.displayText}>
                        <HighlightedText
                            htmlInput={ruleLine.displayText}
                            plainText={ruleLine.displayText}
                            term={term}
                            highlightHtml={highlightHtml}
                            stripMarker={false}
                        />
                    </span>
                )}
            </div>
            {actions}
        </div>
    );
});

RuleRow.displayName = 'RuleRow';
