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

import { CustomFilterApi } from '../../../../../Extension/src/background/api/filters/custom';
import { FiltersApi } from '../../../../../Extension/src/background/api/filters/main';
import { FilterUpdateApi } from '../../../../../Extension/src/background/api/filters/update/update-mv3';
import { engine } from '../../../../../Extension/src/background/engine';
import { type FilterVersionData } from '../../../../../Extension/src/background/schema';
import { filterVersionStorage } from '../../../../../Extension/src/background/storages';
import { CUSTOM_FILTERS_START_ID } from '../../../../../Extension/src/common/constants';
import { logger } from '../../../../../Extension/src/common/logger';

vi.mock('../../../../../Extension/src/background/api/filters/custom', () => ({
    CustomFilterApi: {
        updateFilter: vi.fn(),
    },
}));

vi.mock('../../../../../Extension/src/background/api/filters/main', () => ({
    FiltersApi: {
        getInstalledAndEnabledFiltersIds: vi.fn(),
    },
}));

vi.mock('../../../../../Extension/src/background/engine', () => ({
    engine: {
        update: vi.fn(),
    },
}));

vi.mock('../../../../../Extension/src/background/storages', () => ({
    filterVersionStorage: {
        get: vi.fn(),
    },
}));

describe.skipIf(!__IS_MV3__)('MV3 custom filter updates', () => {
    const firstFilterId = CUSTOM_FILTERS_START_ID;
    const secondFilterId = CUSTOM_FILTERS_START_ID + 1;
    const now = new Date('2026-09-18T12:00:00.000Z').getTime();
    const filterVersion: FilterVersionData = {
        version: '1.0.0.0',
        lastCheckTime: now,
        lastScheduledCheckTime: now,
        lastUpdateTime: now,
        expires: 3600,
        diffPath: 'patches/1.0.0.0',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(now);
        vi.mocked(FiltersApi.getInstalledAndEnabledFiltersIds).mockReturnValue([2, firstFilterId, secondFilterId]);
        vi.mocked(filterVersionStorage.get).mockReturnValue(filterVersion);
        vi.mocked(CustomFilterApi.updateFilter).mockResolvedValue(null);
        vi.mocked(engine.update).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses patches by default while installed and enabled custom filters are fresh', async () => {
        await FilterUpdateApi.updateCustomFilters();

        expect(CustomFilterApi.updateFilter).toHaveBeenCalledTimes(2);
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(1, {
            filterId: firstFilterId,
            ignorePatches: false,
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(2, {
            filterId: secondFilterId,
            ignorePatches: false,
        });
        expect(engine.update).toHaveBeenCalledOnce();
    });

    it.each([
        { elapsedAfterExpiryMs: -1, ignorePatches: false },
        { elapsedAfterExpiryMs: 0, ignorePatches: true },
        { elapsedAfterExpiryMs: 1, ignorePatches: true },
    ])('uses Expires to select full syncs at expiry offset $elapsedAfterExpiryMs ms', async ({
        elapsedAfterExpiryMs,
        ignorePatches,
    }) => {
        vi.mocked(filterVersionStorage.get).mockReturnValue({
            ...filterVersion,
            lastCheckTime: now - filterVersion.expires * 1000 - elapsedAfterExpiryMs,
        });

        await FilterUpdateApi.updateCustomFilters();

        expect(CustomFilterApi.updateFilter).toHaveBeenCalledTimes(2);
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(1, {
            filterId: firstFilterId,
            ignorePatches,
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(2, {
            filterId: secondFilterId,
            ignorePatches,
        });
    });

    it('requests full downloads when version metadata is missing', async () => {
        vi.mocked(filterVersionStorage.get).mockReturnValue(undefined);

        await FilterUpdateApi.updateCustomFilters();

        expect(CustomFilterApi.updateFilter).toHaveBeenCalledTimes(2);
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(1, {
            filterId: firstFilterId,
            ignorePatches: true,
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(2, {
            filterId: secondFilterId,
            ignorePatches: true,
        });
    });

    it('uses the per-filter full-check clock rather than patch activity or the wait flag', async () => {
        vi.mocked(filterVersionStorage.get).mockImplementation((filterId) => ({
            ...filterVersion,
            lastCheckTime: filterId === firstFilterId ? now : now - filterVersion.expires * 1000,
            shouldWaitFullUpdate: true,
        }));

        await FilterUpdateApi.updateCustomFilters();

        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(1, {
            filterId: firstFilterId,
            ignorePatches: false,
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(2, {
            filterId: secondFilterId,
            ignorePatches: true,
        });
    });

    it('forwards the manual full-download flag to every custom filter', async () => {
        await FilterUpdateApi.updateCustomFilters(true);

        expect(CustomFilterApi.updateFilter).toHaveBeenCalledTimes(2);
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(1, {
            filterId: firstFilterId,
            ignorePatches: true,
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenNthCalledWith(2, {
            filterId: secondFilterId,
            ignorePatches: true,
        });
        expect(engine.update).toHaveBeenCalledOnce();
        expect(filterVersionStorage.get).not.toHaveBeenCalled();
    });

    it('updates healthy filters and the engine before rejecting a partial failure', async () => {
        const thirdFilterId = CUSTOM_FILTERS_START_ID + 2;
        const failure = new Error('Download failed');
        const updatedFilters: number[] = [];
        vi.mocked(FiltersApi.getInstalledAndEnabledFiltersIds)
            .mockReturnValue([firstFilterId, secondFilterId, thirdFilterId]);
        vi.mocked(CustomFilterApi.updateFilter).mockImplementation(async ({ filterId }) => {
            if (filterId === secondFilterId) {
                throw failure;
            }

            await Promise.resolve();
            updatedFilters.push(filterId);
            return null;
        });
        vi.mocked(engine.update).mockImplementation(async () => {
            expect(updatedFilters).toEqual([firstFilterId, thirdFilterId]);
        });

        const update = FilterUpdateApi.updateCustomFilters(true);

        await expect(update).rejects.toBeInstanceOf(AggregateError);
        await expect(update).rejects.toMatchObject({
            errors: [{
                message: `Failed to update custom filter ${secondFilterId}`,
                cause: failure,
            }],
        });
        expect(CustomFilterApi.updateFilter).toHaveBeenCalledTimes(3);
        expect(engine.update).toHaveBeenCalledOnce();
        expect(logger.error).toHaveBeenCalledExactlyOnceWith(
            expect.stringContaining(`custom filter ${secondFilterId}`),
            failure,
        );
    });

    it('includes every failed filter in the aggregate error and logs', async () => {
        const firstFailure = new Error('First download failed');
        const secondFailure = new Error('Second download failed');
        vi.mocked(CustomFilterApi.updateFilter)
            .mockRejectedValueOnce(firstFailure)
            .mockRejectedValueOnce(secondFailure);

        await expect(FilterUpdateApi.updateCustomFilters()).rejects.toMatchObject({
            errors: [
                { message: `Failed to update custom filter ${firstFilterId}`, cause: firstFailure },
                { message: `Failed to update custom filter ${secondFilterId}`, cause: secondFailure },
            ],
        });
        expect(logger.error).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining(`custom filter ${firstFilterId}`),
            firstFailure,
        );
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining(`custom filter ${secondFilterId}`),
            secondFailure,
        );
        expect(engine.update).toHaveBeenCalledOnce();
    });

    it('still refreshes the engine when there are no enabled custom filters', async () => {
        vi.mocked(FiltersApi.getInstalledAndEnabledFiltersIds).mockReturnValue([2, 3]);

        await FilterUpdateApi.updateCustomFilters();

        expect(CustomFilterApi.updateFilter).not.toHaveBeenCalled();
        expect(engine.update).toHaveBeenCalledOnce();
    });
});
