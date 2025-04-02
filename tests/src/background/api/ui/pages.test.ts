import { PagesApi } from '../../../../../Extension/src/background/api/ui/pages';
import { SettingsApi } from '../../../../../Extension/src/background/api/settings/main';
import { FilterStateStorage } from '../../../../../Extension/src/background/storages/filter-state';
import { GroupStateStorage } from '../../../../../Extension/src/background/storages/group-state';
import { ForwardFrom } from '../../../../../Extension/src/common/forward';

jest.mock('../../../../../Extension/src/background/storages/metadata');
jest.mock('../../../../../Extension/src/common/user-agent');

jest.spyOn(FilterStateStorage.prototype, 'getEnabledFilters').mockImplementation(() => []);
jest.spyOn(GroupStateStorage.prototype, 'getEnabledGroups').mockImplementation(() => []);
jest.spyOn(GroupStateStorage.prototype, 'get').mockImplementation(() => {
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
