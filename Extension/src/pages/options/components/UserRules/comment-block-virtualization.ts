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

import { type VirtualItem } from '@tanstack/react-virtual';

import { type RuleLineGroup } from './rule-parser';
import { COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES } from './rule-row-constants';

/**
 * Whether a comment block is large enough to render only its visible lines
 * through the nested line virtualizer.
 *
 * @param group Rule line group.
 *
 * @returns True for comment blocks above the virtualization threshold.
 */
export const isCommentBlockAboveVirtualizationThreshold = (group: RuleLineGroup): boolean => (
    group.isComment && group.lines.length > COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES
);

/**
 * Whether the outer list virtualizer should compensate the window scroll
 * position after a row was re-measured.
 *
 * Mirrors the virtualizer's default rule (adjust when the item starts above the
 * viewport), except for virtualized comment blocks. Only one virtualizer may
 * own a scroll correction, otherwise the same change is compensated twice (or
 * not at all) and the page jumps. A block row changes its height for two
 * reasons, and each has one owner:
 *
 * - A line was measured and turned out to wrap. The nested line virtualizer
 *   sees every such change and compensates the lines above the viewport,
 *   wherever the viewport is, so the outer list never does. Comparing scroll
 *   positions cannot split this case between the two virtualizers: the nested
 *   one decides line by line, while the outer one sees their total.
 * - The row mounted again. The nested measurements are lost on unmount, so the
 *   row shrinks back to its estimate. No line changed, so only the outer list
 *   can compensate, and it does once the viewport is past the row's new end.
 *
 * @param item Re-measured outer virtual item.
 * @param delta Change of the item size in the current measurement.
 * @param scrollOffset Current window scroll offset.
 * @param scrollAdjustments Corrections already applied in the current burst.
 * @param ruleGroups Outer list groups, by virtual item index.
 * @param isRowMount Whether the row is measured because its element has just
 * mounted, rather than because its mounted content changed.
 *
 * @returns Whether the outer virtualizer should adjust the scroll position.
 */
export const shouldAdjustScrollPositionOnItemSizeChange = (
    item: VirtualItem,
    delta: number,
    scrollOffset: number,
    scrollAdjustments: number,
    ruleGroups: RuleLineGroup[],
    isRowMount: boolean,
): boolean => {
    const group = ruleGroups[item.index];
    const effectiveScrollOffset = scrollOffset + scrollAdjustments;

    if (group !== undefined && isCommentBlockAboveVirtualizationThreshold(group)) {
        return isRowMount && effectiveScrollOffset >= item.end + delta;
    }

    return item.start < effectiveScrollOffset;
};
