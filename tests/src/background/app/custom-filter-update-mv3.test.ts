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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { App } from '../../../../Extension/src/background/app/app-mv3';
import { logger } from '../../../../Extension/src/common/logger';

const mocks = vi.hoisted(() => ({
    asyncInit: vi.fn(),
    updateCustomFilters: vi.fn(),
    hasPendingManualUpdateIntent: vi.fn(),
    getManualExtensionUpdateData: vi.fn(),
    handleExtensionReloadOnUpdate: vi.fn(),
}));

vi.mock('../../../../Extension/src/background/app/app-common', () => ({
    AppCommon: class {
        static asyncInit = mocks.asyncInit;
    },
}));

vi.mock('../../../../Extension/src/background/api', () => ({
    FilterUpdateApi: {
        updateCustomFilters: mocks.updateCustomFilters,
    },
    FiltersApi: {},
    network: {},
}));

vi.mock('../../../../Extension/src/background/services/extension-update/extension-update-service-mv3', () => ({
    ExtensionUpdateService: {
        hasPendingManualUpdateIntent: mocks.hasPendingManualUpdateIntent,
        getManualExtensionUpdateData: mocks.getManualExtensionUpdateData,
        handleExtensionReloadOnUpdate: mocks.handleExtensionReloadOnUpdate,
    },
}));

vi.mock('../../../../Extension/src/background/services/rules-limits/rules-limits-service-mv3', () => ({
    rulesLimitsService: {},
}));

vi.mock('../../../../Extension/src/background/engine', () => ({
    engine: {},
}));

/**
 * Exposes the asynchronous startup hook without initializing unrelated services.
 */
class TestApp extends App {
    /**
     * @inheritdoc
     */
    public static override asyncInit(): Promise<boolean> {
        return super.asyncInit();
    }
}

describe.skipIf(!__IS_MV3__)('App custom filter refresh after an MV3 update', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.asyncInit.mockResolvedValue(true);
        mocks.updateCustomFilters.mockResolvedValue(undefined);
        mocks.hasPendingManualUpdateIntent.mockResolvedValue(false);
        mocks.handleExtensionReloadOnUpdate.mockResolvedValue(undefined);
    });

    it('keeps automatic reload refreshes patch-capable with a no-argument call', async () => {
        await expect(TestApp.asyncInit()).resolves.toBe(true);

        expect(mocks.updateCustomFilters).toHaveBeenCalledExactlyOnceWith();
        expect(mocks.handleExtensionReloadOnUpdate).toHaveBeenCalledExactlyOnceWith(true, true);
    });

    it('preserves a pending manual full-download request across reload', async () => {
        mocks.hasPendingManualUpdateIntent.mockResolvedValue(true);

        await expect(TestApp.asyncInit()).resolves.toBe(true);

        expect(mocks.hasPendingManualUpdateIntent).toHaveBeenCalledOnce();
        expect(mocks.getManualExtensionUpdateData).not.toHaveBeenCalled();
        expect(mocks.updateCustomFilters).toHaveBeenCalledExactlyOnceWith(true);
        expect(mocks.handleExtensionReloadOnUpdate).toHaveBeenCalledExactlyOnceWith(true, true);
    });

    it('ignores stale manual metadata from an earlier update cycle', async () => {
        mocks.hasPendingManualUpdateIntent.mockResolvedValue(false);

        await expect(TestApp.asyncInit()).resolves.toBe(true);

        expect(mocks.updateCustomFilters).toHaveBeenCalledExactlyOnceWith();
    });

    it('passes a deferred manual refresh failure to reload handling without failing startup', async () => {
        const failure = new AggregateError([new Error('Download failed')], 'Failed to update custom filters');
        mocks.hasPendingManualUpdateIntent.mockResolvedValue(true);
        mocks.updateCustomFilters.mockRejectedValue(failure);

        await expect(TestApp.asyncInit()).resolves.toBe(true);

        expect(mocks.updateCustomFilters).toHaveBeenCalledExactlyOnceWith(true);
        expect(mocks.getManualExtensionUpdateData).not.toHaveBeenCalled();
        expect(mocks.handleExtensionReloadOnUpdate).toHaveBeenCalledExactlyOnceWith(true, false);
        expect(logger.error).toHaveBeenCalledWith(
            '[ext.App.asyncInit]: Failed to update custom filters after extension update:',
            failure,
        );
    });

    it('continues startup after an automatic refresh failure', async () => {
        mocks.updateCustomFilters.mockRejectedValue(new Error('Download failed'));

        await expect(TestApp.asyncInit()).resolves.toBe(true);

        expect(mocks.updateCustomFilters).toHaveBeenCalledExactlyOnceWith();
        expect(mocks.handleExtensionReloadOnUpdate).toHaveBeenCalledExactlyOnceWith(true, false);
    });

    it('does not refresh custom filters when the extension version did not change', async () => {
        mocks.asyncInit.mockResolvedValue(false);

        await expect(TestApp.asyncInit()).resolves.toBe(false);

        expect(mocks.updateCustomFilters).not.toHaveBeenCalled();
        expect(mocks.hasPendingManualUpdateIntent).not.toHaveBeenCalled();
        expect(mocks.handleExtensionReloadOnUpdate).toHaveBeenCalledExactlyOnceWith(false, true);
    });
});
