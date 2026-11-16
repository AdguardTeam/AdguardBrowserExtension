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
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import {
    render,
    screen,
    cleanup,
    waitFor,
    fireEvent,
    act,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { UserRulesList } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList';
import { REACT_MODAL_OVERLAY_CLASS } from '../../../../../../Extension/src/pages/common/constants';

const {
    getUserRulesEditorData,
    saveUserRules,
    setUserRulesExportAvailableState,
    eventListeners,
} = vi.hoisted(() => ({
    getUserRulesEditorData: vi.fn(),
    saveUserRules: vi.fn(),
    setUserRulesExportAvailableState: vi.fn(),
    eventListeners: [] as Array<() => void | Promise<void>>,
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
        createEventListener: vi.fn((_types: unknown, listener: () => void | Promise<void>) => {
            eventListeners.push(listener);
            return Promise.resolve(() => {});
        }),
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

// These suites never type into the search field or toggle a rule, so the
// debounce never fires and the real implementation (which the component only
// calls `cancel()` on) is enough.
vi.mock('lodash-es', async () => vi.importActual('lodash-es'));

// Render all items synchronously (no real measurement needed for assertions).
vi.mock('@tanstack/react-virtual', () => ({
    defaultRangeExtractor: () => [],
    useWindowVirtualizer: ({ count }: { count: number }) => ({
        getTotalSize: () => count * 44,
        getVirtualItems: () => Array.from(
            { length: count },
            (_, index) => ({ index, key: index, start: index * 44 }),
        ),
        measureElement: () => undefined,
    }),
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/rule-highlighter',
    () => ({ useRuleHighlighter, HighlighterStatus }),
);

// Render react-modal as a plain container so the real `EditorLeaveModal`
// route-blocker can be exercised without booting the modal library. The
// overlay class is the same constant the list's outside-click blocker treats as
// clickable (see `UserRulesList`), so the two cannot drift apart.
vi.mock('react-modal', () => ({
    default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
        isOpen
            ? React.createElement('div', { className: REACT_MODAL_OVERLAY_CLASS }, children)
            : null
    ),
}));

/**
 * Renders the list under a real data router with a second route to navigate to.
 *
 * @param initialEntries History entries to seed the memory router with. Defaults to starting on the list route.
 * @param initialIndex Index of the entry the router starts on. Defaults to the last entry.
 *
 * @returns The memory router instance, so tests can drive navigation.
 */
const renderInRouter = (
    initialEntries: string[] = ['/'],
    initialIndex?: number,
) => {
    const router = createMemoryRouter(
        [
            { path: '/', element: <UserRulesList /> },
            {
                path: '/other',
                element: React.createElement('div', { 'data-testid': 'other-section' }, 'other'),
            },
        ],
        { initialEntries, initialIndex },
    );
    render(<RouterProvider router={router} />);
    return router;
};

/**
 * Triggers an in-app route change and flushes the resulting React updates.
 *
 * @param router The memory router returned by `renderInRouter`.
 */
const navigateToOther = async (router: ReturnType<typeof renderInRouter>) => {
    await act(async () => {
        await router.navigate('/other');
    });
};

/**
 * Triggers a Back/Forward (POP) route change and flushes the resulting React
 * updates.
 *
 * @param router The memory router returned by `renderInRouter`.
 * @param delta Number of history entries to move by.
 */
const navigateByHistory = async (router: ReturnType<typeof renderInRouter>, delta: number) => {
    await act(async () => {
        await router.navigate(delta);
    });
};

describe('UserRulesList route guard', () => {
    beforeEach(() => {
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        saveUserRules.mockReset();
        eventListeners.length = 0;
        // jsdom does not implement scrollIntoView.
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('blocks an in-app route change while an edited draft is dirty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        await navigateToOther(router);

        // The navigation is paused and the leave confirmation is shown.
        expect(screen.getByText('options_editor_leave_title')).toBeTruthy();
        expect(screen.queryByTestId('other-section')).toBeNull();
    });

    it('does not block navigation when nothing would be lost', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        // Editor opened but the draft still matches the stored text.
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        await navigateToOther(router);

        expect(screen.getByTestId('other-section')).toBeTruthy();
        expect(screen.queryByText('options_editor_leave_title')).toBeNull();
    });

    it('does not block a query-only change on the same pathname', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        await act(async () => {
            await router.navigate('/?group=1');
        });

        // Same pathname: not a "between sections" navigation, so it is not
        // intercepted even though the draft is dirty.
        expect(router.state.location.search).toBe('?group=1');
        expect(screen.queryByText('options_editor_leave_title')).toBeNull();
    });

    it('cancel keeps the route and the draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        await navigateToOther(router);

        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_cancel'));
        });

        // Still on the list route with the editor open and the draft intact,
        // and the confirmation dismissed.
        expect(screen.queryByTestId('other-section')).toBeNull();
        expect(screen.queryByText('options_editor_leave_title')).toBeNull();
        expect(screen.getByTestId('inline-editor').getAttribute('data-value')).toBe('edited text');
    });

    it('re-arms the guard after a cancel', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        // First attempt: blocked, then cancelled.
        await navigateToOther(router);
        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_cancel'));
        });
        expect(screen.queryByTestId('other-section')).toBeNull();

        // A later attempt is blocked again: the blocker was reset, not removed.
        await navigateToOther(router);
        expect(screen.getByText('options_editor_leave_title')).toBeTruthy();
        expect(screen.queryByTestId('other-section')).toBeNull();
    });

    it('confirm navigates away and discards the draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        await navigateToOther(router);

        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_confirm'));
        });

        // Proceeding re-issues the navigation asynchronously.
        await waitFor(() => {
            expect(screen.getByTestId('other-section')).toBeTruthy();
        });
        expect(screen.queryByTestId('inline-editor')).toBeNull();
    });

    // Back/Forward is the POP path the ticket is about: the URL reverts and the
    // navigation is re-issued with `history.go`, which is what the
    // `isMountedRef` workaround in `EditorLeaveModal` guards against.
    it('blocks a Back/Forward (POP) navigation while the draft is dirty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter(['/other', '/'], 1);

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        await navigateByHistory(router, -1);

        expect(screen.getByText('options_editor_leave_title')).toBeTruthy();
        expect(screen.queryByTestId('other-section')).toBeNull();
    });

    it('confirm proceeds with a Back/Forward (POP) navigation', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const router = renderInRouter(['/other', '/'], 1);

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        await navigateByHistory(router, -1);

        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_confirm'));
        });

        // The blocker must not get stuck on the POP path (react-router #11430).
        await waitFor(() => {
            expect(screen.getByTestId('other-section')).toBeTruthy();
        });
        expect(screen.queryByTestId('inline-editor')).toBeNull();
    });

    it('keeps blocking navigation while the create save is in flight', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        let resolveSave!: () => void;
        saveUserRules.mockImplementation(() => new Promise<void>((resolve) => {
            resolveSave = resolve;
        }));
        const router = renderInRouter();

        await waitFor(() => expect(screen.getByText('||a.com^')).toBeTruthy());

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        // Non-empty draft: the guard is armed, so this attempt is blocked.
        await navigateToOther(router);
        expect(screen.getByText('options_editor_leave_title')).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_cancel'));
        });

        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The rule is still being persisted: leaving now would drop the draft
        // if the save failed (e.g. the MV3 first-save race), so the guard stays
        // armed until the save settles.
        await navigateToOther(router);
        expect(screen.getByText('options_editor_leave_title')).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByText('options_editor_leave_cancel'));
        });

        await act(async () => {
            resolveSave();
        });

        // Settled: the row closed, so nothing is left to confirm.
        await waitFor(() => expect(screen.queryByTestId('inline-editor')).toBeNull());
        await navigateToOther(router);
        expect(screen.getByTestId('other-section')).toBeTruthy();
        expect(screen.queryByText('options_editor_leave_title')).toBeNull();
    });
});
