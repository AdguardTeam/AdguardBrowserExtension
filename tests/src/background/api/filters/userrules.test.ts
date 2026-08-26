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

import { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { UserRulesApi } from '../../../../../Extension/src/background/api/filters/userrules';
import { FiltersStoragesAdapter } from '../../../../../Extension/src/background/storages/filters-adapter';
import { hybridStorage } from '../../../../../Extension/src/background/storages';
import { AntiBannerFiltersId } from '../../../../../Extension/src/common/constants';
import { mockLocalStorage } from '../../../../helpers';

describe('UserRulesApi', () => {
    let localStorage: Storage.StorageArea;

    beforeEach(() => {
        localStorage = mockLocalStorage();
    });

    afterEach(async () => {
        await localStorage.clear();
        await hybridStorage.clear();
    });

    it('normalizes line endings when user rules are saved', async () => {
        await UserRulesApi.setUserRules('||a.com^\r\n||b.com^\r||c.com^');

        await expect(UserRulesApi.getOriginalUserRules())
            .resolves.toBe('||a.com^\n||b.com^\n||c.com^');
    });

    it('normalizes line endings in existing user rules during initialization', async () => {
        await FiltersStoragesAdapter.set(
            AntiBannerFiltersId.UserFilterId,
            '||a.com^\r\n||b.com^',
        );

        await expect(UserRulesApi.getOriginalUserRules())
            .resolves.toBe('||a.com^\r\n||b.com^');

        await UserRulesApi.init(false);

        await expect(UserRulesApi.getOriginalUserRules())
            .resolves.toBe('||a.com^\n||b.com^');
    });

    it('preserves existing rules when initialization cannot save normalized content', async () => {
        await FiltersStoragesAdapter.set(
            AntiBannerFiltersId.UserFilterId,
            '||a.com^\r\n||b.com^',
        );
        const setSpy = vi.spyOn(FiltersStoragesAdapter, 'set')
            .mockRejectedValueOnce(new Error('Storage write failed'));

        try {
            await UserRulesApi.init(false);

            await expect(UserRulesApi.getOriginalUserRules())
                .resolves.toBe('||a.com^\r\n||b.com^');
        } finally {
            setSpy.mockRestore();
        }
    });
});
