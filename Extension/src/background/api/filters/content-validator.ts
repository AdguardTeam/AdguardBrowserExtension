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

/**
 * Maximum number of non-empty lines to inspect for HTML markers.
 */
const MAX_LINES_TO_CHECK = 10;

/**
 * Checks whether the downloaded content looks like an HTML document
 * rather than a filter list.
 *
 * Only the first few non-empty lines are inspected for HTML document-level
 * structure markers (`<!DOCTYPE`, `<html`, `<head`, `<meta`). Individual rule
 * lines are never scanned because legitimate filter rules frequently contain
 * HTML tokens inside `$replace` modifiers, `#%#` scriptlets, `$$` HTML
 * filtering rules, and CSS attribute selectors.
 *
 * @param lines Array of lines from the downloaded content.
 *
 * @returns True if the content appears to be an HTML document.
 */
export const isHtmlContent = (lines: string[]): boolean => {
    let checked = 0;

    for (let i = 0; i < lines.length && checked < MAX_LINES_TO_CHECK; i += 1) {
        const line = lines[i];

        if (line === undefined) {
            continue;
        }

        const trimmed = line.trim();

        if (trimmed.length === 0) {
            continue;
        }

        checked += 1;

        const lower = trimmed.toLowerCase();

        if (
            lower.startsWith('<!doctype')
            || lower.startsWith('<html')
            || lower.startsWith('<head')
            || lower.startsWith('<meta')
        ) {
            return true;
        }
    }

    return false;
};
