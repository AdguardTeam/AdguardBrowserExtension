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
    type MockInstance,
    vi,
} from 'vitest';
import browser from 'webextension-polyfill';

import { AUTO_DISABLE_FILTERS_KEY } from '../../../../Extension/src/common/constants';
import { logger } from '../../../../Extension/src/common/logger';
import {
    defaultAutoDisableFiltersState,
    type AutoDisableFiltersStorageData,
} from '../../../../Extension/src/background/schema';
import { AutoDisableFiltersStorage } from '../../../../Extension/src/background/storages/auto-disable-filters';
import { browserStorage } from '../../../../Extension/src/background/storages/shared-instances';
import { mockLocalStorage } from '../../../helpers';

const { RETRY_DELAY_MS, MAX_RETRY_DELAY_MS } = AutoDisableFiltersStorage;

const savedState: AutoDisableFiltersStorageData = {
    activeDayCounter: 42,
    lastCountedDayUtc: '2026-09-14',
    lastVisitedActiveDayByLanguage: { de: 30, ru: 42 },
    enabledAtActiveDayByFilter: { 1: 12 },
    pendingNotificationFilterIds: [5],
};

/**
 * Returns a state with the active day counter increased by one.
 *
 * @param state Current state.
 *
 * @returns Next state.
 */
const countDay = (state: AutoDisableFiltersStorageData): AutoDisableFiltersStorageData => ({
    ...state,
    activeDayCounter: state.activeDayCounter + 1,
});

/**
 * Reads and parses the persisted state.
 *
 * @returns Parsed state or `undefined` when nothing is stored yet.
 */
const readStoredState = async (): Promise<unknown> => {
    const stored = await browser.storage.local.get(AUTO_DISABLE_FILTERS_KEY);
    const raw = stored[AUTO_DISABLE_FILTERS_KEY];

    return typeof raw === 'string' ? JSON.parse(raw) : undefined;
};

/**
 * Returns how many times the state was written to the storage.
 *
 * @returns Number of `browser.storage.local.set` calls.
 */
const getStorageWriteCount = (): number => (
    browser.storage.local.set as unknown as { callCount: number }
).callCount;

/**
 * Holds the next storage write until it is released.
 *
 * @returns Spy of the storage write and a function releasing the held write.
 */
const holdNextWrite = (): { writeSpy: MockInstance<typeof browserStorage.set>; release: () => void } => {
    const { promise, resolve } = Promise.withResolvers<void>();
    const originalSet = browserStorage.set.bind(browserStorage);
    const writeSpy = vi.spyOn(browserStorage, 'set').mockImplementationOnce(async (key, value) => {
        await promise;
        await originalSet(key, value);
    });

    return { writeSpy, release: resolve };
};

describe('AutoDisableFiltersStorage', () => {
    let storage: AutoDisableFiltersStorage;

    beforeEach(() => {
        vi.useFakeTimers();
        mockLocalStorage();
        storage = new AutoDisableFiltersStorage();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('starts with the default state', async () => {
        await expect(storage.getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('keeps saved state on reload', async () => {
        mockLocalStorage({ [AUTO_DISABLE_FILTERS_KEY]: JSON.stringify(savedState) });

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(savedState);
    });

    it('falls back to the default state when stored data is corrupted', async () => {
        mockLocalStorage({ [AUTO_DISABLE_FILTERS_KEY]: 'not-json' });
        vi.spyOn(logger, 'warn').mockImplementation(() => {});

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('persists an update before resolving', async () => {
        await storage.update(countDay);

        const expected = { ...defaultAutoDisableFiltersState, activeDayCounter: 1 };
        await expect(storage.getState()).resolves.toStrictEqual(expected);
        await expect(readStoredState()).resolves.toStrictEqual(expected);
    });

    it('does not write when the updater returns the same state', async () => {
        await storage.update((state) => state);

        expect(getStorageWriteCount()).toBe(0);
    });

    it('applies concurrent updates one after another', async () => {
        await Promise.all(Array.from({ length: 100 }, () => storage.update(countDay)));

        await expect(readStoredState()).resolves.toStrictEqual({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: 100,
        });
    });

    it('reads the state after an in-flight update is written', async () => {
        const { writeSpy, release } = holdNextWrite();

        const update = storage.update(countDay);
        const read = storage.getState();
        await vi.advanceTimersByTimeAsync(0);
        expect(writeSpy).toHaveBeenCalledTimes(1);

        release();
        await update;

        await expect(read).resolves.toStrictEqual({ ...defaultAutoDisableFiltersState, activeDayCounter: 1 });
    });

    it('keeps a failed write in the cache and retries it without another update', async () => {
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await expect(storage.update(countDay)).resolves.toBeUndefined();

        expect(errorSpy).toHaveBeenCalledOnce();
        await expect(storage.getState()).resolves.toStrictEqual({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: 1,
        });
        await expect(readStoredState()).resolves.toBeUndefined();

        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

        await expect(readStoredState()).resolves.toStrictEqual({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: 1,
        });
    });

    it('doubles the retry delay after each failed retry', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        const writeSpy = vi.spyOn(browserStorage, 'set')
            .mockRejectedValueOnce(new Error('write failed'))
            .mockRejectedValueOnce(new Error('first retry failed'));

        await storage.update(countDay);
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
        expect(writeSpy).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2 - 1);
        expect(writeSpy).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(1);
        expect(writeSpy).toHaveBeenCalledTimes(3);
        await expect(readStoredState()).resolves.toStrictEqual({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: 1,
        });
    });

    it('does not increase the retry delay beyond the maximum', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        const writeSpy = vi.spyOn(browserStorage, 'set').mockRejectedValue(new Error('write failed'));

        await storage.update(countDay);
        await vi.advanceTimersByTimeAsync(MAX_RETRY_DELAY_MS * 4);
        const writeCount = writeSpy.mock.calls.length;

        await vi.advanceTimersByTimeAsync(MAX_RETRY_DELAY_MS);

        expect(writeSpy).toHaveBeenCalledTimes(writeCount + 1);
    });

    it('persists a failed write with the next update and cancels the retry', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await storage.update(countDay);
        await storage.update(countDay);

        await expect(readStoredState()).resolves.toStrictEqual({
            ...defaultAutoDisableFiltersState,
            activeDayCounter: 2,
        });
        const writeCount = getStorageWriteCount();
        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2);
        expect(getStorageWriteCount()).toBe(writeCount);
    });

    it('keeps stored data and resumes updates when the initial read fails', async () => {
        mockLocalStorage({ [AUTO_DISABLE_FILTERS_KEY]: JSON.stringify(savedState) });
        const recoveringStorage = new AutoDisableFiltersStorage();
        vi.spyOn(recoveringStorage, 'read').mockRejectedValueOnce(new Error('read failed'));

        await expect(recoveringStorage.update(countDay)).rejects.toThrow('read failed');
        await recoveringStorage.update(countDay);

        await expect(readStoredState()).resolves.toStrictEqual({ ...savedState, activeDayCounter: 43 });
    });

    it('clears cached and stored state on reset', async () => {
        mockLocalStorage({ [AUTO_DISABLE_FILTERS_KEY]: JSON.stringify(savedState) });
        const resettingStorage = new AutoDisableFiltersStorage();
        await resettingStorage.update(countDay);

        await resettingStorage.reset();

        await expect(resettingStorage.getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
        await expect(readStoredState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('resets when the stored state cannot be read', async () => {
        mockLocalStorage({ [AUTO_DISABLE_FILTERS_KEY]: JSON.stringify(savedState) });
        const resettingStorage = new AutoDisableFiltersStorage();
        vi.spyOn(resettingStorage, 'read').mockRejectedValue(new Error('read failed'));

        await resettingStorage.reset();

        await expect(resettingStorage.getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
        await expect(readStoredState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('does not resurrect history when reset follows an in-flight update', async () => {
        await storage.update(countDay);
        const { release } = holdNextWrite();

        const update = storage.update(countDay);
        await vi.advanceTimersByTimeAsync(0);
        const reset = storage.reset();
        release();
        await Promise.all([update, reset]);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('retries a failed reset with the default state instead of old history', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        await storage.update(countDay);
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await storage.reset();
        await expect(storage.getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);

        await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });

    it('starts over when the feature data is removed', async () => {
        await storage.update(countDay);

        await browser.storage.local.remove(AUTO_DISABLE_FILTERS_KEY);

        await expect(new AutoDisableFiltersStorage().getState()).resolves.toStrictEqual(defaultAutoDisableFiltersState);
    });
});
