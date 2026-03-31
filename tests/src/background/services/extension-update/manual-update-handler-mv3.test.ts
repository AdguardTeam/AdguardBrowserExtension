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

import {
    ManualUpdateHandler,
} from '../../../../../Extension/src/background/services/extension-update/manual-update-handler-mv3';
import {
    BackendUpdateChecker,
} from '../../../../../Extension/src/background/services/extension-update/backend-update-checker-mv3';
import {
    AutoUpdateStateManager,
} from '../../../../../Extension/src/background/services/extension-update/auto-update-state-manager-mv3';
import { UpdateCheckStatus } from '../../../../../Extension/src/background/services/extension-update/types';

// Mock BackendUpdateChecker to control its return values
vi.mock(
    '../../../../../Extension/src/background/services/extension-update/backend-update-checker-mv3',
    () => ({
        BackendUpdateChecker: {
            checkUpdate: vi.fn(),
        },
    }),
);

// Mock sleepIfNecessary to avoid real delays in tests
vi.mock(
    '../../../../../Extension/src/common/sleep-utils',
    () => ({
        sleepIfNecessary: vi.fn(),
    }),
);

// Mock chrome.runtime.requestUpdateCheck
const mockRequestUpdateCheck = vi.fn();
const globalChrome = (global as Record<string, unknown>).chrome;
if (globalChrome && typeof globalChrome === 'object') {
    const runtime = (globalChrome as Record<string, unknown>).runtime;
    if (runtime && typeof runtime === 'object') {
        Object.defineProperty(runtime, 'requestUpdateCheck', {
            value: mockRequestUpdateCheck,
            writable: true,
            configurable: true,
        });
    }
}

describe('ManualUpdateHandler', () => {
    let handler: ManualUpdateHandler;
    let stateManager: AutoUpdateStateManager;
    const onUpdateCheckStart = vi.fn();
    const onUpdateCheckComplete = vi.fn();
    const onUpdateApplyStart = vi.fn();
    const onUpdateApplyFailed = vi.fn();

    beforeEach(async () => {
        vi.clearAllMocks();

        stateManager = new AutoUpdateStateManager();
        await stateManager.init();

        handler = new ManualUpdateHandler({
            stateManager,
            onUpdateCheckStart,
            onUpdateCheckComplete,
            onUpdateApplyStart,
            onUpdateApplyFailed,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('check() — pre-download backend check', () => {
        it('calls requestUpdateCheck when backend reports update available', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            mockRequestUpdateCheck.mockResolvedValue({
                status: 'update_available',
                version: '5.3.0.18',
            });

            await handler.check();

            expect(BackendUpdateChecker.checkUpdate).toHaveBeenCalledTimes(1);
            expect(mockRequestUpdateCheck).toHaveBeenCalledTimes(1);
        });

        it('does NOT call requestUpdateCheck when backend returns 204 (blocked)', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            await handler.check();

            expect(BackendUpdateChecker.checkUpdate).toHaveBeenCalledTimes(1);
            expect(mockRequestUpdateCheck).not.toHaveBeenCalled();
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });

        it('does NOT call requestUpdateCheck when backend returns error', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.Error,
                error: new Error('Network error'),
            });

            await handler.check();

            expect(BackendUpdateChecker.checkUpdate).toHaveBeenCalledTimes(1);
            expect(mockRequestUpdateCheck).not.toHaveBeenCalled();
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });
    });

    describe('onUpdateAvailable() — post-download analytics', () => {
        it('makes a fire-and-forget backend call for analytics', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            await handler.onUpdateAvailable();

            // The analytics call is fire-and-forget, so it should have been initiated
            expect(BackendUpdateChecker.checkUpdate).toHaveBeenCalledTimes(1);
            // The handler should still notify completion regardless
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(true);
        });

        it('notifies completion even when analytics call fails', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockRejectedValue(
                new Error('analytics failure'),
            );

            await handler.onUpdateAvailable();

            // The handler should still notify completion — analytics failure is swallowed
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(true);
        });
    });
});
