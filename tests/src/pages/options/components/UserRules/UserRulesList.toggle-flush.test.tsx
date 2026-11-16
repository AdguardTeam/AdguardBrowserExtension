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

import { UserRulesList } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList';

const {
    getUserRulesEditorData,
    saveUserRules,
    setUserRulesExportAvailableState,
} = vi.hoisted(() => ({
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

const { loggerError } = vi.hoisted(() => ({
    loggerError: vi.fn(),
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
        error: loggerError,
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

// The real `lodash-es` debounce is exercised here together with
// `vi.useFakeTimers()`: while the fake clock is frozen the 300 ms timer never
// fires, so a click leaves the toggle pending, and `flush()` (on unmount /
// pagehide / visibilitychange) persists it. This covers the actual
// `debounce`/`flush` semantics the fix relies on instead of a hand-rolled mock.
// `vitest.setup.ts` replaces `debounce` with an identity function that has no
// `flush`, so restore the real implementation for this file.
vi.mock('lodash-es', () => vi.importActual('lodash-es'));

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

/**
 * Overrides `document.visibilityState` for lifecycle tests.
 *
 * @param state Visibility state to report.
 */
const setVisibilityState = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

describe('UserRulesList toggle flush', () => {
    beforeEach(() => {
        // Freeze the clock so the 300 ms debounce stays pending until a flush is
        // triggered by unmount / pagehide / visibilitychange.
        vi.useFakeTimers();
        useRuleHighlighter.mockReturnValue({ renderer: null, status: HighlighterStatus.Ready });
        // jsdom does not implement scrollIntoView.
        Element.prototype.scrollIntoView = vi.fn();
        setVisibilityState('visible');
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('flushes a pending toggle on unmount instead of dropping it', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const { unmount } = render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        // Debounce is still pending: nothing has been persisted yet.
        expect(saveUserRules).not.toHaveBeenCalled();

        unmount();

        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');
    });

    it('flushes a pending toggle on pagehide', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        expect(saveUserRules).not.toHaveBeenCalled();

        fireEvent(window, new Event('pagehide'));

        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');
    });

    it('flushes a pending toggle when the document becomes hidden', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        expect(saveUserRules).not.toHaveBeenCalled();

        setVisibilityState('hidden');
        fireEvent(document, new Event('visibilitychange'));

        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');
    });

    it('writes at most once when both pagehide and visibilitychange fire', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));

        fireEvent(window, new Event('pagehide'));
        setVisibilityState('hidden');
        fireEvent(document, new Event('visibilitychange'));

        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');
    });

    it('does not write when no toggle is pending', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent(window, new Event('pagehide'));
        setVisibilityState('hidden');
        fireEvent(document, new Event('visibilitychange'));

        expect(saveUserRules).not.toHaveBeenCalled();
    });

    it('flushes only the final state after rapid toggles', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const { unmount } = render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox); // disable
        fireEvent.click(checkbox); // enable
        fireEvent.click(checkbox); // disable

        unmount();

        // Only the latest queued value is persisted, exactly once.
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');
    });

    it('still persists a later toggle after a lifecycle flush', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        const checkbox = screen.getByRole('checkbox', { name: '||example.org^' });
        fireEvent.click(checkbox); // disable -> pending
        fireEvent(window, new Event('pagehide'));
        expect(saveUserRules).toHaveBeenCalledTimes(1);

        fireEvent.click(checkbox); // enable -> new pending
        fireEvent(window, new Event('pagehide'));
        expect(saveUserRules).toHaveBeenCalledTimes(2);

        // Let the flushed saves and their refetches settle without act warnings.
        await act(async () => {
            await Promise.resolve();
        });
    });

    it('skips the post-flush refetch once the list unmounts', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mirrors the real List -> Edit shape: the wrapping element stays
        // mounted while only the list unmounts, so the unmount flush runs
        // against a live tree.
        const { rerender } = render(
            <div>
                <UserRulesList />
            </div>,
        );

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        // Ignore the mount fetch so only the post-flush refetch is observed.
        getUserRulesEditorData.mockClear();
        setUserRulesExportAvailableState.mockClear();

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        expect(saveUserRules).not.toHaveBeenCalled();

        // Ignore the optimistic toggle's own state sync; only the post-flush
        // work is asserted below.
        setUserRulesExportAvailableState.mockClear();

        // Unmount only the list; the wrapper stays mounted. The unmount flush
        // persists the pending toggle.
        rerender(<div />);
        expect(saveUserRules).toHaveBeenCalledTimes(1);
        expect(saveUserRules).toHaveBeenCalledWith('!off ||example.org^');

        // Let the flushed save settle.
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // The save resolved, but the follow-up refetch must be skipped: the list
        // is gone, so its result would only be discarded (and would warn about a
        // state update on an unmounted component).
        expect(getUserRulesEditorData).not.toHaveBeenCalled();
        expect(setUserRulesExportAvailableState).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('re-checks the MV3 limits after the unmount flush', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const checkLimitations = vi.fn().mockResolvedValue(undefined);
        const { unmount } = render(<UserRulesList checkLimitations={checkLimitations} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        unmount();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // `checkLimitations` updates the shared settings store rather than this
        // component's state, so it must still run after the unmount flush: that
        // flush is the only place recalculating the warning for a list -> edit
        // switch right after a toggle.
        expect(checkLimitations).toHaveBeenCalledTimes(1);
    });

    it('logs a failing MV3 limits check instead of rejecting unhandled', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||example.org^' });
        saveUserRules.mockResolvedValue(undefined);
        const checkLimitations = vi.fn().mockRejectedValue(new Error('limits failed'));
        render(<UserRulesList checkLimitations={checkLimitations} />);

        await waitFor(() => {
            expect(screen.getByText('||example.org^')).toBeTruthy();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: '||example.org^' }));
        fireEvent(window, new Event('pagehide'));

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(checkLimitations).toHaveBeenCalledTimes(1);
        expect(loggerError).toHaveBeenCalledWith(
            '[ext.useUserRulesMutations]: Failed to check rule limits after toggle save:',
            expect.any(Error),
        );
    });

    it('re-queues a superseded toggle when the superseding write fails', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        // The delete's write fails; the re-queued toggle save then succeeds.
        saveUserRules.mockResolvedValue(undefined);
        saveUserRules.mockRejectedValueOnce(new Error('delete failed'));
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Toggle a rule: with the clock frozen the save stays pending.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));
        expect(saveUserRules).not.toHaveBeenCalled();

        // Delete another rule before the debounce fires, so the delete's write
        // supersedes (and drops) the queued toggle save.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        expect(saveUserRules.mock.calls[0]![0]).toBe('!off ||a.com^');

        // Let the failed delete settle. It reverts to a state that still shows
        // the toggle, so the toggle has to be persisted again — otherwise the
        // checkbox would stay toggled while the toggle is never saved.
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // The re-queued save is debounced like any other toggle save.
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(saveUserRules).toHaveBeenCalledTimes(2);
        expect(saveUserRules.mock.calls[1]![0]).toBe('!off ||a.com^\n||b.com^');
    });

    it('re-queues a toggle superseded again by a second failing write', async () => {
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        // Both deletes fail; the re-queued toggle save then succeeds.
        saveUserRules.mockResolvedValue(undefined);
        saveUserRules
            .mockRejectedValueOnce(new Error('first delete failed'))
            .mockRejectedValueOnce(new Error('second delete failed'));
        render(<UserRulesList />);

        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Toggle a rule: with the clock frozen the save stays pending.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));
        expect(saveUserRules).not.toHaveBeenCalled();

        // First delete supersedes the queued toggle save and fails, which
        // re-queues the toggle.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        expect(saveUserRules.mock.calls[0]![0]).toBe('!off ||a.com^');
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // Second delete lands while the re-queued save is still pending, so it
        // supersedes it too — and fails as well.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        expect(saveUserRules.mock.calls[1]![0]).toBe('!off ||a.com^');
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // The re-queued save must have been re-queued again: clearing the
        // tracking flag on the first re-queue would drop the toggle here, so it
        // would stay toggled in the UI while never being saved.
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(saveUserRules).toHaveBeenCalledTimes(3);
        expect(saveUserRules.mock.calls[2]![0]).toBe('!off ||a.com^\n||b.com^');
    });

    it('re-queues a toggle whose own failed save was superseded by a failing undo', async () => {
        const addNotification = vi.fn();
        getUserRulesEditorData.mockResolvedValue({ userRules: '||a.com^\n||b.com^' });
        let rejectToggleSave: (reason: Error) => void = () => {};
        let rejectUndoSave: (reason: Error) => void = () => {};
        saveUserRules
            // The initial delete succeeds.
            .mockResolvedValueOnce(undefined)
            // Toggle save: started by the debounce, settled manually.
            .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
                rejectToggleSave = reject;
            }))
            // Undo save: also settled manually, so the two failures can be
            // ordered deterministically.
            .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {
                rejectUndoSave = reject;
            }))
            .mockResolvedValue(undefined);
        render(<UserRulesList addNotification={addNotification} />);

        await waitFor(() => {
            expect(screen.getByText('||a.com^')).toBeTruthy();
        });

        // Delete ||b.com^ so an Undo snackbar is available. The delete's promise
        // chain has to be flushed explicitly: with fake timers installed
        // `waitFor` does not poll, so it only sees state that is already settled.
        fireEvent.click(screen.getAllByLabelText('options_user_rules_delete_rule')[1]!);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(addNotification).toHaveBeenCalledTimes(1);

        // Toggle ||a.com^ and let the debounce fire, so its save is in flight.
        fireEvent.click(screen.getByRole('checkbox', { name: '||a.com^' }));
        await act(async () => {
            vi.advanceTimersByTime(300);
        });
        expect(saveUserRules).toHaveBeenCalledTimes(2);

        // Undo supersedes the in-flight toggle save.
        const params = addNotification.mock.calls[0]![0];
        await act(async () => {
            params.buttons[0].onClick();
        });
        expect(saveUserRules).toHaveBeenCalledTimes(3);

        // The toggle save fails, but it was superseded, so it must stay tracked:
        // the undo's write is what now carries the toggle.
        await act(async () => {
            rejectToggleSave(new Error('toggle failed'));
            await Promise.resolve();
            await Promise.resolve();
        });

        // The undo's write fails too, reverting to a state that still shows the
        // toggle, so the toggle has to be re-queued.
        await act(async () => {
            rejectUndoSave(new Error('undo failed'));
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(saveUserRules).toHaveBeenCalledTimes(4);
        expect(saveUserRules.mock.calls[3]![0]).toBe('!off ||a.com^\n||b.com^');
    });
});
