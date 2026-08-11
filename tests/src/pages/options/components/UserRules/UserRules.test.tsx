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
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';
import { action, observable } from 'mobx';

import { UserRules } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRules';
import { rootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';
import { messenger } from '../../../../../../Extension/src/pages/services/messenger';
import {
    userRulesEditorStore,
} from '../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore';
import {
    VIEW_MODE_STORAGE_KEY,
    ViewMode,
    readViewMode,
    writeViewMode,
    type ViewModeValue,
} from '../../../../../../Extension/src/pages/common/components/UserRulesEditor/view-mode';

// Heavy editor child -> a plain stub. No ref/imperative handle is needed because
// auto-save reads the mirrored editor value from the store.
vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor', () => ({
    UserRulesEditor: () => React.createElement('div', { 'data-testid': 'user-rules-editor' }),
}));

// Stub the leave modal so tests can drive the confirm/cancel actions without
// rendering react-modal.
vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    EditorLeaveModal: ({
        isOpen,
        onConfirm,
        onCancel,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => (isOpen
        ? React.createElement(
            'div',
            { 'data-testid': 'editor-leave-modal' },
            React.createElement('button', { type: 'button', 'data-testid': 'leave-confirm', onClick: onConfirm }),
            React.createElement('button', { type: 'button', 'data-testid': 'leave-cancel', onClick: onCancel }),
        )
        : null),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/UserRules/UserRulesList', () => ({
    /* eslint-disable react/require-default-props */
    UserRulesList: ({
        disabled,
        onCreateRule,
    }: { disabled?: boolean; onCreateRule?: () => void }) => React.createElement(
        'div',
        {
            'data-testid': 'user-rules-list',
            'data-disabled': disabled ? 'true' : 'false',
        },
        onCreateRule
            ? React.createElement('button', {
                type: 'button',
                'data-testid': 'create-rule',
                onClick: onCreateRule,
            }, 'create-rule')
            : null,
    ),
    /* eslint-enable react/require-default-props */
}));

vi.mock('../../../../../../Extension/src/pages/options/components/UserRules/UserRulesMenu', () => ({
    UserRulesMenu: () => React.createElement('div', { 'data-testid': 'user-rules-menu' }),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingsSection', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SettingsSection: ({ actions, children }: any) => (
        React.createElement('div', null, actions, children)
    ),
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => React.createElement('svg', { 'data-testid': 'icon' }),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/UserRules/UserRulesSwitcher', () => ({
    UserRulesSwitcher: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/UserRules/UserScriptsApiWarningForUserRules', () => ({
    UserScriptsApiWarningForUserRules: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Warnings', () => ({
    DynamicRulesLimitsWarning: () => null,
    ClipboardPermissionWarning: () => null,
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translator: { getMessage: (key: any) => key },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        openFullscreenUserRules: vi.fn(),
        closeFullscreenUserRules: vi.fn(),
        setEditorStorageContent: vi.fn().mockResolvedValue(undefined),
        getUserRules: vi.fn().mockResolvedValue({ content: '' }),
    },
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: { isFirefoxMobile: false },
}));

vi.mock('../../../../../../Extension/src/pages/common/telemetry', () => ({
    useTelemetryPageViewEvent: () => {},
    TelemetryScreenName: { UserRulesScreen: 'user_rules_screen' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TelemetryStore: vi.fn(function (this: any) {
        this.sendCustomEvent = vi.fn();
    }),
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => ({
    SavingFSMState: {
        Idle: 'idle', Saving: 'saving', Saved: 'saved', Error: 'error',
    },
    createSavingService: () => ({
        getSnapshot: () => ({ value: 'idle' }),
        subscribe: () => () => {},
        send: vi.fn(),
    }),
    CURSOR_POSITION_AFTER_INSERT: 1,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore', () => {
    // eslint-disable-next-line global-require
    const React = require('react');
    const ctx = React.createContext({});
    return { userRulesEditorStore: ctx };
});

const createRootStoreValue = (overrides = {}) => {
    // Mirrors the real SettingsStore: view mode is an observable sourced from
    // localStorage, and setUserRulesViewMode persists + updates it. The box is
    // created per mount so it reads the current localStorage value.
    const userRulesViewModeBox = observable.box(readViewMode());
    // isFullscreenUserRulesEditorOpen is observable so tests can simulate
    // the fullscreen window opening/closing.
    const fullscreenOpenBox = observable.box(false);
    return {
        settingsStore: {
            userFilterEnabledSettingId: 'user-filter-enabled',
            userFilterEnabled: true,
            get isFullscreenUserRulesEditorOpen(): boolean {
                return fullscreenOpenBox.get();
            },
            setFullscreenUserRulesEditorState: action((value: boolean) => {
                fullscreenOpenBox.set(value);
            }),
            get userRulesViewMode(): ViewModeValue {
                return userRulesViewModeBox.get();
            },
            setUserRulesViewMode: action((mode: ViewModeValue) => {
                writeViewMode(mode);
                userRulesViewModeBox.set(mode);
            }),
            checkLimitations: vi.fn().mockResolvedValue(undefined),
            updateSetting: vi.fn(),
        },
        uiStore: {
            setShowLoader: vi.fn(),
            addNotification: vi.fn(),
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
        ...overrides,
    };
};

const createSavingService = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let listener: any = null;
    return {
        subscribe: vi.fn((cb: (state: { value: string }) => void) => {
            listener = cb;
            return () => {
                listener = null;
            };
        }),
        emit: (value: string) => {
            if (listener) {
                listener({ value });
            }
        },
    };
};

const createEditorStore = ({
    savingState = 'idle',
    dirty = false,
    editorValue = '||example.com^',
    saveEmits = ['saving', 'saved'],
} = {}) => {
    const savingService = createSavingService();
    return {
        savingUserRulesState: savingState,
        userRulesEditorContentChanged: dirty,
        editorValue,
        savingService,
        setUserRulesEditorContentChangedState: vi.fn(),
        setCursorPosition: vi.fn(),
        // Real XState saves are async (messenger.saveUserRules in the
        // background), so emit on a microtask to allow React renders between
        // transitions — matching production behaviour.
        saveUserRules: vi.fn(() => {
            saveEmits.forEach((value) => queueMicrotask(() => savingService.emit(value)));
        }),
    };
};

const mountUserRules = (
    rootValue = createRootStoreValue(),
    editorValue = createEditorStore(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => render(
    React.createElement(
        rootStore.Provider as any,
        { value: rootValue },
        React.createElement(
            userRulesEditorStore.Provider as any,
            { value: editorValue },
            React.createElement(UserRules),
        ),
    ),
);

const viewButton = () => screen.getByRole('button', { name: 'options_user_rules_switch_to_editor' });
const editButton = () => screen.getByRole('button', { name: 'options_user_rules_switch_to_list' });
const createRuleButton = () => screen.getByTestId('create-rule');

describe('UserRules view/edit toggle', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('opens in view mode by default and renders the list', () => {
        mountUserRules();
        expect(screen.getByTestId('user-rules-list')).toBeTruthy();
        expect(screen.queryByTestId('user-rules-editor')).toBeNull();
    });

    it('switches to edit mode (editor) on toggle click', () => {
        mountUserRules();
        fireEvent.click(viewButton());
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
        expect(screen.queryByTestId('user-rules-list')).toBeNull();
    });

    it('shows the leave modal instead of saving when switching to view with dirty content', () => {
        const editorStore = createEditorStore({ dirty: true, editorValue: '||custom-rule.com^' });
        mountUserRules(createRootStoreValue(), editorStore);
        fireEvent.click(viewButton()); // view -> edit
        fireEvent.click(editButton()); // edit -> view (dirty)

        // The leave confirmation modal is shown; the editor is still visible
        // and no save is triggered.
        expect(screen.getByTestId('editor-leave-modal')).toBeTruthy();
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
        expect(screen.queryByTestId('user-rules-list')).toBeNull();
        expect(editorStore.saveUserRules).not.toHaveBeenCalled();
    });

    it('confirms the leave modal: discards changes and switches to the list without saving', () => {
        const editorStore = createEditorStore({ dirty: true, editorValue: '||custom-rule.com^' });
        mountUserRules(createRootStoreValue(), editorStore);
        fireEvent.click(viewButton()); // view -> edit
        fireEvent.click(editButton()); // edit -> view (dirty) -> modal
        fireEvent.click(screen.getByTestId('leave-confirm'));

        expect(screen.getByTestId('user-rules-list')).toBeTruthy();
        expect(screen.queryByTestId('user-rules-editor')).toBeNull();
        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();
        expect(editorStore.saveUserRules).not.toHaveBeenCalled();
        expect(editorStore.setUserRulesEditorContentChangedState).toHaveBeenCalledWith(false);
    });

    it('cancels the leave modal: stays in edit mode', () => {
        const editorStore = createEditorStore({ dirty: true });
        mountUserRules(createRootStoreValue(), editorStore);
        fireEvent.click(viewButton()); // view -> edit
        fireEvent.click(editButton()); // edit -> view (dirty) -> modal
        fireEvent.click(screen.getByTestId('leave-cancel'));

        expect(screen.queryByTestId('editor-leave-modal')).toBeNull();
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
        expect(screen.queryByTestId('user-rules-list')).toBeNull();
        expect(editorStore.saveUserRules).not.toHaveBeenCalled();
    });

    it('switches to view without saving when the content is clean', async () => {
        const editorStore = createEditorStore({ dirty: false });
        mountUserRules(createRootStoreValue(), editorStore);
        fireEvent.click(viewButton()); // view -> edit
        fireEvent.click(editButton()); // edit -> view (no dirty content)

        expect(await screen.findByTestId('user-rules-list')).toBeTruthy();
        expect(editorStore.saveUserRules).not.toHaveBeenCalled();
    });

    it('disables the toggle while a save is in progress', () => {
        mountUserRules(createRootStoreValue(), createEditorStore({ savingState: 'saving' }));
        expect((viewButton() as HTMLButtonElement).disabled).toBe(true);
    });

    it('enables the toggle when not saving', () => {
        mountUserRules(createRootStoreValue(), createEditorStore({ savingState: 'idle' }));
        expect((viewButton() as HTMLButtonElement).disabled).toBe(false);
    });

    it('opens in edit mode when edit is persisted', () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.Editor);
        mountUserRules();
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
    });

    it('writes the new mode to localStorage when toggling to view', async () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.Editor);
        mountUserRules();
        fireEvent.click(editButton()); // edit -> view

        await screen.findByTestId('user-rules-list');
        expect(localStorage.getItem(VIEW_MODE_STORAGE_KEY)).toBe(ViewMode.List);
    });

    it('opens in view mode when the stored value is invalid', () => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, 'garbage');
        mountUserRules();
        expect(screen.getByTestId('user-rules-list')).toBeTruthy();
    });

    it('clears editor storage when switching from list to editor', () => {
        mountUserRules();
        expect(messenger.setEditorStorageContent).not.toHaveBeenCalled();

        fireEvent.click(viewButton()); // list -> editor

        expect(messenger.setEditorStorageContent).toHaveBeenCalledWith('');
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
    });

    it('does NOT clear editor storage in handleLeaveConfirm with fullscreen open', () => {
        const rootValue = createRootStoreValue();
        rootValue.settingsStore.setFullscreenUserRulesEditorState(true);
        rootValue.settingsStore.setUserRulesViewMode(ViewMode.Editor);
        const editorStore = createEditorStore({ dirty: true });

        mountUserRules(rootValue, editorStore);
        fireEvent.click(editButton()); // edit -> view (fullscreen) -> modal
        fireEvent.click(screen.getByTestId('leave-confirm'));

        // Storage must NOT be cleared here — the fullscreen editor's
        // beforeunload listener would re-save dirty content over the clear.
        // Instead, storage is cleared when the user next opens the editor.
        const clearCalls = (messenger.setEditorStorageContent as ReturnType<typeof vi.fn>)
            .mock.calls.filter(([value]) => value === null || value === '');
        expect(clearCalls).toHaveLength(0);
        // But closeFullscreenUserRules IS called right away.
        expect(messenger.closeFullscreenUserRules).toHaveBeenCalledTimes(1);
    });
});

describe('UserRules create rule', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.List);
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    /**
     * Returns the stored content and cursor that handleCreateRule produced:
     * the last non-empty `setEditorStorageContent` call is the seeded rules,
     * and the `setCursorPosition` call is where the editor will open.
     *
     * Must be called after awaiting the editor to appear, which guarantees
     * the async handler has run to completion (`setViewMode` is its last step).
     */
    const captureSeededAndCursor = (editorStore: ReturnType<typeof createEditorStore>) => {
        const setContents = (messenger.setEditorStorageContent as ReturnType<typeof vi.fn>)
            .mock.calls.map(([value]) => value);
        const seeded = setContents.filter((value) => value !== '').at(-1);
        const setCursor = editorStore.setCursorPosition as ReturnType<typeof vi.fn>;
        return {
            seeded,
            cursor: setCursor.mock.calls.at(-1)?.[0],
        };
    };

    it('seeds a trailing empty line and opens the editor on it (no existing terminator)', async () => {
        (messenger.getUserRules as ReturnType<typeof vi.fn>)
            .mockResolvedValue({ content: '||example.org^' });
        const editorStore = createEditorStore();
        mountUserRules(createRootStoreValue(), editorStore);

        fireEvent.click(createRuleButton());
        await screen.findByTestId('user-rules-editor');

        const { seeded, cursor } = captureSeededAndCursor(editorStore);
        expect(seeded).toBe('||example.org^\n');
        expect(cursor).toEqual({ line: 2, ch: 0 });
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
    });

    it('does not duplicate the trailing newline when content already ends with one', async () => {
        (messenger.getUserRules as ReturnType<typeof vi.fn>)
            .mockResolvedValue({ content: '||a.com^\n||b.com^\n' });
        const editorStore = createEditorStore();
        mountUserRules(createRootStoreValue(), editorStore);

        fireEvent.click(createRuleButton());
        await screen.findByTestId('user-rules-editor');

        const { seeded, cursor } = captureSeededAndCursor(editorStore);
        expect(seeded).toBe('||a.com^\n||b.com^\n');
        expect(cursor).toEqual({ line: 3, ch: 0 });
    });

    it('collapses multiple trailing newlines into a single empty line before placing the cursor', async () => {
        (messenger.getUserRules as ReturnType<typeof vi.fn>)
            .mockResolvedValue({ content: '||a.com^\n||b.com^\n\n\n' });
        const editorStore = createEditorStore();
        mountUserRules(createRootStoreValue(), editorStore);

        fireEvent.click(createRuleButton());
        await screen.findByTestId('user-rules-editor');

        const { seeded, cursor } = captureSeededAndCursor(editorStore);
        expect(seeded).toBe('||a.com^\n||b.com^\n');
        expect(cursor).toEqual({ line: 3, ch: 0 });
    });

    it('handles empty rules by opening on the single blank line (line 1)', async () => {
        (messenger.getUserRules as ReturnType<typeof vi.fn>)
            .mockResolvedValue({ content: '' });
        const editorStore = createEditorStore();
        mountUserRules(createRootStoreValue(), editorStore);

        fireEvent.click(createRuleButton());
        await screen.findByTestId('user-rules-editor');

        const setContents = (messenger.setEditorStorageContent as ReturnType<typeof vi.fn>)
            .mock.calls.map(([value]) => value);
        // Storage is cleared ('') then seeded: for empty content it stays empty,
        // which the editor renders as a single blank line.
        expect(setContents.filter((value) => value === '')).toHaveLength(2);
        const setCursor = editorStore.setCursorPosition as ReturnType<typeof vi.fn>;
        expect(setCursor.mock.calls.at(-1)?.[0]).toEqual({ line: 1, ch: 0 });
        expect(screen.getByTestId('user-rules-editor')).toBeTruthy();
    });
});

describe('UserRules telemetry', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, ViewMode.List);
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    const getTelemetryStore = (
        rootValue: ReturnType<typeof createRootStoreValue>,
    ) => rootValue.telemetryStore as {
        sendCustomEvent: ReturnType<typeof vi.fn>;
    };

    it('fires switch_to_editor_click when switching from list to editor', () => {
        const rootValue = createRootStoreValue();
        mountUserRules(rootValue);
        fireEvent.click(viewButton());

        const telemetryStore = getTelemetryStore(rootValue);
        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'switch_to_editor_click',
            'user_rules_screen',
        );
    });

    it('fires switch_to_list_click when switching from editor to list', async () => {
        const rootValue = createRootStoreValue();
        const editorStore = createEditorStore({ dirty: false });
        mountUserRules(rootValue, editorStore);
        fireEvent.click(viewButton()); // list -> editor
        fireEvent.click(editButton()); // editor -> list

        await screen.findByTestId('user-rules-list');

        const telemetryStore = getTelemetryStore(rootValue);
        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'switch_to_list_click',
            'user_rules_screen',
        );
    });

    it('fires create_rule_click when the Create rule button is clicked', async () => {
        (messenger.getUserRules as ReturnType<typeof vi.fn>)
            .mockResolvedValue({ content: '||example.org^' });
        const rootValue = createRootStoreValue();
        mountUserRules(rootValue);

        fireEvent.click(createRuleButton());
        await screen.findByTestId('user-rules-editor');

        const telemetryStore = getTelemetryStore(rootValue);
        expect(telemetryStore.sendCustomEvent).toHaveBeenCalledWith(
            'create_rule_click',
            'user_rules_screen',
        );
    });
});
