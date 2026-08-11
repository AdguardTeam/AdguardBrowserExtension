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
 * Layout constants mirroring CSS values from {@link RuleRow.module.pcss}.
 *
 * These values are used by the virtualizer's {@code estimateSize} callback so
 * that scroll positions can be estimated before real DOM measurements are
 * available. When any of the corresponding CSS rules change, these constants
 * **must** be updated as well — otherwise the virtualizer will produce jank
 * and incorrect scroll offsets.
 */

/**
 * Total vertical padding of a rule row.
 *
 * Mirrors `.row { padding: 8px 16px; }` in {@code RuleRow.module.pcss}
 * (8px top + 8px bottom = 16px total).
 */
export const ROW_PADDING_PX = 16;

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
