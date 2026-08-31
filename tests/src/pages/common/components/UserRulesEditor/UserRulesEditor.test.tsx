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
    render,
    waitFor,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { UserRulesEditor } from '../../../../../../Extension/src/pages/common/components/UserRulesEditor';
import {
    UserRulesEditorStore,
    userRulesEditorStore,
} from '../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore';

const NOTIFIER_USER_FILTER_UPDATED = 'event.user.filter.updated';

type FakeEditorRef = {
    current: {
        getValue: () => string;
        setValue: (value: string) => void;
        getCursor: () => { line: number; ch: number };
        setCursor: (cursor: { line: number; ch: number }) => void;
        setWrap: (enabled: boolean) => void;
        setReadOnly: (enabled: boolean) => void;
        focus: () => void;
    } | null;
};

// Shared mutable state between the hoisted mocks and the test body.
const h = vi.hoisted(() => {
    const listeners: Record<string, (message: { type: string }) => void> = {};
    const pendingResolvers: Array<(value: { userRules: string }) => void> = [];
    const editorState = { value: '' };
    const setValueCalls: string[] = [];

    return {
        listeners,
        pendingResolvers,
        editorState,
        setValueCalls,
        storageResolver: null as ((value: string) => void) | null,
        onChange: null as (() => Promise<void>) | null,
        lastEditorRef: null as FakeEditorRef | null,
        getUserRulesEditorData: vi.fn(),
        createEventListener: vi.fn(),
        getEditorStorageContent: vi.fn(),
        setEditorStorageContent: vi.fn(),
        getUserRules: vi.fn(),
        getOptionsData: vi.fn(),
        saveUserRules: vi.fn(),
    };
});

// The editor exposes an imperative handle we drive in place of CodeMirror.
vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    // eslint-disable-next-line react/require-default-props
    Editor: ({ editorRef, onChange }: { editorRef: FakeEditorRef; onChange?: () => Promise<void> }) => {
        h.lastEditorRef = editorRef;
        h.onChange = onChange ?? null;
        editorRef.current = {
            getValue: () => h.editorState.value,
            setValue: (value: string) => {
                h.editorState.value = value;
                h.setValueCalls.push(value);
            },
            getCursor: () => ({ line: 1, ch: 0 }),
            setCursor: () => {},
            setWrap: () => {},
            setReadOnly: () => {},
            focus: () => {},
        };
        return React.createElement('div', { 'data-testid': 'user-rules-editor' });
    },
    EditorLeaveModal: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Checkbox', () => ({
    Checkbox: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getUserRulesEditorData: (...args: unknown[]) => h.getUserRulesEditorData(...args),
        createEventListener: (...args: unknown[]) => h.createEventListener(...args),
        getEditorStorageContent: (...args: unknown[]) => h.getEditorStorageContent(...args),
        setEditorStorageContent: (...args: unknown[]) => h.setEditorStorageContent(...args),
        getUserRules: (...args: unknown[]) => h.getUserRules(...args),
        getOptionsData: (...args: unknown[]) => h.getOptionsData(...args),
        saveUserRules: (...args: unknown[]) => h.saveUserRules(...args),
        openFullscreenUserRules: vi.fn(),
        closeFullscreenUserRules: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryEventName: {},
    TelemetryScreenName: {},
}));

vi.mock('../../../../../../Extension/src/background/schema/settings', () => ({
    SettingOption: { UserFilterEnabled: 'user-filter-enabled' },
}));

vi.mock('../../../../../../Extension/src/common/constants', () => ({
    NotifierType: {
        SettingUpdated: 'event.update.setting.value',
        UserFilterUpdated: 'event.user.filter.updated',
    },
}));

vi.mock('../../../../../../Extension/src/common/utils/user-rules', () => ({
    mergeImportedRules: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/pages/common/utils/dom', () => ({
    getFirstNonDisabledElement: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/pages/helpers', () => ({
    handleFileUpload: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        trace: vi.fn(),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/utils/export', () => ({
    exportData: vi.fn(),
    ExportTypes: { UserFilter: 'user-filter' },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/helpers', () => ({
    addMinDelayLoader: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../../../Extension/src/pages/common/constants', () => ({
    FILE_WRONG_EXTENSION_CAUSE: 'wrong-extension',
}));

vi.mock('../../../../../../Extension/src/pages/common/hooks/usePreventUnload', () => ({
    usePreventUnload: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/pages/common/types', () => ({
    NotificationType: { Error: 'error' },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/SavingButton', () => ({
    SavingErrorMessage: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/ToggleWrapButton', () => ({
    ToggleWrapButton: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/ToggleFullscreenButton', () => ({
    ToggleFullscreenButton: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesSavingButton', () => ({
    UserRulesSavingButton: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/styles/theme', () => ({
    default: {
        modal: {},
        common: {},
    },
}));

const mountEditor = () => {
    // Real MobX store with only the messenger mocked out, so the
    // dirty-dependent branches stay observable.
    const store = new UserRulesEditorStore();
    render(
        React.createElement(
            userRulesEditorStore.Provider,
            { value: store },
            React.createElement(UserRulesEditor, {
                fullscreen: false,
                setShowLoader: vi.fn(),
                addNotification: vi.fn(),
                updateSetting: vi.fn(),
                checkLimitations: vi.fn(),
                sendTelemetryCustomEvent: vi.fn(),
            }),
        ),
    );
    return store;
};

const fireUserFilterUpdated = () => {
    act(() => {
        h.listeners[NOTIFIER_USER_FILTER_UPDATED]?.({ type: NOTIFIER_USER_FILTER_UPDATED });
    });
};

const resolvePendingUserRules = (index: number, userRules: string) => {
    const resolver = h.pendingResolvers[index];
    expect(resolver).toBeDefined();
    resolver?.({ userRules });
};

describe('UserRulesEditor content sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        h.listeners = {};
        h.pendingResolvers.length = 0;
        h.editorState.value = '';
        h.setValueCalls.length = 0;

        h.getUserRulesEditorData.mockImplementation(
            () => new Promise<{ userRules: string }>((resolve) => {
                h.pendingResolvers.push(resolve);
            }),
        );
        h.createEventListener.mockImplementation(
            (events: string[], callback: (message: { type: string }) => void) => {
                events.forEach((event) => {
                    h.listeners[event] = callback;
                });
                return Promise.resolve(() => {});
            },
        );
        h.getEditorStorageContent.mockResolvedValue('');
        h.setEditorStorageContent.mockResolvedValue(undefined);
        h.getUserRules.mockResolvedValue({ content: '' });
        h.getOptionsData.mockResolvedValue({ settings: null });
        h.saveUserRules.mockResolvedValue(undefined);
        h.storageResolver = null;
        h.onChange = null;
        h.lastEditorRef = null;
    });

    afterEach(() => {
        cleanup();
    });

    it('keeps the latest rules when overlapping UserFilterUpdated reads resolve out of order', async () => {
        mountEditor();

        // Let the initial load finish its content apply and queue its export read.
        await waitFor(() => {
            expect(h.pendingResolvers).toHaveLength(1);
        });

        // Resolve the initial export read and reset the resolver queue.
        await act(async () => {
            resolvePendingUserRules(0, '');
        });
        h.pendingResolvers.length = 0;

        // Two quick updates: the first read will resolve last (stale), the second first (fresh).
        fireUserFilterUpdated();
        fireUserFilterUpdated();
        await waitFor(() => {
            expect(h.pendingResolvers).toHaveLength(2);
        });

        // Resolve out of order: fresh (index 1) first, stale (index 0) last.
        await act(async () => {
            resolvePendingUserRules(1, '||fresh.com^');
        });
        await waitFor(() => {
            expect(h.editorState.value).toBe('||fresh.com^');
        });

        await act(async () => {
            resolvePendingUserRules(0, '||stale.com^');
        });
        await waitFor(() => {
            expect(h.setValueCalls[h.setValueCalls.length - 1]).toBe('||fresh.com^');
        });

        // The stale read must have been discarded, leaving the fresh snapshot in place.
        expect(h.editorState.value).toBe('||fresh.com^');
    });

    it('keeps the storage handoff when an external update resolves during the initial load', async () => {
        // Defer the storage read so the event lands while the initial load is in flight.
        h.getEditorStorageContent.mockImplementation(
            () => new Promise<string>((resolve) => {
                h.storageResolver = resolve;
            }),
        );

        const store = mountEditor();

        // The external update starts while the initial load is still waiting for storage.
        fireUserFilterUpdated();
        await waitFor(() => {
            expect(h.pendingResolvers).toHaveLength(1);
        });

        // The initial load applies the handoff and marks it dirty synchronously.
        await act(async () => {
            h.storageResolver?.('||handoff.com^');
        });
        await waitFor(() => {
            expect(h.editorState.value).toBe('||handoff.com^');
        });
        expect(store.userRulesEditorContentChanged).toBe(true);

        // The event read passes the generation check, but the dirty handoff must survive.
        await act(async () => {
            resolvePendingUserRules(0, '||backend.com^');
        });

        expect(h.editorState.value).toBe('||handoff.com^');
        expect(store.userRulesEditorContentChanged).toBe(true);
    });

    it('does not overwrite unsaved edits when an external update arrives', async () => {
        h.getUserRules.mockResolvedValue({ content: '||initial.com^' });

        const store = mountEditor();

        await waitFor(() => {
            expect(h.editorState.value).toBe('||initial.com^');
        });

        // Flush the initial export-state read and reset the resolver queue.
        await act(async () => {
            resolvePendingUserRules(0, '||initial.com^');
        });
        h.pendingResolvers.length = 0;

        // Simulate typing: the editor value diverges from the backend content.
        h.editorState.value = '||typed.com^';
        await act(async () => {
            await h.onChange?.();
        });
        expect(store.userRulesEditorContentChanged).toBe(true);

        fireUserFilterUpdated();
        await waitFor(() => {
            expect(h.pendingResolvers).toHaveLength(1);
        });
        await act(async () => {
            resolvePendingUserRules(0, '||backend-new.com^');
        });

        expect(h.editorState.value).toBe('||typed.com^');
        expect(store.userRulesEditorContentChanged).toBe(true);
    });

    it('leaves the dirty flag untouched when the change handler resolves after unmount', async () => {
        h.getUserRules.mockResolvedValue({ content: '||initial.com^' });

        const store = mountEditor();

        await waitFor(() => {
            expect(h.editorState.value).toBe('||initial.com^');
        });
        await act(async () => {
            resolvePendingUserRules(0, '||initial.com^');
        });

        // Dirty the editor via the change handler.
        h.editorState.value = '||typed.com^';
        await act(async () => {
            await h.onChange?.();
        });
        expect(store.userRulesEditorContentChanged).toBe(true);

        // The editor ref is gone (post-unmount): a late resolution must not
        // write into the shared store.
        if (h.lastEditorRef) {
            h.lastEditorRef.current = null;
        }
        await act(async () => {
            await h.onChange?.();
        });
        expect(store.userRulesEditorContentChanged).toBe(true);
    });
});
