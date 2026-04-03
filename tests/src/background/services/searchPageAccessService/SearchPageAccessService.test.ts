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

/* eslint-disable max-classes-per-file */

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
} from 'vitest';

import {
    isSearchEngineDomain,
} from '../../../../../Extension/src/background/services/searchPageAccessService/search-domains';
import {
    SearchPageAccessServiceCommon,
} from '../../../../../Extension/src/background/services/searchPageAccessService/SearchPageAccessService-common';
import { searchPageAccessStorage } from '../../../../../Extension/src/background/storages';
import { UserAgent } from '../../../../../Extension/src/common/user-agent';
import { MAIN_FRAME_ID } from '../../../../../Extension/src/background/tswebextension';

vi.mock('../../../../../Extension/src/background/storages', () => ({
    searchPageAccessStorage: {
        shouldShowNotification: vi.fn(),
        isPermissionGranted: vi.fn(),
        setIsPermissionGranted: vi.fn(),
        dismissNotification: vi.fn(),
    },
}));

vi.mock('../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: {
        isOpera: false,
    },
}));

vi.mock('../../../../../Extension/src/background/message-handler', () => ({
    messageHandler: {
        addListener: vi.fn(),
    },
}));

describe('isSearchEngineDomain', () => {
    it.each([
        'https://google.com/',
        'https://www.google.co.uk/',
        'https://mail.yandex.ru/inbox',
        'https://bing.com/',
        'https://www.duckduckgo.com/?q=test',
    ])('should return true for search engine URL: %s', (url) => {
        expect(isSearchEngineDomain(url)).toBe(true);
    });

    it.each([
        'https://www.example.com',
        'https://notgoogle.com/',
        'https://fakeyandex.ru/',
        'https://google.evil.com',
        'https://foo.google.evil.com',
    ])('should return false for non-search engine URL: %s', (url) => {
        expect(isSearchEngineDomain(url)).toBe(false);
    });

    it('should return false for invalid URL', () => {
        expect(isSearchEngineDomain('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
        expect(isSearchEngineDomain('')).toBe(false);
    });
});

describe('SearchPageAccessServiceCommon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('shouldShowNotification', () => {
        it('should return false when not Opera browser', async () => {
            Object.defineProperty(UserAgent, 'isOpera', { value: false, configurable: true });

            const result = await SearchPageAccessServiceCommon.shouldShowNotification();

            expect(result).toBe(false);
            expect(searchPageAccessStorage.shouldShowNotification).not.toHaveBeenCalled();
        });

        it('should return false when Opera but notification dismissed', async () => {
            Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(false);

            const result = await SearchPageAccessServiceCommon.shouldShowNotification();

            expect(result).toBe(false);
        });

        it('should return false when Opera, should show, but permission already granted', async () => {
            Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);
            vi.mocked(searchPageAccessStorage.isPermissionGranted).mockResolvedValue(true);

            const result = await SearchPageAccessServiceCommon.shouldShowNotification();

            expect(result).toBe(false);
        });

        it('should return true when Opera, should show, and permission not granted', async () => {
            Object.defineProperty(UserAgent, 'isOpera', { value: true, configurable: true });
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);
            vi.mocked(searchPageAccessStorage.isPermissionGranted).mockResolvedValue(false);

            const result = await SearchPageAccessServiceCommon.shouldShowNotification();

            expect(result).toBe(true);
        });
    });

    describe('onNavigationCommitted', () => {
        /**
         * Helper class to access protected methods for testing.
         */
        class TestableService extends SearchPageAccessServiceCommon {
            public static async testOnNavigationCommitted(
                details: { tabId: number; frameId: number; url: string },
            ): Promise<void> {
                return this.onNavigationCommitted(details as any);
            }

            public static testExecuteScriptCalled = false;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            protected static override async executeTestScript(tabId: number): Promise<void> {
                this.testExecuteScriptCalled = true;
            }

            public static resetTestState(): void {
                this.testExecuteScriptCalled = false;
            }
        }

        beforeEach(() => {
            TestableService.resetTestState();
        });

        it('should skip non-main frame navigations', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);

            await TestableService.testOnNavigationCommitted({
                tabId: 1,
                frameId: 1,
                url: 'https://www.google.com/search?q=test',
            });

            expect(searchPageAccessStorage.shouldShowNotification).not.toHaveBeenCalled();
            expect(TestableService.testExecuteScriptCalled).toBe(false);
        });

        it('should skip non-search engine URLs', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);

            await TestableService.testOnNavigationCommitted({
                tabId: 1,
                frameId: MAIN_FRAME_ID,
                url: 'https://www.example.com',
            });

            expect(searchPageAccessStorage.shouldShowNotification).not.toHaveBeenCalled();
            expect(TestableService.testExecuteScriptCalled).toBe(false);
        });

        it('should skip when notification is dismissed', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(false);

            await TestableService.testOnNavigationCommitted({
                tabId: 1,
                frameId: MAIN_FRAME_ID,
                url: 'https://www.google.com/search?q=test',
            });

            expect(searchPageAccessStorage.shouldShowNotification).toHaveBeenCalledTimes(1);
            expect(TestableService.testExecuteScriptCalled).toBe(false);
        });

        it('should check permission when all conditions are met', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);

            await TestableService.testOnNavigationCommitted({
                tabId: 1,
                frameId: MAIN_FRAME_ID,
                url: 'https://www.google.com/search?q=test',
            });

            expect(searchPageAccessStorage.shouldShowNotification).toHaveBeenCalledTimes(1);
            expect(TestableService.testExecuteScriptCalled).toBe(true);
        });
    });

    describe('checkPermission (via executeTestScript)', () => {
        /**
         * Helper class to test permission checking behavior.
         */
        class PermissionTestService extends SearchPageAccessServiceCommon {
            private static shouldFail = false;

            public static setShouldFail(value: boolean): void {
                this.shouldFail = value;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            protected static override async executeTestScript(tabId: number): Promise<void> {
                if (this.shouldFail) {
                    throw new Error('Permission denied');
                }
            }

            public static async testOnNavigationCommitted(
                details: { tabId: number; frameId: number; url: string },
            ): Promise<void> {
                return this.onNavigationCommitted(details as any);
            }
        }

        beforeEach(() => {
            PermissionTestService.setShouldFail(false);
        });

        it('should set permission granted to true when script injection succeeds', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);
            PermissionTestService.setShouldFail(false);

            await PermissionTestService.testOnNavigationCommitted({
                tabId: 1,
                frameId: MAIN_FRAME_ID,
                url: 'https://www.google.com/search?q=test',
            });

            expect(searchPageAccessStorage.setIsPermissionGranted).toHaveBeenCalledWith(true);
        });

        it('should set permission granted to false when script injection fails', async () => {
            vi.mocked(searchPageAccessStorage.shouldShowNotification).mockResolvedValue(true);
            PermissionTestService.setShouldFail(true);

            await PermissionTestService.testOnNavigationCommitted({
                tabId: 1,
                frameId: MAIN_FRAME_ID,
                url: 'https://www.google.com/search?q=test',
            });

            expect(searchPageAccessStorage.setIsPermissionGranted).toHaveBeenCalledWith(false);
        });
    });
});
