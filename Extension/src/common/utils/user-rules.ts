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

import { NEWLINE_CHAR_UNIX, NEWLINE_CHAR_REGEX } from '../constants';

/**
 * Result of merging raw imported rule text into the existing rules string.
 */
export type MergeImportedRulesResult = {
    /**
     * Existing rules joined with the genuinely-new, non-blank imported rules,
     * trimmed of trailing whitespace.
     */
    merged: string;
    /**
     * Number of genuinely-new rules appended.
     */
    addedCount: number;
};

/**
 * Parses raw imported rule text and merges only the genuinely-new, non-blank
 * rules into the existing rules string.
 *
 * Centralised so the import/dedup algorithm cannot drift between callers
 * (the header menu on the options page and the shared editor toolbar). Blank
 * lines in the imported file are dropped — they carry no filtering value and
 * only add noise to the stored list. Existing rules are preserved verbatim,
 * including their blank lines.
 *
 * The caller is responsible for detecting an empty/whitespace-only import
 * (`rawNewRules.trim().length === 0`) and surfacing the appropriate error
 * notification, because that UI behaviour differs across callers (the menu
 * shows an error toast; the editor silently skips).
 *
 * @param oldRulesString Current persisted or in-memory rules text.
 * @param rawNewRules Raw imported file content (will be trimmed).
 *
 * @returns Merged rules string and the count of newly added rules.
 */
export function mergeImportedRules(
    oldRulesString: string,
    rawNewRules: string,
): MergeImportedRulesResult {
    const trimmedNew = rawNewRules.trim();
    const oldRules = oldRulesString.split(NEWLINE_CHAR_REGEX);
    const newRules = trimmedNew.split(NEWLINE_CHAR_REGEX);

    // Pre-build a Set of trimmed old rules for O(1) duplicate lookup.
    const oldRulesSet = new Set(oldRules.map((r) => r.trim()));

    const uniqNewRules = newRules.filter((rule) => {
        const trimmedRule = rule.trim();
        if (trimmedRule.length === 0) {
            return false;
        }
        return !oldRulesSet.has(trimmedRule);
    });

    const merged = [...oldRules, ...uniqNewRules].join(NEWLINE_CHAR_UNIX).trim();

    return { merged, addedCount: uniqNewRules.length };
}

/**
 * Returns the suffix that {@link appendRule} appends to the given text:
 * the rule, preceded by a newline separator when needed.
 *
 * @param rulesText Current rules text.
 * @param rule Rule to append.
 *
 * @returns Text to insert at the end of the document.
 */
export function appendRuleSuffix(rulesText: string, rule: string): string {
    if (rulesText.length === 0 || rulesText.endsWith(NEWLINE_CHAR_UNIX)) {
        return rule;
    }
    return NEWLINE_CHAR_UNIX + rule;
}

/**
 * Appends a rule to the rules text, adding a newline separator only when the
 * existing text is non-empty and does not already end with one.
 *
 * @param rulesText Current rules text.
 * @param rule Rule to append.
 *
 * @returns Rules text with the rule appended.
 */
export function appendRule(rulesText: string, rule: string): string {
    return rulesText + appendRuleSuffix(rulesText, rule);
}

/**
 * Removes all lines exactly matching the rule from the rules text.
 *
 * Matches the storage semantics: duplicate occurrences of the same rule are
 * all removed. Lines are joined with Unix newlines.
 *
 * @param rulesText Current rules text.
 * @param rule Rule to remove.
 *
 * @returns Rules text without the matching lines.
 */
export function removeRule(rulesText: string, rule: string): string {
    return rulesText
        .split(NEWLINE_CHAR_REGEX)
        .filter((line) => line !== rule)
        .join(NEWLINE_CHAR_UNIX);
}

/**
 * A half-open text range `[from, to)` within the rules text.
 */
export type TextRange = {
    /**
     * Start offset of the range.
     */
    readonly from: number;

    /**
     * End offset of the range.
     */
    readonly to: number;
};

/**
 * Computes the ranges to delete in order to remove all lines exactly matching
 * the rule, mirroring {@link removeRule} semantics (duplicates are all
 * removed). Each matched line swallows its preceding newline, unless the
 * previous line also matched (its newline is already consumed) — then it
 * swallows the following one.
 *
 * The ranges refer to the original text and must be applied from last to
 * first so earlier offsets stay valid.
 *
 * @param rulesText Current rules text. Must be LF-normalized (CodeMirror
 * documents always are).
 * @param rule Rule to remove.
 *
 * @returns Ranges to delete, in document order.
 */
export function computeRemoveRanges(
    rulesText: string,
    rule: string,
): TextRange[] {
    const lines = rulesText.split(NEWLINE_CHAR_UNIX);
    const ranges: TextRange[] = [];
    let offset = 0;
    let prevMatched = false;
    lines.forEach((line, index) => {
        const lineStart = offset;
        const lineEnd = offset + line.length;
        offset = lineEnd + 1;
        if (line !== rule) {
            prevMatched = false;
            return;
        }
        const from = index > 0 && !prevMatched ? lineStart - 1 : lineStart;
        const to = index > 0 && !prevMatched ? lineEnd : Math.min(lineEnd + 1, rulesText.length);
        ranges.push({ from, to });
        prevMatched = true;
    });

    return ranges;
}

/**
 * Whether the rules text contains at least one non-whitespace rule.
 *
 * @param rulesText Rules text.
 *
 * @returns True if there is anything to export or save.
 */
export function hasUserRules(rulesText: string): boolean {
    return rulesText.trim().length > 0;
}

/**
 * Operations behind the `NotifierType.UserFilterUpdated` event.
 */
export const UserFilterUpdateOperation = {
    /**
     * A single rule was appended to the end of the list.
     */
    Add: 'add',

    /**
     * A single rule was removed from the list.
     */
    Remove: 'remove',
} as const;

/**
 * Describes a granular change behind the `NotifierType.UserFilterUpdated`
 * event. Sent as the first data argument of the notification so listeners
 * can apply a patch instead of refetching the whole rules list. An absent
 * or invalid payload means a full replacement — listeners refetch.
 */
export type UserFilterUpdatedEventData =
    | { readonly operation: typeof UserFilterUpdateOperation.Add; readonly ruleText: string }
    | { readonly operation: typeof UserFilterUpdateOperation.Remove; readonly ruleText: string };

/**
 * Narrows an unknown notification payload to {@link UserFilterUpdatedEventData}.
 *
 * @param data Raw payload received with the notification.
 *
 * @returns Whether the payload is a valid event data object.
 */
export const isUserFilterUpdatedEventData = (data: unknown): data is UserFilterUpdatedEventData => {
    if (typeof data !== 'object' || data === null || !('operation' in data) || !('ruleText' in data)) {
        return false;
    }

    const { operation, ruleText } = data;

    if (operation !== UserFilterUpdateOperation.Add && operation !== UserFilterUpdateOperation.Remove) {
        return false;
    }

    return typeof ruleText === 'string'
        && ruleText.trim().length > 0
        && !NEWLINE_CHAR_REGEX.test(ruleText);
};
