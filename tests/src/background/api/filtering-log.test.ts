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
    vi,
    describe,
    afterAll,
    expect,
    it,
} from 'vitest';
import { type Tabs } from 'webextension-polyfill';

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

    describe('createTabInfo', () => {
        // AG-30018: Edge fires tabs.onCreated with url='', title='', pendingUrl=undefined
        // when window.open() creates a tab that immediately redirects.
        // The old !url guard rejected such tabs, so filtering events arriving
        // a few ms later were silently dropped.
        it('registers tab with empty url and title (window.open redirect)', () => {
            const filteringLogApi = new FilteringLogApi();
            const tab: Tabs.Tab = {
                id: 10,
                url: '',
                title: '',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            };

            filteringLogApi.createTabInfo(tab);

            const info = filteringLogApi.getFilteringInfoByTabId(10);
            expect(info).toBeDefined();
            expect(info?.title).toBe('');
            expect(info?.domain).toBeNull();
            expect(info?.isExtensionTab).toBe(false);
        });

        // Edge creates a hidden prerendered NTP tab (ntp.msn.com) with a url
        // but empty title. Without this guard it appeared as a phantom tab
        // in the filtering log.
        it('skips tab with url but no title (Edge prerendered NTP)', () => {
            const filteringLogApi = new FilteringLogApi();
            const tab: Tabs.Tab = {
                id: 11,
                url: 'https://ntp.msn.com/edge/ntp',
                title: '',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            };

            filteringLogApi.createTabInfo(tab);

            expect(filteringLogApi.getFilteringInfoByTabId(11)).toBeUndefined();
        });

        // pendingUrl with no title should be treated the same as url with no title.
        it('skips tab with pendingUrl but no title', () => {
            const filteringLogApi = new FilteringLogApi();
            const tab: Tabs.Tab = {
                id: 12,
                url: '',
                pendingUrl: 'https://ntp.msn.com/edge/ntp',
                title: '',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            };

            filteringLogApi.createTabInfo(tab);

            expect(filteringLogApi.getFilteringInfoByTabId(12)).toBeUndefined();
        });

        // pendingUrl is used as the effective URL for domain resolution.
        it('uses pendingUrl for domain when url is empty', () => {
            const filteringLogApi = new FilteringLogApi();
            const tab: Tabs.Tab = {
                id: 13,
                url: '',
                pendingUrl: 'http://localhost:3000/go',
                title: 'Redirecting',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            };

            filteringLogApi.createTabInfo(tab);

            const info = filteringLogApi.getFilteringInfoByTabId(13);
            expect(info).toBeDefined();
            expect(info?.domain).toBe('localhost');
            expect(info?.title).toBe('Redirecting');
        });

        // Verifies the full redirect lifecycle: a tab is created with empty
        // url/title, then updateTabInfo() arrives with the real URL.
        // domain, title and isExtensionTab must all be refreshed.
        it('updates domain and title when real URL arrives via updateTabInfo', () => {
            const filteringLogApi = new FilteringLogApi();

            // 1. Tab created with empty data (window.open redirect)
            filteringLogApi.createTabInfo({
                id: 20,
                url: '',
                title: '',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });

            const infoBefore = filteringLogApi.getFilteringInfoByTabId(20);
            expect(infoBefore).toBeDefined();
            expect(infoBefore?.domain).toBeNull();

            // 2. Real URL arrives
            filteringLogApi.updateTabInfo({
                id: 20,
                url: 'https://example.com/page',
                title: 'Example Page',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });

            const infoAfter = filteringLogApi.getFilteringInfoByTabId(20);
            expect(infoAfter?.title).toBe('Example Page');
            expect(infoAfter?.domain).toBe('example.com');
            expect(infoAfter?.isExtensionTab).toBe(false);
        });
    });
});
