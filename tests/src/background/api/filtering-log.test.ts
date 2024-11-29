import { FilteringLogApi } from '../../../../Extension/src/background/api/filtering-log';

const tabId = 1;
const title = 'test';
const eventId = '0';

jest.mock('../../../../Extension/src/common/api/extension/tabs', () => {
    return {
        __esModule: true,
        TabsApi: {
            getAll: jest.fn(() => {
                return Promise.resolve([{
                    id: tabId,
                    url: 'test',
                    title,
                }]);
            }),
        },
    };
});

describe('FilteringLogApi', () => {
    afterAll(() => {
        jest.clearAllMocks();
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
