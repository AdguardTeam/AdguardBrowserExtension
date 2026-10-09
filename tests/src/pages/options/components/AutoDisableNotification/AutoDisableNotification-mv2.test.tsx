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
    type createMemoryRouter as CreateMemoryRouter,
    type RouterProvider as RouterProviderComponent,
    type useLocation as UseLocationHook,
    type useNavigate as UseNavigateHook,
} from 'react-router-dom';

import {
    afterEach,
    beforeAll,
    beforeEach,
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
import browser from 'webextension-polyfill';
import { type AutoDisableNotification as AutoDisableNotificationComponent } from 'auto-disable-notification';

import {
    type rootStore as RootStoreContext,
    type RootStore,
} from '../../../../../../Extension/src/pages/options/stores/RootStore';
import { type default as UiStoreClass } from '../../../../../../Extension/src/pages/options/stores/UiStore';
import {
    type TelemetryStore as TelemetryStoreClass,
} from '../../../../../../Extension/src/pages/common/telemetry/TelemetryStore';
import {
    type Notifications as NotificationsComponent,
} from '../../../../../../Extension/src/pages/options/components/Notifications/Notifications';
import { type AutoDisabledFilter } from '../../../../../../Extension/src/common/auto-disable-notification';
import {
    type messenger as MessengerInstance,
} from '../../../../../../Extension/src/pages/services/messenger/messenger-mv2';
import {
    AUTO_DISABLE_NOTIFICATION_DEDUPE_KEY,
    TIME_TO_REMOVE_NOTIFICATION_MS,
} from '../../../../../../Extension/src/pages/common/constants';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';
import { TelemetryEventName } from '../../../../../../Extension/src/common/telemetry';

vi.mock('../../../../../../Extension/src/pages/options/stores/RootStore', async () => {
    const { createContext } = await import('react');
    return { rootStore: createContext({}) };
});

/**
 * Mocks the locale provider, because the repository's default test provider
 * returns keys. The setup file preloads the real provider, so the module
 * registry is reset before the feature modules are imported.
 */
vi.doMock('../../../../../../Extension/src/common/translators/i18n', async () => {
    const { default: messages } = await import('../../../../../../Extension/_locales/en/messages.json');
    const catalog: Record<string, { message: string }> = messages;
    return {
        i18n: {
            getMessage: (key: string) => catalog[key]?.message ?? '',
            getBaseMessage: (key: string) => catalog[key]?.message ?? '',
            getUILanguage: () => 'en',
            getBaseUILanguage: () => 'en',
        },
    };
});

let messenger: typeof MessengerInstance;
let rootStore: typeof RootStoreContext;
let UiStore: typeof UiStoreClass;
let TelemetryStore: typeof TelemetryStoreClass;
let AutoDisableNotification: typeof AutoDisableNotificationComponent;
let Notifications: typeof NotificationsComponent;
let createMemoryRouter: typeof CreateMemoryRouter;
let RouterProvider: typeof RouterProviderComponent;
let useLocation: typeof UseLocationHook;
let useNavigate: typeof UseNavigateHook;

beforeAll(async () => {
    vi.resetModules();
    ({ messenger } = await import(
        '../../../../../../Extension/src/pages/services/messenger/messenger-mv2'
    ));
    ({ rootStore } = await import('../../../../../../Extension/src/pages/options/stores/RootStore'));
    ({ default: UiStore } = await import('../../../../../../Extension/src/pages/options/stores/UiStore'));
    ({ TelemetryStore } = await import(
        '../../../../../../Extension/src/pages/common/telemetry/TelemetryStore'
    ));
    ({ AutoDisableNotification } = await import('auto-disable-notification'));
    ({ Notifications } = await import(
        '../../../../../../Extension/src/pages/options/components/Notifications/Notifications'
    ));
    ({
        createMemoryRouter, RouterProvider, useLocation, useNavigate,
    } = await import('react-router-dom'));
});

/**
 * Renders a probe of the current route.
 *
 * @returns Route probe component.
 */
function RouteProbe() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <div aria-label="Current section">
                {location.pathname}
                {location.search}
            </div>
            <button type="button" onClick={() => navigate('/about')}>About section</button>
        </>
    );
}

/**
 * Renders the notification bridge, the notification list and a route probe.
 *
 * @returns Page layout.
 */
function TestLayout() {
    return (
        <>
            <AutoDisableNotification />
            <Notifications />
            <RouteProbe />
        </>
    );
}

/**
 * Stores shared by the test page.
 */
type TestStores = {
    uiStore: InstanceType<typeof UiStore>;
    telemetryStore: InstanceType<typeof TelemetryStore>;
};

/**
 * Renders the test page.
 *
 * @param props Component props.
 * @param props.uiStore Options UI store.
 * @param props.telemetryStore Telemetry store.
 *
 * @returns Test page.
 */
function TestPage({ uiStore, telemetryStore }: TestStores) {
    const [router] = React.useState(() => createMemoryRouter([
        { path: '*', element: <TestLayout /> },
    ], { initialEntries: ['/general'] }));
    const value = React.useMemo(() => ({ uiStore, telemetryStore } as RootStore), [uiStore, telemetryStore]);
    return (
        <rootStore.Provider value={value}>
            <RouterProvider router={router} />
        </rootStore.Provider>
    );
}

/**
 * Creates the test page element.
 *
 * @param uiStore Options UI store.
 * @param telemetryStore Telemetry store.
 *
 * @returns Page element.
 */
function page(uiStore: InstanceType<typeof UiStore>, telemetryStore: InstanceType<typeof TelemetryStore>) {
    return <TestPage uiStore={uiStore} telemetryStore={telemetryStore} />;
}

describe.skipIf(__IS_MV3__)('AutoDisableNotification', () => {
    let uiStore: InstanceType<typeof UiStore>;
    let telemetryStore: InstanceType<typeof TelemetryStore>;
    let resolve: (filters: AutoDisabledFilter[]) => void;
    let reject: (error: Error) => void;
    const german: AutoDisabledFilter = { filterId: 1, name: 'German' };
    const turkish: AutoDisabledFilter = { filterId: 2, name: 'Turkish' };

    beforeEach(() => {
        vi.spyOn(browser.extension, 'getBackgroundPage').mockReturnValue(null as unknown as Window);
        uiStore = new UiStore({} as RootStore);
        telemetryStore = new TelemetryStore();
        telemetryStore.setIsAnonymizedUsageDataAllowed(true);
        vi.spyOn(messenger, 'sendTelemetryCustomEvent').mockResolvedValue();
        vi.spyOn(messenger, 'getAutoDisableNotifications').mockReturnValue(new Promise((done, fail) => {
            resolve = done;
            reject = fail;
        }));
        vi.spyOn(messenger, 'acknowledgeAutoDisableNotifications').mockResolvedValue();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('shows one filter through messages and acknowledges it', async () => {
        const connect = vi.spyOn(browser.runtime, 'connect');
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german]));

        expect(screen.getByRole('status').textContent).toContain('German was turned off as unused.');
        expect(messenger.acknowledgeAutoDisableNotifications).toHaveBeenCalledExactlyOnceWith([1]);
        expect(browser.extension.getBackgroundPage).not.toHaveBeenCalled();
        expect(connect).not.toHaveBeenCalled();
    });

    it('shows several filters in one aggregated notification', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german, turkish]));

        expect(screen.getByRole('status').textContent).toContain('2 language filters were turned off as unused.');
        expect(messenger.acknowledgeAutoDisableNotifications).toHaveBeenCalledExactlyOnceWith([1, 2]);
    });

    it('opens Language-specific filters on Review and closes the notification', async () => {
        vi.useFakeTimers();
        render(page(uiStore, telemetryStore));
        await act(async () => resolve([german]));

        fireEvent.click(screen.getByRole('link', { name: 'Review' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(screen.getByLabelText('Current section').textContent).toBe('/filters?group=7');
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('keeps one notification across route changes, rerenders and elapsed time', async () => {
        vi.useFakeTimers();
        const view = render(page(uiStore, telemetryStore));
        await act(async () => resolve([german]));

        fireEvent.click(screen.getByRole('button', { name: 'About section' }));
        await act(async () => view.rerender(page(uiStore, telemetryStore)));
        act(() => {
            vi.advanceTimersByTime(60000);
        });

        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(messenger.getAutoDisableNotifications).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('does not show or acknowledge a response received after the page closes', async () => {
        const view = render(page(uiStore, telemetryStore));

        view.unmount();
        await act(async () => resolve([german]));

        expect(uiStore.notifications).toHaveLength(0);
        expect(messenger.acknowledgeAutoDisableNotifications).not.toHaveBeenCalled();
    });

    it('does not acknowledge when the same notification is already shown', async () => {
        uiStore.addNotification({
            type: NotificationType.Warning,
            text: 'Shown earlier',
            dedupeKey: AUTO_DISABLE_NOTIFICATION_DEDUPE_KEY,
        });
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german]));

        expect(uiStore.notifications).toHaveLength(1);
        expect(messenger.acknowledgeAutoDisableNotifications).not.toHaveBeenCalled();
    });

    it('shows nothing when no filters are pending', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([]));

        expect(screen.queryByRole('status')).toBeNull();
        expect(messenger.acknowledgeAutoDisableNotifications).not.toHaveBeenCalled();
    });

    it('keeps settings usable when the request fails', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => reject(new Error('request failed')));

        expect(screen.queryByRole('status')).toBeNull();
        expect(messenger.acknowledgeAutoDisableNotifications).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'About section' }));
        expect(screen.getByLabelText('Current section').textContent).toBe('/about');
    });

    it('keeps the notification when the acknowledgement fails', async () => {
        vi.mocked(messenger.acknowledgeAutoDisableNotifications).mockRejectedValueOnce(new Error('write failed'));
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german]));

        expect(screen.getByRole('status').textContent).toContain('German was turned off as unused.');
    });

    it('reports a shown notification without a screen', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german]));

        expect(messenger.sendTelemetryCustomEvent).toHaveBeenCalledExactlyOnceWith(
            undefined,
            TelemetryEventName.UnusedFilterNotificationDisplayed,
        );
    });

    it('reports a shown notification about several filters', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german, turkish]));

        expect(messenger.sendTelemetryCustomEvent).toHaveBeenCalledExactlyOnceWith(
            undefined,
            TelemetryEventName.UnusedFilterNotificationDisplayed,
        );
    });

    it('does not report a notification that is already shown', async () => {
        uiStore.addNotification({
            type: NotificationType.Warning,
            text: 'Shown earlier',
            dedupeKey: AUTO_DISABLE_NOTIFICATION_DEDUPE_KEY,
        });
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([german]));

        expect(messenger.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });

    it('does not report anything when no filters are pending', async () => {
        render(page(uiStore, telemetryStore));

        await act(async () => resolve([]));

        expect(messenger.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });

    it('reports Review without reporting a close', async () => {
        vi.useFakeTimers();
        render(page(uiStore, telemetryStore));
        await act(async () => resolve([german]));
        vi.mocked(messenger.sendTelemetryCustomEvent).mockClear();

        fireEvent.click(screen.getByRole('link', { name: 'Review' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(messenger.sendTelemetryCustomEvent).toHaveBeenCalledExactlyOnceWith(
            undefined,
            TelemetryEventName.UnusedFilterReviewClick,
        );
    });

    it('reports a close with the close button', async () => {
        vi.useFakeTimers();
        render(page(uiStore, telemetryStore));
        await act(async () => resolve([german]));
        vi.mocked(messenger.sendTelemetryCustomEvent).mockClear();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        act(() => {
            vi.advanceTimersByTime(TIME_TO_REMOVE_NOTIFICATION_MS);
        });

        expect(messenger.sendTelemetryCustomEvent).toHaveBeenCalledExactlyOnceWith(
            undefined,
            TelemetryEventName.UnusedFilterCloseClick,
        );
    });

    it('does not report anything when anonymized usage data is not allowed', async () => {
        telemetryStore.setIsAnonymizedUsageDataAllowed(false);
        render(page(uiStore, telemetryStore));
        await act(async () => resolve([german]));

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(messenger.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });
});
