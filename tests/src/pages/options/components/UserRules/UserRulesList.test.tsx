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
import { type DebouncedFunc } from 'lodash-es';

import {
    USER_RULES_VIEW_MODE_TOGGLE_CLASS,
    UserRulesList,
} from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList';
import { logger } from '../../../../../../Extension/src/common/logger';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';
import { usePreventUnload } from '../../../../../../Extension/src/pages/common/hooks/usePreventUnload';
import { UserAgent } from '../../../../../../Extension/src/common/user-agent';

const {
    getUserRulesEditorData,
    saveUserRules,
    setUserRulesExportAvailableState,
    eventListeners,
} = vi.hoisted(() => ({
    getUserRulesEditorData: vi.fn(),
    saveUserRules: vi.fn(),
    setUserRulesExportAvailableState: vi.fn(),
    // Listeners registered through `messenger.createEventListener`, so tests
    // can simulate background events such as an external user-rules refresh.
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

const { virtualizerWindow } = vi.hoisted(() => ({
    // Number of items the mocked virtualizer renders. Tests can shrink it to
    // simulate the edited row scrolling out of view and unmounting.
    virtualizerWindow: { visibleCount: Number.POSITIVE_INFINITY },
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

// The leave guard renders `EditorLeaveModal` in route-blocker mode, which calls
// react-router's `useBlocker` and therefore needs a data router. These suites
// render the list directly, so replace it with a marker that is present exactly
// when the list mounts it (i.e. while there is an unsaved inline draft). The
// real blocking behaviour is covered by UserRulesList.route-guard.test.tsx.
vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    EditorLeaveModal: () => React.createElement('div', { 'data-testid': 'editor-leave-modal' }),
}));

// Stub the editor store: the list now maintains `userRulesExportAvailable`
// after each fetch (shared with the header menu). Mocking here also avoids
// loading UserRulesEditorStore.js, which uses TS decorators that the vitest
// plain-JS transform cannot parse.
vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore', () => ({
    userRulesEditorStore: React.createContext({
        setUserRulesExportAvailableState,
    }),
}));

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

vi.mock('lodash-es', async () => {
    const actual = await vi.importActual('lodash-es');
    type Debounced = DebouncedFunc<(...args: unknown[]) => unknown>;
    const { debounce: actualDebounce } = actual as { debounce: (...args: unknown[]) => Debounced };
    return {
        ...actual,
        debounce: (fn: (...args: unknown[]) => unknown) => {
            const debounced = actualDebounce(fn as () => void, 0);
            const mock = vi
                .fn(fn)
                .mockImplementation((...args: unknown[]) => fn(...args)) as unknown as Debounced;
            mock.cancel = debounced.cancel;
            mock.flush = debounced.flush;
            return mock;
        },
    };
});

// Render all items synchronously (no real measurement needed for assertions).
vi.mock('@tanstack/react-virtual', () => ({
    defaultRangeExtractor: ({ start, end }: { start: number; end: number }) => Array.from(
        { length: Math.max(end - start + 1, 0) },
        (_, offset) => start + offset,
    ),
    useWindowVirtualizer: ({
        count,
        rangeExtractor,
    }: {
        count: number;
        rangeExtractor?: (range: { start: number; end: number; overscan: number; count: number }) => number[];
    }) => {
        const lastVisibleIndex = Math.min(count, virtualizerWindow.visibleCount) - 1;
        const indices = rangeExtractor
            ? rangeExtractor({
                start: 0,
                end: lastVisibleIndex,
                overscan: 0,
                count,
            })
            : Array.from({ length: lastVisibleIndex + 1 }, (_, index) => index);

        return {
            getTotalSize: () => count * 44,
            getVirtualItems: () => indices.map((index) => ({
                index,
                key: index,
                start: index * 44,
            })),
            measureElement: () => undefined,
        };
    },
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/rule-highlighter',
    () => ({ useRuleHighlighter, HighlighterStatus }),
);

afterEach(() => {
    // Restore the full virtualizer window for the suites that run after a test
    // shrinks it.
    virtualizerWindow.visibleCount = Number.POSITIVE_INFINITY;
});

describe('UserRulesList', () => {
    beforeEach(() => {
        // Default to the loading state; individual tests override as needed.
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Loading });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders the non-functional toolbar (search + Create rule)', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('options_user_rules_search_placeholder')).toBeTruthy();
        });
        expect(screen.getByText('options_user_rules_create_rule')).toBeTruthy();
        expect(screen.getByTestId('icon-#plus')).toBeTruthy();
    });

    it('reports a load failure and retries from the notification', async () => {
        vi.useFakeTimers();
        try {
            const addNotification = vi.fn().mockReturnValue('user-rules-load-error-id');
            const removeNotification = vi.fn();
            getUserRulesEditorData.mockRejectedValue(new Error('background unavailable'));
            render(
                <UserRulesList
                    addNotification={addNotification}
                    removeNotification={removeNotification}
                />,
            );

            // `fetchDataWithRetry` retries ten times with a 500 ms delay before
            // it reports the failure.
            await act(async () => {
                await vi.advanceTimersByTimeAsync(5_000);
            });

            expect(addNotification).toHaveBeenCalledTimes(1);
            const params = addNotification.mock.calls[0]![0];
            expect(params.type).toBe(NotificationType.Error);
            expect(params.dedupeKey).toBe('user-rules-load-error');
            expect(params.text).toBe('options_user_rules_load_error');

            // The retry button reruns the fetch; this time it succeeds.
            getUserRulesEditorData.mockReset();
            getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
            await act(async () => {
                params.buttons[0].onClick();
                await vi.advanceTimersByTimeAsync(0);
            });

            expect(screen.getByText('||example.org^')).toBeTruthy();
            expect(removeNotification).toHaveBeenCalledWith('user-rules-load-error-id');
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows the placeholder when there are no rules', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '   ' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('options_user_rules_empty_placeholder')).toBeTruthy();
        });
    });

    it('renders a row per rule for non-empty input', async () => {
        getUserRulesEditorData.mockResolvedValue({
            userRules: '||a.com^\n@@||b.com^\n! c',
        });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });
        expect(screen.getByText('@@||b.com^')).toBeTruthy();
        // Comment marker (`!`) is stripped from the displayed text.
        expect(screen.getByText('c')).toBeTruthy();
        expect(screen.queryByText('options_user_rules_empty_placeholder')).toBeNull();
    });

    it('filters rules by search term', async () => {
        getUserRulesEditorData.mockResolvedValue({
            userRules: '||example.com^\n||other.com^\n! comment',
        });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.com^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'example' } });

        // When searching, the text is split into chunks, so we check for the highlighted "example"
        expect(screen.getByText('example')).toBeTruthy();
        expect(screen.queryByText('||other.com^')).toBeNull();
    });

    it('shows no-match placeholder with image and text when search yields zero results', async () => {
        getUserRulesEditorData.mockResolvedValue({
            userRules: '||example.com^',
        });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.com^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

        expect(screen.getByText('options_user_rules_no_match')).toBeTruthy();
    });

    it('clears search when clear button is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({
            userRules: '||example.com^\n||other.com^',
        });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.com^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder') as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'example' } });

        expect(screen.queryByText('||other.com^')).toBeNull();

        const clearButton = screen.getByTestId('icon-#cross').closest('button');
        fireEvent.click(clearButton!);

        expect(searchInput.value).toBe('');
        expect(screen.getByText('||other.com^')).toBeTruthy();
    });

    it('shows the highlighting loading indicator until the highlighter is ready', async () => {
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Loading });
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('options_user_rules_highlight_loading')).toBeTruthy();
        });
    });

    it('hides the loading indicator when the highlighter fails permanently', async () => {
        // On permanent failure the status settles to Error, so the loading
        // indicator must not stay visible forever (rows use the plain-text fallback).
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Error });
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });
        expect(screen.queryByText('options_user_rules_highlight_loading')).toBeNull();
    });

    it('passes the highlighter to rows so rule text is syntax-highlighted', async () => {
        const highlightHtml = vi.fn((rule: string) => `<span data-testid="tok">${rule}</span>`);
        useRuleHighlighter.mockReturnValue({ renderer: highlightHtml, status: HighlighterStatus.Ready });
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByTestId('tok')).toBeTruthy();
        });
        // No search term active, so no search options are forwarded.
        expect(highlightHtml).toHaveBeenCalledWith('||example.org^', undefined);
        // Loading indicator should not be shown once the highlighter is ready.
        expect(screen.queryByText('options_user_rules_highlight_loading')).toBeNull();
    });

    it('hides the highlighting loading indicator while a search term is active', async () => {
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Loading });
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('options_user_rules_highlight_loading')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'example' } });

        await waitFor(() => {
            expect(screen.queryByText('options_user_rules_highlight_loading')).toBeNull();
        });
    });

    it('disables a rule on checkbox click and saves the !off-prefixed text', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        // Optimistic: checkbox now unchecked.
        expect((checkbox as HTMLInputElement).checked).toBe(false);
        // Saved text has the strict marker.
        const saved = saveUserRules.mock.calls[0]![0] as string;
        expect(saved).toBe('!off ||example.org^');
    });

    it('enables a disabled rule on checkbox click and removes the marker', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '!off ||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        expect((checkbox as HTMLInputElement).checked).toBe(true);
        const saved = saveUserRules.mock.calls[0]![0] as string;
        expect(saved).toBe('||example.org^');
    });

    it('does not render a checkbox on comment rows', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '! my comment\n||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkboxes = screen.getAllByRole('checkbox', { name: '||example.org^' });
        // One checkbox for the rule row only; the comment row has none.
        expect(checkboxes).toHaveLength(1);
    });

    it('debounces saves: rapid on-off-on resolves to the final state', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        // The test lodash mock invokes the debounced fn synchronously per call,
        // so each click saves immediately. Assert net correctness instead:
        // off -> on -> off ends disabled.
        fireEvent.click(checkbox); // disable
        fireEvent.click(checkbox); // enable
        fireEvent.click(checkbox); // disable

        const lastCall = saveUserRules.mock.calls.at(-1)![0] as string;
        expect(lastCall).toBe('!off ||example.org^');
    });

    it('reverts the UI and logs on save failure', async () => {
        getUserRulesEditorData
            // Initial fetch
            .mockResolvedValueOnce({ userRules: '||example.org^' })
            // Refetch after save failure returns the original (unchanged) rules
            .mockResolvedValueOnce({ userRules: '||example.org^' });
        saveUserRules.mockRejectedValue(new Error('boom'));
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        // The optimistic uncheck is reverted to checked once the save rejects
        // and the backend state is refetched.
        await waitFor(() => {
            expect((checkbox as HTMLInputElement).checked).toBe(true);
        });
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect((logger.error as unknown as { mock: { calls: unknown[][] } })
            .mock.calls[0]![0]).toContain('[ext.useUserRulesMutations]:');
    });

    it('shows an error notification when a toggle save fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList addNotification={addNotification} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));

        // A failed toggle save reverts the checkbox, so it must report the
        // failure like every other mutation instead of flipping back silently.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.type).toBe(NotificationType.Error);
        expect(params.text).toBe('options_editor_save_error');
    });

    it('does not report a save error when only the post-toggle refetch fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            // Initial fetch
            .mockResolvedValueOnce({ userRules: '||example.org^' })
            // Refetch after the successful save fails.
            .mockRejectedValueOnce(new Error('refetch failed'));
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        await waitFor(() => expect(logger.error).toHaveBeenCalledTimes(1));

        // The write succeeded, so the failure is only logged: no save-error
        // notification, and the toggle stays applied instead of being reverted.
        expect(addNotification).not.toHaveBeenCalled();
        expect((logger.error as unknown as { mock: { calls: unknown[][] } })
            .mock.calls[0]![0]).toContain('Failed to refetch user rules after toggle save');
        expect((checkbox as HTMLInputElement).checked).toBe(false);
    });

    it('refetches backend state when rapid-toggle save fails (T1→T2→T3, T3 fails)', async () => {
        // Scenario: user rapidly toggles a rule 3 times (off→on→off).
        // In production, only T3's save runs (debounce skips T1/T2). If T3's
        // save fails, the UI must refetch the actual backend state (which is
        // still the original enabled rule) rather than reverting to T2's
        // optimistic state (which was never persisted).
        //
        // Note: the test lodash mock invokes the debounced fn synchronously,
        // so all 3 toggles save immediately. The mutationSeq guard ensures
        // only the latest (T3) refetch result is applied to the UI.
        getUserRulesEditorData
            // Initial fetch: rule is enabled
            .mockResolvedValueOnce({ userRules: '||example.org^' })
            // Refetch after each save failure returns the original state
            .mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        // T1: disable
        fireEvent.click(checkbox);
        // T2: enable
        fireEvent.click(checkbox);
        // T3: disable (this is the one that actually saves and fails)
        fireEvent.click(checkbox);

        // After T3's save fails, the UI refetches and shows the backend state
        // (rule still enabled), NOT T2's optimistic "enabled" state.
        await waitFor(() => {
            expect((checkbox as HTMLInputElement).checked).toBe(true);
        });
        // The last saved value was T3's optimistic state (disabled).
        const saved = saveUserRules.mock.calls.at(-1)![0] as string;
        expect(saved).toBe('!off ||example.org^');
    });

    it('does not revert a newer toggle when an older save fails', async () => {
        let rejectFirstSave: (reason: Error) => void = () => {};
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules
            .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
                rejectFirstSave = reject;
            }))
            .mockResolvedValueOnce(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox); // Disable; leave this save pending.
        fireEvent.click(checkbox); // Enable; this is now the latest optimistic state.

        await act(async () => {
            rejectFirstSave(new Error('first save failed'));
        });

        await waitFor(() => {
            expect((checkbox as HTMLInputElement).checked).toBe(true);
        });
        expect(saveUserRules).toHaveBeenCalledTimes(2);
    });

    it('discards a stale refetch when a newer mutation started meanwhile', async () => {
        let resolveStaleRefetch: ((value: { userRules: string }) => void) | undefined;
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // The refetch that follows the delete stays pending until the test
            // resolves it, after a newer mutation has started.
            .mockImplementationOnce(() => new Promise<{ userRules: string }>((resolve) => {
                resolveStaleRefetch = resolve;
            }))
            // Refetch after the toggle save.
            .mockResolvedValueOnce({ userRules: '!off ||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Delete the first rule: the save resolves, its refetch hangs.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => {
            expect(screen.queryByText('||a.com^')).toBeNull();
        });

        // A newer mutation (toggle) starts and settles before the stale
        // refetch resolves.
        fireEvent.click(screen.getByRole('checkbox', { name: '||b.com^' }));
        await waitFor(() => {
            expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
        });

        // The stale refetch carries the pre-delete content: applying it would
        // revert both the delete and the toggle, so it must be discarded.
        resolveStaleRefetch?.({ userRules: '||a.com^\n||b.com^' });
        await waitFor(() => {
            expect(screen.queryByText('||a.com^')).toBeNull();
        });
        expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    });

    it('updates export availability during an optimistic toggle', async () => {
        saveUserRules.mockResolvedValue(undefined);
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        expect(setUserRulesExportAvailableState).toHaveBeenLastCalledWith(true);
    });
});

describe('UserRulesList row actions', () => {
    beforeEach(() => {
        saveUserRules.mockReset();
        getUserRulesEditorData.mockReset();
        useRuleHighlighter.mockReset();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        eventListeners.length = 0;
    });

    afterEach(() => {
        cleanup();
    });
    it('deletes a rule immediately: optimistic removal, save, refetch, undo notification', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        const deleteButtons = screen.getAllByLabelText('options_user_rules_delete_rule');
        fireEvent.click(deleteButtons[1]!); // ||b.com^ row

        // No confirmation dialog — the rule is deleted immediately.
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(screen.queryByText('||b.com^')).toBeNull());
        expect(screen.getByText('||a.com^')).toBeTruthy();

        // A snackbar notification with a working "Undo" button is shown.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.buttons?.[0]?.title).toBe('options_user_rules_undo');
    });

    it('restores the deleted rule when Undo is clicked', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);

        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Trigger the Undo button from the notification params.
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||b.com^'));
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('restores a deleted rule after its comment once a rule is created above it', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! c\n||a.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: '! c' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\n! c' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: 'edited text\n! c\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Delete the rule that follows the comment (the second row).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('! c'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Create a rule above it: every line shifts down by one, so the
        // captured index of the deleted rule is stale.
        // jsdom does not implement scrollIntoView; the create row calls it.
        Element.prototype.scrollIntoView = vi.fn();
        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('edited text\n! c'));

        // Undo must restore the rule after its comment, not above it.
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        await waitFor(() => {
            expect(saveUserRules).toHaveBeenCalledWith('edited text\n! c\n||a.com^');
        });
    });

    it('reverts the optimistic removal when saving fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);

        await waitFor(() => expect(saveUserRules).toHaveBeenCalled());
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });
        // The failed delete is reported with the shared save-error
        // notification, the same as the inline-delete path.
        expect(addNotification).toHaveBeenCalledTimes(1);
        expect(addNotification.mock.calls[0]![0]).toMatchObject({
            type: NotificationType.Error,
            text: 'options_editor_save_error',
        });
    });

    it('shows an error notification when Undo fails to save', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        // First save (delete) succeeds; second save (undo) fails.
        saveUserRules
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('save failed'));
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        // Undo failed: an error notification is shown.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));
        const errorParams = addNotification.mock.calls[1]![0];
        expect(errorParams.type).toBe(NotificationType.Error);
        expect(errorParams.text).toBe('options_editor_save_error');
    });

    it('enters inline editing when the pencil is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);

        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');
        expect(saveUserRules).not.toHaveBeenCalled();
    });

    it('exits inline editing on cancel, discarding the draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');

        fireEvent.click(screen.getByTestId('inline-editor-cancel'));

        expect(screen.queryByTestId('inline-editor')).toBeNull();
        // The stored (not the edited) text is shown again.
        expect(screen.getByText('||b.com^')).toBeTruthy();
        expect(saveUserRules).not.toHaveBeenCalled();
    });

    it('persists the inline draft and exits editing on save', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '||a.com^\nedited text' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(saveUserRules).toHaveBeenCalledWith('||a.com^\nedited text');
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        await waitFor(() => {
            expect(screen.getByText('edited text')).toBeTruthy();
        });
    });

    it('ignores save and cancel while the row save is in flight', async () => {
        let resolveSave: () => void = () => {};
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '||a.com^\nedited text' });
        saveUserRules.mockImplementationOnce(() => new Promise<void>((resolve) => {
            resolveSave = resolve;
        }));
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // While the row's own save is in flight its editor and actions are
        // locked and any further save/cancel attempt is ignored: the draft
        // cannot be written twice and the row cannot be closed mid-save, which
        // would hide the outcome of the write that is already landing.
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('true');
        expect(screen.getByLabelText('options_user_rules_save_rule'))
            .toHaveProperty('disabled', true);
        expect(screen.getByLabelText('options_user_rules_cancel_rule_editing'))
            .toHaveProperty('disabled', true);

        fireEvent.click(screen.getByTestId('inline-editor-save'));
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));

        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();

        await act(async () => {
            resolveSave();
        });

        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(saveUserRules).toHaveBeenCalledTimes(1);
    });

    it('skips the save when the inline draft is unchanged', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // Nothing changed: no write, no refetch, and editing closes.
        expect(saveUserRules).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
    });

    it.each([
        ['a rule with surrounding whitespace', '  ||a.com^  '],
        ['a disabled rule with extra marker whitespace', '!off  ||a.com^'],
        ['an indented comment line', '  !  comment'],
    ])('skips an untouched %s without a write', async (_title, storedRules) => {
        getUserRulesEditorData.mockResolvedValue({ userRules: storedRules });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getAllByLabelText('options_user_rules_edit_rule')).toHaveLength(1);
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // Only whitespace differs from the trimmed stored line, so saving is a
        // no-op: no write and no engine update.
        expect(saveUserRules).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
    });

    it('keeps the !off marker when saving an edited disabled rule', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '!off ||b.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '!off edited text' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        // The seed drops the marker; saving must put it back.
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(saveUserRules).toHaveBeenCalledWith('!off edited text');
    });

    it('deletes the rule through the trash pipeline when the inline draft is saved empty', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // Same persistence as the trash action: the line is removed, not blanked.
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(screen.queryByText('||b.com^')).toBeNull());
        expect(screen.queryByTestId('inline-editor')).toBeNull();

        // And the same undo snackbar is offered.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.buttons?.[0]?.title).toBe('options_user_rules_undo');
    });

    it('keeps a bare comment when saved unchanged', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '!\n||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        // A bare `!` comment has no text to edit.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('');

        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // An unchanged empty draft must not delete the line.
        expect(saveUserRules).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
    });

    it('reverts the optimistic inline edit when the save fails', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => expect(saveUserRules).toHaveBeenCalled());
        // The optimistic draft is rolled back to the stored rule; the failed
        // save keeps the row open with the draft.
        await waitFor(() => {
            expect(screen.queryByText('edited text')).toBeNull();
        });
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
        // Cancelling shows the stored (reverted) rule again.
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        expect(screen.getByText('||b.com^')).toBeTruthy();
    });

    it('shows an error notification when an inline save fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.type).toBe(NotificationType.Error);
        expect(params.text).toBe('options_editor_save_error');
        // The failed save keeps the editor open with the draft so it does not
        // have to be retyped.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
    });

    it('shows an error notification when an inline delete fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.type).toBe(NotificationType.Error);
        expect(params.text).toBe('options_editor_save_error');
        // The failed delete keeps the row open and the optimistic removal is
        // rolled back: cancelling shows the stored rule again.
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        expect(screen.getByText('||b.com^')).toBeTruthy();
    });

    it('shows an error notification when a trash delete fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_delete_rule'));

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.type).toBe(NotificationType.Error);
        expect(params.text).toBe('options_editor_save_error');
        // The optimistic delete is rolled back.
        expect(screen.getByText('||a.com^')).toBeTruthy();
    });

    it('ignores clicks outside the edited row: another pencil does not move editing', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||a.com^');

        // While row 0 is edited, only row 1 still shows the pencil. Clicking it
        // must be fully ignored instead of moving editing to that row.
        const otherPencil = screen.getByLabelText('options_user_rules_edit_rule');
        fireEvent.mouseDown(otherPencil);
        fireEvent.click(otherPencil);

        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||a.com^');
    });

    it('ignores clicks outside the edited row: search and Create rule do not react', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const telemetryStore = {
            sendPageViewEvent: vi.fn(),
            sendCustomEvent: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        render(<UserRulesList telemetryStore={telemetryStore} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.mouseDown(searchInput);
        fireEvent.click(searchInput);

        const createButton = screen.getByRole('button', { name: 'options_user_rules_create_rule' });
        fireEvent.mouseDown(createButton);
        fireEvent.click(createButton);

        // No search telemetry, no create telemetry and no create row.
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rules_search_click',
            'user_rules_screen',
        );
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'create_rule_click',
            'user_rules_screen',
        );
        // Editing continues on the same row.
        const editors = screen.getAllByTestId('inline-editor');
        expect(editors).toHaveLength(1);
        expect(editors[0]!.dataset.value).toBe('||a.com^');
    });

    it('ignores clicks outside the edited row: another rule checkbox does not toggle', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);

        const otherCheckbox = screen.getByRole('checkbox', { name: '||b.com^' }) as HTMLInputElement;
        fireEvent.mouseDown(otherCheckbox);
        fireEvent.click(otherCheckbox);

        expect(otherCheckbox.checked).toBe(true);
        expect(saveUserRules).not.toHaveBeenCalled();
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
    });

    it('lets the view-mode toggle through the click blocker', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        // The toggle lives outside the row, but it must reach its own guard so
        // the owner can ask before unmounting the list.
        const toggle = document.createElement('button');
        toggle.className = USER_RULES_VIEW_MODE_TOGGLE_CLASS;
        const onClick = vi.fn();
        toggle.addEventListener('click', onClick);
        document.body.appendChild(toggle);

        try {
            fireEvent.mouseDown(toggle);
            fireEvent.click(toggle);
        } finally {
            toggle.remove();
        }

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('keeps editing open when the inline editor loses focus', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.blur(screen.getByTestId('inline-editor'));

        // Blur must not exit editing; only save/cancel do.
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
    });

    it('edits a single-line comment inline without its marker', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '! my comment\n||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);

        // The marker is fixed context; only the comment text is editable.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('my comment');
    });

    it('keeps the comment marker when saving an edited comment', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! my comment\n||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '! edited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(saveUserRules).toHaveBeenCalledWith('! edited text\n||a.com^');
    });

    it('saves a multi-line comment block with the markers restored', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! first\n||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '! line one\n! line two\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The added line inherits the `!` marker of the edited block.
        expect(saveUserRules).toHaveBeenCalledWith('! line one\n! line two\n||a.com^');
    });

    it('keeps hashmark markers when saving an edited hashmark block', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '# first\n# second\n||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '# line one\n# line two\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(saveUserRules).toHaveBeenCalledWith('# line one\n# line two\n||a.com^');
    });

    it('keeps the block spacing when a line is added to a comment block', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '!aaa\n||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: '!line one\n!line two\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The added line inherits the block's `!` marker without a forced space.
        expect(saveUserRules).toHaveBeenCalledWith('!line one\n!line two\n||a.com^');
    });

    it('deletes a multi-line comment block through the trash pipeline when saved empty', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! first\n! second\n||a.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // Same persistence as the trash action: the block is removed, not blanked.
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(screen.queryByText('first')).toBeNull());
        expect(screen.queryByTestId('inline-editor')).toBeNull();

        // And the same undo snackbar is offered.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.buttons?.[0]?.title).toBe('options_user_rules_undo');
    });

    it('keeps a bare comment block when saved empty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '!\n!\n||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        // Both block lines are bare comments, so the seed is a single newline.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('\n');

        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // An unchanged empty block must not be deleted.
        expect(saveUserRules).not.toHaveBeenCalled();
    });

    it('edits a multi-line comment block inline without markers', async () => {
        getUserRulesEditorData.mockResolvedValue({
            userRules: '! first\n! second\n||a.com^',
        });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);

        // The whole block is editable inline; the markers stay hidden.
        const editor = screen.getByTestId('inline-editor');
        expect(editor.dataset.value).toBe('first\nsecond');
        expect(editor.dataset.comment).toBe('true');
    });

    it('keeps the inline draft in the editing state so a remounted row can restore it', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        // The list stores the draft in the editing state machine and passes it
        // back to the row, so a virtualizer remount seeds the editor with the
        // in-progress content instead of the stored text.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
    });

    it('keeps editing on the same rule when a refetch removes a rule above it', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // External refresh removed the rule above the edited one.
            .mockResolvedValueOnce({ userRules: '||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });
        await waitFor(() => {
            expect(eventListeners).toHaveLength(1);
        });

        // Edit the second rule, then let a background refresh drop the first.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');

        await act(async () => {
            await eventListeners[0]!();
        });

        // The edited line shifted to index 0; editing must follow it instead of
        // staying on the old index (which now holds a different rule).
        await waitFor(() => {
            expect(screen.queryByText('||a.com^')).toBeNull();
        });
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');
        // The edited row shows save/cancel instead of the pencil.
        expect(screen.queryAllByLabelText('options_user_rules_edit_rule')).toHaveLength(0);
    });

    it('cancels inline editing when the edited rule disappears from a refetched list', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // External refresh (e.g. import from the header menu) removed the
            // rule that is being edited.
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });
        await waitFor(() => {
            expect(eventListeners).toHaveLength(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();

        await act(async () => {
            await eventListeners[0]!();
        });

        // The line is gone: editing must not survive against a different rule.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(screen.getByText('||a.com^')).toBeTruthy();
        expect(screen.getByLabelText('options_user_rules_edit_rule')).toBeTruthy();
    });

    it('edits the correct rule when blank lines precede it', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '! c\n\n||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        // The last row sits at raw line index 3: the blank line is filtered
        // from the rendered list but still occupies an index in the rules text.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[2]!);

        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');
        // The rule above keeps its pencil instead of being marked as edited.
        expect(screen.queryAllByLabelText('options_user_rules_edit_rule')).toHaveLength(2);
    });

    it('keeps the edited row visible when the search excludes it', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');

        // A pending search can settle while a row is being edited. The edited
        // row must stay mounted even when it no longer matches, otherwise the
        // editor unmounts while editing is still active and the click blockers
        // leave the page with no way to save, cancel or clear the search.
        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'a.com' } });

        expect(screen.getByTestId('inline-editor').dataset.value).toBe('||b.com^');

        // Once editing ends, the row respects the filter again.
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        await waitFor(() => {
            expect(screen.queryByText('||b.com^')).toBeNull();
        });
    });

    it('keeps the edited row mounted and blocks outside clicks when it leaves the virtual window', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const telemetryStore = {
            sendPageViewEvent: vi.fn(),
            sendCustomEvent: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        const { rerender } = render(<UserRulesList telemetryStore={telemetryStore} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
        fireEvent.click(screen.getByTestId('inline-editor-draft'));

        // The virtualizer now renders only the first row, but `rangeExtractor`
        // keeps the edited row mounted as the click-blocking boundary.
        virtualizerWindow.visibleCount = 1;
        rerender(<UserRulesList telemetryStore={telemetryStore} />);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');

        // Outside clicks are still swallowed, so another row's trash, the
        // search field and Create rule cannot lose the draft.
        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.click(searchInput);
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rules_search_click',
            'user_rules_screen',
        );

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        expect(saveUserRules).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'create_rule_click',
            'user_rules_screen',
        );

        // The pencil on another row must not replace the active draft either:
        // Edit is inert while an inline editor is open.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        virtualizerWindow.visibleCount = Number.POSITIVE_INFINITY;
        rerender(<UserRulesList telemetryStore={telemetryStore} />);
        expect(screen.getAllByTestId('inline-editor')).toHaveLength(1);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
    });

    it('keeps editing and the draft when the edited rule is toggled', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the toggle persists the disabled marker.
            .mockResolvedValueOnce({ userRules: '!off ||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');

        // Toggling rewrites the raw text with the `!off` marker, but the
        // displayed text is stable, so editing must follow the rule and keep
        // the draft instead of cancelling or moving to another row.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));

        await waitFor(() => {
            expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
        });
        expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    });

    it('keeps inline editing and the draft when user rules are turned off', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const { rerender } = render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');

        rerender(<UserRulesList filterOff />);

        // Like the Edit view, turning the rules off keeps the unsaved draft and
        // the editor stays open and usable.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
        expect(screen.getByLabelText('options_user_rules_save_rule')).toHaveProperty('disabled', false);
    });

    it('cancels inline editing when the tracked line becomes the other kind', async () => {
        getUserRulesEditorData
            // A comment and a rule with identical displayed text.
            .mockResolvedValueOnce({ userRules: '! foo\nfoo' })
            // External refresh removed the comment, leaving only the rule.
            .mockResolvedValueOnce({ userRules: 'foo' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getAllByText('foo')).toHaveLength(2);
        });
        await waitFor(() => {
            expect(eventListeners).toHaveLength(1);
        });

        // Edit the comment (first row).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('foo');

        await act(async () => {
            await eventListeners[0]!();
        });

        // The same text now belongs to a rule: editing must not move onto it.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(screen.getAllByText('foo')).toHaveLength(1);
        expect(screen.getByLabelText('options_user_rules_edit_rule')).toBeTruthy();
    });

    it('cancels inline editing when the edited comment merges into a different block', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! first\n||separator.com^\n! second' })
            // External refresh removed the separator: the two comments merge
            // into one block whose text no longer matches the tracked block.
            .mockResolvedValueOnce({ userRules: '! first\n! second' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||separator.com^')).toBeTruthy();
        });
        await waitFor(() => {
            expect(eventListeners).toHaveLength(1);
        });

        // Edit the first comment.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('first');

        await act(async () => {
            await eventListeners[0]!();
        });

        // The tracked block changed, so editing is cancelled and the merged
        // block is rendered in full.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(screen.getByText('first')).toBeTruthy();
        expect(screen.getByText('second')).toBeTruthy();
    });

    it('keeps editing on the same comment block when a refetch removes a rule above it', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n! first\n! second' })
            // External refresh removed the rule above the edited block.
            .mockResolvedValueOnce({ userRules: '! first\n! second' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });
        await waitFor(() => {
            expect(eventListeners).toHaveLength(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('first\nsecond');

        await act(async () => {
            await eventListeners[0]!();
        });

        // The block shifted to index 0; editing must follow it instead of
        // staying on the old index.
        await waitFor(() => {
            expect(screen.queryByText('||a.com^')).toBeNull();
        });
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('first\nsecond');
    });

    it('undo restores only the rule from its own snackbar after multiple deletes', async () => {
        // Reproduces the reported bug: delete rule B, then delete rule C, then
        // undo the FIRST snackbar (B). The undo must restore only B, not C.
        const notificationIds = ['notif-1', 'notif-2'];
        let idIndex = 0;
        const addNotification = vi.fn().mockImplementation(() => {
            const id = notificationIds[idIndex];
            idIndex += 1;
            return id;
        });
        const removeNotification = vi.fn();
        getUserRulesEditorData
            // Initial fetch: three rules [a, b, c]
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // After deleting b: refetch returns [a, c]
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            // After deleting c: refetch returns [a]
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // After undoing b: refetch returns [a, b]
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} removeNotification={removeNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
            expect(screen.getByText('||b.com^')).toBeTruthy();
            expect(screen.getByText('||c.com^')).toBeTruthy();
        });

        // Delete ||b.com^ (row index 1).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(screen.queryByText('||b.com^')).toBeNull());
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Delete ||c.com^ (now at row index 1, since b is gone).
        // Both undo snackbars should remain visible (they stack, not override).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(screen.queryByText('||c.com^')).toBeNull());
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        // The first snackbar should NOT be dismissed when the second delete
        // starts — both stay visible so the user can choose which to undo.
        expect(removeNotification).not.toHaveBeenCalled();

        // Only ||a.com^ should remain.
        expect(screen.getByText('||a.com^')).toBeTruthy();
        expect(screen.queryByText('||b.com^')).toBeNull();
        expect(screen.queryByText('||c.com^')).toBeNull();

        // Undo the FIRST delete (||b.com^). This must restore only b, not c.
        const firstParams = addNotification.mock.calls[0]![0];
        await act(async () => {
            firstParams.buttons[0].onClick();
        });

        // The first snackbar is dismissed when its own Undo is clicked.
        expect(removeNotification).toHaveBeenCalledWith('notif-1');

        // ||b.com^ is restored, ||c.com^ is NOT (still deleted).
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });
        expect(screen.getByText('||a.com^')).toBeTruthy();
        expect(screen.queryByText('||c.com^')).toBeNull();

        // The saved text must contain a and b, but NOT c.
        const undoSaveCall = saveUserRules.mock.calls.at(-1)![0] as string;
        expect(undoSaveCall).toContain('||a.com^');
        expect(undoSaveCall).toContain('||b.com^');
        expect(undoSaveCall).not.toContain('||c.com^');
    });

    it('stacks undo snackbars when multiple deletes happen', async () => {
        const notificationIds = ['notif-1', 'notif-2'];
        let idIndex = 0;
        const addNotification = vi.fn().mockImplementation(() => {
            const id = notificationIds[idIndex];
            idIndex += 1;
            return id;
        });
        const removeNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            .mockResolvedValueOnce({ userRules: '' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} removeNotification={removeNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        // Delete ||b.com^ — shows undo snackbar 1.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Delete ||a.com^ — shows undo snackbar 2.
        // Both snackbars should remain visible (they stack, not override).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        // removeNotification should NOT have been called — both snackbars stay.
        expect(removeNotification).not.toHaveBeenCalled();
    });

    it('keeps undo snackbars visible when a toggle starts', async () => {
        const addNotification = vi.fn().mockReturnValue('undo-notif');
        const removeNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} removeNotification={removeNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        // Delete ||b.com^ — shows undo snackbar.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Toggle ||a.com^ — the undo snackbar should stay visible.
        const checkbox = screen.getByRole('checkbox', { name: '||a.com^' });
        fireEvent.click(checkbox);

        // removeNotification should NOT have been called.
        expect(removeNotification).not.toHaveBeenCalled();
    });

    it('dismisses only the clicked undo snackbar, not others', async () => {
        const notificationIds = ['notif-1', 'notif-2'];
        let idIndex = 0;
        const addNotification = vi.fn().mockImplementation(() => {
            const id = notificationIds[idIndex];
            idIndex += 1;
            return id;
        });
        const removeNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} removeNotification={removeNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||c.com^')).toBeTruthy();
        });

        // Delete ||b.com^ — shows undo snackbar 1.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Delete ||c.com^ — shows undo snackbar 2. Both stay visible.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        // Neither snackbar should have been dismissed when the second delete
        // started — both stay visible so the user can choose which to undo.
        expect(removeNotification).not.toHaveBeenCalled();

        // Undo the second delete (||c.com^) — should dismiss only snackbar 2.
        const secondParams = addNotification.mock.calls[1]![0];
        await act(async () => {
            secondParams.buttons[0].onClick();
        });

        // Only the second snackbar should have been dismissed.
        expect(removeNotification).toHaveBeenCalledWith('notif-2');
        expect(removeNotification).not.toHaveBeenCalledWith('notif-1');
    });
});

describe('UserRulesList create rule', () => {
    beforeEach(() => {
        saveUserRules.mockReset();
        getUserRulesEditorData.mockReset();
        useRuleHighlighter.mockReset();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        eventListeners.length = 0;
        // jsdom does not implement scrollIntoView; the create row calls it when
        // it opens to keep itself in view.
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    const createButton = () => screen.getByRole('button', { name: 'options_user_rules_create_rule' });

    it('opens an empty inline create row above the rules and fires create_rule_click', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const telemetryStore = {
            sendPageViewEvent: vi.fn(),
            sendCustomEvent: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        render(<UserRulesList telemetryStore={telemetryStore} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());

        const editor = screen.getByTestId('inline-editor');
        expect(editor.dataset.value).toBe('');
        // The create row is rendered before the first rule row.
        const firstRule = screen.getByText('||a.com^');
        expect(
            editor.compareDocumentPosition(firstRule) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        // The checkbox is checked and non-interactive; the row uses the
        // custom-rule icon from the mockup.
        const checkbox = screen.getByRole('checkbox', {
            name: 'options_user_rules_create_rule',
        }) as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(true);
        expect(screen.getByTestId('icon-#custom-rule')).toBeTruthy();
        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'create_rule_click',
            'user_rules_screen',
        );
    });

    it('creates one rule per line when several rules are pasted', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'line one\nline two\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        // The mock emits a two-line draft, like a paste of two rules.
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The lines must not be glued into one broken rule.
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('line one\nline two\n||a.com^'));
    });

    it('renders the create row when the list has no rules', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '' });
        render(<UserRulesList />);
        // Wait for the initial fetch so the Create rule button is enabled.
        await waitFor(() => {
            expect((createButton() as HTMLButtonElement).disabled).toBe(false);
        });
        expect(screen.getByText('options_user_rules_empty_placeholder')).toBeTruthy();

        fireEvent.click(createButton());

        expect(screen.getByTestId('inline-editor').dataset.value).toBe('');
    });

    it('keeps the search when the create row opens and shows the created rule', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the create.
            .mockResolvedValue({ userRules: 'edited text\n||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder') as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'a.com' } });
        expect(screen.queryByText('||b.com^')).toBeNull();

        fireEvent.click(createButton());

        // Creating works the same as without a search: the query is kept and
        // the create row opens above the results.
        expect(searchInput.value).toBe('a.com');
        expect(screen.queryByText('||b.com^')).toBeNull();
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('');

        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('edited text\n||a.com^\n||b.com^'));

        // The created rule does not match the query but stays visible on top.
        // The matched rule is looked up by its checkbox: the search highlight
        // splits its text.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('edited text')).toBeTruthy();
        });
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
        expect(screen.queryByText('||b.com^')).toBeNull();

        // A new query shows only its own matches again.
        fireEvent.change(searchInput, { target: { value: 'b.com' } });
        expect(screen.queryByText('edited text')).toBeNull();
        expect(screen.getByRole('checkbox', { name: '||b.com^' })).toBeTruthy();
    });

    it('keeps a created rule visible during a search after it is turned off', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^\n||b.com^' })
            // Refetch after the toggle.
            .mockResolvedValue({ userRules: '!off edited text\n||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByRole('checkbox', { name: 'edited text' })).toBeTruthy();
        });

        // Turning the rule off adds the `!off` marker to its text; the row
        // must not disappear from the results.
        fireEvent.click(screen.getByRole('checkbox', { name: 'edited text' }));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('!off edited text\n||a.com^\n||b.com^'));
        const checkbox = screen.getByRole('checkbox', { name: 'edited text' }) as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it('keeps the rules of every create during the same search', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the first create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^\n||b.com^' })
            // Refetch after the second create.
            .mockResolvedValue({ userRules: 'line one\nline two\nedited text\n||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByRole('checkbox', { name: 'edited text' })).toBeTruthy();
        });

        // The second create must not hide the rule of the first one.
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByRole('checkbox', { name: 'line one' })).toBeTruthy();
        });
        expect(screen.getByRole('checkbox', { name: 'line two' })).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: 'edited text' })).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
        expect(screen.queryByText('||b.com^')).toBeNull();
    });

    it('keeps only the created row when a rule with the same text already exists', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the create: the same text is now prepended, so both
            // rows have it.
            .mockResolvedValue({ userRules: 'edited text\nedited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        // The pre-existing rule with the same text does not match the query.
        expect(screen.queryByText('edited text')).toBeNull();

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('edited text')).toBeTruthy();
        });

        // Only the created row is kept: the older row with the same text stays
        // filtered out.
        expect(screen.getAllByText('edited text')).toHaveLength(1);
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('does not keep an older rule with the same text when the created row is deleted', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the create: the same text is prepended.
            .mockResolvedValueOnce({ userRules: 'edited text\nedited text\n||a.com^' })
            // Refetch after the delete: only the older row remains.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the undo: the created row is back.
            .mockResolvedValue({ userRules: 'edited text\nedited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getAllByText('edited text')).toHaveLength(1);
        });

        // Delete the created row (the first visible one): the tracked prefix
        // shrinks, so the older row with the same text must stay filtered out.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('edited text\n||a.com^'));
        await waitFor(() => expect(screen.queryByText('edited text')).toBeNull());
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();

        // Undo restores the created row and pins it again, without revealing the
        // older row with the same text.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            await params.buttons[0].onClick();
        });
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('edited text\nedited text\n||a.com^'));
        await waitFor(() => expect(screen.getAllByText('edited text')).toHaveLength(1));
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('keeps an edited created rule visible during the same search', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the edit: the new text does not match the query.
            .mockResolvedValue({ userRules: 'renamed text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('edited text')).toBeTruthy();
        });

        // Edit the created row: the tracked prefix keeps it visible even though
        // its new text no longer matches the query.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-renamed'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('renamed text\n||a.com^'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('renamed text')).toBeTruthy();
        });
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('shrinks the pinned prefix when a created comment block merged with an older one is edited down', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! old header\n||old.com^\n||a.com^' })
            // Refetch after the create: the created comments merge with the older
            // header into one block.
            .mockResolvedValueOnce({ userRules: '! one\n! two\n! old header\n||old.com^\n||a.com^' })
            // Refetch after the edit: the block shrank to a single line.
            .mockResolvedValue({ userRules: '! edited text\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comments'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('one')).toBeTruthy();
        });
        expect(screen.queryByText('||old.com^')).toBeNull();

        // The block merges two created lines with an older one, so shrinking it
        // has to reduce the prefix by the created lines only. Keeping the count
        // at 2 would pin `||old.com^`.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('! edited text\n||old.com^\n||a.com^'));
        await waitFor(() => expect(screen.queryByText('||old.com^')).toBeNull());
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('keeps a created comment pinned when only older lines of a merged block are removed', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! old header\n||old.com^\n||a.com^' })
            // Refetch after the create: the created comment merges with the
            // older header into one block.
            .mockResolvedValueOnce({ userRules: '! personal note\n! old header\n||old.com^\n||a.com^' })
            // Refetch after the edit: only the created line remains.
            .mockResolvedValue({ userRules: '! personal note\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comment'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('personal note')).toBeTruthy();
        });
        expect(screen.queryByText('||old.com^')).toBeNull();

        // Removing the older comment must not unpin the created line that is
        // still in the block: the count has to stay at 1.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-comment-text'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('! personal note\n||old.com^\n||a.com^'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('personal note')).toBeTruthy();
        });
        expect(screen.queryByText('||old.com^')).toBeNull();
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('unpins a merged block when the created lines are removed', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! old header\n||old.com^\n||a.com^' })
            // Refetch after the create: the created comment merges with the
            // older header into one block.
            .mockResolvedValueOnce({ userRules: '! personal note\n! old header\n||old.com^\n||a.com^' })
            // Refetch after the edit: only the older line remains.
            .mockResolvedValue({ userRules: '! old header\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comment'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('personal note')).toBeTruthy());
        expect(screen.queryByText('||old.com^')).toBeNull();

        // Edit the block down to the older comment: the created line is gone,
        // so the older comment must not stay pinned either.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-older-comment'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('! old header\n||old.com^\n||a.com^'));
        await waitFor(() => expect(screen.queryByTestId('inline-editor')).toBeNull());
        expect(screen.queryByText('old header')).toBeNull();
        expect(screen.queryByText('personal note')).toBeNull();
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('shrinks the pinned prefix when a fully created comment block is edited down', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||old.com^\n||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: '! one\n! two\n||old.com^\n||a.com^' })
            // Refetch after the edit: the block shrank to a single line.
            .mockResolvedValue({ userRules: '! edited text\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comments'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('one')).toBeTruthy();
        });
        expect(screen.queryByText('||old.com^')).toBeNull();

        // The block is fully created, so shrinking it has to shrink the count
        // too; keeping it at 2 would pin `||old.com^`.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('! edited text\n||old.com^\n||a.com^'));
        await waitFor(() => expect(screen.queryByText('||old.com^')).toBeNull());
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('reverts the count when a growing comment edit fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||old.com^\n||a.com^' })
            // Refetch after the first create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||old.com^\n||a.com^' })
            // Refetch after the second create.
            .mockResolvedValueOnce({ userRules: '! personal note\nedited text\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValueOnce(undefined);
        saveUserRules.mockResolvedValueOnce(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('edited text')).toBeTruthy());

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comment'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('personal note')).toBeTruthy());
        expect(screen.queryByText('||old.com^')).toBeNull();

        // Growing the created comment makes the optimistic count 3. If the
        // failed save does not revert it, `||old.com^` (index 2 in the reverted
        // text) gets pinned.
        saveUserRules.mockRejectedValueOnce(new Error('edit failed'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        // Leave the editor to see the reverted rows.
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        await waitFor(() => expect(screen.getByText('personal note')).toBeTruthy());
        expect(screen.queryByText('||old.com^')).toBeNull();
    });

    it('keeps a created row pinned when its delete fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' });
        saveUserRules.mockResolvedValueOnce(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('edited text')).toBeTruthy();
        });

        saveUserRules.mockRejectedValueOnce(new Error('delete failed'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);

        // The delete reverted the rules, so the count has to revert too or the
        // restored created row would disappear from the results.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByText('edited text')).toBeTruthy());
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('does not pin an older same-text row when Undo fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\nedited text\n||a.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getAllByText('edited text')).toHaveLength(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(screen.queryByText('edited text')).toBeNull());
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        saveUserRules.mockRejectedValueOnce(new Error('undo failed'));
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            await params.buttons[0].onClick();
        });

        // The Undo failed and the rules reverted to the older row only. The
        // optimistic count bump has to revert as well; otherwise the older row
        // with the same text would be pinned under the query.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));
        expect(screen.queryByText('edited text')).toBeNull();
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('keeps a created comment block pinned when a shrinking edit fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! old header\n||old.com^\n||a.com^' })
            // Refetch after the create: the created comments merge with the older
            // header into one block.
            .mockResolvedValueOnce({ userRules: '! one\n! two\n! old header\n||old.com^\n||a.com^' });
        saveUserRules.mockResolvedValueOnce(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-comments'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
            expect(screen.getByText('one')).toBeTruthy();
        });

        saveUserRules.mockRejectedValueOnce(new Error('edit failed'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[0]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The edit reverted to the three-line block, so the count has to revert
        // to 2 as well or the created block would be filtered out.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        // Leave the editor (it stays open with the failed draft) to see the
        // reverted rows.
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        await waitFor(() => expect(screen.getByText('one')).toBeTruthy());
        expect(screen.queryByText('||old.com^')).toBeNull();
    });

    it('does not pin an undone created row under a different search query', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the first create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // Refetch after the second create.
            .mockResolvedValueOnce({ userRules: 'renamed text\nedited text\n||a.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: 'renamed text\n||a.com^' })
            // Refetch after the undo.
            .mockResolvedValue({ userRules: 'renamed text\nedited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('edited text')).toBeTruthy());

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft-renamed'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('renamed text')).toBeTruthy());

        // Delete the older created row (`edited text`, now second).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('renamed text\n||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Change the query, then Undo: the restored row was created under the
        // previous query and must not be pinned under the new one.
        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'b.com' } },
        );
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            await params.buttons[0].onClick();
        });

        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('renamed text\nedited text\n||a.com^'));
        expect(screen.queryByText('renamed text')).toBeNull();
        expect(screen.queryByText('edited text')).toBeNull();
        expect(screen.getByText('options_user_rules_no_match')).toBeTruthy();
    });

    it('forgets the created prefix when an external refresh replaces the rules', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the create.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' })
            // External replacement, e.g. Delete all + Import from the header.
            .mockResolvedValueOnce({ userRules: '||imported.com^\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });
        await waitFor(() => expect(eventListeners).toHaveLength(1));

        fireEvent.change(
            screen.getByPlaceholderText('options_user_rules_search_placeholder'),
            { target: { value: 'a.com' } },
        );
        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => expect(screen.getByText('edited text')).toBeTruthy());

        await act(async () => {
            await eventListeners[0]!();
        });

        // The replacement text did not come from a create, so its first line
        // must not stay pinned under the search.
        await waitFor(() => expect(screen.queryByText('||imported.com^')).toBeNull());
        expect(screen.queryByText('edited text')).toBeNull();
        expect(screen.getByRole('checkbox', { name: '||a.com^' })).toBeTruthy();
    });

    it('closes the create row on cancel without saving and returns focus to the button', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        const button = createButton();
        fireEvent.click(button);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));

        expect(screen.queryByTestId('inline-editor')).toBeNull();
        expect(saveUserRules).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(button);
    });

    it('closes the create row without saving when the draft is empty', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        const button = createButton();
        fireEvent.click(button);
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(screen.queryByTestId('inline-editor')).toBeNull();
        expect(saveUserRules).not.toHaveBeenCalled();
        expect(addNotification).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(button);
    });

    it('ignores clicks outside the create row: checkbox, pencil and search do not react', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const telemetryStore = {
            sendPageViewEvent: vi.fn(),
            sendCustomEvent: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        render(<UserRulesList telemetryStore={telemetryStore} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());

        // Another rule's checkbox must not toggle (and must not be persisted).
        const checkbox = screen.getByRole('checkbox', { name: '||a.com^' }) as HTMLInputElement;
        fireEvent.mouseDown(checkbox);
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(true);
        expect(saveUserRules).not.toHaveBeenCalled();

        // Another row's pencil must not move editing to that row.
        const pencil = screen.getAllByLabelText('options_user_rules_edit_rule')[0]!;
        fireEvent.mouseDown(pencil);
        fireEvent.click(pencil);

        // The search must not react (no focus, no telemetry).
        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.mouseDown(searchInput);
        fireEvent.click(searchInput);
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rules_search_click',
            'user_rules_screen',
        );

        // Only the create row's editor exists; the draft is untouched and the
        // rows still show their pencils.
        const editors = screen.getAllByTestId('inline-editor');
        expect(editors).toHaveLength(1);
        expect(editors[0]!.dataset.value).toBe('');
        expect(screen.getAllByLabelText('options_user_rules_edit_rule')).toHaveLength(2);
    });

    it('keeps search, toggling, creating, editing and deleting available while user rules are off', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList filterOff />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        expect((createButton() as HTMLButtonElement).disabled).toBe(false);
        screen.getAllByRole('checkbox').forEach((checkbox) => {
            expect((checkbox as HTMLInputElement).disabled).toBe(false);
        });
        screen.getAllByLabelText('options_user_rules_edit_rule').forEach((button) => {
            expect((button as HTMLButtonElement).disabled).toBe(false);
        });
        screen.getAllByLabelText('options_user_rules_delete_rule').forEach((button) => {
            expect((button as HTMLButtonElement).disabled).toBe(false);
        });

        // Search filters the list.
        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'b.com' } });
        expect(screen.queryByText('||a.com^')).toBeNull();
        fireEvent.change(searchInput, { target: { value: '' } });

        // Toggling persists the rule as turned off.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('!off ||a.com^\n||b.com^'));

        // Editing and creating open the inline editors.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
    });

    /**
     * Builds the platform's find shortcut: Cmd+F on macOS, Ctrl+F elsewhere.
     *
     * @returns Keydown event.
     */
    const findShortcutEvent = () => new KeyboardEvent('keydown', {
        key: 'f',
        code: 'KeyF',
        ctrlKey: !UserAgent.isMacOs,
        metaKey: UserAgent.isMacOs,
        bubbles: true,
        cancelable: true,
    });

    it('moves Ctrl+F to the list search instead of the browser find', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        // The search input is the shortcut's target, so it advertises it.
        expect(searchInput.getAttribute('aria-keyshortcuts')).toBe(UserAgent.isMacOs ? 'Meta+F' : 'Control+F');

        const event = findShortcutEvent();
        document.body.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(searchInput);
    });

    it('leaves Ctrl+F alone while an inline editor is open', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        const event = findShortcutEvent();
        document.body.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).not.toBe(screen.getByPlaceholderText('options_user_rules_search_placeholder'));
    });

    it('keeps the create row and the draft when user rules are turned off', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const { rerender } = render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');

        rerender(<UserRulesList filterOff />);

        // The typed rule is not lost: the row stays open while the rules are
        // off.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
    });

    it('keeps the Create rule button disabled until the rules are loaded', async () => {
        let resolveFetch: (value: { userRules: string }) => void = () => {};
        getUserRulesEditorData.mockReturnValue(new Promise((resolve) => {
            resolveFetch = resolve;
        }));
        render(<UserRulesList />);

        // The initial fetch is pending: creating now could overwrite the
        // not-yet-loaded rules with a single line.
        expect((createButton() as HTMLButtonElement).disabled).toBe(true);

        await act(async () => {
            resolveFetch({ userRules: '||a.com^' });
        });

        await waitFor(() => {
            expect((createButton() as HTMLButtonElement).disabled).toBe(false);
        });
    });

    it('ignores save and cancel while the create save is in flight', async () => {
        let resolveSave: () => void = () => {};
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' });
        saveUserRules.mockImplementationOnce(() => new Promise<void>((resolve) => {
            resolveSave = resolve;
        }));
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // While the save is in flight the row actions are disabled and further
        // save/cancel attempts are ignored, so the rule cannot be prepended
        // twice and the row cannot be closed mid-save.
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('options_user_rules_save_rule'))
            .toHaveProperty('disabled', true);
        expect(screen.getByLabelText('options_user_rules_cancel_rule_creation'))
            .toHaveProperty('disabled', true);
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();

        await act(async () => {
            resolveSave();
        });

        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(saveUserRules).toHaveBeenCalledTimes(1);
    });

    it('opens the editor unlocked while an unrelated mutation is saving', async () => {
        let resolveToggleSave: () => void = () => {};
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the toggle save.
            .mockResolvedValueOnce({ userRules: '!off ||a.com^' });
        saveUserRules.mockImplementationOnce(() => new Promise<void>((resolve) => {
            resolveToggleSave = resolve;
        }));
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Toggle a rule so a mutation is in flight when the create row opens.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));
        expect(saveUserRules).toHaveBeenCalledTimes(1);

        fireEvent.click(createButton());

        // The hook's `isSaving` is true, but the create save is not: the editor
        // must stay editable, otherwise the first keystrokes are lost.
        expect(screen.getByTestId('inline-editor').dataset.readonly).toBe('false');

        await act(async () => {
            resolveToggleSave();
        });
    });

    it('prepends the created rule, closes the row and returns focus on save', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        const button = createButton();
        fireEvent.click(button);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(saveUserRules).toHaveBeenCalledWith('edited text\n||a.com^\n||b.com^');
        // The save is asynchronous: the row closes once the persistence and
        // refetch settle.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        await waitFor(() => {
            expect(screen.getByText('edited text')).toBeTruthy();
        });
        expect(document.activeElement).toBe(button);
    });

    it('keeps the create draft open and reports the error when the save fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        saveUserRules.mockRejectedValue(new Error('save failed'));
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        const params = addNotification.mock.calls[0]![0];
        expect(params.type).toBe(NotificationType.Error);
        expect(params.text).toBe('options_editor_save_error');
        // The draft row is still open with the typed text.
        expect(screen.getByTestId('inline-editor').dataset.value).toBe('edited text');
    });

    it('keeps the created rule when the post-save refetch fails', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // The refetch after the save fails, but the write succeeded.
            .mockRejectedValueOnce(new Error('refetch failed'));
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The write is authoritative: the row closes and the persisted content
        // is shown instead of a save error.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(screen.getByText('edited text')).toBeTruthy();
        expect(addNotification).not.toHaveBeenCalled();
    });

    it('keeps the created rule when the limits check fails after the save', async () => {
        const addNotification = vi.fn();
        const checkLimitations = vi.fn().mockRejectedValue(new Error('limits failed'));
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' });
        saveUserRules.mockResolvedValue(undefined);
        render(
            <UserRulesList addNotification={addNotification} checkLimitations={checkLimitations} />,
        );
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(screen.getByText('edited text')).toBeTruthy();
        expect(addNotification).not.toHaveBeenCalled();
    });

    it('updates export availability after creating the first rule', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('options_user_rules_empty_placeholder')).toBeTruthy();
        });

        fireEvent.click(createButton());
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        await waitFor(() => {
            expect(setUserRulesExportAvailableState).toHaveBeenLastCalledWith(true);
        });
    });
});

describe('UserRulesList telemetry', () => {
    const createTelemetryStore = () => ({
        sendPageViewEvent: vi.fn(),
        sendCustomEvent: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    beforeEach(() => {
        saveUserRules.mockReset();
        getUserRulesEditorData.mockReset();
        useRuleHighlighter.mockReset();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        // jsdom does not implement scrollIntoView; the create row calls it.
        // Stubbed here too so the create-row tests below pass when this suite
        // runs on its own.
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    it('fires user_rules_empty pageview once when the loaded rules list is empty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('options_user_rules_empty_placeholder')).toBeTruthy();
        });

        expect(telemetryStore.sendPageViewEvent).toHaveBeenCalledTimes(1);
        expect(telemetryStore.sendPageViewEvent).toHaveBeenCalledWith('user_rules_empty');
    });

    it('does not fire user_rules_empty pageview when the rules list is non-empty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        expect(telemetryStore.sendPageViewEvent).not.toHaveBeenCalled();
    });

    it('fires checkbox_click on rule toggle', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox);

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'checkbox_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_edit_click when a rule pencil is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_edit_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_edit_click when a comment pencil is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '! a comment' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByLabelText('options_user_rules_edit_rule')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_edit_click',
            'user_rules_screen',
        );
    });

    it('does not fire user_rule_edit_click when Create rule is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_edit_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_inline_save_click when the row checkmark is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_inline_save_click when an existing rule is emptied and saved', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||example.org^' })
            // Refetch after the empty save deletes the rule.
            .mockResolvedValueOnce({ userRules: '' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
        // The empty draft goes through the delete pipeline, so the test really
        // covers the empty-draft path rather than a plain save.
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith(''));
        await waitFor(() => expect(screen.queryByText('||example.org^')).toBeNull());
    });

    it('fires user_rule_inline_save_click when the create row checkmark is clicked', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||example.org^' })
            .mockResolvedValueOnce({ userRules: 'new rule\n||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_inline_save_click when an empty create draft is saved', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-clear'));
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
    });

    it('does not fire user_rules_save_click for an inline save', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rules_save_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_inline_cancel_click when the row cross is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByLabelText('options_user_rules_cancel_rule_editing'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_cancel_click',
            'user_rules_screen',
        );
    });

    it('fires user_rule_inline_cancel_click when the create row cross is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByLabelText('options_user_rules_cancel_rule_creation'), { detail: 1 });

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rule_inline_cancel_click',
            'user_rules_screen',
        );
    });

    it('does not fire user_rule_inline_save_click for keyboard activation of the checkmark', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        // Enter / Space on the focused checkmark fires a click with detail 0.
        fireEvent.click(screen.getByLabelText('options_user_rules_save_rule'), { detail: 0 });

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
    });

    it('does not fire user_rule_inline_save_click for the editor save hotkey', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        // Enter / Ctrl(Cmd)+S -> the editor's save callback.
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
    });

    it('does not fire user_rule_inline_cancel_click for the editor cancel hotkey', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        // Escape -> the editor's cancel callback.
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-cancel'));

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_inline_cancel_click',
            'user_rules_screen',
        );
    });

    it('does not fire save or cancel events when clicking outside the editing row', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        // Both targets are outside the editing row. The search input has no
        // guard of its own, so it proves the click blocker (rather than a
        // handler's own guard) is what suppresses the interaction.
        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.mouseDown(searchInput);
        fireEvent.click(searchInput);

        const createButton = screen.getByRole('button', { name: 'options_user_rules_create_rule' });
        fireEvent.mouseDown(createButton);
        fireEvent.click(createButton);

        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_inline_save_click',
            'user_rules_screen',
        );
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rule_inline_cancel_click',
            'user_rules_screen',
        );
        // The blocker stopped the outside handlers: no search or create event.
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'user_rules_search_click',
            'user_rules_screen',
        );
        expect(telemetryStore.sendCustomEvent).not.toHaveBeenCalledWith(
            'create_rule_click',
            'user_rules_screen',
        );
    });

    it('keeps keyboard focus and key events inside the editing row', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        searchInput.focus();
        expect(document.activeElement).toBe(screen.getByTestId('inline-editor'));

        // Even if focus briefly lands outside, the key is swallowed so the
        // search cannot change and Escape cannot clear it mid-edit.
        expect(fireEvent.keyDown(searchInput, { key: 'Escape' })).toBe(false);
        expect(fireEvent.keyDown(searchInput, { key: 'a' })).toBe(false);
    });

    it('fires user_rules_search_click on search input click', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        const telemetryStore = createTelemetryStore();
        render(<UserRulesList telemetryStore={telemetryStore} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const searchInput = screen.getByPlaceholderText('options_user_rules_search_placeholder');
        fireEvent.click(searchInput);

        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'user_rules_search_click',
            'user_rules_screen',
        );
    });
});

describe('UserRulesList unload warning', () => {
    beforeEach(() => {
        saveUserRules.mockReset();
        getUserRulesEditorData.mockReset();
        useRuleHighlighter.mockReset();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        eventListeners.length = 0;
        vi.mocked(usePreventUnload).mockClear();
        // jsdom does not implement scrollIntoView; the create row calls it.
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    const UNLOAD_MESSAGE = 'options_editor_leave_title options_userfilter_leave_subtitle';

    it('does not warn while no inline editor is open', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('does not warn when a rule editor is opened without changes', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));

        // The draft still matches the stored text, so nothing would be lost.
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('does not warn when the rule draft differs only in whitespace', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft-trailing-space'));

        // Saving trims the whitespace away, so there is nothing to lose.
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('stops warning when the edited draft is typed back to the stored text', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        fireEvent.click(screen.getByTestId('inline-editor-draft-reset'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('warns once the rule draft differs and stops after cancel', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('stops warning after an inline save', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The save exits editing once it resolves, which clears the warning.
        await waitFor(() => {
            expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
        });
    });

    it('does not warn while the create row is open with an empty draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));

        // An empty create row has nothing to lose yet.
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('does not warn for a whitespace-only create draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft-whitespace'));

        // A whitespace-only draft is discarded on save, so nothing is lost.
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('warns once the create draft is non-empty and stops after cancel', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
    });

    it('keeps warning while the create save is in flight', async () => {
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the save.
            .mockResolvedValueOnce({ userRules: 'edited text\n||a.com^' });
        let resolveSave!: () => void;
        saveUserRules.mockImplementation(() => new Promise<void>((resolve) => {
            resolveSave = resolve;
        }));
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        fireEvent.click(screen.getByTestId('inline-editor-save'));

        // The create save is pessimistic and keeps the row open: the rule is
        // not persisted yet, and cancel is ignored while the save is in flight,
        // so leaving now would lose the typed rule if the save failed (e.g. the
        // MV3 first-save race).
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);
        expect(screen.getByTestId('editor-leave-modal')).toBeTruthy();

        await act(async () => {
            resolveSave();
        });

        // The save settled and the row closed: nothing is left to lose.
        await waitFor(() => {
            expect(screen.queryByTestId('inline-editor')).toBeNull();
        });
        expect(usePreventUnload).toHaveBeenLastCalledWith(false, UNLOAD_MESSAGE);
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();
    });

    it('keeps warning when user rules are turned off with an unsaved draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const { rerender } = render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        // The draft is kept while the rules are off, so the warning stays too.
        rerender(<UserRulesList filterOff />);
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);
    });

    it('keeps warning while the edited row leaves the virtual window', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const { rerender } = render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);

        // The row stays mounted via `rangeExtractor`, so the draft is still
        // visible and would still be lost on unload.
        virtualizerWindow.visibleCount = 1;
        rerender(<UserRulesList />);
        expect(screen.getByTestId('inline-editor')).toBeTruthy();
        expect(usePreventUnload).toHaveBeenLastCalledWith(true, UNLOAD_MESSAGE);
    });

    it('mounts the leave guard only while the draft is dirty', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Nothing to lose yet: the guard is not mounted.
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();

        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        // Editor open but the draft still matches the stored text.
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();

        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        // Dirty: the guard is armed.
        expect(screen.getByTestId('editor-leave-modal')).toBeTruthy();

        fireEvent.click(screen.getByTestId('inline-editor-cancel'));
        // Cancelled: disarmed again.
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();
    });

    it('mounts the leave guard for a non-empty create draft', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        render(<UserRulesList />);
        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        // Empty create row: nothing to lose.
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();

        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        // Non-empty create draft: the guard is armed.
        expect(screen.getByTestId('editor-leave-modal')).toBeTruthy();
    });
});

describe('UserRulesList undo positioning', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        saveUserRules.mockReset();
        getUserRulesEditorData.mockReset();
        useRuleHighlighter.mockReset();
        eventListeners.length = 0;
    });

    afterEach(() => {
        cleanup();
    });

    it('restores a comment block around the blank line inside it', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! first\n\n! second\n||rule.com^' })
            // Refetch after the delete: only the blank line and the rule remain.
            .mockResolvedValueOnce({ userRules: '\n||rule.com^' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: '! first\n\n! second\n||rule.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||rule.com^')).toBeTruthy();
        });

        // The comment block is the first row.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('\n||rule.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        // The surviving blank line must stay between the two restored lines.
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('! first\n\n! second\n||rule.com^');
        });
    });

    it('restores stacked deletes relative to each other', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // After deleting b.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            // After deleting c.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // After undoing b.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // After undoing c.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        // Delete b, then c (c is now the second row).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||c.com^'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        // Undo b first, then c: c must land after b, not between a and b.
        await act(async () => {
            addNotification.mock.calls[0]![0].buttons[0].onClick();
        });
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||b.com^'));

        await act(async () => {
            addNotification.mock.calls[1]![0].buttons[0].onClick();
        });
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||b.com^\n||c.com^'));
    });

    it('gives identical deleted blocks separate undo snackbars', async () => {
        const addNotification = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||same.com^\n||same.com^' })
            // After deleting the first row.
            .mockResolvedValueOnce({ userRules: '||same.com^' })
            // After deleting the second row.
            .mockResolvedValueOnce({ userRules: '' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getAllByText('||same.com^')).toHaveLength(2);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('||same.com^'));

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith(''));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        // The notification store dedupes on `type` + `dedupeKey`; a text-based
        // key would suppress the second snackbar and leave its block without an
        // undo path.
        const dedupeKeys = addNotification.mock.calls.map((call) => call[0].dedupeKey);
        expect(new Set(dedupeKeys).size).toBe(2);
    });

    it('reads the stored rules before undoing after the list unmounted', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // The rule saved in the Edit view while the list was unmounted.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||from-editor.com^' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||from-editor.com^\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        const { unmount } = render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Switching to the Edit view unmounts the list; the snackbar survives.
        unmount();

        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        // The rule saved in the Edit view must not be overwritten.
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||from-editor.com^\n||b.com^');
        });
    });

    it('aborts undo when the stored rules cannot be read after unmount', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after the delete.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // The read before the undo fails.
            .mockRejectedValueOnce(new Error('read failed'));
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        const { unmount } = render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Switching to the Edit view unmounts the list; the snackbar survives.
        unmount();

        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        // The frozen list state must not be written over the Edit view text.
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(addNotification.mock.calls[1]![0].type).toBe(NotificationType.Error);
        expect(addNotification.mock.calls[1]![0].text).toBe('options_editor_save_error');
    });

    it('falls back to the anchor when the visible text changed before undo', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // Refetch after deleting b.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            // External refetch: a rule appeared above the list.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||c.com^' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||b.com^\n||c.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||c.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(eventListeners).toHaveLength(1));

        // Another tab changes the rules while the snackbar is still up.
        await act(async () => {
            await eventListeners[0]!();
        });
        await waitFor(() => expect(screen.getByText('||x.com^')).toBeTruthy());

        // The logical indices no longer match the text, so Undo must match the
        // captured neighbours and put b back between a and c.
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith(
                '||x.com^\n||a.com^\n||b.com^\n||c.com^',
            );
        });
    });

    it('keeps logical undo order after unmount when the stored text is unchanged', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // Refetch after deleting c.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after deleting b.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Undo c: unchanged stored text, then refetch.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            // Undo b: the text from the first undo, then refetch.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        const { unmount } = render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||c.com^')).toBeTruthy();
        });

        // Delete c, then b.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[2]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||b.com^'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(2));

        unmount();

        // Undo c, then b. The stored text still matches the indices, so b must
        // land before c instead of after it.
        await act(async () => {
            addNotification.mock.calls[0]![0].buttons[0].onClick();
        });
        await waitFor(() => expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||c.com^'));

        await act(async () => {
            addNotification.mock.calls[1]![0].buttons[0].onClick();
        });
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||b.com^\n||c.com^');
        });
    });

    it('shifts pending undo positions when an inline edit grows the text above them', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! a\n||b.com^' })
            // Refetch after deleting b.
            .mockResolvedValueOnce({ userRules: '! a' })
            // Refetch after growing the comment.
            .mockResolvedValueOnce({ userRules: '! line one\n! line two' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: '! line one\n! line two\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('! a'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        // Grow the comment above the deleted rule by one line.
        fireEvent.click(screen.getByLabelText('options_user_rules_edit_rule'));
        fireEvent.click(screen.getByTestId('inline-editor-draft-multiline'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenCalledWith('! line one\n! line two');
        });

        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('! line one\n! line two\n||b.com^');
        });
    });

    it('uses logical indices for deletes taken after an external change', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^\n||d.com^' })
            // Refetch after deleting d.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // External refetch: x appeared above the list.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||b.com^\n||c.com^' })
            // Refetch after deleting c.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||b.com^' })
            // Refetch after deleting b.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^' })
            // Refetch after undoing c.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||c.com^' })
            // Refetch after undoing b.
            .mockResolvedValueOnce({ userRules: '||x.com^\n||a.com^\n||b.com^\n||c.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||d.com^')).toBeTruthy();
        });

        // Delete d and leave its snackbar alone (as if it expired).
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[3]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||b.com^\n||c.com^'));
        await waitFor(() => expect(eventListeners).toHaveLength(1));

        await act(async () => {
            await eventListeners[0]!();
        });
        await waitFor(() => expect(screen.getByText('||x.com^')).toBeTruthy());

        // The next deletes are taken from the new text, so only d's indices are
        // stale; c and b must keep the logical fast path.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[3]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||x.com^\n||a.com^\n||b.com^'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[2]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||x.com^\n||a.com^'));

        await act(async () => {
            addNotification.mock.calls[1]![0].buttons[0].onClick();
        });
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('||x.com^\n||a.com^\n||c.com^');
        });

        await act(async () => {
            addNotification.mock.calls[2]![0].buttons[0].onClick();
        });
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith(
                '||x.com^\n||a.com^\n||b.com^\n||c.com^',
            );
        });
    });

    it('keeps logical undo order after a failed toggle rollback', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' })
            // Refetch after deleting c.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^' })
            // Refetch after deleting b.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after the failed toggle: the checkbox is rolled back.
            .mockResolvedValueOnce({ userRules: '||a.com^' })
            // Refetch after undoing c.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||c.com^' })
            // Refetch after undoing b.
            .mockResolvedValueOnce({ userRules: '||a.com^\n||b.com^\n||c.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||c.com^')).toBeTruthy();
        });

        // Delete c and b, then let the toggle save fail.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[2]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^\n||b.com^'));
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||a.com^'));

        saveUserRules.mockRejectedValueOnce(new Error('toggle failed'));
        const checkbox = screen.getByRole('checkbox', { name: '||a.com^' }) as HTMLInputElement;
        fireEvent.click(checkbox);
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(3));
        await waitFor(() => expect(checkbox.checked).toBe(true));

        // The rollback is the text the pending indices describe, so c and b
        // must not be mistaken for stale blocks.
        await act(async () => {
            addNotification.mock.calls[0]![0].buttons[0].onClick();
        });
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||c.com^');
        });

        await act(async () => {
            addNotification.mock.calls[1]![0].buttons[0].onClick();
        });
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('||a.com^\n||b.com^\n||c.com^');
        });
    });

    it('puts a created rule above a deleted first comment after undo', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData
            .mockResolvedValueOnce({ userRules: '! c\n||b.com^' })
            // Refetch after deleting the comment.
            .mockResolvedValueOnce({ userRules: '||b.com^' })
            // Refetch after creating a rule.
            .mockResolvedValueOnce({ userRules: 'edited text\n||b.com^' })
            // Refetch after the undo.
            .mockResolvedValueOnce({ userRules: 'edited text\n! c\n||b.com^' });
        saveUserRules.mockResolvedValue(undefined);
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        Element.prototype.scrollIntoView = vi.fn();

        render(<UserRulesList addNotification={addNotification} />);
        await waitFor(() => {
            expect(screen.getByText('||b.com^')).toBeTruthy();
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[0]!);
        await waitFor(() => expect(saveUserRules).toHaveBeenCalledWith('||b.com^'));
        await waitFor(() => expect(addNotification).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_create_rule' }));
        fireEvent.click(screen.getByTestId('inline-editor-draft'));
        fireEvent.click(screen.getByTestId('inline-editor-save'));
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenCalledWith('edited text\n||b.com^');
        });

        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });

        // The new rule stays first; the restored comment goes below it.
        await waitFor(() => {
            expect(saveUserRules).toHaveBeenLastCalledWith('edited text\n! c\n||b.com^');
        });
    });
});
