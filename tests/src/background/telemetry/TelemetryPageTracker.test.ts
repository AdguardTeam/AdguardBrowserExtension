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
    test,
    vi,
} from 'vitest';

import { TelemetryScreenName, TelemetryPageTracker } from '../../../../Extension/src/background/services';

vi.mock('../../../../Extension/src/background/message-handler', () => ({
    messageHandler: {
        addListener: vi.fn(),
    },
}));

describe('TelemetryPageTracker', () => {
    let tracker: TelemetryPageTracker;

    beforeEach(() => {
        vi.clearAllMocks();
        tracker = new TelemetryPageTracker();
    });

    describe('addOpenedPage', () => {
        test('adds new page and returns page ID', () => {
            const pageId = tracker.addOpenedPage();

            expect(pageId).toBeDefined();
            expect(typeof pageId).toBe('string');
            expect(pageId.length).toBeGreaterThan(0);
        });

        test('accepts custom page ID', () => {
            const customPageId = 'custom-page-123';
            const pageId = tracker.addOpenedPage(customPageId);

            expect(pageId).toBe(customPageId);
        });
    });

    describe('removeOpenedPage', () => {
        test('removes existing page', () => {
            const pageId = tracker.addOpenedPage();

            expect(() => tracker.removeOpenedPage(pageId)).not.toThrow();
        });

        test('resets screen names when all pages are closed', () => {
            const pageId = tracker.addOpenedPage();
            tracker.updateScreen(TelemetryScreenName.MainPage, pageId);

            expect(tracker.prevScreenName).toBeUndefined();

            tracker.removeOpenedPage(pageId);

            expect(tracker.prevScreenName).toBeUndefined();
            expect(tracker.currentScreenName).toBeUndefined();
            expect(tracker.currentScreenPageId).toBeUndefined();
        });

        test('rotates screen names when current page is closed', () => {
            const pageId1 = tracker.addOpenedPage('page-1');
            const pageId2 = tracker.addOpenedPage('page-2');

            tracker.updateScreen(TelemetryScreenName.MainPage, pageId1);
            tracker.updateScreen(TelemetryScreenName.SecurePage, pageId2);

            tracker.removeOpenedPage(pageId2);

            expect(tracker.prevScreenName).toBe(TelemetryScreenName.SecurePage);
        });

        test('keeps state when removing non-current page', () => {
            const pageId1 = tracker.addOpenedPage('page-1');
            const pageId2 = tracker.addOpenedPage('page-2');

            tracker.updateScreen(TelemetryScreenName.MainPage, pageId1);
            tracker.updateScreen(TelemetryScreenName.SecurePage, pageId2);

            const prevBefore = tracker.prevScreenName;

            tracker.removeOpenedPage(pageId1);

            expect(tracker.prevScreenName).toBe(prevBefore);
        });
    });

    describe('updateScreen', () => {
        test('updates screen name and page ID', () => {
            const pageId = 'test-page';
            const updated = tracker.updateScreen(TelemetryScreenName.MainPage, pageId);

            expect(updated).toBe(true);
        });

        test('sets prevScreenName to previous currentScreenName', () => {
            const pageId1 = 'page-1';
            const pageId2 = 'page-2';

            tracker.updateScreen(TelemetryScreenName.MainPage, pageId1);
            expect(tracker.prevScreenName).toBeUndefined();

            tracker.updateScreen(TelemetryScreenName.SecurePage, pageId2);
            expect(tracker.prevScreenName).toBe(TelemetryScreenName.MainPage);
        });

        test('returns false when screen name and page ID are the same', () => {
            const pageId = 'test-page';

            tracker.updateScreen(TelemetryScreenName.MainPage, pageId);
            const updated = tracker.updateScreen(TelemetryScreenName.MainPage, pageId);

            expect(updated).toBe(false);
        });

        test('returns true when only screen name changes', () => {
            const pageId = 'test-page';

            tracker.updateScreen(TelemetryScreenName.MainPage, pageId);
            const updated = tracker.updateScreen(TelemetryScreenName.SecurePage, pageId);

            expect(updated).toBe(true);
        });

        test('returns true when only page ID changes', () => {
            tracker.updateScreen(TelemetryScreenName.MainPage, 'page-1');
            const updated = tracker.updateScreen(TelemetryScreenName.MainPage, 'page-2');

            expect(updated).toBe(true);
        });

        test('tracks screen navigation history', () => {
            tracker.updateScreen(TelemetryScreenName.MainPage, 'page-1');
            tracker.updateScreen(TelemetryScreenName.SecurePage, 'page-2');
            tracker.updateScreen(TelemetryScreenName.BlockElementScreen, 'page-3');

            expect(tracker.prevScreenName).toBe(TelemetryScreenName.SecurePage);
        });
    });

    describe('screen navigation flow', () => {
        test('handles typical popup flow', () => {
            const pageId = tracker.addOpenedPage();

            // Open popup
            tracker.updateScreen(TelemetryScreenName.MainPage, pageId);
            expect(tracker.prevScreenName).toBeUndefined();

            // Navigate to secure page
            tracker.updateScreen(TelemetryScreenName.GeneralSettings, pageId);
            expect(tracker.prevScreenName).toBe(TelemetryScreenName.MainPage);

            // Close popup
            tracker.removeOpenedPage(pageId);
            expect(tracker.prevScreenName).toBeUndefined();
        });

        test('handles multiple pages open simultaneously', () => {
            const popupId = tracker.addOpenedPage('popup');
            const optionsId = tracker.addOpenedPage('options');

            tracker.updateScreen(TelemetryScreenName.MainPage, popupId);
            tracker.updateScreen(TelemetryScreenName.GeneralSettings, optionsId);

            tracker.removeOpenedPage(popupId);
            expect(tracker.prevScreenName).toBe(TelemetryScreenName.MainPage);

            tracker.removeOpenedPage(optionsId);
            expect(tracker.prevScreenName).toBeUndefined();
        });
    });
});

export {};
