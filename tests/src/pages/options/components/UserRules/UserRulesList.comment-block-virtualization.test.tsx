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

import { UserRulesList } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList';
import { LINE_HEIGHT_PX } from '../../../../../../Extension/src/pages/options/components/UserRules/rule-row-constants';

const {
    getUserRulesEditorData,
    saveUserRules,
    setUserRulesExportAvailableState,
    windowVirtualizerInstances,
} = vi.hoisted(() => ({
    getUserRulesEditorData: vi.fn(),
    saveUserRules: vi.fn(),
    setUserRulesExportAvailableState: vi.fn(),
    // Real window virtualizer instances created by the pass-through mock, so
    // tests can reach the outer list's instance and pin its wiring.
    windowVirtualizerInstances: [] as Virtualizer<Window, Element>[],
}));

const { useRuleHighlighter, HighlighterStatus } = vi.hoisted(() => ({
    useRuleHighlighter: vi.fn(),
    HighlighterStatus: {
        Loading: 'loading',
        Ready: 'ready',
        Error: 'error',
    } as const,
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getUserRulesEditorData: (...args: unknown[]) => getUserRulesEditorData(...args),
        saveUserRules: (...args: unknown[]) => saveUserRules(...args),
        createEventListener: vi.fn(() => Promise.resolve(() => {})),
    },
}));

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/hooks/usePreventUnload', () => ({
    usePreventUnload: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    EditorLeaveModal: () => React.createElement('div', { 'data-testid': 'editor-leave-modal' }),
}));

vi.mock(
    '../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore',
    () => ({
        userRulesEditorStore: React.createContext({
            setUserRulesExportAvailableState,
        }),
    }),
);

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList.module.pcss',
    () => ({
        default: new Proxy({}, { get: (_t, prop) => String(prop) }),
    }),
);

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: ({ id }: { id: string }) => React.createElement('svg', { 'data-testid': `icon-${id}` }),
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/InlineRuleEditor',
    () => import('../../../../../helpers/mocks/inline-rule-editor'),
);

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/rule-highlighter',
    () => ({ useRuleHighlighter, HighlighterStatus }),
);

// The global setup mock replaces `debounce` with the bare function, which
// drops the `.cancel`/`.flush` methods the list calls when clearing the search
// or unmounting. This suite never types into the search box, so restoring the
// real implementation is enough.
vi.mock('lodash-es', () => vi.importActual('lodash-es'));

/**
 * Shape the pass-through mock needs from the real module. The remaining
 * exports (`defaultRangeExtractor`) come along at runtime through the spread.
 */
type ActualReactVirtualModule = {
    useWindowVirtualizer: typeof useWindowVirtualizer;
};

// Pass through to the real virtualizers and keep the created instances, so a
// test can call `resizeItem` on the outer list and pin its
// `shouldAdjustScrollPositionOnItemSizeChange` wiring.
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
 * A comment block large enough to be rendered through the nested line
 * virtualizer (threshold: 100 lines). Only the block is saved, so it is the
 * single (and first) row of the list.
 */
const HUGE_COMMENT_BLOCK = Array.from(
    { length: 10_000 },
    (_, index) => `! comment line ${index}`,
).join('\n');

/**
 * Original `window.scrollTo`, restored after each test. The virtualizers call
 * it on mount (`_scrollToOffset`), and jsdom's implementation only logs a
 * "Not implemented" error, so tests replace it with a spy.
 */
const originalScrollTo = window.scrollTo;

describe('UserRulesList comment block virtualization', () => {
    beforeEach(() => {
        // jsdom reports 0 for offsetHeight; report the estimated line
        // height so the real virtualizers' measurements do not collapse (the
        // estimates match, so no correction cascades fire).
        Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            get: () => LINE_HEIGHT_PX,
        });
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
        getUserRulesEditorData.mockResolvedValue({ userRules: HUGE_COMMENT_BLOCK });
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        windowVirtualizerInstances.length = 0;
        window.scrollTo = originalScrollTo;
    });

    it('mounts only the visible lines of a huge comment block', async () => {
        render(<UserRulesList />);

        await screen.findByText('comment line 0');

        // The block is one row of the outer virtualizer…
        expect(document.querySelectorAll('div[data-index]').length).toBe(1);

        // …rendering only its visible lines through the nested virtualizer
        // (the lines are `span[data-index]`, not all 10 000).
        const mountedLines = document.querySelectorAll('span[data-index]');
        expect(mountedLines.length).toBeGreaterThan(10);
        expect(mountedLines.length).toBeLessThan(200);
        expect(screen.queryByText('comment line 5000')).toBeNull();
    });

    it('lets the nested virtualizer own corrections while the viewport is inside a huge block', async () => {
        render(<UserRulesList />);

        await screen.findByText('comment line 0');

        const outerVirtualizer = windowVirtualizerInstances.find(
            (instance) => instance.options.count === 1,
        );
        expect(outerVirtualizer).toBeDefined();

        const blockItem = outerVirtualizer!.measurementsCache[0]!;
        expect(blockItem).toBeDefined();

        // Put the viewport inside the block row, where the nested line
        // virtualizer already compensates for wrapped lines above it. With the
        // override unwired (or with a wrong `ruleGroups[item.index]` lookup)
        // the outer virtualizer's default rule would correct the same delta and
        // scroll the page twice.
        outerVirtualizer!.scrollOffset = blockItem.start + (blockItem.size / 2);
        const scrollTo = window.scrollTo as unknown as ReturnType<typeof vi.fn>;
        scrollTo.mockClear();

        act(() => {
            outerVirtualizer!.resizeItem(0, blockItem.size + 60);
        });

        expect(scrollTo).not.toHaveBeenCalled();
    });

    it('leaves line changes to the nested virtualizer once the viewport is past a huge block', async () => {
        render(<UserRulesList />);

        await screen.findByText('comment line 0');

        const outerVirtualizer = windowVirtualizerInstances.find(
            (instance) => instance.options.count === 1,
        );
        expect(outerVirtualizer).toBeDefined();

        const blockItem = outerVirtualizer!.measurementsCache[0]!;

        // Scrolling up from the rules below the block mounts its last lines
        // above the viewport, and the nested virtualizer compensates each
        // wrapped one. The outer list then measures their total on the row
        // and must not compensate it again, even past the row's new end.
        outerVirtualizer!.scrollOffset = blockItem.end + 100;
        const scrollTo = window.scrollTo as unknown as ReturnType<typeof vi.fn>;
        scrollTo.mockClear();

        act(() => {
            outerVirtualizer!.resizeItem(0, blockItem.size + 60);
        });

        expect(scrollTo).not.toHaveBeenCalled();
    });

    it('corrects a huge block that shrinks to its estimate when its row mounts again', async () => {
        const rulesBelowBlock = Array.from({ length: 200 }, (_, index) => `||example-${index}.org^`);
        getUserRulesEditorData.mockResolvedValue({
            userRules: [HUGE_COMMENT_BLOCK, ...rulesBelowBlock].join('\n'),
        });
        // jsdom lays nothing out, so the list would report the same viewport
        // top at any scroll position and its scroll margin would follow the
        // scroll. Keep the list at the top of the document instead.
        const getBoundingClientRect = vi
            .spyOn(window.HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(() => ({ top: -window.scrollY } as DOMRect));

        const scrollWindowTo = (scrollY: number) => {
            Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true, writable: true });
            act(() => {
                fireEvent.scroll(window);
            });
        };

        try {
            render(<UserRulesList />);

            await screen.findByText('comment line 0');

            const outerVirtualizer = windowVirtualizerInstances.find(
                (instance) => instance.options.count === 1 + rulesBelowBlock.length,
            );
            expect(outerVirtualizer).toBeDefined();

            // The block was scrolled through: its wrapped lines were measured,
            // so the outer list holds a row taller than the estimate.
            const measuredBlockSize = 10_000;
            act(() => {
                outerVirtualizer!.resizeItem(0, measuredBlockSize);
            });

            // Scroll far past the block: its row unmounts and the nested
            // measurements are lost.
            scrollWindowTo(measuredBlockSize + 4_000);
            expect(document.querySelector('div[data-index="0"]')).toBeNull();

            // Scroll back up to the first rule below the block: the block row
            // mounts again, at the height jsdom reports for every element.
            const scrollY = measuredBlockSize + 10;
            const scrollTo = window.scrollTo as unknown as ReturnType<typeof vi.fn>;
            scrollTo.mockClear();
            scrollWindowTo(scrollY);

            expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({
                top: scrollY - (measuredBlockSize - LINE_HEIGHT_PX),
            }));
        } finally {
            getBoundingClientRect.mockRestore();
            Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
        }
    });

    it('keeps a huge comment block one editing unit', async () => {
        render(<UserRulesList />);

        await screen.findByText('comment line 0');

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_edit_rule' }));

        const editor = await screen.findByTestId('inline-editor');
        // The editor is seeded with the whole block (markers stripped) and
        // replaces the sliced line rendering.
        expect(editor.getAttribute('data-comment')).toBe('true');
        expect(editor.getAttribute('data-value')).toContain('comment line 9999');
        expect(document.querySelectorAll('span[data-index]').length).toBe(0);
    });
});
