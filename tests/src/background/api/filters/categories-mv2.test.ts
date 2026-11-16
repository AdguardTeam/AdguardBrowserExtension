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

import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { AntibannerGroupsId } from '../../../../../Extension/src/common/constants';
import {
    Categories,
    FiltersApi,
    FilterUpdateApi,
} from '../../../../../Extension/src/background/api';
import {
    filterStateStorage,
    groupStateStorage,
    settingsStorage,
} from '../../../../../Extension/src/background/storages';
import { mockLocalStorage } from '../../../../helpers';

const LANGUAGE_GROUP_ID = AntibannerGroupsId.LanguageFiltersGroupId;

describe.skipIf(__IS_MV3__)('Categories.enableGroup', () => {
    beforeEach(() => {
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });
        groupStateStorage.setData({
            [LANGUAGE_GROUP_ID]: { enabled: false, touched: true },
        });

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
            3: {
                enabled: false,
                installed: true,
                loaded: true,
                disabledAsUnused: true,
            },
        });

        vi.spyOn(FiltersApi, 'getFiltersMetadata').mockReturnValue([
            { filterId: 1, groupId: LANGUAGE_GROUP_ID } as any,
            { filterId: 2, groupId: LANGUAGE_GROUP_ID } as any,
            { filterId: 3, groupId: AntibannerGroupsId.PrivacyFiltersGroupId } as any,
        ]);
        vi.spyOn(FiltersApi, 'loadAndEnableFilters').mockResolvedValue(undefined);
        vi.spyOn(FilterUpdateApi, 'checkForFiltersUpdates').mockResolvedValue([]);
        vi.spyOn(Categories, 'getGroupName').mockReturnValue('Language-specific');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('clears the unused statuses of all filters of the group', async () => {
        await Categories.enableGroup(LANGUAGE_GROUP_ID);

        expect(groupStateStorage.get(LANGUAGE_GROUP_ID)?.enabled).toBe(true);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
        expect(filterStateStorage.get(2)?.disabledAsUnused).toBe(false);
    });

    it('preserves statuses while the group enable is pending', async () => {
        let finishUpdate!: () => void;
        vi.mocked(FilterUpdateApi.checkForFiltersUpdates).mockReturnValueOnce(new Promise((resolve) => {
            finishUpdate = () => resolve([]);
        }));

        const pending = Categories.enableGroup(LANGUAGE_GROUP_ID);

        expect(groupStateStorage.get(LANGUAGE_GROUP_ID)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(true);

        finishUpdate();
        await pending;

        expect(groupStateStorage.get(LANGUAGE_GROUP_ID)?.enabled).toBe(true);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
    });

    it('preserves statuses when the update check rejects', async () => {
        vi.mocked(FilterUpdateApi.checkForFiltersUpdates).mockRejectedValueOnce(new Error('update failed'));

        await expect(Categories.enableGroup(LANGUAGE_GROUP_ID)).rejects.toThrow('update failed');

        expect(groupStateStorage.get(LANGUAGE_GROUP_ID)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(true);
        expect(filterStateStorage.get(2)?.disabledAsUnused).toBe(true);
    });

    it('preserves statuses when enabling the group fails', async () => {
        vi.spyOn(groupStateStorage, 'enableGroups').mockImplementationOnce(() => {
            throw new Error('enable failed');
        });

        await expect(Categories.enableGroup(LANGUAGE_GROUP_ID)).rejects.toThrow('enable failed');

        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(true);
        expect(filterStateStorage.get(2)?.disabledAsUnused).toBe(true);
    });

    it('does not clear the statuses of filters from other groups', async () => {
        await Categories.enableGroup(LANGUAGE_GROUP_ID);

        expect(filterStateStorage.get(3)?.disabledAsUnused).toBe(true);
    });
});
