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

import React, { createContext } from 'react';

import {
    render,
    screen,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/services/messenger', () => ({
    messenger: {
        openExtensionStore: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryEventName: { RateUsClick: 'rate_us_click' },
    TelemetryScreenName: { MainPage: 'main_page' },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => React.createElement('svg', { 'data-testid': 'icon-cross' }),
}));

const sidebarCss = {
    container: 'sidebar-container',
    description: 'sidebar-description',
    rateButton: 'sidebar-rateButton',
    close: 'sidebar-close',
};

vi.mock(
    '../../../../../../Extension/src/pages/options/components/RateNotification/rate-notification.module.pcss',
    () => ({ default: sidebarCss }),
);

const createMockRootStore = (overrides: Record<string, unknown> = {}) => {
    const store = {
        settingsStore: {
            rateShowState: true,
            hideRateShow: vi.fn(),
            ...overrides,
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
    };

    return { context: createContext(store), store };
};

describe('RateNotification', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('should return null when rateShowState is false', async () => {
        const { context } = createMockRootStore({ rateShowState: false });

        vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { RateNotification } = await import(
            '../../../../../../Extension/src/pages/options/components/RateNotification/RateNotification'
        );

        const { container } = render(React.createElement(RateNotification));

        expect(container.innerHTML).toBe('');
    });

    it('should use sidebar styles', async () => {
        const { context } = createMockRootStore({
            rateShowState: true,
        });

        vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { RateNotification } = await import(
            '../../../../../../Extension/src/pages/options/components/RateNotification/RateNotification'
        );

        render(React.createElement(RateNotification));

        const alert = screen.getByRole('alert');
        expect(alert.className).toBe('sidebar-container');

        const rateButton = screen.getByText('options_rate_us_cta');
        expect(rateButton.className).toContain('button--m');
    });

    it('should call hideRateShow when close button is clicked', async () => {
        const { context, store } = createMockRootStore({ rateShowState: true });

        vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { RateNotification } = await import(
            '../../../../../../Extension/src/pages/options/components/RateNotification/RateNotification'
        );

        render(React.createElement(RateNotification));

        const closeButton = screen.getByLabelText('close_button_title');
        fireEvent.click(closeButton);

        expect(store.settingsStore.hideRateShow).toHaveBeenCalledOnce();
    });

    it('should render close button as accessible button element', async () => {
        const { context } = createMockRootStore({ rateShowState: true });

        vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { RateNotification } = await import(
            '../../../../../../Extension/src/pages/options/components/RateNotification/RateNotification'
        );

        render(React.createElement(RateNotification));

        const closeButton = screen.getByLabelText('close_button_title');
        expect(closeButton.tagName).toBe('BUTTON');
        expect(closeButton.getAttribute('type')).toBe('button');
    });
});
