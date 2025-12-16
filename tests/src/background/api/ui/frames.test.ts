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

import { type Storage } from 'webextension-polyfill';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

// TODO should be written separate test, because there is different api in mv3 and mv2 for tabs context
//  after that remove exclude from the ./tsconfig.mv3.json
import {
    TabContext,
    NetworkRule,
    type TabInfo,
    documentApi,
} from '@adguard/tswebextension';

import {
    PageStatsApi,
    mockLocalStorage,
    SettingsApi,
} from '../../../../helpers';
import { appContext, AppContextKey } from '../../../../../Extension/src/background/storages/app';
import { FramesApi } from '../../../../../Extension/src/background/api/ui/frames';
import { AntiBannerFiltersId } from '../../../../../Extension/src/common/constants';

vi.mock('../../../../../Extension/src/background/api/page-stats', () => ({
    ...(vi.importActual('../../../../../Extension/src/background/api/page-stats')),
    PageStatsApi,
}));

vi.mock('../../../../../Extension/src/background/api/settings', async () => ({
    ...(await vi.importActual('../../../../../Extension/src/background/api/settings')),
    SettingsApi,
}));

vi.spyOn(PageStatsApi, 'getTotalBlocked').mockImplementation(() => 0);
vi.spyOn(SettingsApi, 'getSetting').mockImplementation(() => false);

describe('Frames Api', () => {
    let storage: Storage.StorageArea;

    afterEach(() => {
        storage.clear();
    });

    beforeEach(async () => {
        storage = mockLocalStorage();
    });

    beforeAll(() => {
        appContext.set(AppContextKey.IsInit, true);
    });

    it('getMainFrameData calculates documentAllowlisted and canAddRemoveRule', async () => {
        const rule = '@@||testcases.agrd.dev$document';
        const url = 'https://testcases.agrd.dev/test-important-vs-urlblock.html';

        const info: TabInfo = {
            url,
            id: 1,
            index: 0,
            highlighted: true,
            active: true,
            pinned: true,
            incognito: false,
        };
        const tabContext = new TabContext(info, documentApi);
        tabContext.mainFrameRule = new NetworkRule(rule, AntiBannerFiltersId.UserFilterId);
        tabContext.blockedRequestCount = 0;

        // TODO (Slava): fix later
        // @ts-ignore
        const frameData = await FramesApi.getMainFrameData(tabContext);
        const { documentAllowlisted, canAddRemoveRule } = frameData;

        expect(documentAllowlisted).toBe(true);

        expect(canAddRemoveRule).toBe(true);
    });
});
