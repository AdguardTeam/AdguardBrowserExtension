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

import { defaultSettings } from '../../../../Extension/src/common/settings';
import { logger } from '../../../../Extension/src/common/logger';
import {
    defaultAutoDisableFiltersState,
    type AutoDisableFiltersStorageData,
    type RegularFilterMetadata,
    SettingOption,
} from '../../../../Extension/src/background/schema';
import {
    autoDisableFiltersStorage,
    filterStateStorage,
    metadataStorage,
    settingsStorage,
} from '../../../../Extension/src/background/storages';
import {
    AutoDisableFiltersService,
    UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
    applyProcessedPage,
    findUnusedLanguageFilterIds,
} from '../../../../Extension/src/background/services/auto-disable-filters-mv2';
import { AutoDisableFiltersStorage } from '../../../../Extension/src/background/storages/auto-disable-filters';
import { browserStorage } from '../../../../Extension/src/background/storages/shared-instances';
import { mockLocalStorage } from '../../../helpers';

const mocks = vi.hoisted(() => ({
    getEnabledFilters: vi.fn(),
    disableFilters: vi.fn(),
    debounceUpdate: vi.fn(),
}));

vi.mock('../../../../Extension/src/background/api/filters/main', () => ({
    FiltersApi: {
        getEnabledFilters: mocks.getEnabledFilters,
        disableFilters: mocks.disableFilters,
    },
}));

vi.mock('../../../../Extension/src/background/engine', () => ({
    engine: {
        debounceUpdate: mocks.debounceUpdate,
    },
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_DAY = Date.UTC(2026, 8, 14, 12, 0, 0);
const SECOND_DAY = Date.UTC(2026, 8, 15, 12, 0, 0);
const FIRST_DAY_UTC = '2026-09-14';
const SECOND_DAY_UTC = '2026-09-15';

const LAST_KEPT_AGE = UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS - 1;

const createFilter = (filterId: number, languages: string[]): RegularFilterMetadata => ({
    filterId,
    languages,
} as unknown as RegularFilterMetadata);

/**
 * Creates a tracking state on top of the default one.
 *
 * @param state Fields to override.
 *
 * @returns Tracking state.
 */
const createState = (state: Partial<AutoDisableFiltersStorageData>): AutoDisableFiltersStorageData => ({
    ...defaultAutoDisableFiltersState,
    ...state,
});

describe('applyProcessedPage', () => {
    it('counts the first processed page of a UTC date', () => {
        expect(applyProcessedPage(defaultAutoDisableFiltersState, 'de', FIRST_DAY)).toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: FIRST_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: 1 },
        }));
    });

    it('counts a UTC date once and remembers every language of that date', () => {
        let state = applyProcessedPage(defaultAutoDisableFiltersState, 'de', FIRST_DAY);
        state = applyProcessedPage(state, 'ru', FIRST_DAY + 1000);
        state = applyProcessedPage(state, 'de', FIRST_DAY + 2000);

        expect(state).toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: FIRST_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: 1, ru: 1 },
        }));
    });

    it('returns the same state for an already recorded day and language', () => {
        const state = applyProcessedPage(defaultAutoDisableFiltersState, 'de', FIRST_DAY);

        expect(applyProcessedPage(state, 'de', FIRST_DAY + 1000)).toBe(state);
    });

    it('counts an unknown language as activity without a language visit', () => {
        expect(applyProcessedPage(defaultAutoDisableFiltersState, undefined, FIRST_DAY)).toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: FIRST_DAY_UTC,
        }));
    });

    it('does not record an empty language', () => {
        expect(applyProcessedPage(defaultAutoDisableFiltersState, '', FIRST_DAY)).toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: FIRST_DAY_UTC,
        }));
    });

    it('counts a later UTC date exactly once regardless of the gap', () => {
        let state = applyProcessedPage(defaultAutoDisableFiltersState, 'de', FIRST_DAY);
        state = applyProcessedPage(state, 'de', FIRST_DAY + 35 * DAY_MS);
        state = applyProcessedPage(state, 'ru', FIRST_DAY + 35 * DAY_MS + 1000);

        expect(state).toStrictEqual(createState({
            activeDayCounter: 2,
            lastCountedDayUtc: '2026-10-19',
            lastVisitedActiveDayByLanguage: { de: 2, ru: 2 },
        }));
    });

    it('does not move the counter or the date backwards', () => {
        let state = applyProcessedPage(defaultAutoDisableFiltersState, 'de', SECOND_DAY);
        state = applyProcessedPage(state, 'ru', SECOND_DAY - DAY_MS);
        state = applyProcessedPage(state, 'ru', SECOND_DAY);

        expect(state).toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: SECOND_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: 1, ru: 1 },
        }));
    });

    it('counts both sides of UTC midnight as separate active days', () => {
        let state = applyProcessedPage(defaultAutoDisableFiltersState, 'de', Date.UTC(2026, 8, 14, 23, 59));
        state = applyProcessedPage(state, 'de', Date.UTC(2026, 8, 15, 0, 1));

        expect(state).toStrictEqual(createState({
            activeDayCounter: 2,
            lastCountedDayUtc: SECOND_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: 2 },
        }));
    });
});

describe('findUnusedLanguageFilterIds', () => {
    const filters = [
        createFilter(1, ['ru']),
        createFilter(9, ['es', 'pt']),
        createFilter(4, ['cs', 'sk']),
        createFilter(2, []),
    ];
    const activeDayCounter = 105;

    it('keeps a filter whose language was visited just below the threshold', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { ru: activeDayCounter - LAST_KEPT_AGE },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('treats a filter as unused when its language age reaches the threshold', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { ru: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));

        expect(unused).toStrictEqual([1]);
    });

    it('does not disable anything while the language history is empty', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1, 9, 4], createState({ activeDayCounter: 1000 }));

        expect(unused).toStrictEqual([]);
    });

    it('keeps a multi-language filter if at least one of its languages is recent', () => {
        const unused = findUnusedLanguageFilterIds(filters, [9, 4], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: {
                es: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
                pt: activeDayCounter - 1,
                cs: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
                sk: activeDayCounter - LAST_KEPT_AGE,
            },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('disables a multi-language filter when all of its languages are old', () => {
        const unused = findUnusedLanguageFilterIds(filters, [9, 4], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: {
                es: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS - 10,
                pt: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
                cs: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS - 10,
                sk: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS - 1,
            },
        }));

        expect(unused).toStrictEqual([9, 4]);
    });

    it('keeps a filter with a language without visits until the counter reaches the threshold', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1], createState({
            activeDayCounter: LAST_KEPT_AGE,
            lastVisitedActiveDayByLanguage: { de: LAST_KEPT_AGE },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('disables a filter with a language without visits once the counter reaches the threshold', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1], createState({
            activeDayCounter: UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS,
            lastVisitedActiveDayByLanguage: { de: UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));

        expect(unused).toStrictEqual([1]);
    });

    it('keeps a filter enabled less than the threshold ago', () => {
        const unused = findUnusedLanguageFilterIds(filters, [1], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter },
            enabledAtActiveDayByFilter: { 1: activeDayCounter - LAST_KEPT_AGE },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('ignores disabled filters', () => {
        const unused = findUnusedLanguageFilterIds(filters, [], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { ru: 1, es: 1, cs: 1 },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('ignores filters without languages', () => {
        const unused = findUnusedLanguageFilterIds(filters, [2], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { ru: 1 },
        }));

        expect(unused).toStrictEqual([]);
    });

    it('matches visits and filter languages by normalized locale', () => {
        const unused = findUnusedLanguageFilterIds([createFilter(1, ['ru'])], [1], createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { 'ru-RU': activeDayCounter - 1 },
        }));

        expect(unused).toStrictEqual([]);
    });
});

describe.skipIf(__IS_MV3__)('AutoDisableFiltersService', () => {
    const activeDayCounter = 105;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });
        autoDisableFiltersStorage.setCache(defaultAutoDisableFiltersState);
        vi.spyOn(filterStateStorage, 'disableFiltersAsUnused').mockImplementation(mocks.disableFilters);
        vi.spyOn(metadataStorage, 'getFilters').mockReturnValue([createFilter(1, ['de'])]);
        mocks.getEnabledFilters.mockReturnValue([1]);
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('records a visit and persists it', async () => {
        await AutoDisableFiltersService.recordVisit('tr', FIRST_DAY);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(createState({
            activeDayCounter: 1,
            lastCountedDayUtc: FIRST_DAY_UTC,
            lastVisitedActiveDayByLanguage: { tr: 1 },
        }));
    });

    it('logs a visit which cannot be recorded because the state cannot be read', async () => {
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(autoDisableFiltersStorage, 'update').mockRejectedValueOnce(new Error('read failed'));

        await expect(AutoDisableFiltersService.recordVisit('tr', FIRST_DAY)).resolves.toBeUndefined();

        expect(errorSpy).toHaveBeenCalledOnce();
    });

    it('does not disable anything when automatic filter selection is off', async () => {
        settingsStorage.set(SettingOption.DisableDetectFilters, true);
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));

        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(mocks.disableFilters).not.toHaveBeenCalled();
    });

    it('keeps a filter whose language was visited just below the threshold', async () => {
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - LAST_KEPT_AGE },
        }));

        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(mocks.disableFilters).not.toHaveBeenCalled();
        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([]);
        expect(mocks.debounceUpdate).not.toHaveBeenCalled();
    });

    it('disables a filter, marks it as unused and queues a notification at the threshold', async () => {
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));

        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(mocks.disableFilters).toHaveBeenCalledWith([1]);
        await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
            pendingNotificationFilterIds: [1],
        });
        expect(mocks.debounceUpdate).toHaveBeenCalledOnce();
    });

    it('does not duplicate a filter which is already pending', async () => {
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
            pendingNotificationFilterIds: [1, 2],
        }));

        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([1, 2]);
    });

    it('does not report a filter turned off manually while a previous write is in flight', async () => {
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastCountedDayUtc: FIRST_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));
        const { promise, resolve } = Promise.withResolvers<void>();
        const originalSet = browserStorage.set.bind(browserStorage);
        vi.spyOn(browserStorage, 'set').mockImplementationOnce(async (key, value) => {
            await promise;
            await originalSet(key, value);
        });

        const visit = AutoDisableFiltersService.recordVisit(undefined, SECOND_DAY);
        const check = AutoDisableFiltersService.checkAndDisableUnusedFilters();
        await vi.advanceTimersByTimeAsync(0);
        mocks.getEnabledFilters.mockReturnValue([]);
        resolve();
        await Promise.all([visit, check]);

        expect(mocks.disableFilters).not.toHaveBeenCalled();
        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([]);
    });

    it('keeps the disable and the notification when the write fails, and retries the write', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(mocks.disableFilters).toHaveBeenCalledWith([1]);
        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([1]);

        await vi.advanceTimersByTimeAsync(AutoDisableFiltersStorage.RETRY_DELAY_MS);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toMatchObject({
            pendingNotificationFilterIds: [1],
        });
    });

    it('counts the day and the language together before the expiry check', async () => {
        autoDisableFiltersStorage.setCache(createState({
            activeDayCounter: activeDayCounter - 1,
            lastCountedDayUtc: '2026-09-13',
            lastVisitedActiveDayByLanguage: { de: activeDayCounter - UNUSED_FILTERS_THRESHOLD_ACTIVE_DAYS },
        }));

        await AutoDisableFiltersService.recordVisit('de', FIRST_DAY);
        await AutoDisableFiltersService.checkAndDisableUnusedFilters();

        expect(mocks.disableFilters).not.toHaveBeenCalled();
        await expect(autoDisableFiltersStorage.getState()).resolves.toMatchObject({
            activeDayCounter,
            lastCountedDayUtc: FIRST_DAY_UTC,
            lastVisitedActiveDayByLanguage: { de: activeDayCounter },
        });
    });

    it('runs the check on init and reschedules it', async () => {
        const checkSpy = vi
            .spyOn(AutoDisableFiltersService, 'checkAndDisableUnusedFilters')
            .mockResolvedValue(undefined);

        AutoDisableFiltersService.init();

        await vi.advanceTimersByTimeAsync(0);
        expect(checkSpy).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
        expect(checkSpy).toHaveBeenCalledTimes(2);
    });
});
