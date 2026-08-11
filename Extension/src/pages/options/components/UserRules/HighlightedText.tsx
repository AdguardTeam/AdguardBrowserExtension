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

import { Highlight } from '../../../common/components/ui/Highlight';

import { type RuleHtmlRenderer } from './rule-highlighter';
import { stripCommentMarkerFromHtml } from './strip-comment-marker';

import styles from './RuleRow.module.pcss';

/**
 * Props for {@link HighlightedText}.
 */
interface HighlightedTextProps {
    /**
     * Text passed to the syntax highlighter. For comments this is the full
     * text (including the marker) so it is tokenized correctly.
     */
    htmlInput: string;

    /**
     * Text used for the plain search-highlight fallback (with the comment
     * marker already stripped).
     */
    plainText: string;

    /**
     * Trimmed search term for highlighting.
     */
    term: string;

    /**
     * Renders a rule line to colorized HTML, optionally highlighting a search
     * term. When omitted the row falls back to plain search-match highlighting.
     */
    highlightHtml?: RuleHtmlRenderer;

    /**
     * Whether to strip the leading comment marker from the highlighted HTML.
     */
    stripMarker: boolean;
}

/**
 * Renders a single line's colorized/highlighted text, memoized on the actual
 * string values rather than the parent's object references.
 *
 * In {@link UserRulesList}, every mutation (e.g. toggling one rule) re-runs
 * `parseRuleLines`/`groupLines`/`filterGroups`, allocating brand-new
 * `RuleLineGroup`/`ParsedRuleLine` objects for *every* line. That defeats the
 * outer `React.memo(RuleRow)` shallow check on all rows, even those whose text
 * did not change, re-running the expensive WASM `highlightHtml` for each.
 *
 * Because this component receives only primitive strings plus a stable
 * `highlightHtml` function reference (`stripCommentMarkerFromHtml` is a direct
 * import), `React.memo` can skip the highlighting re-computation for rows whose
 * underlying text and search term are unchanged.
 *
 * @param props Component props.
 *
 * @returns React content for the line.
 */
export const HighlightedText = React.memo(({
    htmlInput,
    plainText,
    term,
    highlightHtml,
    stripMarker,
}: HighlightedTextProps) => {
    if (highlightHtml) {
        // The renderer (from @adguard/rules-editor) HTML-escapes the rule
        // text and emits only <span class> markup, so this cannot inject
        // executable HTML from rule content. When a search term is active it
        // wraps matches itself, so matches spanning several syntax tokens are
        // highlighted correctly.
        const search = term.length > 0
            ? { searchTerm: term, searchClassName: styles.highlight }
            : undefined;
        let html = highlightHtml(htmlInput, search);
        if (stripMarker) {
            html = stripCommentMarkerFromHtml(html);
        }
        return (
            <span
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    return (
        <Highlight
            text={plainText}
            term={term}
            highlightClassName={styles.highlight}
        />
    );
});

HighlightedText.displayName = 'HighlightedText';
