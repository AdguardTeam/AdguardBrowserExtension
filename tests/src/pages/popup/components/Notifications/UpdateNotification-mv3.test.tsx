/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension
 * (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension.
 * If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import {
    render,
    screen,
    cleanup,
} from '@testing-library/react';
import { observable, runInAction } from 'mobx';

import { ExtensionUpdateFSMState } from '../../../../../../Extension/src/common/constants';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';
// eslint-disable-next-line import/order
import { popupStore } from '../../../../../../Extension/src/pages/popup/stores/PopupStore';

// Mock the Notification component to render a simple div for testing
vi.mock(
    '../../../../../../Extension/src/pages/popup/components/Notifications/Notification',
    () => ({
        Notification: ({ text, type }: { text: string; type: NotificationType }) => (
            React.createElement(
                'div',
                { 'data-testid': 'notification', 'data-type': type },
                text,
            )
        ),
    }),
);

vi.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

// Import after mocks
// eslint-disable-next-line import/first
import {
    UpdateNotification,
} from '../../../../../../Extension/src/pages/popup/components/Notifications/UpdateNotification-mv3';

describe('UpdateNotification component', () => {
    let mockStore: {
        extensionUpdateState: ExtensionUpdateFSMState;
        updateNotification: null | {
            type: NotificationType;
            text: string;
        };
        isExtensionUpdateAvailable: boolean;
        isExtensionCheckingUpdateOrUpdating: boolean;
    };

    beforeEach(() => {
        mockStore = observable({
            extensionUpdateState: ExtensionUpdateFSMState.Idle,
            updateNotification: null as null | {
                type: NotificationType;
                text: string;
            },
            isExtensionUpdateAvailable: false,
            isExtensionCheckingUpdateOrUpdating: false,
        });
    });

    it('renders nothing when updateNotification is null', () => {
        runInAction(() => {
            mockStore.updateNotification = null;
        });

        const { container } = render(
            <popupStore.Provider value={mockStore as never}>
                <UpdateNotification />
            </popupStore.Provider>,
        );

        expect(container.innerHTML).toBe('');
    });

    it('renders notification when updateNotification is set', () => {
        runInAction(() => {
            mockStore.updateNotification = {
                type: NotificationType.Success,
                text: 'update_not_needed',
            };
        });

        render(
            <popupStore.Provider value={mockStore as never}>
                <UpdateNotification />
            </popupStore.Provider>,
        );

        const notifications = screen.getAllByTestId('notification');
        expect(notifications.length).toBeGreaterThan(0);
        const notification = notifications[notifications.length - 1];
        expect(notification?.textContent).toBe('update_not_needed');
    });

    it('renders error notification with correct type', () => {
        runInAction(() => {
            mockStore.updateNotification = {
                type: NotificationType.Error,
                text: 'update_failed_text',
            };
        });

        render(
            <popupStore.Provider value={mockStore as never}>
                <UpdateNotification />
            </popupStore.Provider>,
        );

        const notifications = screen.getAllByTestId('notification');
        const notification = notifications[notifications.length - 1];
        expect(notification?.textContent).toBe('update_failed_text');
        expect(notification?.getAttribute('data-type'))
            .toBe(NotificationType.Error);
    });

    it('renders correct notification for each state', () => {
        runInAction(() => {
            mockStore.updateNotification = {
                type: NotificationType.Loading,
                text: 'update_checking_in_progress',
            };
        });

        render(
            <popupStore.Provider value={mockStore as never}>
                <UpdateNotification />
            </popupStore.Provider>,
        );

        let notifications = screen.getAllByTestId('notification');
        expect(notifications[notifications.length - 1]?.textContent)
            .toBe('update_checking_in_progress');

        cleanup();

        runInAction(() => {
            mockStore.updateNotification = {
                type: NotificationType.Success,
                text: 'update_not_needed',
            };
        });

        render(
            <popupStore.Provider value={mockStore as never}>
                <UpdateNotification />
            </popupStore.Provider>,
        );

        notifications = screen.getAllByTestId('notification');
        expect(notifications[notifications.length - 1]?.textContent)
            .toBe('update_not_needed');
    });
});
