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

import { HighlightedText } from './HighlightedText';
import { type RuleHtmlRenderer } from './rule-highlighter';
import {
    type RuleLineGroup,
    RuleIconType,
    classifyRule,
} from './rule-parser';

import styles from './RuleRow.module.pcss';

/**
 * Maps a {@link RuleIconType} to its sprite symbol id.
 */
const RULE_ICON_ID: Record<RuleIconType, string> = {
    [RuleIconType.Blocking]: '#blocking-rule',
    [RuleIconType.Exclusion]: '#exclusion-rule',
    [RuleIconType.Custom]: '#custom-rule',
    [RuleIconType.Comment]: '#comment',
};

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
     * When true, the row action buttons are non-interactive.
     */
    disabled?: boolean;
}

/**
 * Renders a single rule or comment block as a list row.
 *
 * Comment groups render a comment icon and all comment lines stacked vertically.
 * Rule groups render a checkbox to toggle the rule on/off, a rule-type icon, and
 * the rule text.
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
    disabled = false,
}: RuleRowProps) => {
    const { isComment, lines } = group;
    const term = searchTerm.trim();

    const actions = (
        <div className={styles.actions}>
            <button
                type="button"
                className={styles.actionButton}
                onClick={() => onEdit?.(group)}
                disabled={disabled}
                aria-label={translator.getMessage('options_user_rules_edit_rule')}
            >
                <Icon
                    id="#switch-to-editor"
                    className={styles.actionIcon}
                    aria-hidden="true"
                />
            </button>
            <button
                type="button"
                className={styles.actionButton}
                onClick={() => onDelete?.(group)}
                disabled={disabled}
                aria-label={translator.getMessage('options_user_rules_delete_rule')}
            >
                <Icon
                    id="#trash"
                    className={classNames(styles.actionIcon, 'icon--red-default')}
                    aria-hidden="true"
                />
            </button>
        </div>
    );

    if (isComment) {
        return (
            <div className={styles.row}>
                <div className={styles.comment}>
                    <Icon
                        id={RULE_ICON_ID[RuleIconType.Comment]}
                        className={styles.icon}
                        aria-hidden="true"
                    />
                    <div className={styles.commentText}>
                        {lines.map((line) => (
                            <span key={line.lineIndex} className={styles.commentLine}>
                                <HighlightedText
                                    htmlInput={line.trimmedText}
                                    plainText={line.displayText}
                                    term={term}
                                    highlightHtml={highlightHtml}
                                    stripMarker
                                />
                            </span>
                        ))}
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
        <div className={classNames(styles.row, isDisabled && styles.disabledRule)}>
            <div className={styles.rule}>
                <input
                    type="checkbox"
                    checked={!isDisabled}
                    onChange={onToggle ? handleToggle : undefined}
                    disabled={disabled || onToggle === undefined}
                    className={styles.checkbox}
                    aria-label={ruleLine.displayText}
                />
                <Icon
                    id={RULE_ICON_ID[ruleIconType]}
                    className={styles.icon}
                    aria-hidden="true"
                />
                <span className={styles.ruleText}>
                    <HighlightedText
                        htmlInput={ruleLine.displayText}
                        plainText={ruleLine.displayText}
                        term={term}
                        highlightHtml={highlightHtml}
                        stripMarker={false}
                    />
                </span>
            </div>
            {actions}
        </div>
    );
});

RuleRow.displayName = 'RuleRow';
