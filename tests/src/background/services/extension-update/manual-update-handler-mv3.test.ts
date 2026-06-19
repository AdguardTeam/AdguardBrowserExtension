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
import { FilterUpdateService } from '../../../../../Extension/src/background/services/filter-update/filter-update-mv3';
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
import {
    MANUAL_EXTENSION_UPDATE_KEY,
    MANUAL_EXTENSION_UPDATE_PAGE_OPENED_KEY,
} from '../../../../../Extension/src/common/constants';
import { ForwardFrom } from '../../../../../Extension/src/common/forward';

// Mock BackendUpdateChecker to control its return values
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

// Mock FilterUpdateService to track last check time persistence
vi.mock(
    '../../../../../Extension/src/background/services/filter-update/filter-update-mv3',
    () => ({
        FilterUpdateService: {
            setLastCheckTimeMs: vi.fn(() => Promise.resolve()),
            getLastCheckTimeMs: vi.fn(() => Promise.resolve(0)),
        },
    }),
);

// Mock PagesApi at the pages index level (used by handleReload to open pages).
// We mock both openFiltersOnSettingsPage and openExtensionPopup as
// resolved no-ops so handleReload can complete without real chrome APIs.
vi.mock(
    '../../../../../Extension/src/background/api/ui/pages/index',
    () => ({
        PagesApi: class {
            static openFiltersOnSettingsPage = vi.fn().mockResolvedValue(undefined);

            static openExtensionPopup = vi.fn().mockResolvedValue(undefined);
        },
        pagesApi: {
            openFiltersOnSettingsPage: vi.fn().mockResolvedValue(undefined),
            openExtensionPopup: vi.fn().mockResolvedValue(undefined),
        },
    }),
);

// Mock getRunInfo
vi.mock(
    '../../../../../Extension/src/background/utils/run-info',
    () => ({
        getRunInfo: vi.fn().mockResolvedValue({ currentAppVersion: '5.2.0.1' }),
    }),
);

// Mock browserStorage
const { mockBrowserStorageGet } = vi.hoisted(() => ({
    mockBrowserStorageGet: vi.fn().mockResolvedValue(undefined),
}));
vi.mock(
    '../../../../../Extension/src/background/storages',
    () => ({
        browserStorage: {
            get: mockBrowserStorageGet,
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined),
        },
    }),
);

// Mock ContentScriptInjector
vi.mock(
    '../../../../../Extension/src/background/content-script-injector',
    () => ({
        ContentScriptInjector: {
            setUpdateFlag: vi.fn().mockResolvedValue(undefined),
        },
    }),
);

// Mock chrome.runtime.requestUpdateCheck and chrome.runtime.reload
const mockRequestUpdateCheck = vi.fn();
const mockReload = vi.fn();
const globalChrome = (global as Record<string, unknown>).chrome;
if (globalChrome && typeof globalChrome === 'object') {
    const runtime = (globalChrome as Record<string, unknown>).runtime;
    if (runtime && typeof runtime === 'object') {
        Object.defineProperty(runtime, 'requestUpdateCheck', {
            value: mockRequestUpdateCheck,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(runtime, 'reload', {
            value: mockReload,
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

    describe.skipIf(!__IS_MV3__)('check() — custom filters update when no extension update', () => {
        it('calls updateCustomFilters when no extension update is found', async () => {
            vi.spyOn(FilterUpdateApi, 'updateCustomFilters').mockResolvedValue(undefined);

            // Backend says no update
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            await handler.check();

            expect(FilterUpdateApi.updateCustomFilters).toHaveBeenCalledTimes(1);
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });

        it('still completes check when updateCustomFilters fails', async () => {
            vi.spyOn(FilterUpdateApi, 'updateCustomFilters').mockRejectedValue(new Error('network'));

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            await handler.check();

            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });
    });

    describe.skipIf(!__IS_MV3__)('check() — persists last check time', () => {
        it('calls setLastCheckTimeMs after a successful check with no update', async () => {
            const before = Date.now();

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            await handler.check();

            expect(FilterUpdateService.setLastCheckTimeMs).toHaveBeenCalledTimes(1);
            const [savedTs] = vi.mocked(FilterUpdateService.setLastCheckTimeMs).mock.calls[0]!;
            expect(savedTs).toBeGreaterThanOrEqual(before);
            expect(savedTs).toBeLessThanOrEqual(Date.now());
        });

        it('returns the confirmed timestamp in the response', async () => {
            const before = Date.now();

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            const result = await handler.check();

            expect(result.lastCheckTimeMs).not.toBeNull();
            expect(result.lastCheckTimeMs).toBeGreaterThanOrEqual(before);
            expect(result.lastCheckTimeMs).toBeLessThanOrEqual(Date.now());
        });

        it('returns null when setLastCheckTimeMs fails', async () => {
            vi.mocked(FilterUpdateService.setLastCheckTimeMs).mockRejectedValue(
                new Error('storage error'),
            );

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            const result = await handler.check();

            expect(result.lastCheckTimeMs).toBeNull();
            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });

        it('still calls onUpdateCheckComplete when setLastCheckTimeMs fails', async () => {
            vi.mocked(FilterUpdateService.setLastCheckTimeMs).mockRejectedValue(
                new Error('storage error'),
            );

            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.NoContent,
            });

            await handler.check();

            expect(onUpdateCheckComplete).toHaveBeenCalledWith(false);
        });

        it('returns null when extension update is available (no timestamp path)', async () => {
            vi.mocked(BackendUpdateChecker.checkUpdate).mockResolvedValue({
                status: UpdateCheckStatus.UpdateAvailable,
                version: '5.3.0.18',
            });

            // requestUpdateCheck succeeds and confirms update is available —
            // handler enters the "wait for Chrome event" early-return path.
            mockRequestUpdateCheck.mockResolvedValue({
                status: 'update_available',
                version: '5.3.0.18',
            });

            const result = await handler.check();

            // When update is available and we wait for Chrome event, null is returned
            expect(result.lastCheckTimeMs).toBeNull();
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

    describe('peekUpdateData() — non-destructive read', () => {
        it('returns data when it exists in storage', async () => {
            const testData = {
                initVersion: '5.2.0.1',
                pageToOpenAfterReload: 'options_screen',
                isOk: true,
            };
            mockBrowserStorageGet.mockResolvedValue(JSON.stringify(testData));

            const result = await ManualUpdateHandler.peekUpdateData();

            expect(result).toEqual(testData);
            expect(mockBrowserStorageGet).toHaveBeenCalled();
        });

        it('returns null when storage is empty', async () => {
            mockBrowserStorageGet.mockResolvedValue(undefined);

            const result = await ManualUpdateHandler.peekUpdateData();

            expect(result).toBeNull();
        });

        it('does NOT remove data from storage after reading', async () => {
            const testData = {
                initVersion: '5.2.0.1',
                pageToOpenAfterReload: 'options_screen',
                isOk: true,
            };
            mockBrowserStorageGet.mockResolvedValue(JSON.stringify(testData));

            await ManualUpdateHandler.peekUpdateData();

            // Verify that browserStorage.remove was NOT called
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );
            expect(browserStorage.remove).not.toHaveBeenCalled();
        });

        it('returns null when data is invalid JSON', async () => {
            mockBrowserStorageGet.mockResolvedValue('not valid json');

            const result = await ManualUpdateHandler.peekUpdateData();

            expect(result).toBeNull();
        });
    });

    describe('handleReload() — data persistence and page-opened guard', () => {
        it('does not remove MANUAL_EXTENSION_UPDATE_KEY after opening options page', async () => {
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );
            const { PagesApi } = await import(
                '../../../../../Extension/src/background/api/ui/pages/index'
            );

            mockBrowserStorageGet
                .mockResolvedValueOnce(JSON.stringify({
                    initVersion: '5.2.0.0',
                    pageToOpenAfterReload: ForwardFrom.Options,
                    isOk: true,
                }))
                // Second call is for wasPageOpened flag
                .mockResolvedValueOnce(undefined);

            await ManualUpdateHandler.handleReload(true);

            // Key must still exist for UI consumption
            const removeCalls = (browserStorage.remove as ReturnType<typeof vi.fn>).mock.calls;
            const wasMainKeyRemoved = removeCalls.some(
                (call: unknown[]) => call[0] === MANUAL_EXTENSION_UPDATE_KEY,
            );
            expect(wasMainKeyRemoved).toBe(false);

            // Page-opened flag must be set
            expect(browserStorage.set).toHaveBeenCalledWith(
                MANUAL_EXTENSION_UPDATE_PAGE_OPENED_KEY,
                true,
            );

            // Page must have been opened
            expect(PagesApi.openFiltersOnSettingsPage).toHaveBeenCalled();
        });

        it('does not re-open page when page-opened flag is already set', async () => {
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );
            const { PagesApi } = await import(
                '../../../../../Extension/src/background/api/ui/pages/index'
            );

            // Return metadata with pageToOpenAfterReload
            // First call: retrieveUpdateData returns metadata
            mockBrowserStorageGet.mockResolvedValueOnce(JSON.stringify({
                initVersion: '5.2.0.0',
                pageToOpenAfterReload: ForwardFrom.Popup,
                isOk: true,
            }));
            // Second call: page-opened flag is set
            mockBrowserStorageGet.mockResolvedValueOnce(true);

            await ManualUpdateHandler.handleReload(false);

            // Page must NOT be opened again
            expect(PagesApi.openExtensionPopup).not.toHaveBeenCalled();
            expect(PagesApi.openFiltersOnSettingsPage).not.toHaveBeenCalled();

            // Key must NOT be modified
            const setCalls = (browserStorage.set as ReturnType<typeof vi.fn>).mock.calls;
            const wasKeyUpdated = setCalls.some(
                (call: unknown[]) => call[0] === MANUAL_EXTENSION_UPDATE_KEY,
            );
            expect(wasKeyUpdated).toBe(false);
        });

        it('sets isOk to false when update failed (isUpdate=false) on first open', async () => {
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );

            mockBrowserStorageGet
                .mockResolvedValueOnce(JSON.stringify({
                    initVersion: '5.2.0.0',
                    pageToOpenAfterReload: ForwardFrom.Options,
                    isOk: true,
                }))
                // page-opened flag not set
                .mockResolvedValueOnce(undefined);

            await ManualUpdateHandler.handleReload(false);

            // isOk must have been changed to false
            expect(browserStorage.set).toHaveBeenCalledWith(
                MANUAL_EXTENSION_UPDATE_KEY,
                JSON.stringify({
                    initVersion: '5.2.0.0',
                    pageToOpenAfterReload: ForwardFrom.Options,
                    isOk: false,
                }),
            );
        });

        it('cleans up stale PAGE_OPENED_KEY when metadata is absent', async () => {
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );

            // No metadata in storage
            mockBrowserStorageGet.mockResolvedValue(undefined);

            await ManualUpdateHandler.handleReload(true);

            // PAGE_OPENED_KEY must be cleaned up
            expect(browserStorage.remove).toHaveBeenCalledWith(
                MANUAL_EXTENSION_UPDATE_PAGE_OPENED_KEY,
            );
        });
    });

    describe('getUpdateData() — consumes only the metadata key', () => {
        it('removes MANUAL_EXTENSION_UPDATE_KEY but NOT MANUAL_EXTENSION_UPDATE_PAGE_OPENED_KEY', async () => {
            const { browserStorage } = await import(
                '../../../../../Extension/src/background/storages'
            );

            const testData = {
                initVersion: '5.2.0.0',
                pageToOpenAfterReload: ForwardFrom.Popup,
                isOk: true,
            };

            mockBrowserStorageGet.mockResolvedValue(JSON.stringify(testData));

            const result = await ManualUpdateHandler.getUpdateData();

            expect(result).toEqual(testData);
            expect(browserStorage.remove).toHaveBeenCalledWith(MANUAL_EXTENSION_UPDATE_KEY);
            // PAGE_OPENED_KEY must NOT be removed — its lifecycle is managed by handleReload()
            expect(browserStorage.remove).not.toHaveBeenCalledWith(MANUAL_EXTENSION_UPDATE_PAGE_OPENED_KEY);
        });
    });
});
