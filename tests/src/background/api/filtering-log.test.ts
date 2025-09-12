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
