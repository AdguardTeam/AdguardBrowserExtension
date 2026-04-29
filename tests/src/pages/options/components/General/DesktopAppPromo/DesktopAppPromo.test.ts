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
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

vi.mock('../../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: { isMacOs: true, isWindows: false },
}));

vi.mock('../../../../../../../Extension/src/common/forward', () => ({
    Forward: {
        get: ({ action }: { action: string }) => `https://example.com/${action}`,
    },
    ForwardAction: {
        DesktopAppPromoMac: 'desktop_app_promo_mac',
        DesktopAppPromoWindows: 'desktop_app_promo_windows',
        DesktopAppPromoLinux: 'desktop_app_promo_linux',
    },
    ForwardFrom: {
        Options: 'options_screen',
    },
}));

// Mock CSS modules and SVG imports.
vi.mock(
    '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/desktop-app-promo.module.pcss',
    () => ({
        default: {
            container: 'container',
            title: 'title',
            description: 'description',
            button: 'button',
            image: 'image',
            close: 'close',
        },
    }),
);

vi.mock(
    '../../../../../../../../Extension/assets/images/desktop-app-promo.svg',
    () => ({ default: 'desktop-app-promo.svg' }),
);

vi.mock('../../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => React.createElement('svg', { 'data-testid': 'icon-cross' }),
}));

const createMockRootStore = (overrides: Record<string, unknown> = {}) => {
    const store = {
        settingsStore: {
            showAdguardPromoInfo: true,
            hideAdguardPromoInfo: vi.fn(),
            ...overrides,
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
    };

    return { context: createContext(store), store };
};

describe('DesktopAppPromo', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('should render promo when showAdguardPromoInfo is true', async () => {
        const { context } = createMockRootStore({ showAdguardPromoInfo: true });

        vi.doMock('../../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { DesktopAppPromo } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        render(React.createElement(DesktopAppPromo));

        expect(screen.getByText('options_desktop_app_promo_title')).toBeTruthy();
        expect(screen.getByText('options_desktop_app_promo_button_mac')).toBeTruthy();
    });

    it('should return null when showAdguardPromoInfo is false', async () => {
        const { context } = createMockRootStore({ showAdguardPromoInfo: false });

        vi.doMock('../../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { DesktopAppPromo } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        const { container } = render(React.createElement(DesktopAppPromo));

        expect(container.innerHTML).toBe('');
    });

    it('should call hideAdguardPromoInfo when close button is clicked', async () => {
        const { context, store } = createMockRootStore({ showAdguardPromoInfo: true });

        vi.doMock('../../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { DesktopAppPromo } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        render(React.createElement(DesktopAppPromo));

        const closeButton = screen.getByLabelText('close_button_title');
        fireEvent.click(closeButton);

        expect(store.settingsStore.hideAdguardPromoInfo).toHaveBeenCalledOnce();
    });

    it('should render close button as accessible button element', async () => {
        const { context } = createMockRootStore({ showAdguardPromoInfo: true });

        vi.doMock('../../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
            rootStore: context,
        }));

        const { DesktopAppPromo } = await import(
            '../../../../../../../Extension/src/pages/options/components/General/DesktopAppPromo/DesktopAppPromo'
        );

        render(React.createElement(DesktopAppPromo));

        const closeButton = screen.getByLabelText('close_button_title');
        expect(closeButton.tagName).toBe('BUTTON');
        expect(closeButton.getAttribute('type')).toBe('button');
    });
});
