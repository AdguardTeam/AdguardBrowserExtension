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

import browser from 'webextension-polyfill';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { FiltersStorage } from '@adguard/tswebextension/filters-storage';

import {
    UpdateApi,
    SettingsApi,
    AllowlistApi,
} from '../../../../Extension/src/background/api';
import {
    FiltersStoragesAdapterCommon as Mv2Filters,
} from '../../../../Extension/src/background/storages/filters-adapter/filters-adapter-common';
import {
    FiltersStoragesAdapter as Mv3Filters,
} from '../../../../Extension/src/background/storages/filters-adapter/filters-adapter-mv3';
import { hybridStorage } from '../../../../Extension/src/background/storages';
import { getRunInfo } from '../../../../Extension/src/background/utils';
import { getStorageFixturesV15, mockLocalStorage } from '../../../helpers';

vi.mock('../../../../Extension/src/background/engine');
vi.mock('../../../../Extension/src/background/api/ui/icons');
vi.mock('../../../../Extension/src/background/storages/notification');

afterEach(async () => {
    vi.restoreAllMocks();
    await hybridStorage.clear();
});

describe.skipIf(!__IS_MV3__)('MV2 to MV3 update with the same schema', () => {
    it('preserves user data and reads static filters from the bundled MV3 store', async () => {
        // V15 fixtures represent the MV2 storage format, including custom filters and group states.
        const data = getStorageFixturesV15(12345)[1]!;
        data['app-version'] = '5.5.0';
        const expected = structuredClone(data);
        expected['app-version'] = '5.6.0';
        const storage = mockLocalStorage(data);
        const userRules = '||user.example^\nexample.org##.advert';
        const customRules = '||custom.example^';
        await Mv2Filters.set(0, userRules);
        await Mv2Filters.set(1000, customRules);
        await Mv2Filters.set(2, '||old-mv2.example^');

        const runInfo = await getRunInfo();
        expect(runInfo.previousSchemaVersion).toBe(runInfo.currentSchemaVersion);
        await UpdateApi.update({ ...runInfo, currentAppVersion: '5.6.0' });
        expect(await storage.get(null)).toEqual(expected);

        await SettingsApi.init();
        AllowlistApi.init();
        expect(AllowlistApi.getAllowlistDomains()).toEqual(['domain1.com', 'domain2.com']);
        expect(AllowlistApi.getInvertedAllowlistDomains()).toEqual(['domain3.com', 'domain4.com']);
        expect(await Mv3Filters.getOriginalFilterList(0)).toBe(userRules);
        expect(await Mv3Filters.getOriginalFilterList(1000)).toBe(customRules);

        vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
            name: 'AdGuard',
            version: '5.6.0',
            manifest_version: 3,
            declarative_net_request: {
                rule_resources: [{
                    id: 'ruleset_2', enabled: true, path: 'filters/declarative/ruleset_2/ruleset_2.json',
                }],
            },
        });
        // TSWebExtension owns the bundled static filters; stale MV2 rules must not be read.
        vi.spyOn(FiltersStorage, 'getRawFilterList').mockResolvedValue('||edge-mv3.example^');
        expect(await Mv3Filters.getFilterContent(2)).toBe('||edge-mv3.example^');
    });
});
