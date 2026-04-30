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

        // Calling createTabInfo for a normal tab must not touch the pre-seeded
        // background tab entry (BACKGROUND_TAB_ID guard was removed from createTabInfo
        // in the $popup fix — verify the removal does not corrupt background tab).
        it('does not overwrite background tab entry when called for a normal tab', () => {
            const BACKGROUND_TAB_ID = -1;
            const filteringLogApi = new FilteringLogApi();

            const bgInfoBefore = filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID);
            expect(bgInfoBefore).toBeDefined();

            filteringLogApi.createTabInfo({
                id: 30,
                url: 'https://example.com',
                title: 'Example',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });

            // Background tab entry must be the exact same object — untouched.
            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)).toBe(bgInfoBefore);
            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.tabId).toBe(BACKGROUND_TAB_ID);
        });
    });

    describe('updateTabInfo', () => {
        // Calling updateTabInfo for a normal tab must not touch the pre-seeded
        // background tab entry (BACKGROUND_TAB_ID guard was removed from updateTabInfo
        // in the $popup fix — verify the removal does not corrupt background tab).
        it('does not corrupt background tab entry when called for a normal tab', () => {
            const BACKGROUND_TAB_ID = -1;
            const filteringLogApi = new FilteringLogApi();
            filteringLogApi.onOpenFilteringLogPage();

            // Seed an event into the background tab.
            filteringLogApi.addEventData(BACKGROUND_TAB_ID, { eventId: 'bg-event-1' });
            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.filteringEvents)
                .toHaveLength(1);

            // Create and then update a normal tab.
            filteringLogApi.createTabInfo({
                id: 40,
                url: '',
                title: '',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });
            filteringLogApi.updateTabInfo({
                id: 40,
                url: 'https://example.com',
                title: 'Example',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });

            // Background tab must be completely untouched.
            const bgInfo = filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID);
            expect(bgInfo).toBeDefined();
            expect(bgInfo?.tabId).toBe(BACKGROUND_TAB_ID);
            expect(bgInfo?.filteringEvents).toHaveLength(1);
            expect(bgInfo?.filteringEvents[0]).toEqual({ eventId: 'bg-event-1' });
        });

        it('called with BACKGROUND_TAB_ID and does not clear its filtering events', () => {
            const BACKGROUND_TAB_ID = -1;
            const filteringLogApi = new FilteringLogApi();
            filteringLogApi.onOpenFilteringLogPage();

            // Seed an event into the background tab.
            filteringLogApi.addEventData(BACKGROUND_TAB_ID, { eventId: 'bg-event-2' });

            filteringLogApi.updateTabInfo({
                id: BACKGROUND_TAB_ID,
                url: 'chrome-extension://abc/background.html',
                title: 'Background Page',
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            });

            const bgInfo = filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID);
            // filteringEvents must not have been wiped by the update call.
            expect(bgInfo?.filteringEvents).toHaveLength(1);
            expect(bgInfo?.filteringEvents[0]).toEqual({ eventId: 'bg-event-2' });
        });
    });

    describe('updateEventData', () => {
        it('updates event when tabId matches the tab that holds the event', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs(); // registers tab 1
            filteringLogApi.onOpenFilteringLogPage();

            filteringLogApi.addEventData(tabId, { eventId });
            expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents)
                .toEqual([{ eventId }]);

            await filteringLogApi.updateEventData(tabId, eventId, { requestUrl: 'https://example.com' });

            expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents)
                .toEqual([{ eventId, requestUrl: 'https://example.com' }]);
        });

        it('does nothing when the eventId is not found in the target tab', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs();
            filteringLogApi.onOpenFilteringLogPage();

            const BACKGROUND_TAB_ID = -1;
            await filteringLogApi.updateEventData(BACKGROUND_TAB_ID, 'nonexistent-id', { requestUrl: 'https://x.com' });

            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.filteringEvents)
                .toHaveLength(0);
        });
    });

    // Used by the `$popup` filtering log fix to re-attach the original
    // SendRequest event from the popup tab (which is being closed) to the
    // pre-seeded background tab.
    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1686
    describe('moveEventToBackgroundTab', () => {
        const BACKGROUND_TAB_ID = -1;

        it('moves a previously recorded event from a popup tab to the background tab and merges data', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs(); // registers tab 1
            filteringLogApi.onOpenFilteringLogPage();

            // SendRequest landed under the popup's real tabId.
            filteringLogApi.addEventData(tabId, { eventId });
            expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents)
                .toHaveLength(1);

            await filteringLogApi.moveEventToBackgroundTab(tabId, eventId, {
                requestUrl: 'http://evilsite.com/',
            });

            // Event must have been removed from the popup tab.
            expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents)
                .toHaveLength(0);

            // And present (with the merged update) under the background tab.
            const bgEvents = filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.filteringEvents;
            expect(bgEvents).toHaveLength(1);
            expect(bgEvents?.[0]).toEqual({ eventId, requestUrl: 'http://evilsite.com/' });
        });

        it('appends the moved event next to existing background tab events', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs(); // registers tab 1
            filteringLogApi.onOpenFilteringLogPage();

            // Pre-existing background event (e.g. earlier service-worker request).
            filteringLogApi.addEventData(BACKGROUND_TAB_ID, { eventId: 'earlier-bg-event' });

            // Popup SendRequest under the real popup tab id.
            const popupEventId = 'popup-event';
            filteringLogApi.addEventData(tabId, { eventId: popupEventId });

            await filteringLogApi.moveEventToBackgroundTab(tabId, popupEventId, {
                requestUrl: 'https://popup.example.com/',
            });

            expect(filteringLogApi.getFilteringInfoByTabId(tabId)?.filteringEvents)
                .toHaveLength(0);

            const bgEvents = filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.filteringEvents;
            expect(bgEvents).toHaveLength(2);
            expect(bgEvents?.find((e) => e.eventId === 'earlier-bg-event')).toBeDefined();
            expect(bgEvents?.find((e) => e.eventId === popupEventId)).toEqual({
                eventId: popupEventId,
                requestUrl: 'https://popup.example.com/',
            });
        });

        it('does nothing when no event with the given id was recorded under the source tab', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs();
            filteringLogApi.onOpenFilteringLogPage();

            await filteringLogApi.moveEventToBackgroundTab(tabId, 'unknown-id', {
                requestUrl: 'https://example.com',
            });

            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)?.filteringEvents)
                .toHaveLength(0);
        });
    });

    describe('removeTabInfo', () => {
        it('does not remove the background tab entry when called with BACKGROUND_TAB_ID', () => {
            const BACKGROUND_TAB_ID = -1;
            const filteringLogApi = new FilteringLogApi();

            // Background tab is pre-seeded in the map
            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)).toBeDefined();

            filteringLogApi.removeTabInfo(BACKGROUND_TAB_ID);

            // Must still be present
            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)).toBeDefined();
        });

        it('preserves background tab entry after synchronizeOpenTabs', async () => {
            const BACKGROUND_TAB_ID = -1;
            const filteringLogApi = new FilteringLogApi();

            // synchronizeOpenTabs iterates all tabsInfoMap keys, including -1,
            // and calls removeTabInfo for IDs not returned by TabsApi.getAll().
            // BACKGROUND_TAB_ID must survive.
            await filteringLogApi.synchronizeOpenTabs();

            expect(filteringLogApi.getFilteringInfoByTabId(BACKGROUND_TAB_ID)).toBeDefined();
        });

        it('removes a normal tab entry', async () => {
            const filteringLogApi = new FilteringLogApi();
            await filteringLogApi.synchronizeOpenTabs(); // registers tab 1

            expect(filteringLogApi.getFilteringInfoByTabId(tabId)).toBeDefined();

            filteringLogApi.removeTabInfo(tabId);

            expect(filteringLogApi.getFilteringInfoByTabId(tabId)).toBeUndefined();
        });
    });
});
