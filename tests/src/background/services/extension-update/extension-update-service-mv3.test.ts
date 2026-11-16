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

/* eslint-disable max-classes-per-file */

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import browser from 'sinon-chrome';

import { type ManualUpdateMetadata } from '../../../../../Extension/src/background/services/extension-update/types';
import {
    AUTO_UPDATE_STATE_KEY_MV3,
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
} from '../../../../../Extension/src/common/constants';
import { ForwardFrom } from '../../../../../Extension/src/common/forward';

// --- Hoisted mocks ---

const {
    mockActorSend,
    mockActorStart,
    mockActorGetSnapshot,
    mockActorSubscribe,
    getFsmSubscriber,
} = vi.hoisted(() => {
    let subscriber: ((state: { value: string }) => void) | undefined;

    return {
        mockActorSend: vi.fn(),
        mockActorStart: vi.fn(),
        mockActorGetSnapshot: vi.fn(() => ({ value: ExtensionUpdateFSMState.Idle })),
        mockActorSubscribe: vi.fn((callback: (state: { value: string }) => void) => {
            subscriber = callback;
        }),
        getFsmSubscriber: (): ((state: { value: string }) => void) | undefined => subscriber,
    };
});

// Mock extensionUpdateActor
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/extension-update-machine-mv3',
    () => ({
        extensionUpdateActor: {
            send: mockActorSend,
            start: mockActorStart,
            getSnapshot: mockActorGetSnapshot,
            subscribe: mockActorSubscribe,
        },
    }),
);

// Mock messageHandler
vi.mock(
    '../../../../../Extension/src/background/message-handler',
    () => ({
        messageHandler: {
            addListener: vi.fn(),
        },
    }),
);

// Mock ManualUpdateHandler
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/manual-update-handler-mv3',
    () => {
        class MockManualUpdateHandler {
            check = vi.fn();

            applyUpdate = vi.fn();

            onUpdateAvailable = vi.fn().mockResolvedValue(undefined);

            static handleReload = vi.fn().mockResolvedValue(null);

            static getUpdateData = vi.fn().mockResolvedValue(null);

            static peekUpdateData = vi.fn().mockResolvedValue(null);
        }
        return { ManualUpdateHandler: MockManualUpdateHandler };
    },
);

// Mock AutoUpdateHandler
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/auto-update-handler-mv3',
    () => {
        class MockAutoUpdateHandler {
            onUpdateAvailable = vi.fn().mockResolvedValue(undefined);

            clearState = vi.fn().mockResolvedValue(undefined);

            iconDelayMs = 24 * 60 * 60 * 1000;
        }
        return { AutoUpdateHandler: MockAutoUpdateHandler };
    },
);

// Mock Prefs — version will be overridden per test
const { mockPrefsVersion } = vi.hoisted(() => ({
    mockPrefsVersion: { value: '5.3.0.0' },
}));

vi.mock(
    '../../../../../Extension/src/background/prefs',
    () => ({
        Prefs: {
            get version() {
                return mockPrefsVersion.value;
            },
        },
    }),
);

// Mock ContentScriptInjector (used by AutoUpdateHandler)
vi.mock(
    '../../../../../Extension/src/background/content-script-injector',
    () => ({
        ContentScriptInjector: {
            setUpdateFlag: vi.fn().mockResolvedValue(undefined),
        },
    }),
);

// Mock chrome.runtime.onUpdateAvailable
const mockAddListener = vi.fn();
const globalChrome = (global as Record<string, unknown>).chrome;
if (globalChrome && typeof globalChrome === 'object') {
    const runtime = (globalChrome as Record<string, unknown>).runtime;
    if (runtime && typeof runtime === 'object') {
        Object.defineProperty(runtime, 'onUpdateAvailable', {
            value: { addListener: mockAddListener },
            writable: true,
            configurable: true,
        });
    }
}

// Import after all mocks are set up
const { ExtensionUpdateService } = await import(
    '../../../../../Extension/src/background/services/extension-update/extension-update-service-mv3'
);
const { ManualUpdateHandler } = await import(
    '../../../../../Extension/src/background/services/extension-update/manual-update-handler-mv3'
);

/**
 * Base manual update metadata fixture; tests derive copies with overrides.
 */
const baseManualUpdateMetadata: ManualUpdateMetadata = {
    initVersion: '5.2.0.0',
    pageToOpenAfterReload: ForwardFrom.Options,
    isOk: true,
};

/**
 * Seeds auto-update state in mocked browser storage.
 *
 * @param state The state object to persist.
 */
async function seedAutoUpdateState(state: Record<string, unknown>): Promise<void> {
    await browser.storage.local.set({
        [AUTO_UPDATE_STATE_KEY_MV3]: JSON.stringify(state),
    });
}

describe.skipIf(!__IS_MV3__)('ExtensionUpdateService.init — stale state handling', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue(null);
        vi.mocked(ManualUpdateHandler.handleReload).mockResolvedValue(null);
        vi.mocked(ManualUpdateHandler.getUpdateData).mockResolvedValue(null);
        // Reset storage
        await browser.storage.local.clear();
        // Default Prefs.version
        mockPrefsVersion.value = '5.3.0.0';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('clears stale state when nextVersion equals current version', async () => {
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.3.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        expect(mockActorStart).toHaveBeenCalledTimes(1);

        // Init is sent but with isUpdateAvailable: false (stale state cleared)
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
            }),
        );

        // No UpdateAvailable event sent
        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        // State should be cleared from storage
        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });

    it('clears stale state when nextVersion is older than current version', async () => {
        mockPrefsVersion.value = '5.4.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.3.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        // Init is sent but with isUpdateAvailable: false
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
            }),
        );

        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });

    it('preserves valid state and sends Init with isUpdateAvailable true', async () => {
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.4.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        // Init event sent with isUpdateAvailable: true
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: true,
                isReloadedOnUpdate: false,
            }),
        );

        // UpdateAvailable event also sent (for side effects)
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );
    });

    it('sends Init with defaults and has no other side effects when no persisted state exists', async () => {
        await ExtensionUpdateService.init();

        expect(mockActorStart).toHaveBeenCalledTimes(1);

        // Init is sent with default flags
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: false,
            }),
        );

        // No UpdateAvailable event sent
        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );
    });

    it('clears state defensively when nextVersion is malformed and sends Init with defaults', async () => {
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: 'invalid..version',
            updateAvailableTimestamp: Date.now(),
        });

        await ExtensionUpdateService.init();

        // Init sent with defaults (state cleared due to malformed version)
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
            }),
        );

        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });

    it('sends Init event with isUpdateAvailable true when persisted nextVersion is newer', async () => {
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.4.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: true,
                isReloadedOnUpdate: false,
            }),
        );
    });

    it('sends Init event with both flags false when no persisted state exists', async () => {
        await ExtensionUpdateService.init();

        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ExtensionUpdateFSMEvent.Init,
                isUpdateAvailable: false,
                isReloadedOnUpdate: false,
            }),
        );
    });

    it.each([true, false])('defers the manual reload result until refresh completes (isOk=%s)', async (isOk) => {
        const metadata: ManualUpdateMetadata = { ...baseManualUpdateMetadata, isOk };
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue(metadata);
        vi.mocked(ManualUpdateHandler.handleReload).mockResolvedValue(metadata);

        await ExtensionUpdateService.init();

        // Init is sent immediately without the reload flags; the manual result
        // is deferred until the post-reload refresh completes.
        expect(mockActorSend).toHaveBeenCalledExactlyOnceWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: false,
            isUpdateFailedAfterReload: false,
        });

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true);

        expect(ManualUpdateHandler.handleReload).toHaveBeenCalledExactlyOnceWith(true, true);
        expect(mockActorSend).toHaveBeenCalledTimes(2);
        expect(mockActorSend).toHaveBeenLastCalledWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: !isOk,
        });
        expect(ManualUpdateHandler.getUpdateData).not.toHaveBeenCalled();
    });

    it('reports the persisted result when reload handling rejects after a successful cycle', async () => {
        // handleReload persists the update result before opening pages, so a
        // rejection means a storage failure and the peeked value is the most
        // trustworthy result available.
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue({ ...baseManualUpdateMetadata });
        vi.mocked(ManualUpdateHandler.handleReload).mockRejectedValue(new Error('storage error'));

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true, true);

        expect(mockActorSend).toHaveBeenCalledExactlyOnceWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: false,
        });

        // The post-reload gate must be released even on failure, so the UI can
        // consume the persisted result.
        await ExtensionUpdateService.getManualExtensionUpdateData();
        expect(ManualUpdateHandler.getUpdateData).toHaveBeenCalledOnce();
    });

    it('reports a failure when reload handling rejects after a failed cycle', async () => {
        // The peeked value can still hold the provisional success because the
        // rejected handleReload may have failed to persist the failure.
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue({ ...baseManualUpdateMetadata });
        vi.mocked(ManualUpdateHandler.handleReload).mockRejectedValue(new Error('storage error'));

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true, false);

        expect(mockActorSend).toHaveBeenCalledExactlyOnceWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: true,
        });
    });

    it('keeps the preserved success when reload handling rejects after the version changed', async () => {
        // The version changed since the manual update was initiated, so a
        // rejected handleReload on a later start must not force a failure.
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue({ ...baseManualUpdateMetadata });
        vi.mocked(ManualUpdateHandler.handleReload).mockRejectedValue(new Error('storage error'));

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(false, true);

        expect(mockActorSend).toHaveBeenCalledExactlyOnceWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: false,
        });
    });

    it('queues the reload result while the FSM is not Idle and flushes it on Idle', async () => {
        const metadata: ManualUpdateMetadata = { ...baseManualUpdateMetadata };
        vi.mocked(ManualUpdateHandler.handleReload).mockResolvedValue(metadata);

        await ExtensionUpdateService.init();
        mockActorSend.mockClear();

        // The FSM left Idle while the refresh was pending, e.g. a manual check
        // started or onUpdateAvailable fired.
        mockActorGetSnapshot.mockReturnValue({ value: ExtensionUpdateFSMState.Checking });

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(false, true);

        // The machine handles Init only in Idle, so the result must be queued.
        expect(mockActorSend).not.toHaveBeenCalled();

        // Simulate the FSM returning to Idle.
        mockActorGetSnapshot.mockReturnValue({ value: ExtensionUpdateFSMState.Idle });
        getFsmSubscriber()?.({ value: ExtensionUpdateFSMState.Idle });

        expect(mockActorSend).toHaveBeenCalledExactlyOnceWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: false,
        });
    });

    it('releases the gate without an Init event when reload handling and the fallback both fail', async () => {
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockRejectedValue(new Error('storage error'));
        vi.mocked(ManualUpdateHandler.handleReload).mockRejectedValue(new Error('storage error'));

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true, true);

        expect(mockActorSend).not.toHaveBeenCalled();

        await ExtensionUpdateService.getManualExtensionUpdateData();
        expect(ManualUpdateHandler.getUpdateData).toHaveBeenCalledOnce();
    });

    it('initializes a failed result, never success, when the deferred custom refresh fails', async () => {
        const metadata: ManualUpdateMetadata = { ...baseManualUpdateMetadata };
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue(metadata);
        vi.mocked(ManualUpdateHandler.handleReload).mockResolvedValue({
            ...metadata,
            isOk: false,
        });

        await ExtensionUpdateService.init();

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true, false);

        expect(ManualUpdateHandler.handleReload).toHaveBeenCalledExactlyOnceWith(true, false);
        expect(mockActorSend).toHaveBeenLastCalledWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: true,
        });
        expect(ManualUpdateHandler.getUpdateData).not.toHaveBeenCalled();
    });

    it('preserves manual intent when the UI requests metadata before the post-reload refresh finishes', async () => {
        const metadata: ManualUpdateMetadata = { ...baseManualUpdateMetadata };
        const completedMetadata = { ...metadata, isOk: false };
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue(metadata);
        vi.mocked(ManualUpdateHandler.getUpdateData).mockResolvedValue(completedMetadata);
        let completeReload!: (data: ManualUpdateMetadata) => void;
        vi.mocked(ManualUpdateHandler.handleReload).mockImplementationOnce(
            () => new Promise((resolve) => {
                completeReload = resolve;
            }),
        );

        await ExtensionUpdateService.init();
        await expect(ExtensionUpdateService.getManualExtensionUpdateData()).resolves.toBeNull();
        expect(ManualUpdateHandler.getUpdateData).not.toHaveBeenCalled();
        await expect(ExtensionUpdateService.peekManualExtensionUpdateData()).resolves.toEqual(metadata);

        const reload = ExtensionUpdateService.handleExtensionReloadOnUpdate(true, false);
        await expect(ExtensionUpdateService.getManualExtensionUpdateData()).resolves.toBeNull();
        expect(ManualUpdateHandler.getUpdateData).not.toHaveBeenCalled();

        completeReload(completedMetadata);
        await reload;

        await expect(ExtensionUpdateService.getManualExtensionUpdateData()).resolves.toEqual(completedMetadata);
        expect(ManualUpdateHandler.getUpdateData).toHaveBeenCalledOnce();
    });

    it('uses the preserved result on a service-worker restart after the page was opened', async () => {
        const metadata: ManualUpdateMetadata = { ...baseManualUpdateMetadata };
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue(metadata);
        vi.mocked(ManualUpdateHandler.handleReload).mockResolvedValue(metadata);

        await ExtensionUpdateService.init();
        await ExtensionUpdateService.handleExtensionReloadOnUpdate(false);

        expect(mockActorSend).toHaveBeenLastCalledWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: false,
            isReloadedOnUpdate: true,
            isUpdateFailedAfterReload: false,
        });
    });

    it('does not emit a manual reload result when no metadata remains', async () => {
        await ExtensionUpdateService.handleExtensionReloadOnUpdate(true, false);

        expect(mockActorSend).not.toHaveBeenCalled();
    });

    it('still prioritizes a pending extension update when manual metadata exists', async () => {
        vi.mocked(ManualUpdateHandler.peekUpdateData).mockResolvedValue({ ...baseManualUpdateMetadata });
        await seedAutoUpdateState({
            nextVersion: '5.4.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        expect(mockActorSend).toHaveBeenCalledWith({
            type: ExtensionUpdateFSMEvent.Init,
            isUpdateAvailable: true,
            isReloadedOnUpdate: false,
            isUpdateFailedAfterReload: false,
        });
    });
});
