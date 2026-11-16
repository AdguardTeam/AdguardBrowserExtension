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
import browser from 'webextension-polyfill';

import { type AutoDisabledFilter } from '../../../../Extension/src/common/auto-disable-notification';
import { logger } from '../../../../Extension/src/common/logger';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import { messageHandler } from '../../../../Extension/src/background/message-handler';
import { defaultAutoDisableFiltersState } from '../../../../Extension/src/background/schema';
import {
    AutoDisableNotificationService,
} from '../../../../Extension/src/background/services/auto-disable-notification-mv2';
import {
    autoDisableFiltersStorage,
    filterStateStorage,
    metadataStorage,
    settingsStorage,
} from '../../../../Extension/src/background/storages';
import { AutoDisableFiltersStorage } from '../../../../Extension/src/background/storages/auto-disable-filters';
import { browserStorage } from '../../../../Extension/src/background/storages/shared-instances';
import { messenger } from '../../../../Extension/src/pages/services/messenger/messenger-mv2';
import { mockLocalStorage } from '../../../helpers';

/**
 * Filter id without catalog metadata.
 */
const MISSING_FILTER_ID = 99;

/**
 * Returns the ids of notified filters.
 *
 * @param filters Notified filters.
 *
 * @returns Filter ids.
 */
const ids = (filters: AutoDisabledFilter[]): number[] => filters.map(({ filterId }) => filterId);

/**
 * Sets the pending notification.
 *
 * @param filterIds Pending filter ids.
 */
const setPending = (filterIds: number[]): void => {
    autoDisableFiltersStorage.setCache({ ...defaultAutoDisableFiltersState, pendingNotificationFilterIds: filterIds });
};

/**
 * Reads the pending notification persisted in the storage.
 *
 * @returns Persisted pending filter ids.
 */
const readPersistedPending = async (): Promise<number[]> => {
    return (await new AutoDisableFiltersStorage().getState()).pendingNotificationFilterIds;
};

describe.skipIf(__IS_MV3__)('AutoDisableNotificationService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });
        filterStateStorage.setData({
            1: {
                enabled: false, installed: true, loaded: true, disabledAsUnused: true,
            },
            2: {
                enabled: false, installed: true, loaded: true, disabledAsUnused: true,
            },
        });
        setPending([]);
        vi.spyOn(metadataStorage, 'getFilter').mockImplementation((filterId) => (
            filterId === MISSING_FILTER_ID ? undefined : { name: `Filter ${filterId}` } as ReturnType<typeof metadataStorage.getFilter>
        ));
        const register = vi.spyOn(browser.runtime.onMessage, 'addListener');
        messageHandler.init();
        const listener = register.mock.calls[0]![0];
        vi.spyOn(browser.runtime, 'sendMessage').mockImplementation((message) => {
            return Promise.resolve(listener(message, {}, () => {}));
        });
        AutoDisableNotificationService.init();
    });

    afterEach(() => {
        messageHandler.removeListeners();
        vi.clearAllTimers();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('returns pending filters with their names without consuming them', async () => {
        setPending([1, 2]);

        const first = await messenger.getAutoDisableNotifications();
        const second = await messenger.getAutoDisableNotifications();

        expect(first).toStrictEqual([
            { filterId: 1, name: 'Filter 1' },
            { filterId: 2, name: 'Filter 2' },
        ]);
        expect(second).toStrictEqual(first);
        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([1, 2]);
    });

    it('removes only acknowledged filters and persists the removal', async () => {
        setPending([1, 2]);

        await messenger.acknowledgeAutoDisableNotifications([1]);

        await expect(readPersistedPending()).resolves.toStrictEqual([2]);
    });

    it('keeps a filter disabled again after the notification was read', async () => {
        setPending([1]);
        const displayed = await messenger.getAutoDisableNotifications();
        await autoDisableFiltersStorage.update((state) => ({ ...state, pendingNotificationFilterIds: [1, 2] }));

        await messenger.acknowledgeAutoDisableNotifications(ids(displayed));

        await expect(readPersistedPending()).resolves.toStrictEqual([2]);
    });

    it('skips a pending filter which is enabled again', async () => {
        setPending([1, 2]);
        filterStateStorage.enableFilters([1]);

        expect(ids(await messenger.getAutoDisableNotifications())).toStrictEqual([2]);
    });

    it('removes filters missing from the catalog and keeps the rest', async () => {
        vi.spyOn(logger, 'warn').mockImplementation(() => {});
        setPending([1, MISSING_FILTER_ID]);

        expect(ids(await messenger.getAutoDisableNotifications())).toStrictEqual([1]);
        await expect(readPersistedPending()).resolves.toStrictEqual([1]);
    });

    it('keeps an acknowledgement in the cache and retries it when the write fails', async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        setPending([1]);
        vi.spyOn(browserStorage, 'set').mockRejectedValueOnce(new Error('write failed'));

        await messenger.acknowledgeAutoDisableNotifications([1]);

        expect(ids(await messenger.getAutoDisableNotifications())).toStrictEqual([]);
        await vi.advanceTimersByTimeAsync(AutoDisableFiltersStorage.RETRY_DELAY_MS);
        await expect(readPersistedPending()).resolves.toStrictEqual([]);
    });

    it('restores message handlers after reinitialization', async () => {
        setPending([1]);
        messageHandler.removeListeners();
        expect(await messenger.getAutoDisableNotifications()).toBeUndefined();

        AutoDisableNotificationService.init();

        expect(ids(await messenger.getAutoDisableNotifications())).toStrictEqual([1]);
    });
});
