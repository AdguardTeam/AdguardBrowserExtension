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
 */
export const LINE_TERMINATOR_RE = /\r\n|\r|\n/;

/**
 * `split` discards delimiters unless they are captured, so this wraps
 * {@link LINE_TERMINATOR_RE} to retain original line terminators.
 */
const CAPTURING_LINE_TERMINATOR_RE = new RegExp(`(${LINE_TERMINATOR_RE.source})`);

/**
 * Returns the position of the given line's content in the capturing split of
 * the rules text. The split alternates [content, terminator, content, …], so
 * the content of line `n` is at `2 * n` and its terminator at `2 * n + 1`.
 *
 * @param lineIndex 0-based raw line index.
 *
 * @returns Position of the line's content in the split parts array.
 */
const getLineContentPosition = (lineIndex: number): number => lineIndex * 2;

/**
 * Returns the position of the terminator that follows the given line in the
 * capturing split of the rules text (see {@link getLineContentPosition}).
 *
 * @param lineIndex 0-based raw line index.
 *
 * @returns Position of the line's terminator in the split parts array.
 */
const getLineTerminatorPosition = (lineIndex: number): number => lineIndex * 2 + 1;

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
 * A rule line removed by a delete, with its raw line index at deletion time.
 */
export type DeletedRuleLine = {
    /**
     * 0-based raw line index at deletion time.
     */
    lineIndex: number;

    /**
     * Raw line text.
     */
    text: string;
};

/**
 * Anchor captured when a rule block is deleted, used to restore the block when
 * the pending-delete bookkeeping is unavailable (e.g. after the list unmounted
 * and the rules were changed in the Edit view).
 *
 * The anchor records the nearest non-blank neighbours, the raw gaps around the
 * block and the blank lines that survived inside its span, so Undo can put the
 * block and its blank lines back in the exact place.
 */
export type DeletedBlockAnchor = {
    /**
     * Trimmed text of the nearest non-blank line before the deleted block, or
     * `null` when the block was at the top of the list.
     */
    beforeText: string | null;

    /**
     * Trimmed text of the nearest non-blank line after the deleted block, or
     * `null` when the block was at the bottom of the list.
     */
    afterText: string | null;

    /**
     * Raw index of the block's first line at deletion time.
     */
    firstIndex: number;

    /**
     * Raw index of the block's last line at deletion time.
     */
    lastIndex: number;

    /**
     * Number of raw lines between the before-neighbour and the block that the
     * delete kept (blank lines).
     */
    beforeGapCount: number;

    /**
     * Number of raw lines between the block and the after-neighbour that the
     * delete kept (blank lines).
     */
    afterGapCount: number;

    /**
     * Number of raw lines inside the deleted block's span that were not deleted
     * — e.g. the blank line inside a comment block, which parsing skips but the
     * raw text keeps.
     */
    spanSurvivorCount: number;
};

/**
 * A deleted block that can still be restored by its notification's Undo
 * button.
 *
 * Logical indices describe the document as if every pending block were still
 * in place: the real rules text is the logical document minus all pending
 * blocks. They keep stacked deletes ordered relative to each other without
 * relying on text matching.
 */
export type PendingDeletedBlock = {
    /**
     * Deleted lines with their raw indices at deletion time.
     */
    lines: DeletedRuleLine[];

    /**
     * Logical line indices of {@link lines}, parallel to it.
     */
    logicalLineIndices: number[];

    /**
     * Text-based fallback for when the logical indices are stale.
     */
    anchor: DeletedBlockAnchor;
};

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
    const linePosition = getLineContentPosition(lineIndex);
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
 * Returns the marker prefix stripped from a line's inline editor seed, so the
 * marker can be restored when the draft is saved.
 *
 * Comments keep their `!`/`#` marker together with the whitespace after it;
 * disabled rules keep the `!off` marker. Every other line has an empty prefix.
 *
 * @param line Parsed rule line.
 *
 * @returns Marker prefix to prepend to the saved draft.
 */
export function getInlineEditorPrefix(line: ParsedRuleLine): string {
    if (line.isComment) {
        return line.trimmedText.slice(0, line.trimmedText.length - line.displayText.length);
    }

    if (line.isDisabled) {
        return DISABLED_RULE_MARKER;
    }

    return '';
}

/**
 * Returns the text the inline editor is seeded with for a group: the displayed
 * text of every line joined with newlines. For a rule group this is the single
 * line's displayed text; for a comment block it is the whole block with the
 * markers stripped, so the user edits plain comment lines.
 *
 * @param group Rule line group.
 *
 * @returns Seed text for the inline editor.
 */
export function getInlineEditorGroupSeed(group: RuleLineGroup): string {
    return group.lines.map((line) => line.displayText).join('\n');
}

/**
 * Checks whether an inline draft would change the stored group. A draft that
 * only differs in whitespace is treated as unchanged, because saving trims it:
 * rules and disabled rules keep their marker and strip surrounding whitespace,
 * while comment lines are trimmed individually. Used by both the save path and
 * the unsaved-changes warning so they agree on what counts as an edit.
 *
 * @param draft Current editor content (marker-stripped).
 * @param storedValue Seed the editor was opened with.
 * @param isComment Whether the edited group is a comment block.
 *
 * @returns `true` when saving the draft would not change the stored text.
 */
export function isInlineDraftUnchanged(
    draft: string,
    storedValue: string,
    isComment: boolean,
): boolean {
    if (isComment) {
        return normalizeCommentDraft(draft) === normalizeCommentDraft(storedValue);
    }

    return draft.trim() === storedValue.trim();
}

/**
 * Captures the lines and the neighbour anchor of a group that is about to be
 * deleted.
 *
 * @param rulesText Raw rules text before the deletion.
 * @param group Group to delete.
 *
 * @returns Deleted lines and their rebasing anchor.
 */
export function captureDeletedBlock(
    rulesText: string,
    group: RuleLineGroup,
): { lines: DeletedRuleLine[]; anchor: DeletedBlockAnchor } {
    const lines = group.lines.map((line) => ({
        lineIndex: line.lineIndex,
        text: line.text,
    }));
    const firstIndex = group.lines[0]?.lineIndex ?? 0;
    const lastIndex = group.lines[group.lines.length - 1]?.lineIndex ?? firstIndex;
    const parsedLines = parseRuleLines(rulesText);
    const linesBefore = parsedLines.filter((line) => line.lineIndex < firstIndex);
    const lineAfter = parsedLines.find((line) => line.lineIndex > lastIndex);
    const lastBeforeIndex = linesBefore[linesBefore.length - 1]?.lineIndex;

    return {
        lines,
        anchor: {
            beforeText: linesBefore[linesBefore.length - 1]?.trimmedText ?? null,
            afterText: lineAfter?.trimmedText ?? null,
            firstIndex,
            lastIndex,
            beforeGapCount: lastBeforeIndex === undefined
                ? 0
                : firstIndex - lastBeforeIndex - 1,
            afterGapCount: lineAfter === undefined
                ? 0
                : lineAfter.lineIndex - lastIndex - 1,
            // Lines inside the span that the delete did not remove (a blank
            // line between two comment lines) stay in the text, so the block
            // has to be shifted back by them on Undo.
            spanSurvivorCount: Math.max(
                lastIndex - firstIndex + 1 - group.lines.length,
                0,
            ),
        },
    };
}

/**
 * Maps a real raw line index to the logical document that still contains every
 * pending deleted block. The real text is the logical document minus those
 * blocks, so each pending line at or before the current logical position shifts
 * the index by one.
 *
 * @param realLineIndex Raw line index in the currently visible rules text.
 * @param pendingBlocks Blocks that were deleted and can still be undone.
 *
 * @returns Corresponding line index in the logical document.
 */
export function getLogicalLineIndex(
    realLineIndex: number,
    pendingBlocks: PendingDeletedBlock[],
): number {
    const pendingIndices = pendingBlocks
        .flatMap((block) => block.logicalLineIndices)
        .sort((a, b) => a - b);

    let logicalLineIndex = realLineIndex;
    for (const pendingIndex of pendingIndices) {
        if (pendingIndex > logicalLineIndex) {
            break;
        }
        logicalLineIndex += 1;
    }

    return logicalLineIndex;
}

/**
 * Creates a pending deleted block from a group in the currently visible text.
 *
 * @param rulesText Raw rules text before the deletion.
 * @param group Group to delete.
 * @param pendingBlocks Blocks that were deleted earlier and can still be
 * undone.
 *
 * @returns Pending block with its logical line indices.
 */
export function createPendingDeletedBlock(
    rulesText: string,
    group: RuleLineGroup,
    pendingBlocks: PendingDeletedBlock[],
): PendingDeletedBlock {
    const captured = captureDeletedBlock(rulesText, group);

    return {
        ...captured,
        logicalLineIndices: group.lines.map((line) => getLogicalLineIndex(
            line.lineIndex,
            pendingBlocks,
        )),
    };
}

/**
 * Finds the index at which a previously deleted block should be re-inserted,
 * rebasing its captured position on the current text.
 *
 * @param currentRules Current raw rules text.
 * @param anchor Neighbours captured when the block was deleted.
 *
 * @returns Current insertion index for the block's first line.
 */
export function resolveDeletedBlockInsertIndex(
    currentRules: string,
    anchor: DeletedBlockAnchor,
): number {
    if (currentRules.length === 0) {
        // Nothing is left to anchor against: the block becomes the first line
        // instead of keeping its old raw index and padding the empty text with
        // blank lines.
        return 0;
    }

    const lines = parseRuleLines(currentRules);

    /**
     * Finds the index of the occurrence of the given text closest to the
     * preferred position, so duplicated blocks do not move the restored block
     * to an unrelated row.
     *
     * @param text Trimmed line text to look for.
     * @param preferredIndex Position the occurrence is expected at.
     *
     * @returns Found line index, or `null` when the text is gone.
     */
    const findClosestIndex = (text: string, preferredIndex: number): number | null => (
        lines.reduce<number | null>((closest, line) => {
            if (line.trimmedText !== text) {
                return closest;
            }
            if (
                closest === null
                || Math.abs(line.lineIndex - preferredIndex) < Math.abs(closest - preferredIndex)
            ) {
                return line.lineIndex;
            }
            return closest;
        }, null)
    );

    if (anchor.afterText === null) {
        // The block was last when it was deleted, so it goes after the last
        // non-blank line rather than at the raw end: appending at the raw end
        // would add an extra blank line when the text ends with a terminator.
        // The blank lines that preceded the block are kept.
        const lastNonBlankIndex = lines[lines.length - 1]?.lineIndex;
        if (lastNonBlankIndex === undefined) {
            return anchor.firstIndex;
        }
        return lastNonBlankIndex + anchor.beforeGapCount + 1;
    }

    const afterIndex = findClosestIndex(
        anchor.afterText,
        anchor.lastIndex + 1 + anchor.afterGapCount,
    );
    if (afterIndex !== null) {
        // The block goes right before the line that followed it. Blank lines
        // between the block and that line, and blank lines that survived inside
        // the block, still sit in the text, so the block starts that many lines
        // earlier.
        return Math.max(afterIndex - anchor.afterGapCount - anchor.spanSurvivorCount, 0);
    }

    if (anchor.beforeText !== null) {
        const beforeIndex = findClosestIndex(
            anchor.beforeText,
            Math.max(anchor.firstIndex - anchor.beforeGapCount - 1, 0),
        );
        if (beforeIndex !== null) {
            // The after-neighbour is gone too: the block goes after the line
            // that preceded it, keeping the blank lines between them.
            return beforeIndex + anchor.beforeGapCount + 1;
        }
    }

    // Neither neighbour is left: fall back to the captured position, which is
    // exact when the block is re-inserted before any newer delete is undone.
    // Unlike appending, this keeps a block that was first in the list first.
    // Clamp to the current end so a stale captured index cannot create blank
    // lines (an empty text is handled above).
    const lastLineIndex = lines[lines.length - 1]?.lineIndex ?? 0;
    return Math.min(anchor.firstIndex, lastLineIndex + 1);
}

/**
 * Restores a deleted block by matching its captured neighbours in the given
 * text. Used when the pending-delete bookkeeping is unavailable, e.g. after the
 * list unmounted and the Edit view changed the rules.
 *
 * @param currentRules Current raw rules text.
 * @param block Deleted block with its anchor.
 *
 * @returns Rules text with the block restored.
 */
export function restoreDeletedBlockWithAnchor(
    currentRules: string,
    block: Pick<PendingDeletedBlock, 'lines' | 'anchor'>,
): string {
    const insertIndex = resolveDeletedBlockInsertIndex(currentRules, block.anchor);
    const linesToInsert = block.lines.map((line) => ({
        lineIndex: insertIndex + (line.lineIndex - block.anchor.firstIndex),
        text: line.text,
    }));

    return insertLinesIntoRules(currentRules, linesToInsert);
}

/**
 * Restores a pending deleted block at its logical position in the real text,
 * keeping its internal blank lines and its order relative to other pending
 * deletes.
 *
 * Each line is mapped on its own: its logical index minus the number of other
 * pending lines below it. Mapping only the first line would count pending lines
 * that sit between the restored block's lines (e.g. a deleted rule between two
 * comments that merged into one block) and push the later lines too far down.
 *
 * @param currentRules Current raw rules text.
 * @param pendingBlocks Blocks that were deleted and can still be undone,
 * including the target.
 * @param target Block that is being restored.
 *
 * @returns Rules text with the block restored.
 */
export function restorePendingDeletedBlock(
    currentRules: string,
    pendingBlocks: PendingDeletedBlock[],
    target: PendingDeletedBlock,
): string {
    const linesToInsert = target.lines.map((line, index) => {
        const logicalLineIndex = target.logicalLineIndices[index] ?? 0;
        const pendingLinesBefore = pendingBlocks.reduce((count, block) => {
            if (block === target) {
                return count;
            }
            return count + block.logicalLineIndices.filter(
                (lineIndex) => lineIndex < logicalLineIndex,
            ).length;
        }, 0);

        return {
            lineIndex: Math.max(logicalLineIndex - pendingLinesBefore, 0),
            text: line.text,
        };
    });

    return insertLinesIntoRules(currentRules, linesToInsert);
}

/**
 * Normalizes a comment block draft for change detection: trims every line,
 * mirroring the per-line trimming performed when the draft is serialized (see
 * {@link serializeCommentDraft}). Used to tell an unchanged draft, or one that
 * differs only in whitespace, from a real edit — so saving it can be skipped
 * and no unsaved-changes warning is shown for it.
 *
 * @param draft Current editor content (marker-stripped lines).
 *
 * @returns Normalized draft text.
 */
export function normalizeCommentDraft(draft: string): string {
    return draft.split(LINE_TERMINATOR_RE).map((line) => line.trim()).join('\n');
}

/**
 * Marker prefix used when a composed comment line would no longer parse as a
 * comment. `!` always starts a comment, so it is a safe fallback for any text.
 */
const FALLBACK_COMMENT_MARKER_PREFIX = `${CommentMarker.Regular} `;

/**
 * Returns the marker prefix for a line added to a comment block. Added lines
 * inherit the block's last-line prefix exactly — marker and whitespace — so a
 * line appended to the block matches the style of the line it follows: a block
 * written without a space after `!`/`#` keeps growing without one, and a
 * spaced block keeps its spacing.
 *
 * @param group Comment block group. Comment groups always have at least one
 * line (see {@link groupLines}).
 *
 * @returns Marker prefix for an added line.
 */
function getAddedCommentLinePrefix(group: RuleLineGroup): string {
    // Comment groups always have at least one line (see `groupLines`).
    const lastLine = group.lines[group.lines.length - 1]!;
    return getInlineEditorPrefix(lastLine);
}

/**
 * Composes a raw comment line from its marker prefix and displayed text,
 * guaranteeing that the result still parses as a comment.
 *
 * The editor hides the markers, so a draft can silently turn a comment into a
 * rule (`# ` + `example.org##.banner` becomes a cosmetic rule) or into a
 * disabled rule (`!` + `off topic` becomes `!off topic`). In that case the
 * text is re-prefixed with `! `, which always parses as a comment.
 *
 * @param prefix Marker prefix to prepend, e.g. `! ` or `# `.
 * @param text Displayed (marker-stripped) line text, already trimmed.
 *
 * @returns Raw comment line, without trailing whitespace for an empty text.
 */
function composeCommentLine(prefix: string, text: string): string {
    const composed = `${prefix}${text}`;
    if (parseLine(composed, 0).isComment) {
        return composed.trimEnd();
    }

    return `${FALLBACK_COMMENT_MARKER_PREFIX}${text}`.trimEnd();
}

/**
 * Serializes a comment block draft into raw comment lines.
 *
 * Draft lines are matched against the block's original lines in two passes:
 *
 * 1. A line whose text is unchanged keeps the original line's marker and the
 *    whitespace after it, so markers stay attached to their lines when lines
 *    are inserted, removed or reordered. Duplicate texts are matched in order.
 * 2. A line without an unchanged counterpart (new or reworded) takes the first
 *    unclaimed original marker in draft order — not necessarily the marker of
 *    the line it replaced — or inherits the block's last-line prefix when no
 *    original line is left.
 *
 * Draft lines are trimmed, matching the single-line save behavior. A composed
 * line that would no longer parse as a comment falls back to the `! ` marker
 * (see {@link composeCommentLine}).
 *
 * @param group Comment block group.
 * @param draft Current editor content (marker-stripped lines).
 *
 * @returns Raw comment lines ready to be written to the rules text.
 */
export function serializeCommentDraft(group: RuleLineGroup, draft: string): string[] {
    const draftLines = draft.split(LINE_TERMINATOR_RE).map((line) => line.trim());
    const prefixes: (string | undefined)[] = new Array(draftLines.length);

    // Index the original lines by displayed text so the first pass claims a
    // matching marker in constant time per draft line. Scanning and splicing
    // the whole block for every line would be quadratic for large blocks.
    const lineIndicesByText = new Map<string, number[]>();
    group.lines.forEach((line, index) => {
        const indices = lineIndicesByText.get(line.displayText);
        if (indices) {
            indices.push(index);
        } else {
            lineIndicesByText.set(line.displayText, [index]);
        }
    });
    const nextIndexByText = new Map<string, number>();
    const claimed = new Array<boolean>(group.lines.length).fill(false);

    // First pass: unchanged lines keep their own marker.
    draftLines.forEach((text, index) => {
        const indices = lineIndicesByText.get(text);
        if (!indices) {
            return;
        }
        const nextIndex = nextIndexByText.get(text) ?? 0;
        const lineIndex = indices[nextIndex];
        if (lineIndex === undefined) {
            return;
        }
        const matchedLine = group.lines[lineIndex];
        if (!matchedLine) {
            return;
        }
        nextIndexByText.set(text, nextIndex + 1);
        claimed[lineIndex] = true;
        prefixes[index] = getInlineEditorPrefix(matchedLine);
    });

    const addedLinePrefix = getAddedCommentLinePrefix(group);
    let firstUnclaimedIndex = 0;
    const takeFirstUnclaimedLine = () => {
        while (firstUnclaimedIndex < group.lines.length && claimed[firstUnclaimedIndex]) {
            firstUnclaimedIndex += 1;
        }
        const line = group.lines[firstUnclaimedIndex];
        if (line) {
            claimed[firstUnclaimedIndex] = true;
            firstUnclaimedIndex += 1;
        }
        return line;
    };

    // Second pass: new or reworded lines take the first unclaimed original
    // marker in draft order, or the block's last-line prefix when nothing is
    // left.
    return draftLines.map((text, index) => {
        let prefix = prefixes[index];
        if (prefix === undefined) {
            const unclaimedLine = takeFirstUnclaimedLine();
            prefix = unclaimedLine ? getInlineEditorPrefix(unclaimedLine) : addedLinePrefix;
        }
        return composeCommentLine(prefix, text);
    });
}

/**
 * Serializes a single-line inline edit of a rule into a raw line, keeping the
 * line's marker prefix: `!off ` for a disabled rule, empty for an enabled one.
 *
 * Comment lines never go through here: they are serialized through
 * {@link serializeCommentDraft}, which also keeps every composed line a
 * comment.
 *
 * @param line Parsed rule line being edited.
 * @param draft Current editor content (marker-stripped).
 *
 * @returns Raw line ready to be written to the rules text.
 */
export function serializeRuleDraft(line: ParsedRuleLine, draft: string): string {
    return `${getInlineEditorPrefix(line)}${draft.trim()}`;
}

/**
 * Replaces a group's lines in the rules text with new raw lines, supporting a
 * different line count: lines with a draft counterpart are replaced in place
 * (keeping the surrounding raw text untouched), surplus block lines are
 * removed, and extra draft lines are inserted after the block's last line.
 *
 * Works with non-contiguous line indices (e.g. a comment block whose lines are
 * separated by a blank line, which parsing skips but the raw text keeps) and is
 * the single replacement path for both row kinds: a rule row is a one-line
 * group.
 *
 * @param rulesText Full user-rules text.
 * @param group Group whose lines are replaced.
 * @param newLines Raw replacement lines, already marker-prefixed.
 *
 * @returns New user-rules text with the group's lines replaced.
 */
export function replaceGroupLinesInRules(
    rulesText: string,
    group: RuleLineGroup,
    newLines: string[],
): string {
    const originalIndices = group.lines.map((line) => line.lineIndex);
    const replacedCount = Math.min(originalIndices.length, newLines.length);

    // Split the text once and replace the lines in place: re-splitting the
    // whole text for every line is quadratic and blocks the page for a large
    // comment block in a large filter.
    const parts = rulesText.split(CAPTURING_LINE_TERMINATOR_RE);
    for (let i = 0; i < replacedCount; i += 1) {
        const lineIndex = originalIndices[i];
        if (lineIndex === undefined) {
            continue;
        }
        const linePosition = getLineContentPosition(lineIndex);
        if (parts[linePosition] === undefined) {
            continue;
        }
        parts[linePosition] = (newLines[i] ?? '').trim();
    }
    let result = parts.join('');

    if (newLines.length < originalIndices.length) {
        result = deleteLinesFromRules(result, originalIndices.slice(newLines.length));
    }

    if (newLines.length > originalIndices.length) {
        const lastLineIndex = originalIndices[originalIndices.length - 1];
        if (lastLineIndex !== undefined) {
            const addedLines = newLines
                .slice(originalIndices.length)
                .map((text, offset) => ({
                    lineIndex: lastLineIndex + 1 + offset,
                    text,
                }));
            result = insertLinesIntoRules(result, addedLines);
        }
    }

    return result;
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
 * Normalizes a search term for {@link groupMatchesSearch}: trims it and lowers
 * its case.
 *
 * @param searchTerm Search term as typed.
 *
 * @returns Normalized search term; an empty string means "no search".
 */
function normalizeSearchTerm(searchTerm: string): string {
    return searchTerm.trim().toLowerCase();
}

/**
 * Checks whether a group matches a normalized search term (case-insensitive
 * substring match). A group matches if **any** of its lines contains the term,
 * so a multi-line comment block matches as a whole.
 *
 * @param group Rule line group to check.
 * @param lowerSearch Search term normalized with {@link normalizeSearchTerm}.
 *
 * @returns `true` if the group matches.
 */
function groupMatchesSearch(group: RuleLineGroup, lowerSearch: string): boolean {
    return group.lines.some((line) => line.lowerDisplayText.includes(lowerSearch));
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
 * @param alwaysKeep Optional check for groups that stay in the result even
 * when they do not match, e.g. the row being edited. The groups keep their
 * document order.
 *
 * @returns Filtered array of rule line groups.
 */
export function filterGroups(
    groups: RuleLineGroup[],
    searchTerm: string,
    alwaysKeep?: (group: RuleLineGroup) => boolean,
): RuleLineGroup[] {
    const lowerSearch = normalizeSearchTerm(searchTerm);
    if (!lowerSearch) {
        return groups;
    }

    return groups.filter((group) => groupMatchesSearch(group, lowerSearch) || alwaysKeep?.(group));
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
        result += parts[getLineContentPosition(i)] ?? '';
        // Keep the terminator only when there is another kept line after this
        // one; otherwise the terminator would become a trailing newline that
        // wasn't present in the original input.
        if (i !== highestKept) {
            result += parts[getLineTerminatorPosition(i)] ?? '';
        }
    }

    return result;
}

/**
 * Inserts lines into the rules text at the given 0-based line indices: used to
 * restore previously deleted lines on Undo, to prepend a newly created rule,
 * and to grow a comment block.
 *
 * Inserted lines adopt the line terminator of the surrounding text: the
 * terminator of the line they follow, the first line's terminator when
 * inserted at the top, or the last terminator when appending after a line that
 * has none. A text using CRLF/CR terminators is therefore not rewritten to LF;
 * `\n` is used only when there is no terminator to inherit.
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

    if (rulesText.length === 0) {
        // No terminators to inherit, but the indices still carry the gaps
        // between the restored lines (e.g. the blank line inside a comment
        // block), so materialize them as empty lines.
        const lines: string[] = [];
        for (const { lineIndex, text } of sorted) {
            const targetIndex = Math.max(lineIndex, 0);
            while (lines.length < targetIndex) {
                lines.push('');
            }
            lines[targetIndex] = text;
        }
        return lines.join('\n');
    }

    // Capturing split keeps the original terminators: the array alternates
    // [content, terminator, content, terminator, ..., content]. Even positions
    // are line contents (aligned with parseRuleLines indices); odd positions are
    // the terminators that followed them. The last content has no terminator
    // after it, even when the text ends with a terminator (the terminator then
    // starts a trailing empty line).
    const parts = rulesText.split(CAPTURING_LINE_TERMINATOR_RE);

    // Insert each deleted line at its original index. Because we process in
    // ascending order, each insertion naturally shifts subsequent elements,
    // and the original indices remain correct — they represent the intended
    // final positions. No offset adjustment is needed.
    for (const { lineIndex, text } of sorted) {
        const numLines = Math.ceil(parts.length / 2);
        const insertAt = Math.min(lineIndex, numLines);
        // Reuse the terminator of the line the new line follows; inserting at
        // the top has no preceding line, so the first line's terminator is used
        // instead, and appending falls back to the last terminator of the text.
        // `\n` is the fallback when the text has no terminator at all.
        const precedingTerminator = parts[getLineTerminatorPosition(insertAt - 1)];
        const fallbackTerminator = insertAt === 0
            ? parts[getLineTerminatorPosition(0)]
            : parts[parts.length - 2];
        const terminator = precedingTerminator ?? fallbackTerminator ?? '\n';

        if (insertAt === numLines) {
            // Append: the last line has no terminator after it, so the
            // separator has to be added before the new line.
            parts.push(terminator, text);
        } else {
            parts.splice(getLineContentPosition(insertAt), 0, text, terminator);
        }
    }

    return parts.join('');
}
