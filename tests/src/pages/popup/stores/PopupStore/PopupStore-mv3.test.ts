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

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { runInAction } from 'mobx';

import { PopupStore } from '../../../../../../Extension/src/pages/popup/stores/PopupStore/PopupStore-mv3';
import {
    ExtensionUpdateFSMState,
    MIN_UPDATE_DISPLAY_DURATION_MS,
} from '../../../../../../Extension/src/common/constants';
import { NotificationType } from '../../../../../../Extension/src/pages/common/types';

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        isVerbose: false,
    },
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        isChromium: false,
        version: '121',
    },
}));

vi.mock('../../../../../../Extension/src/common/sleep-utils', () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../../../Extension/src/pages/popup/services/messenger', () => ({
    messenger: {
        getPopupData: vi.fn(() => Promise.resolve()),
        getExtensionStatusForPopup: vi.fn(() => Promise.resolve({
            areFilterLimitsExceeded: false,
            isExtensionUpdateAvailable: false,
            isExtensionReloadedOnUpdate: false,
            extensionUpdateState: ExtensionUpdateFSMState.Idle,
            isSuccessfulExtensionUpdate: false,
        })),
        getStatisticsData: vi.fn(() => Promise.resolve({
            todayStats: [],
            weekStats: [],
            monthStats: [],
            overallStats: [],
            todayTotalBlocked: 0,
        })),
        getTabInfoForPopup: vi.fn(() => Promise.resolve({
            url: null,
        })),
        getIsAppInitialized: vi.fn(() => Promise.resolve(true)),
        getCurrentTabId: vi.fn(() => Promise.resolve(null)),
        checkUpdates: vi.fn(() => Promise.resolve()),
        updateExtension: vi.fn(() => Promise.resolve()),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
}));

vi.mock('../../../../../../Extension/src/pages/popup/state-machines/app-state-machine', () => ({
    appStateActor: {
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getSnapshot: () => ({ value: 'enabled' }),
    },
    AppStateEvent: {},
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

describe('PopupStore - extension update computed properties', () => {
    let store: PopupStore;

    beforeEach(() => {
        store = new PopupStore();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('isExtensionUpdateAvailable', () => {
        it.each([
            [ExtensionUpdateFSMState.Idle, false],
            [ExtensionUpdateFSMState.Checking, false],
            [ExtensionUpdateFSMState.Available, true],
            [ExtensionUpdateFSMState.Updating, false],
            [ExtensionUpdateFSMState.NotAvailable, false],
            [ExtensionUpdateFSMState.Failed, false],
            [ExtensionUpdateFSMState.Success, false],
        ])('returns %s when state is %s', (state, expected) => {
            runInAction(() => {
                store.extensionUpdateState = state;
            });
            expect(store.isExtensionUpdateAvailable).toBe(expected);
        });
    });

    describe('isExtensionCheckingUpdateOrUpdating', () => {
        it.each([
            [ExtensionUpdateFSMState.Idle, false],
            [ExtensionUpdateFSMState.Checking, true],
            [ExtensionUpdateFSMState.Available, false],
            [ExtensionUpdateFSMState.Updating, true],
            [ExtensionUpdateFSMState.NotAvailable, false],
            [ExtensionUpdateFSMState.Failed, false],
            [ExtensionUpdateFSMState.Success, false],
        ])('returns %s when state is %s', (state, expected) => {
            runInAction(() => {
                store.extensionUpdateState = state;
            });
            expect(store.isExtensionCheckingUpdateOrUpdating).toBe(expected);
        });
    });

    describe('updateNotification', () => {
        it('returns null when state is Idle', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Idle;
            });
            expect(store.updateNotification).toBeNull();
        });

        it('returns loading notification when state is Checking', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Checking;
            });
            expect(store.updateNotification).toEqual({
                type: NotificationType.Loading,
                animationCondition: true,
                text: 'update_checking_in_progress',
                closeManually: true,
            });
        });

        it('returns success notification when state is NotAvailable', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.NotAvailable;
            });
            expect(store.updateNotification).toEqual({
                type: NotificationType.Success,
                text: 'update_not_needed',
            });
        });

        it('returns null when state is Available', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Available;
            });
            expect(store.updateNotification).toBeNull();
        });

        it('returns loading notification when state is Updating', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Updating;
            });
            expect(store.updateNotification).toEqual({
                type: NotificationType.Loading,
                animationCondition: true,
                text: 'update_installing_in_progress_title',
                closeManually: true,
            });
        });

        it('returns error notification with retry button when state is Failed', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Failed;
            });
            const notification = store.updateNotification;
            expect(notification).not.toBeNull();
            expect(notification!.type).toBe(NotificationType.Error);
            expect(notification!.text).toBe('update_failed_text');
            expect(notification!.buttons).toHaveLength(1);
            if (!notification?.buttons?.[0]) {
                throw new Error('Expected buttons to have at least one element');
            }
            const btn = notification.buttons[0];
            expect(btn.title).toBe('update_failed_try_again_btn');
            expect(typeof btn.onClick).toBe('function');
        });

        it('returns success notification when state is Success', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Success;
            });
            expect(store.updateNotification).toEqual({
                type: NotificationType.Success,
                text: 'update_success_text',
            });
        });
    });

    describe('handleExtensionUpdateStateChange', () => {
        it('updates extensionUpdateState from Checking to Available', () => {
            // Set initial state
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Checking;
            });
            expect(store.isExtensionCheckingUpdateOrUpdating).toBe(true);

            // Update state
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Available);
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Available);
            expect(store.isExtensionUpdateAvailable).toBe(true);
        });

        it('updates extensionUpdateState from Available to Updating', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Available;
            });
            expect(store.isExtensionUpdateAvailable).toBe(true);

            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Updating);
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Updating);
            expect(store.isExtensionCheckingUpdateOrUpdating).toBe(true);
        });

        it('updates extensionUpdateState to Failed and shows notification', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Failed);
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Failed);
            expect(store.updateNotification).not.toBeNull();
            expect(store.updateNotification!.type).toBe(NotificationType.Error);
        });
    });

    describe('configureExtensionUpdates', () => {
        it('sets Available state when isExtensionUpdateAvailable is true', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: true,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Available,
                isSuccessfulExtensionUpdate: false,
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Available);
            expect(store.isExtensionUpdateAvailable).toBe(true);
            expect(store.areFilterLimitsExceeded).toBe(false);
        });

        it('sets Success state when reloaded on successful update', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Success,
                isSuccessfulExtensionUpdate: true,
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Success);
            expect(store.updateNotification).not.toBeNull();
            expect(store.updateNotification!.type).toBe(NotificationType.Success);
        });

        it('sets Failed state when reloaded on failed update', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Failed,
                isSuccessfulExtensionUpdate: false,
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Failed);
            expect(store.updateNotification).not.toBeNull();
            expect(store.updateNotification!.type).toBe(NotificationType.Error);
        });

        it('sets Idle state when no update and no reload', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Idle,
                isSuccessfulExtensionUpdate: false,
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Idle);
            expect(store.updateNotification).toBeNull();
        });
    });

    describe('configureExtensionUpdates trusts extensionUpdateState', () => {
        it(
            'uses Available from snapshot even when legacy booleans disagree',
            () => {
                store.configureExtensionUpdates({
                    areFilterLimitsExceeded: false,
                    isExtensionUpdateAvailable: false,
                    isExtensionReloadedOnUpdate: false,
                    extensionUpdateState: ExtensionUpdateFSMState.Available,
                    isSuccessfulExtensionUpdate: false,
                });

                expect(store.extensionUpdateState)
                    .toBe(ExtensionUpdateFSMState.Available);
                expect(store.isExtensionUpdateAvailable).toBe(true);
            },
        );

        it('uses Failed from snapshot even when legacy booleans disagree', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Failed,
                isSuccessfulExtensionUpdate: false,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Failed);
            expect(store.updateNotification).not.toBeNull();
            expect(store.updateNotification!.type)
                .toBe(NotificationType.Error);
        });

        it('uses Idle from snapshot even when legacy booleans suggest update', () => {
            store.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: true,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Idle,
                isSuccessfulExtensionUpdate: false,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Idle);
            expect(store.isExtensionUpdateAvailable).toBe(false);
        });
    });

    describe('handleExtensionUpdateStateChange deferred Idle', () => {
        it('transitions from Success to Idle after min display duration expires', () => {
            vi.useFakeTimers();

            const testStore = new PopupStore();

            // Simulate FSM event: Success
            runInAction(() => {
                testStore.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Success);
            });
            expect(testStore.extensionUpdateState).toBe(ExtensionUpdateFSMState.Success);

            // Advance time to just before the deadline
            vi.advanceTimersByTime(MIN_UPDATE_DISPLAY_DURATION_MS - 100);

            // Simulate FSM auto-transition to Idle (blocked by minDisplayUntil)
            runInAction(() => {
                testStore.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Idle);
            });
            // Still in Success because min display hasn't elapsed — deferred timer is scheduled
            expect(testStore.extensionUpdateState).toBe(ExtensionUpdateFSMState.Success);

            // Advance past the deadline — deferred timer fires
            vi.advanceTimersByTime(200);
            expect(testStore.extensionUpdateState).toBe(ExtensionUpdateFSMState.Idle);

            vi.useRealTimers();
        });
    });

    describe('dispose()', () => {
        it('clears deferred idle timer', () => {
            vi.useFakeTimers();
            const now = Date.now();
            vi.setSystemTime(now);

            const testStore = new PopupStore();

            // configureExtensionUpdates with reloadedOnUpdate triggers
            // scheduleDeferredIdle which sets a setTimeout
            testStore.configureExtensionUpdates({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Idle,
                isSuccessfulExtensionUpdate: true,
            });

            // A deferred idle timeout should have been scheduled
            expect(vi.getTimerCount()).toBeGreaterThan(0);

            // dispose() should clear the timer
            testStore.dispose();
            expect(vi.getTimerCount()).toBe(0);

            vi.useRealTimers();
        });
    });
});
