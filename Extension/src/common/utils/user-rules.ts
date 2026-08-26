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
 * Normalizes user rules line endings to Unix-style line feeds.
 *
 * @param rulesText User rules text.
 *
 * @returns User rules text with normalized line endings.
 */
export function normalizeUserRulesLineEndings(rulesText: string): string {
    return rulesText.split(NEWLINE_CHAR_REGEX).join(NEWLINE_CHAR_UNIX);
}

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
