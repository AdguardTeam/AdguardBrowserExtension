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

import { cleanup, render } from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    UserScriptsApiRequiredMessage,
} from '../../../../../../Extension/src/pages/options/components/Warnings/UserScriptsApiRequiredMessage';
import { rootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';

vi.mock('../../../../../../Extension/src/common/translators/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        openExtensionsSettingsPage: vi.fn(),
        openExtensionDetailsPage: vi.fn(),
    },
}));

/**
 * Renders the message with the given Chrome version in the settings store.
 *
 * @param currentChromeVersion Chrome version reported by the settings store.
 * @param props Props passed to the message.
 *
 * @returns Render result.
 */
const renderMessage = (
    currentChromeVersion: number | null,
    props: React.ComponentProps<typeof UserScriptsApiRequiredMessage> = {},
) => {
    const store = { settingsStore: { currentChromeVersion } };

    return render(
        React.createElement(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rootStore.Provider as any,
            { value: store },
            React.createElement(UserScriptsApiRequiredMessage, props),
        ),
    );
};

describe('UserScriptsApiRequiredMessage', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('shows the developer mode message for Chrome 137', () => {
        const { container } = renderMessage(137);

        expect(container.innerHTML).toContain('options_developer_mode_required');
    });

    it('shows the allow user scripts message for Chrome 138', () => {
        const { container } = renderMessage(138);

        expect(container.innerHTML).toContain('options_allow_user_scripts_required');
    });

    it('shows the given developer mode message for Chrome 137', () => {
        const { container } = renderMessage(137, {
            devModeMessageKey: 'custom_developer_mode_required',
            allowUserScriptsMessageKey: 'custom_allow_user_scripts_required',
        });

        expect(container.innerHTML).toContain('custom_developer_mode_required');
    });

    it('shows the given allow user scripts message for Chrome 138', () => {
        const { container } = renderMessage(138, {
            devModeMessageKey: 'custom_developer_mode_required',
            allowUserScriptsMessageKey: 'custom_allow_user_scripts_required',
        });

        expect(container.innerHTML).toContain('custom_allow_user_scripts_required');
    });

    it('renders nothing without a Chrome version', () => {
        const { container } = renderMessage(null);

        expect(container.innerHTML).toBe('');
    });
});
