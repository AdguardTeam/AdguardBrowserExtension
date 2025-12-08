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

import { vi } from 'vitest';
import browser from 'sinon-chrome';
import escape from 'css.escape';
// @ts-ignore
import chrome from 'sinon-chrome/extensions';
import { type DebouncedFunc } from 'lodash-es/debounce';

import { ResourceType } from '@adguard/tsurlfilter/es/declarative-converter';

import { MANIFEST_ENV } from './tools/constants';
import {
    MockedTsWebExtension,
    MockedTsWebExtensionMV3,
    mockLocalStorage,
    mockXhrRequests,
    createMockTabsApi,
    createMockDefaultFilteringLog,
    createMockCompaniesDbService,
} from './tests/helpers';
import { mockGlobalFetch } from './tests/helpers/mocks/fetch';

/**
 * sinon-chrome does declare a browser.runtime.id property, but its value is null, which caused the duck-typing to fail.
 *
 * @see https://github.com/mozilla/webextension-polyfill/issues/218#issuecomment-584936358
 */
chrome.runtime.id = 'test';

const EXTENSION_URL_PREFIX = 'chrome-extension://';

browser.runtime.getURL.callsFake((url: string) => `${EXTENSION_URL_PREFIX}test/${url}`);
browser.runtime.getManifest.callsFake(() => ({
    name: 'AdGuard AdBlocker',
    version: '0.0.0',
    manifest_version: MANIFEST_ENV as any,
}));
browser.runtime.getPlatformInfo.resolves({
    os: 'mac',
    arch: 'x86-64',
});
Object.assign(browser, {
    /**
     * These values are used in the background script to determine the maximum
     * number of rules that can be added.
     */
    declarativeNetRequest: {
        /** @see https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#property-MAX_NUMBER_OF_REGEX_RULES */
        MAX_NUMBER_OF_REGEX_RULES: 1000,
        MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 5000,
        ResourceType,
    },
    webRequest: {
        ...browser.webRequest,
        filterResponseData: vi.fn(),
    },
    tabs: {
        ...browser.tabs,
        query: vi.fn(() => []),
    },
    i18n: {
        getUILanguage: vi.fn(() => 'en'),
        getMessage: vi.fn((value: string) => value),
    },
});

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({ default: browser }));

vi.mock('nanoid', () => ({
    nanoid: (): string => 'cd42f5fa',
    customAlphabet: (): Function => (): string => 'cd42f5fa',
}));

// Mock log to hide all logger message
vi.mock('./Extension/src/common/logger.ts');

vi.mock('@adguard/tswebextension', async () => {
    const actual = await vi.importActual('@adguard/tswebextension') as any;
    const tsurlfilter = await vi.importActual('@adguard/tsurlfilter') as any;
    return {
        ...actual,
        TsWebExtension: MockedTsWebExtension,
        isExtensionUrl: vi.fn((url: string) => url.startsWith(EXTENSION_URL_PREFIX)),
        // ConvertedFilterList is actually from @adguard/tsurlfilter
        ConvertedFilterList: tsurlfilter.ConvertedFilterList,
        // Utility functions that are re-exported
        getDomain: actual.getDomain,
        isHttpRequest: actual.isHttpRequest,
        MAIN_FRAME_ID: actual.MAIN_FRAME_ID,
        FilteringEventType: actual.FilteringEventType,
        RequestEvents: actual.RequestEvents,
        // Mock tabsApi
        tabsApi: createMockTabsApi(),
        // Mock defaultFilteringLog
        defaultFilteringLog: createMockDefaultFilteringLog(),
        // Mock companiesDbService
        companiesDbService: createMockCompaniesDbService(),
    };
});

// Mock for MV3 version of tswebextension
// We manually construct the mock to avoid Zod initialization issues and linked package resolution
vi.mock('@adguard/tswebextension/mv3', async () => {
    const tsurlfilter = await vi.importActual('@adguard/tsurlfilter') as any;
    // Import MV2 actual for utility functions, but handle potential linked package issues
    let mv2: any;
    try {
        mv2 = await vi.importActual('@adguard/tswebextension');
    } catch (e) {
        // If linked package fails to load, use empty object and we'll set functions to undefined
        mv2 = {};
    }
    return {
        TsWebExtension: MockedTsWebExtensionMV3,
        isExtensionUrl: vi.fn((url: string) => url.startsWith(EXTENSION_URL_PREFIX)),
        ConvertedFilterList: tsurlfilter.ConvertedFilterList,
        // Re-export common constants and types that may be needed
        MESSAGE_HANDLER_NAME: 'tsWebExtension',
        // Utility functions
        getDomain: mv2.getDomain,
        isHttpRequest: mv2.isHttpRequest,
        MAIN_FRAME_ID: mv2.MAIN_FRAME_ID,
        FilteringEventType: mv2.FilteringEventType,
        RequestEvents: mv2.RequestEvents,
        // Mock tabsApi
        tabsApi: createMockTabsApi(),
        // Mock defaultFilteringLog
        defaultFilteringLog: createMockDefaultFilteringLog(),
        // Mock companiesDbService
        companiesDbService: createMockCompaniesDbService(),
    };
});

vi.mock('lodash-es', async () => ({
    ...await vi.importActual('lodash-es'),
    debounce: ((func: (...args: unknown[]) => unknown) => func as DebouncedFunc<(...args: unknown[]) => unknown>),
}));

mockLocalStorage();

Object.assign(global, {
    sinonFakeServer: mockXhrRequests(),
    fetch: mockGlobalFetch(),
    CSS: {
        escape,
    },
    chrome: browser,
});
