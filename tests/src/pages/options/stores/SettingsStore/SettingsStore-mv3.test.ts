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

import { SettingsStore } from '../../../../../../Extension/src/pages/options/stores/SettingsStore/SettingsStore-mv3';
import { ExtensionUpdateFSMState } from '../../../../../../Extension/src/common/constants';
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

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/services/messenger', () => ({
    messenger: {
        getOptionsData: vi.fn(() => Promise.resolve({
            settings: { values: {}, names: {} },
            appVersion: '5.4.0',
            libVersions: {},
            environmentOptions: { isChrome: true },
            filtersInfo: { rulesCount: 100 },
            filtersMetadata: { filters: [], categories: [] },
            fullscreenUserRulesEditorIsOpen: false,
            showGeneralSettingsPromo: false,
            runtimeInfo: {
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Idle,
                isSuccessfulExtensionUpdate: false,
            },
            dnrRulesets: '',
        })),
        saveAllowlist: vi.fn(() => Promise.resolve()),
        getCurrentLimits: vi.fn(() => Promise.resolve({
            dynamicRulesEnabledCount: 0,
            dynamicRulesMaximumCount: 0,
            dynamicRulesUnsafeEnabledCount: 0,
            dynamicRulesUnsafeMaximumCount: 0,
            dynamicRulesRegexpsEnabledCount: 0,
            dynamicRulesRegexpsMaximumCount: 0,
            staticFiltersEnabledCount: 0,
            staticFiltersMaximumCount: 0,
            staticRulesEnabledCount: 0,
            staticRulesMaximumCount: 0,
            staticRulesRegexpsEnabledCount: 0,
            staticRulesRegexpsMaxCount: 0,
            expectedEnabledFilters: [],
            actuallyEnabledFilters: [],
            areFilterLimitsExceeded: false,
        })),
        openExtensionStore: vi.fn(),
        checkUpdates: vi.fn(() => Promise.resolve()),
        updateExtension: vi.fn(() => Promise.resolve()),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => {
    const SavingFSMState = {
        Idle: 'idle',
        Saving: 'saving',
        Saved: 'saved',
        Error: 'error',
    };
    const SavingFSMEvent = { Save: 'save' };
    const createSavingService = () => ({
        subscribe: vi.fn(),
        getSnapshot: () => ({ value: SavingFSMState.Idle }),
        send: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    });
    return { createSavingService, SavingFSMState, SavingFSMEvent };
});

vi.mock('../../../../../../Extension/src/pages/options/components/Filters/helpers', () => ({
    sortFilters: vi.fn((filters: unknown[]) => filters),
    updateFilters: vi.fn((_old: unknown[], updated: unknown[]) => updated),
    updateGroups: vi.fn((_old: unknown[], updated: unknown[]) => updated),
    sortGroupsOnSearch: vi.fn((groups: unknown[]) => groups),
}));

vi.mock('../../../../../../Extension/src/pages/options/options-storage', () => ({
    optionsStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
    },
}));

describe('SettingsStore - extension update computed properties', () => {
    let store: SettingsStore;
    let mockRootStore: {
        uiStore: { addNotification: ReturnType<typeof vi.fn> };
        telemetryStore: { setIsAnonymizedUsageDataAllowed: ReturnType<typeof vi.fn> };
    };

    beforeEach(() => {
        mockRootStore = {
            uiStore: {
                addNotification: vi.fn(),
            },
            telemetryStore: {
                setIsAnonymizedUsageDataAllowed: vi.fn(),
            },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store = new SettingsStore(mockRootStore as any);
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

    describe('handleExtensionUpdateStateChange', () => {
        it('updates extensionUpdateState from Checking to Available', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Checking;
            });
            expect(store.isExtensionCheckingUpdateOrUpdating).toBe(true);

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

        it('updates extensionUpdateState to Failed', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Failed);
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Failed);
            expect(store.isExtensionUpdateAvailable).toBe(false);
            expect(store.isExtensionCheckingUpdateOrUpdating).toBe(false);
        });

        it('updates extensionUpdateState to Idle', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.NotAvailable;
            });

            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Idle);
            });

            expect(store.extensionUpdateState).toBe(ExtensionUpdateFSMState.Idle);
            expect(store.isExtensionUpdateAvailable).toBe(false);
        });
    });

    describe('applyRuntimeInfo trusts extensionUpdateState', () => {
        it('uses Available from snapshot and skips notification', () => {
            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Available,
                isSuccessfulExtensionUpdate: false,
                lastCheckTimeMs: null,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Available);
            expect(store.isExtensionUpdateAvailable).toBe(true);
            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });

        it('uses Failed from snapshot and adds notification when reloaded', () => {
            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Failed,
                isSuccessfulExtensionUpdate: false,
                lastCheckTimeMs: null,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Failed);
            expect(mockRootStore.uiStore.addNotification)
                .toHaveBeenCalledTimes(1);
            const notification = mockRootStore.uiStore.addNotification.mock.calls[0]![0] as {
                type: NotificationType;
            };
            expect(notification.type).toBe(NotificationType.Error);
        });

        it('uses Success from snapshot and adds notification when reloaded', () => {
            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Success,
                isSuccessfulExtensionUpdate: true,
                lastCheckTimeMs: null,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Success);
            expect(mockRootStore.uiStore.addNotification)
                .toHaveBeenCalledTimes(1);
            const notification = mockRootStore.uiStore.addNotification.mock.calls[0]![0] as {
                type: NotificationType;
            };
            expect(notification.type).toBe(NotificationType.Success);
        });

        it('adds notification when state changes to Success without reload', () => {
            // Store starts in Idle, so Success is a state change.
            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.Success,
                isSuccessfulExtensionUpdate: false,
                lastCheckTimeMs: null,
            });

            expect(store.extensionUpdateState)
                .toBe(ExtensionUpdateFSMState.Success);
            expect(mockRootStore.uiStore.addNotification)
                .toHaveBeenCalledWith({
                    type: NotificationType.Success,
                    text: 'update_success_text',
                });
        });
    });

    describe('handleExtensionUpdateStateChange notifications', () => {
        it('calls addNotification with success notification for NotAvailable state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.NotAvailable);
            });

            expect(mockRootStore.uiStore.addNotification).toHaveBeenCalledWith({
                type: NotificationType.Success,
                text: 'update_not_needed',
            });
        });

        it('calls addNotification with error notification for Failed state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Failed);
            });

            expect(mockRootStore.uiStore.addNotification).toHaveBeenCalledWith({
                type: NotificationType.Error,
                text: 'update_failed_text',
                buttons: [{
                    title: 'update_failed_try_again_btn',
                    onClick: expect.any(Function),
                }],
            });
        });

        it('calls addNotification with success notification for Success state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Success);
            });

            expect(mockRootStore.uiStore.addNotification).toHaveBeenCalledWith({
                type: NotificationType.Success,
                text: 'update_success_text',
            });
        });

        it('does not call addNotification for Idle state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Idle);
            });

            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });

        it('does not call addNotification for Checking state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Checking);
            });

            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });

        it('does not call addNotification for Available state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Available);
            });

            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });

        it('does not call addNotification for Updating state', () => {
            runInAction(() => {
                store.handleExtensionUpdateStateChange(ExtensionUpdateFSMState.Updating);
            });

            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('applyRuntimeInfo notifications', () => {
        it('adds notification when state changes to NotAvailable', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Checking;
            });

            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.NotAvailable,
                isSuccessfulExtensionUpdate: false,
                lastCheckTimeMs: null,
            });

            expect(mockRootStore.uiStore.addNotification).toHaveBeenCalledWith({
                type: NotificationType.Success,
                text: 'update_not_needed',
            });
        });

        it('does not add notification when state does not change', () => {
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.NotAvailable;
            });

            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: false,
                extensionUpdateState: ExtensionUpdateFSMState.NotAvailable,
                isSuccessfulExtensionUpdate: false,
                lastCheckTimeMs: null,
            });

            expect(mockRootStore.uiStore.addNotification).not.toHaveBeenCalled();
        });

        it('does not add duplicate terminal notification when isExtensionReloadedOnUpdate is true', () => {
            // Post-reload notifications are handled separately
            runInAction(() => {
                store.extensionUpdateState = ExtensionUpdateFSMState.Idle;
            });

            store.applyRuntimeInfo({
                areFilterLimitsExceeded: false,
                isExtensionUpdateAvailable: false,
                isExtensionReloadedOnUpdate: true,
                extensionUpdateState: ExtensionUpdateFSMState.Success,
                isSuccessfulExtensionUpdate: true,
                lastCheckTimeMs: null,
            });

            // Should call addNotification exactly once (for post-reload),
            // not twice (once for terminal state + once for post-reload)
            expect(mockRootStore.uiStore.addNotification).toHaveBeenCalledTimes(1);
        });
    });
});
