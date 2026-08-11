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
    waitFor,
    act,
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
import { observable, runInAction } from 'mobx';

import { UserRulesMenu } from '../../../../../../Extension/src/pages/options/components/UserRules/UserRulesMenu';
import { rootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';
import { messenger } from '../../../../../../Extension/src/pages/services/messenger';
import { exportData } from '../../../../../../Extension/src/pages/common/utils/export';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';
import {
    userRulesEditorStore,
} from '../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore';

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translator: { getMessage: (key: any) => key },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getUserRules: vi.fn().mockResolvedValue({ content: '' }),
        saveUserRules: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/utils/export', () => ({
    exportData: vi.fn(),
    ExportTypes: { UserFilter: 'user_filter' },
}));

vi.mock('../../../../../../Extension/src/pages/helpers', () => ({
    handleFileUpload: vi.fn(),
}));

// Stub the editor store so the real UserRulesEditorStore.js (which uses TS
// decorators not parseable as plain JS by the test transform) is not loaded.
// The spy lets us assert the unsaved-changes flag is cleared on delete-all.
// `userRulesExportAvailable` is the shared flag the menu reads reactively;
// initial-state tests mutate it before mount (it serves as the context's
// default value), while the reactive-refresh test provides a real MobX
// observable via mountMenu({ store }) + Provider so observer() can re-render.
const editorStoreMock = vi.hoisted(() => ({
    setUserRulesEditorContentChangedState: vi.fn(),
    userRulesExportAvailable: false,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/UserRulesEditor/UserRulesEditorStore', () => ({
    userRulesEditorStore: React.createContext(editorStoreMock),
}));
// Render ConfirmModal inline so we can drive confirm without react-modal.
vi.mock('../../../../../../Extension/src/pages/common/components/ConfirmModal', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ConfirmModal: ({ isOpen, onConfirm, setIsOpen }: any) => (isOpen
        ? React.createElement(
            'div',
            { 'data-testid': 'confirm-modal' },
            React.createElement('button', {
                type: 'button',
                'data-testid': 'confirm-ok',
                onClick: () => {
                    setIsOpen(false); onConfirm();
                },
            }),
        )
        : null),
}));

const addNotification = vi.fn();
const sendCustomEvent = vi.fn();
const checkLimitations = vi.fn().mockResolvedValue(undefined);

const mountMenu = ({ store }: { store?: unknown } = {}) => {
    const value = {
        uiStore: { addNotification },
        telemetryStore: { sendCustomEvent },
        settingsStore: { checkLimitations },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let tree: React.ReactElement = React.createElement(UserRulesMenu);
    tree = React.createElement(rootStore.Provider, { value }, tree);
    if (store) {
        // Provide a real observable-backed store so observer() reactivity can
        // be exercised (the default stub is a plain object, not observable).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tree = React.createElement((userRulesEditorStore as any).Provider, { value: store }, tree);
    }
    return render(tree);
};

const openMenu = () => {
    // MenuDropDown trigger is the only button before the menu opens.
    fireEvent.click(screen.getByRole('button', { name: 'options_user_rules_menu' }));
};

describe('UserRulesMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        editorStoreMock.userRulesExportAvailable = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (messenger.getUserRules as any).mockResolvedValue({ content: '' });
        checkLimitations.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders four items in order after opening', async () => {
        mountMenu();
        openMenu();
        expect(screen.getByText('options_rule_syntax')).toBeTruthy();
        expect(screen.getByText('options_userfilter_import')).toBeTruthy();
        expect(screen.getByText('options_userfilter_export')).toBeTruthy();
        expect(screen.getByText('options_user_rules_delete_all')).toBeTruthy();
    });

    it('rule syntax item is an external link', async () => {
        mountMenu();
        openMenu();
        const link = screen.getByText('options_rule_syntax').closest('a');
        expect(link).not.toBeNull();
        expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('appends only genuinely-new rules and deduplicates existing ones', async () => {
        const { handleFileUpload } = await import(
            '../../../../../../Extension/src/pages/helpers'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handleFileUpload as any).mockResolvedValue('||new.com^\n||dup.com^');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (messenger.getUserRules as any).mockResolvedValue({ content: '||dup.com^' });

        mountMenu();
        openMenu();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['||new.com^\n||dup.com^'], 'rules.txt', { type: 'text/plain' });
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        fireEvent.change(input);

        await waitFor(() => {
            expect(messenger.saveUserRules).toHaveBeenCalledWith('||dup.com^\n||new.com^');
        });
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: NotificationType.Success,
                text: 'options_user_rules_import_success',
            }),
        );
    });

    it('skips silently on an empty or whitespace-only file', async () => {
        const { handleFileUpload } = await import(
            '../../../../../../Extension/src/pages/helpers'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handleFileUpload as any).mockResolvedValue('   ');

        mountMenu();
        openMenu();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['   '], 'rules.txt', { type: 'text/plain' });
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        fireEvent.change(input);

        // The import is skipped silently — no notification, no save, no fetch.
        // Wait for handleFileUpload promise to settle then verify nothing happened.
        await vi.waitFor(() => {
            expect(addNotification).not.toHaveBeenCalled();
        });
        expect(messenger.getUserRules).not.toHaveBeenCalled();
        expect(messenger.saveUserRules).not.toHaveBeenCalled();
    });

    it('records import telemetry on Import click', async () => {
        mountMenu();
        openMenu();
        fireEvent.click(screen.getByText('options_userfilter_import'));
        expect(sendCustomEvent).toHaveBeenCalledWith(
            'user_rules_import_click',
            expect.anything(),
        );
    });

    it('disables Export and Delete all when there are no rules', () => {
        // userRulesExportAvailable defaults to false in beforeEach.
        mountMenu();
        openMenu();
        expect(screen.getByText('options_userfilter_export').closest('button')?.disabled).toBe(true);
        expect(screen.getByText('options_user_rules_delete_all').closest('button')?.disabled).toBe(true);
    });

    it('exports the user filter when there are rules', () => {
        editorStoreMock.userRulesExportAvailable = true;
        mountMenu();
        openMenu();
        const exportBtn = screen.getByText('options_userfilter_export').closest('button')!;
        expect(exportBtn.disabled).toBe(false);
        fireEvent.click(exportBtn);
        expect(exportData).toHaveBeenCalledWith('user_filter');
    });

    it('opens the confirm modal on Delete all and clears rules on confirm', async () => {
        editorStoreMock.userRulesExportAvailable = true;
        mountMenu();
        openMenu();
        fireEvent.click(screen.getByText('options_user_rules_delete_all'));

        const confirm = await screen.findByTestId('confirm-ok');
        fireEvent.click(confirm);

        await waitFor(() => {
            expect(messenger.saveUserRules).toHaveBeenCalledWith('');
        });
        // The editor's unsaved-changes flag must be cleared so the editor does
        // not desync with the now-empty backend on the next UserFilterUpdated.
        expect(editorStoreMock.setUserRulesEditorContentChangedState).toHaveBeenCalledWith(false);
        expect(addNotification).toHaveBeenCalledWith(
            expect.objectContaining({ text: 'options_user_rules_delete_all_success' }),
        );
        // The MV3 rules-limit warning must be re-checked after "Delete all",
        // otherwise it would keep showing a stale "limit exceeded" state.
        expect(checkLimitations).toHaveBeenCalled();
    });

    it('does not clear rules if the modal is cancelled (never confirmed)', () => {
        editorStoreMock.userRulesExportAvailable = true;
        mountMenu();
        openMenu();
        fireEvent.click(screen.getByText('options_user_rules_delete_all'));
        // Do not click confirm.
        expect(messenger.saveUserRules).not.toHaveBeenCalled();
    });

    it('reactively enables Export and Delete all when rules become available', async () => {
        // Mirrors the runtime refresh path: after an import/delete the
        // UserRulesList refetch updates `userRulesExportAvailable` on the
        // shared store, and the menu (an observer) must re-render to enable
        // its buttons without fetching on its own.
        const store = observable({
            userRulesExportAvailable: false,
            setUserRulesEditorContentChangedState: vi.fn(),
        });
        mountMenu({ store });
        openMenu();
        expect(screen.getByText('options_userfilter_export').closest('button')?.disabled).toBe(true);
        expect(screen.getByText('options_user_rules_delete_all').closest('button')?.disabled).toBe(true);

        await act(async () => {
            runInAction(() => {
                store.userRulesExportAvailable = true;
            });
        });

        expect(screen.getByText('options_userfilter_export').closest('button')?.disabled).toBe(false);
        expect(screen.getByText('options_user_rules_delete_all').closest('button')?.disabled).toBe(false);
    });

    it('shows the import error when the file has the wrong extension', async () => {
        const { handleFileUpload } = await import(
            '../../../../../../Extension/src/pages/helpers'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handleFileUpload as any).mockRejectedValue(new Error('wrong extension'));

        mountMenu();
        openMenu();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['x'], 'rules.pdf', { type: 'application/pdf' });
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        fireEvent.change(input);

        await waitFor(() => {
            expect(addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationType.Error,
                    text: 'options_user_rules_import_error',
                }),
            );
        });
        expect(messenger.getUserRules).not.toHaveBeenCalled();
        expect(messenger.saveUserRules).not.toHaveBeenCalled();
    });

    it('shows the import error when the file upload throws', async () => {
        const { handleFileUpload } = await import(
            '../../../../../../Extension/src/pages/helpers'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handleFileUpload as any).mockRejectedValue(new Error('read failure'));

        mountMenu();
        openMenu();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['x'], 'rules.txt', { type: 'text/plain' });
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        fireEvent.change(input);

        await waitFor(() => {
            expect(addNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: NotificationType.Error,
                    text: 'options_user_rules_import_error',
                }),
            );
        });
        expect(messenger.getUserRules).not.toHaveBeenCalled();
        expect(messenger.saveUserRules).not.toHaveBeenCalled();
    });

    it('records user_rules_menu_click telemetry when the menu button is clicked', () => {
        mountMenu();
        openMenu();
        expect(sendCustomEvent).toHaveBeenCalledWith(
            'user_rules_menu_click',
            'user_rules_screen',
        );
    });
});
