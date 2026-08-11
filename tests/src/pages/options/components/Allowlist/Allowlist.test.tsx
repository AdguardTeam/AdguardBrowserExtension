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
    cleanup,
    render,
    screen,
    within,
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Allowlist } from '../../../../../../Extension/src/pages/options/components/Allowlist/Allowlist';
import { rootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';

vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingsSection', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SettingsSection: ({
        title,
        titleIcon,
        description,
        actions,
        inlineControl,
        className,
    }: any) => (
        <section data-testid="settings-section" data-class-name={className ?? ''}>
            <div>
                {titleIcon}
                {title}
            </div>
            <div>{description}</div>
            <div>{actions}</div>
            <div>{inlineControl}</div>
        </section>
    ),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistMenu', () => ({
    AllowlistMenu: () => <div data-testid="allowlist-menu" />,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistSwitcher', () => ({
    AllowlistSwitcher: () => <div data-testid="allowlist-switcher" />,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: ({ id }: { id: string }) => <svg data-testid={`icon-${id}`} />,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistSavingButton', () => ({
    AllowlistSavingButton: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    Editor: () => <div data-testid="allowlist-editor" />,
    EditorLeaveModal: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/SavingButton', () => ({
    SavingErrorMessage: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Warnings', () => ({
    DynamicRulesLimitsWarning: () => null,
    ClipboardPermissionWarning: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/hooks/usePreventUnload', () => ({
    usePreventUnload: () => {},
}));

vi.mock('../../../../../../Extension/src/pages/common/telemetry', () => ({
    useTelemetryPageViewEvent: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TelemetryStore: vi.fn(function (this: any) {
        this.sendCustomEvent = vi.fn();
    }),
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryEventName: {
        AllowlistImportClick: 'allowlist_import_click',
        AllowlistSaveClick: 'allowlist_save_click',
    },
    TelemetryScreenName: {
        WebsiteAllowListScreen: 'website_allow_list_screen',
    },
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: (key: string) => key },
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: { isFirefoxMobile: false },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => ({
    SavingFSMState: { Idle: 'idle', Saving: 'saving' },
    createSavingService: () => ({
        getSnapshot: () => ({ value: 'idle' }),
        subscribe: () => () => {},
        send: vi.fn(),
    }),
}));

const rootValue = {
    settingsStore: {
        getAllowlist: vi.fn().mockResolvedValue(undefined),
        setAllowlistEditorContentChangedState: vi.fn(),
        allowlist: 'example.org',
        allowlistEditorContentChanged: false,
        allowlistEditorWrap: false,
        allowlistSizeReset: false,
        savingAllowlistState: 'idle',
        settings: {
            names: {
                AllowlistEnabled: 'allowlist-enabled',
                DefaultAllowlistMode: 'default-allowlist-mode',
            },
            values: {
                'default-allowlist-mode': true,
            },
        },
    },
    uiStore: { setShowLoader: vi.fn(), addNotification: vi.fn() },
    telemetryStore: { sendCustomEvent: vi.fn() },
};

const renderAllowlist = () => render(
    React.createElement(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rootStore.Provider as any,
        { value: rootValue },
        React.createElement(Allowlist),
    ),
);

describe('Allowlist layout', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders separate title/action and switch rows', async () => {
        renderAllowlist();

        const sections = await screen.findAllByTestId('settings-section');
        expect(sections).toHaveLength(2);

        const [headerSection, switchSection] = sections;
        if (!headerSection || !switchSection) {
            throw new Error('Expected separate Allowlist header and switch sections');
        }

        expect(within(headerSection).getByTestId('allowlist-menu')).toBeTruthy();
        expect(within(headerSection).getByText('options_allowlist_desc')).toBeTruthy();
        expect(within(headerSection).queryByTestId('allowlist-switcher')).toBeNull();

        expect(switchSection.getAttribute('data-class-name')).toBe('settings__group--editor-switch');
        expect(within(switchSection).getByTestId('icon-#user-rules')).toBeTruthy();
        expect(within(switchSection).getByTestId('allowlist-switcher')).toBeTruthy();
        expect(within(switchSection).queryByTestId('allowlist-menu')).toBeNull();
    });
});
