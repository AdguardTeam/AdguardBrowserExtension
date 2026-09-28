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
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Categories, FiltersApi } from '../../../../../Extension/src/background/api/filters';
import { MessageType } from '../../../../../Extension/src/common/messages';
import { defaultAutoDisableFiltersState } from '../../../../../Extension/src/background/schema';
import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { FiltersService } from '../../../../../Extension/src/background/services/filters/filters-service-mv2';
import {
    autoDisableFiltersStorage,
    filterStateStorage,
    settingsStorage,
} from '../../../../../Extension/src/background/storages';
import { mockLocalStorage } from '../../../../helpers';

const mocks = vi.hoisted(() => ({
    addListener: vi.fn(),
}));

vi.mock('../../../../../Extension/src/background/message-handler', () => ({
    messageHandler: {
        addListener: mocks.addListener,
    },
}));

/**
 * Returns the listener registered for the specified message type.
 *
 * @param messageType Message type to find.
 *
 * @returns Registered listener.
 *
 * @throws Error if the listener is not registered.
 */
const getRegisteredListener = (messageType: MessageType) => {
    const call = mocks.addListener.mock.calls.find(([type]) => type === messageType);

    if (!call) {
        throw new Error(`Listener for ${messageType} is not registered`);
    }

    return call[1] as (message: unknown) => Promise<void>;
};

describe.skipIf(__IS_MV3__)('FiltersService', () => {
    beforeAll(() => {
        FiltersService.init();
    });

    beforeEach(() => {
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });

        filterStateStorage.setData({
            1: {
                enabled: false,
                installed: true,
                loaded: true,
                disabledAsUnused: true,
            },
            2: {
                enabled: false,
                installed: true,
                loaded: true,
                disabledAsUnused: true,
            },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('reports the untouched group of an enabled filter to the page', async () => {
        const groupState = { enabled: false, touched: false };
        vi.spyOn(FiltersApi, 'getFilterName').mockReturnValue('Test filter');
        vi.spyOn(Categories, 'getGroupByFilterId').mockReturnValue({ groupId: 4 } as ReturnType<
            typeof Categories.getGroupByFilterId
        >);
        vi.spyOn(Categories, 'getGroupState').mockReturnValue(groupState);
        // Loading the filter downloads it and then marks its untouched group as touched.
        vi.spyOn(FiltersApi, 'loadAndEnableFilters').mockImplementation(async () => {
            await new Promise((resolve) => {
                setTimeout(resolve, 0);
            });
            groupState.enabled = true;
            groupState.touched = true;
        });
        const listener = getRegisteredListener(MessageType.AddAndEnableFilter);

        await expect(listener({ data: { filterId: 1 } })).resolves.toBe(4);
    });

    it('registers the unused filters status clearing listener', () => {
        expect(mocks.addListener).toHaveBeenCalledWith(
            MessageType.ClearUnusedFiltersStatus,
            expect.any(Function),
        );
    });

    it('clears the unused status of the specified filters only', async () => {
        const listener = getRegisteredListener(MessageType.ClearUnusedFiltersStatus);

        await listener({ data: { filterIds: [1] } });

        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect(filterStateStorage.get(2)?.disabledAsUnused).toBe(true);
    });

    it('does not consume the pending notification queue', async () => {
        autoDisableFiltersStorage.setCache({ ...defaultAutoDisableFiltersState, pendingNotificationFilterIds: [1, 2] });

        const listener = getRegisteredListener(MessageType.ClearUnusedFiltersStatus);
        await listener({ data: { filterIds: [1] } });

        expect((await autoDisableFiltersStorage.getState()).pendingNotificationFilterIds).toStrictEqual([1, 2]);
    });
});
