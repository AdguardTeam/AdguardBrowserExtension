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
    cleanup,
    render,
    screen,
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
        getMessage: (key: string, placeholders?: { version: string }) => {
            return placeholders ? `${key} ${placeholders.version}` : key;
        },
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/telemetry', () => ({
    useTelemetryPageViewEvent: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryScreenName: { AboutScreen: 'about_screen' },
}));

vi.mock('../../../../../../Extension/src/pages/options/components/About/about-page.pcss', () => ({}));

const createMockRootStore = (settingsStoreOverrides: Record<string, unknown> = {}) => {
    const store = {
        settingsStore: {
            appVersion: '5.4.0',
            availableUpdateVersion: undefined,
            libVersions: {
                tswebextension: '4.1.2',
                tsurlfilter: '5.0.1',
                scriptlets: '2.4.2',
                extendedCss: '2.0.0',
            },
            ...settingsStoreOverrides,
        },
        telemetryStore: {},
    };

    return { context: createContext(store), store };
};

const renderAbout = async (settingsStoreOverrides: Record<string, unknown> = {}) => {
    const { context } = createMockRootStore(settingsStoreOverrides);

    vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
        rootStore: context,
    }));

    const { About } = await import('../../../../../../Extension/src/pages/options/components/About/About');

    return render(React.createElement(About));
};

describe('About', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders available update version message when update data exists', async () => {
        await renderAbout({ availableUpdateVersion: '5.4.1' });

        expect(screen.getByText('options_about_update_available 5.4.1')).toBeTruthy();
    });

    it('does not render available update version message when update data is absent', async () => {
        await renderAbout();

        expect(screen.queryByText(/options_about_update_available/)).toBeNull();
    });
});
