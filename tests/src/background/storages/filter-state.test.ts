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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import browser from 'webextension-polyfill';

import { ADGUARD_SETTINGS_KEY } from '../../../../Extension/src/common/constants';
import { defaultSettings } from '../../../../Extension/src/common/settings';
import { filterStateStorageDataValidator } from '../../../../Extension/src/background/schema';
import { filterStateStorage } from '../../../../Extension/src/background/storages/filter-state';
import { settingsStorage } from '../../../../Extension/src/background/storages/settings';
import { mockLocalStorage } from '../../../helpers';

describe('FilterStateStorage', () => {
    beforeEach(() => {
        mockLocalStorage();
        settingsStorage.setCache({ ...defaultSettings });

        filterStateStorage.setData({
            1: {
                enabled: true,
                installed: true,
                loaded: true,
                disabledAsUnused: false,
            },
        });
    });

    it('parses old filter state data without the unused flag', () => {
        const parsed = filterStateStorageDataValidator.parse({
            1: { enabled: true, installed: true, loaded: true },
        });

        expect(parsed[1]?.disabledAsUnused).toBe(false);
    });

    it('disables a filter and marks it as unused', () => {
        filterStateStorage.disableFiltersAsUnused([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(true);
    });

    it('clears the unused flag when a filter is enabled', () => {
        filterStateStorage.set(1, {
            enabled: false,
            installed: true,
            loaded: true,
            disabledAsUnused: true,
        });

        filterStateStorage.enableFilters([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(true);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
    });

    it('clears the unused flag when a filter is disabled', () => {
        filterStateStorage.set(1, {
            enabled: true,
            installed: true,
            loaded: true,
            disabledAsUnused: true,
        });

        filterStateStorage.disableFilters([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
    });

    it('ignores unknown filter ids when disabling as unused', () => {
        filterStateStorage.set(1, {
            enabled: true,
            installed: true,
            loaded: true,
            disabledAsUnused: false,
        });

        filterStateStorage.disableFiltersAsUnused([0, 999, 1]);

        expect(filterStateStorage.get(999)).toBeUndefined();

        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(true);
    });

    it('clears the unused flag without changing the enabled state', () => {
        filterStateStorage.set(1, {
            enabled: false,
            installed: true,
            loaded: true,
            disabledAsUnused: true,
        });

        filterStateStorage.clearUnused([1]);

        expect(filterStateStorage.get(1)?.enabled).toBe(false);
        expect(filterStateStorage.get(1)?.disabledAsUnused).toBe(false);
    });

    it('persists the unused flag', async () => {
        filterStateStorage.disableFiltersAsUnused([1]);

        await vi.waitFor(async () => {
            const stored = await browser.storage.local.get(ADGUARD_SETTINGS_KEY);
            const settings = stored[ADGUARD_SETTINGS_KEY] as Record<string, string>;
            const filtersState = JSON.parse(settings['filters-state'] as string);

            expect(filtersState['1'].enabled).toBe(false);
            expect(filtersState['1'].disabledAsUnused).toBe(true);
        });
    });
});
