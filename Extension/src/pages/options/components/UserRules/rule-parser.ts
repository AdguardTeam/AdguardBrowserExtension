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

import { CommentMarker, CosmeticRuleSeparatorUtils } from '@adguard/agtree';

/**
 * Regex that matches any line terminator: CRLF, CR, or LF.
 * Used by {@link parseRuleLines}, {@link deleteLinesFromRules}, and the
 * "Create rule" handler in {@link UserRules}.
 */
export const LINE_TERMINATOR_RE = /\r\n|\r|\n/;

/**
 * `split` discards delimiters unless they are captured, so this wraps
 * {@link LINE_TERMINATOR_RE} to retain original line terminators.
 */
const CAPTURING_LINE_TERMINATOR_RE = new RegExp(`(${LINE_TERMINATOR_RE.source})`);

/**
 * Matches every line terminator at the very end of the user-rules text.
 */
const TRAILING_LINE_TERMINATORS_RE = new RegExp(`(?:${LINE_TERMINATOR_RE.source})+$`);

/**
 * Returns a copy of {@link rulesText} guaranteed to end with exactly one empty
 * line — i.e. a single trailing line terminator that starts a new, empty line
 * the cursor can sit on.
 *
 * Used by the "Create rule" handler to make sure the editor always opens on a
 * fresh blank line at the bottom, regardless of whether the stored rules end
 * with zero, one, or several line terminators.
 *
 * @param rulesText Full user-rules text.
 *
 * @returns Text that ends with exactly one line terminator (or the empty
 * string, which the editor treats as a single blank line).
 */
export function ensureTrailingEmptyLine(rulesText: string): string {
    if (rulesText.length === 0) {
        return rulesText;
    }
    return `${rulesText.replace(TRAILING_LINE_TERMINATORS_RE, '')}\n`;
}

/**
 * Visual icon type for a rule list item.
 */
export enum RuleIconType {
    /**
     * Standard blocking rule (e.g. `||example.org^`).
     */
    Blocking = 'blocking',

    /**
     * Exclusion (allowlist) rule starting with `@@`.
     */
    Exclusion = 'exclusion',

    /**
     * Custom rule with modifiers/content after the `^` separator.
     */
    Custom = 'custom',

    /**
     * Comment block.
     */
    Comment = 'comment',
}

/**
 * A single line parsed from the raw user rules text.
 */
export interface ParsedRuleLine {
    /**
     * Raw line content (untrimmed).
     */
    text: string;

    /**
     * Whitespace-trimmed text for display.
     */
    trimmedText: string;

    /**
     * Text shown in the row (and used for plain-text search highlighting).
     * Equals {@link trimmedText} except for disabled rules and comments, where
     * the leading marker (`!off`, `!` or `#`) is stripped so the content is
     * shown without it. The syntax highlighter still receives the full
     * {@link trimmedText} so it can color the marker correctly.
     */
    displayText: string;

    /**
     * Lowercased version of {@link displayText}, cached at parse time
     * to avoid repeated allocations during case-insensitive filtering.
     *
     * Filtering is done on the displayed text (markers stripped) so that a
     * search match always corresponds to visible, highlightable text in the
     * row. Filtering on {@link trimmedText} would match hidden marker
     * characters (`!`, `#`, `!off`) and show no visible highlight.
     */
    lowerDisplayText: string;

    /**
     * Whether the line is a comment (starts with `!`, or with `#` when it is
     * not a cosmetic rule).
     */
    isComment: boolean;

    /**
     * Whether the line is a disabled rule (starts with the `!off` marker).
     */
    isDisabled: boolean;

    /**
     * Whether the line is empty or contains only whitespace.
     */
    isBlank: boolean;

    /**
     * 0-based position in the original text.
     */
    lineIndex: number;
}

/**
 * A group of one or more consecutive lines of the same kind.
 *
 * Rules are always single-line groups. Comment blocks are groups of
 * one or more consecutive comment lines — the block is displayed
 * together and filtered as one unit.
 */
export interface RuleLineGroup {
    /**
     * All lines in this group. For rules, exactly one line. For comment
     * groups, one or more consecutive comment lines in document order.
     */
    lines: ParsedRuleLine[];

    /**
     * Whether this group is a comment block (true) or a rule (false).
     */
    isComment: boolean;

    /**
     * 0-based position of the first line in the group (used as React key).
     */
    lineIndex: number;
}

/**
 * Marker prepended to a rule to disable it.
 */
const DISABLED_RULE_MARKER = '!off ';

/**
 * Rebuilds the user-rules text with the rule at {@link lineIndex} toggled to the
 * requested disabled state: adds the {@link DISABLED_RULE_MARKER} to disable, or
 * strips the matched strict marker to enable.
 *
 * @param rulesText Full user-rules text.
 * @param lineIndex 0-based raw line index.
 * @param disabled `true` to add the marker (disable), `false` to remove it (enable).
 *
 * @returns New user-rules text with the toggle applied, or the original text if
 * the line index is out of range.
 */
export function setRuleDisabled(
    rulesText: string,
    lineIndex: number,
    disabled: boolean,
): string {
    const parts = rulesText.split(CAPTURING_LINE_TERMINATOR_RE);
    const linePosition = lineIndex * 2;
    const line = parts[linePosition];

    if (line === undefined) {
        return rulesText;
    }

    const trimmed = line.trim();
    if (disabled) {
        if (trimmed.startsWith(DISABLED_RULE_MARKER)) {
            return rulesText;
        }
        parts[linePosition] = `${DISABLED_RULE_MARKER}${trimmed}`;
    } else {
        // Strip the marker (and any extra whitespace after it). If the line is
        // not a recognised disabled rule (e.g. `! off ...`), leave it untouched.
        parts[linePosition] = trimmed.startsWith(DISABLED_RULE_MARKER)
            ? trimmed.slice(DISABLED_RULE_MARKER.length).trimStart()
            : trimmed;
    }

    return parts.join('');
}

/**
 * Exclusion (allowlist) rule marker prefix.
 */
const EXCLUSION_MARKER = '@@';

/**
 * Rule separator character.
 */
const SEPARATOR = '^';

/**
 * Determines whether a trimmed line is a comment.
 *
 * `!` always starts a comment. `#` starts a hosts-style comment only when it is
 * not the marker of a cosmetic rule (e.g. `##.ad`, `#@#.ad`, `#%#...`), which is
 * detected with AGTree's cosmetic rule separator finder.
 *
 * @param trimmedText Whitespace-trimmed line text.
 *
 * @returns `true` if the line is a comment.
 */
function isCommentLine(trimmedText: string): boolean {
    if (trimmedText.startsWith(CommentMarker.Regular)) {
        return true;
    }

    if (trimmedText.startsWith(CommentMarker.Hashmark)) {
        return CosmeticRuleSeparatorUtils.find(trimmedText) === null;
    }

    return false;
}

/**
 * Parses a single raw text line into a {@link ParsedRuleLine}.
 *
 * @param text Raw line content.
 * @param lineIndex 0-based position in the original text.
 *
 * @returns Parsed line descriptor.
 */
export function parseLine(text: string, lineIndex: number): ParsedRuleLine {
    const trimmedText = text.trim();
    const isBlank = trimmedText.length === 0;
    const isDisabled = !isBlank && trimmedText.startsWith(DISABLED_RULE_MARKER);
    // A disabled rule starts with `!`, but it is a rule (not a comment): it is
    // rendered as a rule row with an unchecked checkbox, and the marker is
    // stripped from the displayed/highlighted text.
    const isComment = !isBlank && !isDisabled && isCommentLine(trimmedText);

    let displayText = trimmedText;
    if (isDisabled) {
        displayText = trimmedText.slice(DISABLED_RULE_MARKER.length).trimStart();
    } else if (isComment) {
        // Strip the single-character comment marker (`!` or `#`) for plain-text
        // display; the highlighter still receives the full text via trimmedText.
        displayText = trimmedText.slice(1).trimStart();
    }

    return {
        text,
        trimmedText,
        displayText,
        lowerDisplayText: displayText.toLowerCase(),
        isComment,
        isDisabled,
        isBlank,
        lineIndex,
    };
}

/**
 * Classifies a rule line into a {@link RuleIconType} for icon selection.
 *
 * Order matters: exclusion (`@@`) is checked before the custom/blocking
 * distinction so that allowlist rules with modifiers are still exclusion.
 *
 * @param ruleText Trimmed rule text.
 *
 * @returns The icon type for the rule.
 */
export function classifyRule(ruleText: string): RuleIconType {
    if (ruleText.startsWith(EXCLUSION_MARKER)) {
        return RuleIconType.Exclusion;
    }

    const separatorIndex = ruleText.indexOf(SEPARATOR);
    const hasContentAfterSeparator = separatorIndex !== -1
        && separatorIndex < ruleText.length - 1;

    if (hasContentAfterSeparator) {
        return RuleIconType.Custom;
    }

    return RuleIconType.Blocking;
}

/**
 * Parses a raw user rules string into a flat array of {@link ParsedRuleLine}s
 * suitable for list rendering.
 *
 * Splitting is performed on `\n`, `\r\n`, and `\r` line endings. Blank lines are
 * skipped.
 *
 * @param rulesText Raw user rules string (newline-separated).
 *
 * @returns Array of parsed lines. Returns an empty array when the input contains
 * no non-blank lines.
 */
export function parseRuleLines(rulesText: string): ParsedRuleLine[] {
    if (!rulesText.trim()) {
        return [];
    }

    const rawLines = rulesText.split(LINE_TERMINATOR_RE);
    return rawLines
        .map((line, index) => parseLine(line, index))
        .filter((line) => !line.isBlank);
}

/**
 * Groups consecutive comment lines from a flat {@link ParsedRuleLine} array
 * into {@link RuleLineGroup} items.
 *
 * Each rule line becomes its own single-line group. Consecutive comment lines
 * are merged into a single group so that the whole comment block is displayed
 * together and filtered as one unit.
 *
 * @param lines Flat array of parsed lines (as returned by {@link parseRuleLines}).
 *
 * @returns Array of line groups.
 */
export function groupLines(lines: ParsedRuleLine[]): RuleLineGroup[] {
    if (lines.length === 0) {
        return [];
    }

    const groups: RuleLineGroup[] = [];
    let pendingCommentLines: ParsedRuleLine[] = [];

    const flushComments = () => {
        const firstCommentLineIndex = pendingCommentLines[0]?.lineIndex;
        if (firstCommentLineIndex === undefined) {
            return;
        }
        groups.push({
            lines: [...pendingCommentLines],
            isComment: true,
            lineIndex: firstCommentLineIndex,
        });
        pendingCommentLines = [];
    };

    for (const line of lines) {
        if (line.isComment) {
            pendingCommentLines.push(line);
        } else {
            flushComments();
            groups.push({
                lines: [line],
                isComment: false,
                lineIndex: line.lineIndex,
            });
        }
    }

    flushComments();
    return groups;
}

/**
 * Filters rule line groups by a search term (case-insensitive substring match).
 *
 * A group is kept if **any** of its lines contains the search term. This means
 * a multi-line comment block is shown in its entirety whenever at least one
 * of its lines matches.
 *
 * @param groups Array of rule line groups.
 * @param searchTerm Search term (empty string returns all groups).
 *
 * @returns Filtered array of rule line groups.
 */
export function filterGroups(
    groups: RuleLineGroup[],
    searchTerm: string,
): RuleLineGroup[] {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) {
        return groups;
    }

    return groups.filter((group) => group.lines.some(
        (line) => line.lowerDisplayText.includes(lowerSearch),
    ));
}

/**
 * Removes the lines at the given 0-based indices from the raw user rules text.
 *
 * Lines are indexed the same way as {@link parseRuleLines} (split on `\n`,
 * `\r\n`, `\r`), so the indices carried by {@link ParsedRuleLine.lineIndex} map
 * directly to the lines removed here. Every other line is preserved
 * byte-for-byte, including its original terminator; blank lines that are not in
 * {@link lineIndices} are kept. A removed line is dropped together with its own
 * terminator.
 *
 * @param rulesText Raw user rules string
 * @param lineIndices 0-based indices of lines to remove
 *
 * @returns The rules text with the given lines removed
 */
export function deleteLinesFromRules(rulesText: string, lineIndices: number[]): string {
    if (lineIndices.length === 0) {
        return rulesText;
    }

    const toRemove = new Set(lineIndices);
    // Capturing split keeps the original terminators: the array alternates
    // [content, terminator, content, terminator, ..., content]. Even positions
    // are line contents (aligned with parseRuleLines indices); odd positions are
    // the terminators that followed them.
    const parts = rulesText.split(CAPTURING_LINE_TERMINATOR_RE);
    const numLines = Math.ceil(parts.length / 2);

    // Find the highest line index that is kept so we can drop any orphaned
    // trailing terminator after it.
    let highestKept = -1;
    for (let i = numLines - 1; i >= 0; i -= 1) {
        if (!toRemove.has(i)) {
            highestKept = i;
            break;
        }
    }

    let result = '';
    for (let i = 0; i < numLines; i += 1) {
        if (toRemove.has(i)) {
            // Skip the line content and its trailing terminator.
            continue;
        }
        result += parts[i * 2] ?? '';
        // Keep the terminator only when there is another kept line after this
        // one; otherwise the terminator would become a trailing newline that
        // wasn't present in the original input.
        if (i !== highestKept) {
            result += parts[i * 2 + 1] ?? '';
        }
    }

    return result;
}

/**
 * Re-inserts previously deleted lines back into the rules text at their
 * original 0-based line indices.
 *
 * @param rulesText Current raw user rules string.
 * @param lines Lines to insert, each with its original `lineIndex` and `text`.
 *
 * @returns The rules text with the given lines re-inserted.
 */
export function insertLinesIntoRules(
    rulesText: string,
    lines: { lineIndex: number; text: string }[],
): string {
    if (lines.length === 0) {
        return rulesText;
    }

    // Sort by original line index so inserts proceed left-to-right.
    const sorted = [...lines].sort((a, b) => a.lineIndex - b.lineIndex);

    // Split the current text into raw lines (content only, terminators dropped).
    const currentLines = rulesText.length > 0
        ? rulesText.split(LINE_TERMINATOR_RE)
        : [];

    // Insert each deleted line at its original index. Because we process in
    // ascending order, each insertion naturally shifts subsequent elements,
    // and the original indices remain correct — they represent the intended
    // final positions. No offset adjustment is needed.
    for (const { lineIndex, text } of sorted) {
        const insertAt = Math.min(lineIndex, currentLines.length);
        currentLines.splice(insertAt, 0, text);
    }

    return currentLines.join('\n');
}
