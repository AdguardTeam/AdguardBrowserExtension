/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    vi,
    describe,
    afterAll,
    expect,
    it,
} from 'vitest';

import { FilteringLogApi } from '../../../../Extension/src/background/api/filtering-log';

const tabId = 1;
const title = 'test';
const eventId = '0';

vi.mock('../../../../Extension/src/common/api/extension/tabs', () => {
    return {
        __esModule: true,
        TabsApi: {
            getAll: vi.fn(() => {
                return Promise.resolve([{
                    id: tabId,
                    url: 'test',
                    title,
                }]);
            }),
        },
    };
});

vi.mock('../../../../Extension/src/background/storages/settings', () => {
    return {
        __esModule: true,
        settingsStorage: {
            get: vi.fn(() => false),
            set: vi.fn(),
        },
    };
});

describe('FilteringLogApi', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('does not save filtering events if filtering log is closed', async () => {
        const filteringLogApi = new FilteringLogApi();
        await filteringLogApi.synchronizeOpenTabs();

        // initially isOpen should be false
        expect(filteringLogApi.isOpen()).toBe(false);
        filteringLogApi.addEventData(tabId, { eventId });

        // while filtering log is closed events shouldn't be collected
        expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents).toEqual([]);

        filteringLogApi.onOpenFilteringLogPage();
        // after opening filtering log page isOpen should be true
        expect(filteringLogApi.isOpen()).toBe(true);
        expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents).toEqual([]);
        filteringLogApi.addEventData(tabId, { eventId });

        // and events should start to be collected
        expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents).toEqual([{ eventId }]);
    });
});
