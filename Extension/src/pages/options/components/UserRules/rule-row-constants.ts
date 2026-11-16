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
 * Constants shared by the rule rows and the nested comment-block virtualizer.
 *
 * The layout constants mirror CSS values from {@link RuleRow.module.pcss} and
 * feed the virtualizers' {@code estimateSize} callbacks so that scroll
 * positions can be estimated before real DOM measurements are available. When
 * any of the corresponding CSS rules change, these constants **must** be
 * updated as well — otherwise the virtualizer will produce jank and incorrect
 * scroll offsets.
 *
 * The comment-block tuning constants
 * ({@link COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES} and
 * {@link COMMENT_BLOCK_OVERSCAN_LINES}) are virtualization policy rather than
 * CSS mirrors: they control when the nested virtualizer is used and how much
 * slack it keeps around the viewport.
 */

/**
 * Vertical padding of a rule row's top edge.
 *
 * Mirrors the top part of `.row { padding: 8px 16px; }` in
 * {@code RuleRow.module.pcss}. Used to derive the document-space top of a
 * virtualized comment block's lines viewport from the row's own position.
 */
export const ROW_PADDING_TOP_PX = 8;

/**
 * Distance from the top of a rule row's content to its text.
 *
 * Mirrors `margin-top: 1px` of `.ruleText` and `.commentText` in
 * {@code RuleRow.module.pcss}. Added to the row's top padding to get the
 * document-space top of a virtualized comment block's lines viewport.
 */
export const TEXT_OFFSET_TOP_PX = 1;

/**
 * Total vertical padding of a rule row.
 *
 * Mirrors `.row { padding: 8px 16px; }` in {@code RuleRow.module.pcss}
 * (8px top + 8px bottom = 16px total).
 */
export const ROW_PADDING_PX = ROW_PADDING_TOP_PX * 2;

/**
 * Line height of a single comment or rule text line.
 *
 * Mirrors `.commentText { line-height: 20px; }` and
 * `.ruleText { line-height: 20px; }` in {@code RuleRow.module.pcss}.
 */
export const LINE_HEIGHT_PX = 20;

/**
 * Height of the icon shown next to a rule or comment.
 *
 * Mirrors `.icon { height: 24px; }` in {@code RuleRow.module.pcss}.
 */
export const ICON_HEIGHT_PX = 24;

/**
 * Estimated height of a single rule row when the virtualizer has no
 * real measurement yet. Used as fallback by {@code estimateSize}.
 */
export const ESTIMATED_ROW_HEIGHT_PX = 40;

/**
 * Minimum number of lines a comment block must exceed before its lines are
 * rendered through the nested virtualizer.
 *
 * Blocks at or below the threshold render every line at once, exactly as
 * before: a nested virtualizer only pays off when the block is several
 * viewports tall (100 lines at 20px each ≈ 2000px ≈ 2.5 viewports at 768px),
 * while small blocks keep the simpler, fully static DOM and unchanged
 * rendering behaviour.
 */
export const COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES = 100;

/**
 * Number of extra comment lines rendered above and below the visible window
 * of a virtualized comment block.
 *
 * Absorbs scroll deltas between window-scroll updates (the virtualizer
 * re-renders synchronously on each scroll event) so fast wheel scrolling does
 * not reveal blank lines. 5 lines ≈ 100px of slack in each direction.
 */
export const COMMENT_BLOCK_OVERSCAN_LINES = 5;
