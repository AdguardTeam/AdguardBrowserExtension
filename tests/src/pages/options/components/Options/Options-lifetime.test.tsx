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
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { observable, runInAction } from 'mobx';

import { Options } from '../../../../../../Extension/src/pages/options/components/Options/Options';
import { rootStore, type RootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';
import UiStore from '../../../../../../Extension/src/pages/options/stores/UiStore';

const mocks = vi.hoisted(() => ({
    getAutoDisableNotifications: vi.fn(async () => []),
}));

vi.mock('../../../../../../Extension/src/pages/options/stores/RootStore', async () => {
    const { createContext } = await import('react');
    return { rootStore: createContext({}) };
});

vi.mock('options', async () => {
    const { Route } = await import('react-router-dom');
    const { OptionsLayout } = await import(
        '../../../../../../Extension/src/pages/options/components/Options/Options-layout'
    );
    return {
        EVENTS: [],
        initialize: vi.fn(async () => true),
        createMessageHandler: vi.fn(() => () => undefined),
        disposeEventPauseController: vi.fn(),
        getOptionRoute: () => (
            <Route path="/" element={<OptionsLayout />}>
                <Route index element={<input aria-label="Unsaved text" defaultValue="" />} />
            </Route>
        ),
    };
});

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getAutoDisableNotifications: mocks.getAutoDisableNotifications,
        addTelemetryOpenedPage: vi.fn(async () => 'page'),
        removeTelemetryOpenedPage: vi.fn(),
        createEventListener: vi.fn(async () => () => undefined),
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/hooks/useAppearanceTheme', () => ({
    useAppearanceTheme: vi.fn(),
}));
vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icons', () => ({ Icons: () => null }));
vi.mock('../../../../../../Extension/src/pages/options/components/ui/Icons', () => ({ Icons: () => null }));
vi.mock('../../../../../../Extension/src/pages/common/components/Loader', () => ({ Loader: () => null }));
vi.mock(
    '../../../../../../Extension/src/pages/options/components/ImportConfigurationDialog/ImportConfigurationDialog',
    () => ({ ImportConfigurationDialog: () => null }),
);
vi.mock('../../../../../../Extension/src/pages/options/components/Sidebar', () => ({ Sidebar: () => null }));
vi.mock(
    '../../../../../../Extension/src/pages/options/components/SkipToContentButton',
    () => ({ SkipToContentButton: () => null }),
);

describe('Options page lifetime', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        window.location.hash = '';
    });

    it('retains the page across settings rerenders and uses only the selected manifest consumer', async () => {
        window.location.hash = '#/';
        const settingsStore = observable({ optionsReadyToRender: false, appearanceTheme: 'light' });
        const uiStore = new UiStore({} as RootStore);
        const stores = { settingsStore, uiStore, telemetryStore: { setPageId: vi.fn() } } as unknown as RootStore;
        render(<rootStore.Provider value={stores}><Options /></rootStore.Provider>);
        expect(mocks.getAutoDisableNotifications).not.toHaveBeenCalled();
        await act(async () => {
            runInAction(() => {
                settingsStore.optionsReadyToRender = true;
            });
        });
        fireEvent.change(screen.getByLabelText('Unsaved text'), { target: { value: 'keep this value' } });
        await act(async () => {
            runInAction(() => {
                settingsStore.appearanceTheme = 'dark';
            });
        });
        expect((screen.getByLabelText('Unsaved text') as HTMLInputElement).value).toBe('keep this value');
        expect(mocks.getAutoDisableNotifications).toHaveBeenCalledTimes(__IS_MV3__ ? 0 : 1);
    });
});
