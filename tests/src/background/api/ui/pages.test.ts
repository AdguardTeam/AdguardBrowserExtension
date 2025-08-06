import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { PagesApi } from '../../../../../Extension/src/background/api/ui/pages';
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

        const reportUrl = await PagesApi.getIssueReportUrl(websiteUrl, reportedFrom);

        const url = new URL(reportUrl);

        expect(url.searchParams.get('app')).toBe('browser_extension');
        expect(url.searchParams.get('from')).toBe(reportedFrom);
        expect(url.searchParams.get('url')).toBe(websiteUrl);
        expect(url.searchParams.get('product_type')).toBe('Ext');
    });
});
