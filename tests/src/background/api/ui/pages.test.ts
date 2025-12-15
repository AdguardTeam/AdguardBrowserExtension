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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { pagesApi } from '../../../../../Extension/src/background/api/ui/pages';
import { SettingsApi } from '../../../../../Extension/src/background/api/settings';
import { FilterStateStorage } from '../../../../../Extension/src/background/storages/filter-state';
import { GroupStateStorage } from '../../../../../Extension/src/background/storages/group-state';
import { ForwardFrom } from '../../../../../Extension/src/common/forward';

vi.mock('../../../../../Extension/src/background/storages/metadata');
vi.mock('../../../../../Extension/src/common/user-agent');

vi.spyOn(FilterStateStorage.prototype, 'getEnabledFilters').mockImplementation(() => []);
vi.spyOn(GroupStateStorage.prototype, 'getEnabledGroups').mockImplementation(() => []);
vi.spyOn(GroupStateStorage.prototype, 'get').mockImplementation(() => {
    return {
        enabled: false,
        touched: false,
    };
});

describe('PagesApi', () => {
    beforeEach(async () => {
        await SettingsApi.init();
    });

    it('getIssueReportUrl', async () => {
        const websiteUrl = 'https://example.com';
        const reportedFrom = ForwardFrom.Popup;

        const reportUrl = await pagesApi.getIssueReportUrl(websiteUrl, reportedFrom);

        const url = new URL(reportUrl);

        expect(url.searchParams.get('app')).toBe('browser_extension');
        expect(url.searchParams.get('from')).toBe(reportedFrom);
        expect(url.searchParams.get('url')).toBe(websiteUrl);
        expect(url.searchParams.get('product_type')).toBe('Ext');
    });
});
