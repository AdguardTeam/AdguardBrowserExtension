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

import { UserRulesList } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList';
import { logger } from '../../../../../../Extension/src/common/logger';

const { getUserRulesEditorData, saveUserRules, setUserRulesExportAvailableState } = vi.hoisted(() => ({
    getUserRulesEditorData: vi.fn(),
    saveUserRules: vi.fn(),
    setUserRulesExportAvailableState: vi.fn(),
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
        createEventListener: vi.fn().mockResolvedValue(() => {}),
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
    useWindowVirtualizer: ({ count }: { count: number }) => ({
        getTotalSize: () => count * 44,
        getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
            index,
            key: index,
            start: index * 44,
        })),
        measureElement: () => undefined,
    }),
}));

vi.mock(
    '../../../../../../Extension/src/pages/options/components/UserRules/rule-highlighter',
    () => ({ useRuleHighlighter, HighlighterStatus }),
);

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
        // No notification is shown when the deletion fails.
        expect(addNotification).not.toHaveBeenCalled();
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
        expect(errorParams.type).toBe('error');
        expect(errorParams.text).toBe('options_editor_save_error');
    });

    it('invokes onCreateRule when the Create button is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^' });
        const onCreateRule = vi.fn();
        render(<UserRulesList onCreateRule={onCreateRule} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||a.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByText('options_user_rules_create_rule')[0]!);
        expect(onCreateRule).toHaveBeenCalledTimes(1);
    });

    it('invokes onEditRule with the row lineIndex when Edit is clicked', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        const onEditRule = vi.fn();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        render(<UserRulesList onEditRule={onEditRule} />);
        await waitFor(() => {
            const elements = screen.queryAllByText('||b.com^');
            expect(elements.length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.click(screen.getAllByLabelText('options_user_rules_edit_rule')[1]!);
        expect(onEditRule).toHaveBeenCalledWith(1);
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
