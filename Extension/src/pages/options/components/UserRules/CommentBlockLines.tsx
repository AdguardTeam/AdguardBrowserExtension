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

import React, { useCallback } from 'react';

import classNames from 'classnames';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import { HighlightedText } from './HighlightedText';
import { type ParsedRuleLine } from './rule-parser';
import { type RuleHtmlRenderer } from './rule-highlighter';
import { COMMENT_BLOCK_OVERSCAN_LINES, LINE_HEIGHT_PX } from './rule-row-constants';

import styles from './RuleRow.module.pcss';

/**
 * Props for the {@link CommentBlockLines} component.
 */
interface CommentBlockLinesProps {
    /**
     * Comment lines of the block, in document order.
     */
    lines: ParsedRuleLine[];

    /**
     * Document-space top of the lines viewport: the row's document top plus
     * the row's top padding. Serves as the nested virtualizer's
     * {@code scrollMargin}, so the items' offsets are document-space and the
     * window's scroll position decides which lines are visible.
     */
    viewportDocumentTop: number;

    /**
     * Trimmed search term for highlighting.
     */
    term: string;

    /**
     * Renders a rule line to colorized HTML, optionally highlighting a search
     * term. When omitted the lines fall back to plain search-match
     * highlighting.
     */
    highlightHtml?: RuleHtmlRenderer;
}

/**
 * Renders only the visible lines of a large comment block.
 *
 * A comment block is a single item of the outer list virtualizer, so all of
 * its lines would otherwise mount at once — a pasted or imported block with
 * thousands of lines bypasses virtualization and freezes the page. This
 * component nests a second window virtualizer inside the block: it shares the
 * document scroll (no extra scrollbar), so only the lines intersecting the
 * window viewport are mounted, plus {@link COMMENT_BLOCK_OVERSCAN_LINES}
 * above and below it.
 *
 * The viewport element reserves the block's full estimated height
 * ({@link LINE_HEIGHT_PX} per line) inline, so the outer row's height, the
 * outer virtualizer's geometry and the page scrollbar keep the values of a
 * fully rendered block; rendered lines that wrap are re-measured
 * dynamically, exactly like the rows of the outer list.
 *
 * The block itself stays one editing unit: while it is being edited,
 * {@code InlineRuleEditor} replaces this component entirely, and the lines
 * render again after the editor closes.
 *
 * Memoized: the virtualizer re-renders this component when its visible range
 * changes, but the parent re-renders on outer range changes pass the same
 * props for an unchanged block, so the shallow check skips re-rendering it.
 *
 * @param props Component props.
 *
 * @returns React element representing the block's visible lines.
 */
export const CommentBlockLines = React.memo(({
    lines,
    viewportDocumentTop,
    term,
    highlightHtml,
}: CommentBlockLinesProps) => {
    const virtualizer = useWindowVirtualizer({
        count: lines.length,
        estimateSize: () => LINE_HEIGHT_PX,
        overscan: COMMENT_BLOCK_OVERSCAN_LINES,
        scrollMargin: viewportDocumentTop,
        getItemKey: useCallback(
            (index: number) => lines[index]?.lineIndex ?? index,
            [lines],
        ),
    });

    // This virtualizer owns the scroll correction for every line that changes
    // its height: the library's default compensates a line that starts above
    // the viewport, wherever the viewport is. The outer list never compensates
    // such a change on the block row, see
    // `shouldAdjustScrollPositionOnItemSizeChange`.

    return (
        <div
            className={styles.commentLinesViewport}
            // Reserves the block's full height so the outer row (and the
            // scrollbar) keep the geometry of the fully rendered block.
            style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
            {virtualizer.getVirtualItems().map((virtualItem) => {
                const line = lines[virtualItem.index];
                if (!line) {
                    return null;
                }
                return (
                    <span
                        key={String(virtualItem.key)}
                        // Read by the virtualizer's measureElement to map the
                        // measured size back to this item.
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className={classNames(styles.commentLine, styles.commentLineVirtualized)}
                        // Item offsets are document-space, so subtract the
                        // viewport's own document top, like the outer list
                        // subtracts its scroll margin.
                        style={{ transform: `translateY(${virtualItem.start - viewportDocumentTop}px)` }}
                    >
                        <HighlightedText
                            htmlInput={line.trimmedText}
                            plainText={line.displayText}
                            term={term}
                            highlightHtml={highlightHtml}
                            stripMarker
                        />
                    </span>
                );
            })}
        </div>
    );
});

CommentBlockLines.displayName = 'CommentBlockLines';
