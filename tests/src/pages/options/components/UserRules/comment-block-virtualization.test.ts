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

import {
    describe,
    expect,
    it,
} from 'vitest';
import { type VirtualItem } from '@tanstack/react-virtual';

// eslint-disable-next-line max-len, import-newlines/enforce
import * as commentBlockVirtualization from '../../../../../../Extension/src/pages/options/components/UserRules/comment-block-virtualization';
import {
    type RuleLineGroup,
    groupLines,
    parseRuleLines,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-parser';
import {
    COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-row-constants';

/**
 * Builds a comment block group with the given number of lines.
 *
 * @param lineCount Number of comment lines.
 *
 * @returns Comment block group.
 */
const makeCommentGroup = (lineCount: number): RuleLineGroup => {
    const rules = Array.from(
        { length: lineCount },
        (_, index) => `! comment ${index}`,
    ).join('\n');

    return groupLines(parseRuleLines(rules))[0]!;
};

/**
 * Builds a single-rule group.
 *
 * @returns Rule group.
 */
const makeRuleGroup = (): RuleLineGroup => groupLines(parseRuleLines('||example.com^'))[0]!;

/**
 * Builds an outer virtual item.
 *
 * @param start Document-space top of the item.
 * @param end Document-space bottom of the item.
 *
 * @returns Virtual item.
 */
const makeItem = (start: number, end: number): VirtualItem => ({
    index: 0,
    start,
    size: end - start,
    end,
    key: 0,
    lane: 0,
});

describe('isCommentBlockAboveVirtualizationThreshold', () => {
    it('is true only for comment blocks above the threshold', () => {
        expect(commentBlockVirtualization.isCommentBlockAboveVirtualizationThreshold(
            makeCommentGroup(COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES),
        )).toBe(false);
        expect(commentBlockVirtualization.isCommentBlockAboveVirtualizationThreshold(
            makeCommentGroup(COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES + 1),
        )).toBe(true);
    });

    it('is false for a rule group', () => {
        expect(commentBlockVirtualization.isCommentBlockAboveVirtualizationThreshold(makeRuleGroup())).toBe(false);
    });
});

describe('shouldAdjustScrollPositionOnItemSizeChange', () => {
    describe('ordinary row', () => {
        it('keeps the default correction for a row above the viewport', () => {
            const item = makeItem(100, 140);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_000,
                0,
                [makeRuleGroup()],
                false,
            )).toBe(true);
        });

        it('does not correct a row below the viewport', () => {
            const item = makeItem(10_000, 10_040);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_000,
                0,
                [makeRuleGroup()],
                false,
            )).toBe(false);
        });

        it('includes corrections already applied in the current burst', () => {
            // Without the accumulated adjustment the row would look as if it
            // started below the viewport; with it, the default rule still
            // compensates the row.
            const item = makeItem(5_500, 5_540);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_000,
                1_000,
                [makeRuleGroup()],
                false,
            )).toBe(true);
        });
    });

    describe('virtualized comment block whose lines changed', () => {
        const commentGroup = makeCommentGroup(COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES + 1);

        it('leaves a wrapped line to the nested virtualizer while the viewport is inside the block', () => {
            // The nested line virtualizer already compensates for the lines
            // above the viewport, so the outer correction would scroll twice.
            const item = makeItem(100, 100_100);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_000,
                0,
                [commentGroup],
                false,
            )).toBe(false);
        });

        it('leaves a wrapped line to the nested virtualizer while the viewport is just past the block', () => {
            // Scrolling up from the rules below the block mounts its last
            // lines above the viewport. The nested virtualizer compensates
            // each of them, so the outer list must not add their total.
            const item = makeItem(100, 5_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_030,
                0,
                [commentGroup],
                false,
            )).toBe(false);
        });

        it('leaves a wrapped line to the nested virtualizer past the block\'s new end', () => {
            const item = makeItem(100, 5_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                60,
                5_100,
                0,
                [commentGroup],
                false,
            )).toBe(false);
        });
    });

    describe('virtualized comment block that mounted again', () => {
        const commentGroup = makeCommentGroup(COMMENT_BLOCK_VIRTUALIZATION_THRESHOLD_LINES + 1);

        it('corrects the block shrinking to its estimate once the viewport is past its new end', () => {
            // The nested measurements are lost on unmount, so the row comes
            // back shorter. No line changed, so only the outer list can
            // compensate.
            const item = makeItem(100, 5_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                -200,
                5_030,
                0,
                [commentGroup],
                true,
            )).toBe(true);
        });

        it('compares against the block\'s new end rather than its old one', () => {
            // Past the new end (4800) but before the old one (5000).
            const item = makeItem(100, 5_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                -200,
                4_900,
                0,
                [commentGroup],
                true,
            )).toBe(true);
        });

        it('does not correct while the viewport is inside the block', () => {
            const item = makeItem(100, 5_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                -200,
                4_000,
                0,
                [commentGroup],
                true,
            )).toBe(false);
        });

        it('does not correct a block below the viewport', () => {
            const item = makeItem(10_000, 110_000);

            expect(commentBlockVirtualization.shouldAdjustScrollPositionOnItemSizeChange(
                item,
                -200,
                5_000,
                0,
                [commentGroup],
                true,
            )).toBe(false);
        });
    });
});
