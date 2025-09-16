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

vi.mock('webextension-polyfill', () => {
    return {
        __esModule: true,
        default: {
            storage: {
                session: {
                    get: vi.fn(() => Promise.resolve({})),
                    set: vi.fn(() => Promise.resolve()),
                },
                local: {
                    get: vi.fn(() => Promise.resolve({})),
                    set: vi.fn(() => Promise.resolve()),
                },
            },
            runtime: {
                id: 'test-extension-id',
                getURL: vi.fn((path) => `chrome-extension://test-extension-id/${path}`),
                getManifest: vi.fn(() => ({ version: '1.0.0' })),
            },
            i18n: {
                getUILanguage: vi.fn(() => 'en'),
                getMessage: vi.fn((key) => key),
            },
            tabs: {
                query: vi.fn(() => Promise.resolve([])),
                get: vi.fn(() => Promise.resolve({})),
            },
            webNavigation: {
                onCommitted: {
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                },
            },
            declarativeNetRequest: {
                MAX_NUMBER_OF_DYNAMIC_RULES: 30000,
                MAX_NUMBER_OF_REGEX_RULES: 1000,
                MAX_NUMBER_OF_ENABLED_STATIC_RULESETS: 50,
            },
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
