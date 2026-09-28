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

import { FiltersApi } from '../../../../../Extension/src/background/api/filters/main';
import {
    AutoDisableFiltersService,
    UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
} from '../../../../../Extension/src/background/services/auto-disable-filters-mv2';
import {
    AutoDisableFiltersStorage,
    autoDisableFiltersStorage,
    filterStateStorage,
    groupStateStorage,
    customFilterMetadataStorage,
    metadataStorage,
    settingsStorage,
} from '../../../../../Extension/src/background/storages';
import { browserStorage } from '../../../../../Extension/src/background/storages/shared-instances';
import {
    defaultAutoDisableFiltersState,
    type RegularFilterMetadata,
} from '../../../../../Extension/src/background/schema';
import { AUTO_DISABLE_FILTERS_KEY } from '../../../../../Extension/src/common/constants';
import { logger } from '../../../../../Extension/src/common/logger';
import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { mockLocalStorage } from '../../../../helpers';

vi.mock('filters-update-api', () => ({
    FilterUpdateApi: { checkForFiltersUpdates: vi.fn(() => Promise.resolve()) },
}));
vi.mock('../../../../../Extension/src/background/engine', () => ({
    engine: { debounceUpdate: vi.fn() },
}));

const ACTIVE_DAY = 105;

const filters = [
    {
        filterId: 1, groupId: 1, name: 'Spanish', languages: ['es'],
    },
    {
        filterId: 2, groupId: 1, name: 'Spanish-Portuguese', languages: ['es', 'pt'],
    },
] as RegularFilterMetadata[];

describe.skipIf(__IS_MV3__)('Language filter enable allowance', () => {
    beforeEach(() => {
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });
        groupStateStorage.setData({ 1: { enabled: true, touched: true } });
        customFilterMetadataStorage.setCache([]);
        autoDisableFiltersStorage.setCache({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: ACTIVE_DAY,
            lastCountedDayUtc: '2026-09-16',
            lastVisitedActiveDayByLanguage: { de: ACTIVE_DAY },
            pendingNotificationFilterIds: [1, 2],
        });
        filterStateStorage.setData({
            1: {
                enabled: false, installed: true, loaded: true, disabledAsUnused: true,
            },
            2: {
                enabled: true, installed: true, loaded: true, disabledAsUnused: false,
            },
        });
        vi.spyOn(metadataStorage, 'getFilter')
            .mockImplementation((id) => filters.find((filter) => filter.filterId === id));
        vi.spyOn(metadataStorage, 'getFilters').mockReturnValue(filters);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('gives a manually enabled filter its own allowance without changing language history', async () => {
        await FiltersApi.loadAndEnableFilters([1]);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(filterStateStorage.get(1)).toMatchObject({ enabled: true, disabledAsUnused: false });
        expect(filterStateStorage.get(2)?.enabled).toBe(false);
        await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
            activeDayCounter: ACTIVE_DAY,
            enabledAtActiveDayByFilter: { 1: ACTIVE_DAY },
            lastVisitedActiveDayByLanguage: { de: ACTIVE_DAY },
            pendingNotificationFilterIds: [2],
        });
    });

    it('removes an enabled filter from the pending notification', async () => {
        await FiltersApi.enableFilters([1]);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
            pendingNotificationFilterIds: [2],
        });
    });

    it('keeps a filter enabled one active day before its allowance expires', async () => {
        await FiltersApi.enableFilters([1]);
        const state = await autoDisableFiltersStorage.getState();
        autoDisableFiltersStorage.setCache({
            ...state,
            activeDayCounter: ACTIVE_DAY + UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS - 1,
        });

        // Repeated enables or rule reloads must not extend the original allowance.
        await FiltersApi.enableFilters([1]);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        expect((await autoDisableFiltersStorage.getState()).enabledAtActiveDayByFilter[1]).toBe(ACTIVE_DAY);
    });

    it('disables a filter when its allowance expires', async () => {
        await FiltersApi.enableFilters([1]);
        const state = await autoDisableFiltersStorage.getState();
        autoDisableFiltersStorage.setCache({
            ...state,
            activeDayCounter: ACTIVE_DAY + UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
        });

        // Repeated enables or rule reloads must not extend the original allowance.
        await FiltersApi.enableFilters([1]);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect((await autoDisableFiltersStorage.getState()).enabledAtActiveDayByFilter[1]).toBe(ACTIVE_DAY);
    });

    it('starts a fresh allowance when an expired filter is re-enabled', async () => {
        const expiredDay = ACTIVE_DAY + UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS;
        await FiltersApi.enableFilters([1]);
        autoDisableFiltersStorage.setCache({
            ...await autoDisableFiltersStorage.getState(),
            activeDayCounter: expiredDay,
        });
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();
        expect(filterStateStorage.get(1)?.enabled).toBe(false);

        await FiltersApi.enableFilters([1]);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        expect((await autoDisableFiltersStorage.getState()).enabledAtActiveDayByFilter[1]).toBe(expiredDay);
    });

    it('enables unrelated filters without accessing language tracking storage', async () => {
        filterStateStorage.set(3, {
            enabled: false, installed: true, loaded: true, disabledAsUnused: false,
        });
        const update = vi.spyOn(autoDisableFiltersStorage, 'update');
        await FiltersApi.enableFilters([3]);
        expect(filterStateStorage.get(3)?.enabled).toBe(true);
        expect(update).not.toHaveBeenCalled();
    });

    it('uses the default allowance at day zero without writing tracking state', async () => {
        autoDisableFiltersStorage.setCache({ ...defaultAutoDisableFiltersState });
        const write = vi.spyOn(browserStorage, 'set');

        await FiltersApi.enableFilters([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        expect(write).not.toHaveBeenCalledWith(AUTO_DISABLE_FILTERS_KEY, expect.anything());
        expect((await autoDisableFiltersStorage.getState()).enabledAtActiveDayByFilter).toStrictEqual({});
    });

    it('enables a filter when its new allowance cannot be saved', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await FiltersApi.enableFilters([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        const { enabledAtActiveDayByFilter } = await autoDisableFiltersStorage.getState();
        expect(enabledAtActiveDayByFilter).toStrictEqual({ 1: ACTIVE_DAY });
    });

    it('enables a filter when the tracking state cannot be read', async () => {
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(autoDisableFiltersStorage, 'update').mockRejectedValueOnce(new Error('read failed'));

        await FiltersApi.enableFilters([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('[ext.FiltersApi.enableFilters]'),
            expect.anything(),
        );
    });

    it('serializes a re-enable with an in-flight expiry check', async () => {
        filterStateStorage.enableFilters([1]);
        const { promise, resolve } = Promise.withResolvers<void>();
        const originalSet = browserStorage.set.bind(browserStorage);
        vi.spyOn(browserStorage, 'set').mockImplementationOnce(async (key, value) => {
            await promise;
            await originalSet(key, value);
        });
        const check = AutoDisableFiltersService.checkAndDisableUnusedFilters();
        const enable = FiltersApi.enableFilters([1]);
        resolve();
        await Promise.all([check, enable]);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
    });
});
