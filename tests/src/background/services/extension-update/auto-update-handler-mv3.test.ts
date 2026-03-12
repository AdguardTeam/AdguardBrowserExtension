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
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';

import { FilterUpdateApi } from '../../../../../Extension/src/background/api/filters/update/update-mv3';
import {
    AutoUpdateHandler,
} from '../../../../../Extension/src/background/services/extension-update/auto-update-handler-mv3';
import {
    BackendUpdateChecker,
} from '../../../../../Extension/src/background/services/extension-update/backend-update-checker-mv3';
import {
    AutoUpdateStateManager,
} from '../../../../../Extension/src/background/services/extension-update/auto-update-state-manager-mv3';
import {
    AutoUpdateStateField,
    UpdateCheckStatus,
} from '../../../../../Extension/src/background/services/extension-update/types';

// Mock BackendUpdateChecker
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/backend-update-checker-mv3',
    () => ({
        BackendUpdateChecker: {
            checkUpdate: vi.fn(),
        },
    }),
);

// Mock FilterUpdateApi
vi.mock(
    '../../../../../Extension/src/background/api/filters/update/update-mv3',
    () => ({
        FilterUpdateApi: {
            updateCustomFilters: vi.fn(),
        },
    }),
);

// Mock IdleDetector to control idle duration.
// vi.mock is hoisted, so we use vi.hoisted() to create mocks that can be
// referenced inside the factory.
const { mockGetIdleDuration, mockStopMonitoring } = vi.hoisted(() => ({
    mockGetIdleDuration: vi.fn(),
    mockStopMonitoring: vi.fn(),
}));

vi.mock(
    '../../../../../Extension/src/background/services/extension-update/idle-detector-mv3',
    () => {
        class MockIdleDetector {
            getIdleDuration = mockGetIdleDuration;

            stopMonitoring = mockStopMonitoring;
        }
        return { IdleDetector: MockIdleDetector };
    },
);

// Mock chrome.runtime.reload
const mockReload = vi.fn();
const globalChrome = (global as Record<string, unknown>).chrome;
if (globalChrome && typeof globalChrome === 'object') {
    const runtime = (globalChrome as Record<string, unknown>).runtime;
    if (runtime && typeof runtime === 'object') {
        Object.defineProperty(runtime, 'reload', {
            value: mockReload,
            writable: true,
            configurable: true,
        });
    }
}

// Mock ContentScriptInjector
vi.mock(
    '../../../../../Extension/src/background/content-script-injector',
    () => ({
        ContentScriptInjector: {
            setUpdateFlag: vi.fn().mockResolvedValue(undefined),
        },
    }),
);

// Default idle threshold from AutoUpdateHandler.DEFAULT_CONFIG
const DEFAULT_IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

describe('AutoUpdateHandler', () => {
    let handler: AutoUpdateHandler;
    let stateManager: AutoUpdateStateManager;
    const onUpdateApplyStart = vi.fn();
    const onUpdateApplyFailed = vi.fn();

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        stateManager = new AutoUpdateStateManager();
        await stateManager.init();

        // Set a next version so checkConditions does not bail early
        stateManager.set(AutoUpdateStateField.nextVersion, '5.3.0.18');

        handler = new AutoUpdateHandler({
            stateManager,
            onUpdateApplyStart,
            onUpdateApplyFailed,
        });

        // Default: idle threshold is always met (exceed the 30-minute default)
        mockGetIdleDuration.mockReturnValue(DEFAULT_IDLE_THRESHOLD_MS + 1);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    /**
     * Starts monitoring and advances timers to trigger checkConditions.
     * The default config uses 20s check interval; we advance past it.
     */
    async function triggerCheckConditions(): Promise<void> {
        await handler.onUpdateAvailable();
        // Advance past the default check interval (20s)
        await vi.advanceTimersByTimeAsync(21_000);
    }

    describe('checkConditions — backend analytics (fire-and-forget)', () => {
        it('applies update and makes fire-and-forget backend call', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            await triggerCheckConditions();

            expect(BackendUpdateChecker.checkUpdate).toHaveBeenCalled();
            expect(onUpdateApplyStart).toHaveBeenCalledTimes(1);
            expect(mockReload).toHaveBeenCalledTimes(1);
        });

        it('applies update even when backend call fails', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockRejectedValue(
                new Error('Network error'),
            );

            await triggerCheckConditions();

            // Update proceeds regardless — backend is fire-and-forget
            expect(onUpdateApplyStart).toHaveBeenCalledTimes(1);
            expect(mockReload).toHaveBeenCalledTimes(1);
        });

        it('does NOT apply update if browser is not idle', async () => {
            // Browser is not idle (below the 30-minute threshold)
            mockGetIdleDuration.mockReturnValue(1000);

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            await triggerCheckConditions();

            // Backend should NOT be called because idle check fails first
            expect(BackendUpdateChecker.checkUpdate).not.toHaveBeenCalled();
            expect(onUpdateApplyStart).not.toHaveBeenCalled();
        });
    });

    describe.skipIf(!__IS_MV3__)('applyUpdate — custom filters', () => {
        it('calls updateCustomFilters before reload', async () => {
            // mock updateCustomFilters to resolve immediately
            vi.spyOn(FilterUpdateApi, 'updateCustomFilters').mockResolvedValue(undefined);

            // emulate extension update availability
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            await triggerCheckConditions();

            expect(FilterUpdateApi.updateCustomFilters).toHaveBeenCalledTimes(1);
            expect(mockReload).toHaveBeenCalledTimes(1);
        });

        it('proceeds with reload even when updateCustomFilters fails', async () => {
            // mock updateCustomFilters to reject
            vi.spyOn(FilterUpdateApi, 'updateCustomFilters').mockRejectedValue(new Error('network'));

            // emulate extension update availability
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            await triggerCheckConditions();

            expect(mockReload).toHaveBeenCalledTimes(1);
            expect(onUpdateApplyFailed).not.toHaveBeenCalled();
        });
    });
});
