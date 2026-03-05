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

import {
    AUTO_UPDATE_STATE_KEY_MV3,
    ExtensionUpdateFSMEvent,
    ExtensionUpdateFSMState,
} from '../../../../../Extension/src/common/constants';

// --- Hoisted mocks ---

const { mockActorSend, mockActorStart, mockActorGetSnapshot } = vi.hoisted(() => ({
    mockActorSend: vi.fn(),
    mockActorStart: vi.fn(),
    mockActorGetSnapshot: vi.fn(() => ({ value: ExtensionUpdateFSMState.Idle })),
}));

// Mock extensionUpdateActor
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/extension-update-machine-mv3',
    () => ({
        extensionUpdateActor: {
            send: mockActorSend,
            start: mockActorStart,
            getSnapshot: mockActorGetSnapshot,
            subscribe: vi.fn(),
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

            static handleReload = vi.fn().mockResolvedValue(undefined);

            static getUpdateData = vi.fn().mockResolvedValue(null);
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
        // Reset storage
        await browser.storage.local.clear();
        // Default Prefs.version
        mockPrefsVersion.value = '5.3.0.0';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('clears stale state when nextVersion equals current version', async () => {
        // Extension was updated to 5.3.0.0, persisted state still has nextVersion: 5.3.0.0
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.3.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        // FSM should start but stay in Idle — no UpdateAvailable event sent
        expect(mockActorStart).toHaveBeenCalledTimes(1);
        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        // State should be cleared from storage
        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });

    it('clears stale state when nextVersion is older than current version', async () => {
        // Downgrade scenario: extension at 5.4.0.0, persisted nextVersion is 5.3.0.0
        mockPrefsVersion.value = '5.4.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.3.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });

    it('preserves valid state when nextVersion is newer than current version', async () => {
        // Legitimate SW restart: update 5.4.0.0 is available, extension is at 5.3.0.0
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: '5.4.0.0',
            updateAvailableTimestamp: Date.now() - 100000,
        });

        await ExtensionUpdateService.init();

        // FSM should receive UpdateAvailable event
        expect(mockActorSend).toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );
    });

    it('returns early with no side effects when no persisted state exists', async () => {
        // Clean startup — no state in storage
        await ExtensionUpdateService.init();

        expect(mockActorStart).toHaveBeenCalledTimes(1);
        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );
    });

    it('clears state defensively when nextVersion is malformed', async () => {
        mockPrefsVersion.value = '5.3.0.0';
        await seedAutoUpdateState({
            nextVersion: 'invalid..version',
            updateAvailableTimestamp: Date.now(),
        });

        await ExtensionUpdateService.init();

        // Should not throw, should not send UpdateAvailable
        expect(mockActorSend).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: ExtensionUpdateFSMEvent.UpdateAvailable }),
        );

        // State should be cleared
        const rawState = await browser.storage.local.get(AUTO_UPDATE_STATE_KEY_MV3);
        expect(rawState[AUTO_UPDATE_STATE_KEY_MV3]).toBeUndefined();
    });
});
