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
 * Removes the leading comment marker (`!` or `#`) and any whitespace that
 * follows it from already-highlighted comment HTML.
 *
 * Comments are passed to the highlighter with their marker so the grammar can
 * tokenize them as comments; the marker is then stripped from the resulting
 * HTML for display. Only the first marker character that appears as text (right
 * after the opening tag) is removed, leaving the surrounding `<span>` markup
 * intact.
 *
 * This encodes an implicit contract with the `@adguard/rules-editor` renderer:
 * the marker character is emitted as plain text immediately after the first
 * opening tag. The contract is pinned by `strip-comment-marker.integration.test.ts`,
 * which runs this against the real renderer output.
 *
 * @param html Highlighted comment HTML.
 *
 * @returns The HTML with the leading comment marker removed.
 */
export const stripCommentMarkerFromHtml = (html: string): string => html.replace(/^(\s*<[^>]*>)\s*[!#]\s*/, '$1');
