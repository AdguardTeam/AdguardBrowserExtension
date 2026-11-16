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

import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type { Virtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';

// A single-element import cannot be wrapped (import-newlines/enforce) and the
// specifier is one character over the line limit.
// eslint-disable-next-line max-len, import-newlines/enforce
import { CommentBlockLines } from '../../../../../../Extension/src/pages/options/components/UserRules/CommentBlockLines';
// eslint-disable-next-line max-len, import-newlines/enforce
import { shouldAdjustScrollPositionOnItemSizeChange } from '../../../../../../Extension/src/pages/options/components/UserRules/comment-block-virtualization';
import { type ParsedRuleLine } from '../../../../../../Extension/src/pages/options/components/UserRules/rule-parser';
import {
    LINE_HEIGHT_PX,
    ROW_PADDING_PX,
    ROW_PADDING_TOP_PX,
} from '../../../../../../Extension/src/pages/options/components/UserRules/rule-row-constants';

const { windowVirtualizerInstances } = vi.hoisted(() => ({
    // Real window virtualizer instances created by the pass-through mock, so
    // tests can resize a line of the nested virtualizer.
    windowVirtualizerInstances: [] as Virtualizer<Window, Element>[],
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/RuleRow.module.pcss',
    () => ({ default: new Proxy({}, { get: (_t, prop) => String(prop) }) }),
);

/**
 * Shape the pass-through mock needs from the real module.
 */
type ActualReactVirtualModule = {
    useWindowVirtualizer: typeof useWindowVirtualizer;
};

// Pass through to the real virtualizer and keep the created instances.
vi.mock('@tanstack/react-virtual', async () => {
    const actual = await vi.importActual<ActualReactVirtualModule>('@tanstack/react-virtual');

    return {
        ...actual,
        useWindowVirtualizer: (options: Parameters<typeof useWindowVirtualizer>[0]) => {
            const virtualizer = actual.useWindowVirtualizer(options);
            windowVirtualizerInstances.push(virtualizer);
            return virtualizer;
        },
    };
});

/**
 * Builds comment lines the way `parseRuleLines` produces them: the marker is
 * stripped from `displayText` but kept in `trimmedText`.
 *
 * @param count Number of lines to build.
 *
 * @returns Comment lines with sequential `lineIndex` values.
 */
const makeCommentLines = (count: number): ParsedRuleLine[] => Array.from(
    { length: count },
    (_, index) => {
        const text = `! comment line ${index}`;
        const displayText = `comment line ${index}`;
        return {
            text,
            trimmedText: text,
            displayText,
            lowerDisplayText: displayText.toLowerCase(),
            isComment: true,
            isDisabled: false,
            isBlank: false,
            lineIndex: index,
        };
    },
);

/**
 * Document-space top of the lines viewport used across the tests. Non-zero so
 * the tests exercise the scroll-margin math.
 */
const VIEWPORT_DOCUMENT_TOP = 100;

/**
 * jsdom's original `offsetHeight` descriptor, restored after each test.
 */
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    window.HTMLElement.prototype,
    'offsetHeight',
);

/**
 * Original value of `window.scrollY`, restored after each test so a test that
 * scrolls does not leak its position into the next one (the window
 * virtualizer's `initialOffset` reads it at mount).
 */
const originalScrollY = window.scrollY;

/**
 * Original value of `window.innerHeight`, restored after each test so a test
 * that shrinks the viewport does not leak into the next one.
 */
const originalInnerHeight = window.innerHeight;

/**
 * Original `window.scrollTo`, restored after each test. The virtualizer calls
 * it on mount (`_scrollToOffset`), and jsdom's implementation only logs a
 * "Not implemented" error, so tests replace it with a spy.
 */
const originalScrollTo = window.scrollTo;

/**
 * Stubs the given window property with a plain value.
 *
 * @param prop Property name (e.g. `scrollY`).
 * @param value Value to report.
 */
const setWindowProp = (prop: 'scrollY' | 'innerHeight', value: number) => {
    Object.defineProperty(window, prop, {
        value,
        configurable: true,
        writable: true,
    });
};

const renderBlock = ({ term = '' }: { term?: string } = {}) => render(
    <CommentBlockLines
        lines={makeCommentLines(10_000)}
        viewportDocumentTop={VIEWPORT_DOCUMENT_TOP}
        term={term}
    />,
);

describe('CommentBlockLines', () => {
    beforeEach(() => {
        // jsdom reports 0 for offsetHeight, which collapses the virtualizer's
        // measurements to zero; report the estimated line height instead so
        // the mounted slices can be asserted (the estimate matches, so no
        // measurement corrections fire).
        Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            get: () => LINE_HEIGHT_PX,
        });
        // The virtualizer calls window.scrollTo on mount; jsdom only logs a
        // "Not implemented" error for it.
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    });

    afterEach(() => {
        cleanup();
        if (originalOffsetHeight) {
            Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
        } else {
            delete (window.HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
        }
        // Restore the window metrics the virtualizer's initialOffset and rect
        // observer read, so tests do not affect each other.
        setWindowProp('scrollY', originalScrollY);
        setWindowProp('innerHeight', originalInnerHeight);
        window.scrollTo = originalScrollTo;
        windowVirtualizerInstances.length = 0;
    });

    it('renders only the visible lines of the block', () => {
        renderBlock();

        // The window rect observer fires immediately with innerHeight 768
        // (jsdom default), so the initial slice is ~38 lines + overscan.
        expect(screen.getByText('comment line 0')).toBeDefined();
        expect(screen.queryByText('comment line 500')).toBeNull();
        expect(screen.queryByText('comment line 9999')).toBeNull();

        const mounted = document.querySelectorAll('span[data-index]');
        expect(mounted.length).toBeGreaterThan(20);
        expect(mounted.length).toBeLessThan(100);
    });

    it('positions the lines inside a viewport reserving the full block height', () => {
        renderBlock();

        const viewport = document.querySelector('div.commentLinesViewport') as HTMLElement;
        expect(viewport).not.toBeNull();
        // 10 000 lines at 20px each: the height is independent of the scroll
        // margin, so the outer row and the scrollbar keep the geometry of a
        // fully rendered block.
        expect(viewport.style.height).toBe(`${10_000 * LINE_HEIGHT_PX}px`);

        const firstLine = viewport.querySelector('span[data-index="0"]') as HTMLElement;
        // Item offsets are document-space, so the first line sits at the top
        // of the viewport.
        expect(firstLine.style.transform).toBe('translateY(0px)');
    });

    it('mounts the lines intersecting the scrolled viewport', () => {
        setWindowProp('scrollY', 5000);
        renderBlock();
        // The window virtualizer's initialOffset reads window.scrollY at
        // mount, so the initial slice already reflects the stubbed position;
        // the scroll event additionally exercises the observer path (the
        // offset observer otherwise only reports on scroll events).
        fireEvent.scroll(window);

        // Viewport at document 5000..5768 → lines around index 250.
        expect(screen.getByText('comment line 250')).toBeDefined();
        expect(screen.queryByText('comment line 20')).toBeNull();
        expect(screen.queryByText('comment line 5000')).toBeNull();

        const mounted = document.querySelectorAll('span[data-index]');
        expect(mounted.length).toBeGreaterThan(20);
        expect(mounted.length).toBeLessThan(100);
    });

    it('narrows the mounted slice when the window shrinks', () => {
        renderBlock();

        expect(screen.getByText('comment line 20')).toBeDefined();

        setWindowProp('innerHeight', 200);
        fireEvent.resize(window);

        expect(screen.queryByText('comment line 20')).toBeNull();
        expect(screen.getByText('comment line 0')).toBeDefined();
    });

    it('highlights the search term in mounted lines', () => {
        renderBlock({ term: 'line 5' });

        const highlights = document.querySelectorAll('.commentLine .highlight');
        expect(highlights.length).toBeGreaterThan(0);
    });

    describe('scroll correction of a wrapped line', () => {
        /**
         * Lines of the block. Above the virtualization threshold, so the outer
         * list treats the row as a virtualized comment block.
         */
        const lines = makeCommentLines(200);

        /**
         * Extra height of a line once it wraps onto four visual lines.
         */
        const WRAPPED_LINE_GROWTH_PX = 3 * LINE_HEIGHT_PX;

        /**
         * Document-space end of the lines, before any of them wraps.
         */
        const linesDocumentEnd = VIEWPORT_DOCUMENT_TOP + lines.length * LINE_HEIGHT_PX;

        /**
         * Document-space end of the block row, before any line wraps: the
         * lines plus the row's bottom padding.
         */
        const rowDocumentEnd = linesDocumentEnd + (ROW_PADDING_PX - ROW_PADDING_TOP_PX);

        /**
         * Renders the block with the viewport top at the given document
         * offset and lets one of its lines wrap, the way it does when it is
         * measured after mounting.
         *
         * @param scrollY Document offset of the viewport top.
         * @param lineIndex Index of the line that wraps.
         *
         * @returns Spy on `window.scrollTo`, cleared after the mount.
         */
        const wrapLineAt = (scrollY: number, lineIndex: number) => {
            setWindowProp('scrollY', scrollY);
            render(
                <CommentBlockLines
                    lines={lines}
                    viewportDocumentTop={VIEWPORT_DOCUMENT_TOP}
                    term=""
                />,
            );

            const nestedVirtualizer = windowVirtualizerInstances[windowVirtualizerInstances.length - 1]!;
            const scrollTo = window.scrollTo as unknown as ReturnType<typeof vi.fn>;
            scrollTo.mockClear();

            act(() => {
                nestedVirtualizer.resizeItem(lineIndex, LINE_HEIGHT_PX + WRAPPED_LINE_GROWTH_PX);
            });

            return scrollTo;
        };

        /**
         * Whether the outer list corrects the scroll when it then measures the
         * same growth of the block row with the viewport top at the given
         * offset.
         *
         * @param scrollY Document offset of the viewport top.
         *
         * @returns Decision of the outer list's predicate.
         */
        const outerListCorrects = (scrollY: number): boolean => {
            const rowDocumentTop = VIEWPORT_DOCUMENT_TOP - ROW_PADDING_TOP_PX;

            return shouldAdjustScrollPositionOnItemSizeChange(
                {
                    index: 0,
                    key: 0,
                    lane: 0,
                    start: rowDocumentTop,
                    size: rowDocumentEnd - rowDocumentTop,
                    end: rowDocumentEnd,
                },
                WRAPPED_LINE_GROWTH_PX,
                scrollY,
                0,
                [{ lines, isComment: true, lineIndex: 0 }],
                false,
            );
        };

        it('corrects a line above the viewport top inside the block', () => {
            // Line 100 is at the viewport top; line 97 is mounted above it.
            const scrollY = VIEWPORT_DOCUMENT_TOP + 100 * LINE_HEIGHT_PX;

            const scrollTo = wrapLineAt(scrollY, 97);

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({
                top: scrollY + WRAPPED_LINE_GROWTH_PX,
            }));
            expect(outerListCorrects(scrollY)).toBe(false);
        });

        it('does not correct a line below the viewport top', () => {
            const scrollY = VIEWPORT_DOCUMENT_TOP + 100 * LINE_HEIGHT_PX;

            const scrollTo = wrapLineAt(scrollY, 103);

            expect(scrollTo).not.toHaveBeenCalled();
            expect(outerListCorrects(scrollY)).toBe(false);
        });

        it('corrects the last line while the viewport top is in the row\'s bottom padding', () => {
            // Past the end of the lines, but still inside the row.
            const scrollY = linesDocumentEnd + 4;

            const scrollTo = wrapLineAt(scrollY, lines.length - 1);

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({
                top: scrollY + WRAPPED_LINE_GROWTH_PX,
            }));
            expect(outerListCorrects(scrollY)).toBe(false);
        });

        it('corrects the last line while the viewport top is one rule row past the block', () => {
            // Where the viewport top is when the outer list mounts the block
            // while the user scrolls up from the rules below it.
            const scrollY = rowDocumentEnd + 30;

            const scrollTo = wrapLineAt(scrollY, lines.length - 1);

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({
                top: scrollY + WRAPPED_LINE_GROWTH_PX,
            }));
            expect(outerListCorrects(scrollY)).toBe(false);
        });

        it('corrects the last line while the viewport top is past the row\'s new end', () => {
            const scrollY = rowDocumentEnd + WRAPPED_LINE_GROWTH_PX + 10;

            const scrollTo = wrapLineAt(scrollY, lines.length - 1);

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({
                top: scrollY + WRAPPED_LINE_GROWTH_PX,
            }));
            expect(outerListCorrects(scrollY)).toBe(false);
        });
    });
});
