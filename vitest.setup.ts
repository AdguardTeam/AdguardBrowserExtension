/**
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
// @ts-ignore
import { fetch as fetchPolyfill } from 'whatwg-fetch';
import browser from 'sinon-chrome';
import escape from 'css.escape';
// @ts-ignore
import chrome from 'sinon-chrome/extensions';
import type { DebouncedFunc } from 'lodash-es/debounce';

import { MANIFEST_ENV } from './tools/constants';
import {
    MockedTsWebExtension,
    mockLocalStorage,
    mockXhrRequests,
} from './tests/helpers';

// set missing CSS.escape polyfill for test env
global.CSS.escape = escape;

/**
 * sinon-chrome does declare a browser.runtime.id property, but its value is null, which caused the duck-typing to fail.
 *
 * @see https://github.com/mozilla/webextension-polyfill/issues/218#issuecomment-584936358
 */
chrome.runtime.id = 'test';

// FIXME: Export directly from tswebextension.
enum ResourceType {
    MAIN_FRAME = 'main_frame',
    SUB_FRAME = 'sub_frame',
    STYLESHEET = 'stylesheet',
    SCRIPT = 'script',
    IMAGE = 'image',
    FONT = 'font',
    OBJECT = 'object',
    XMLHTTPREQUEST = 'xmlhttprequest',
    PING = 'ping',
    CSP_REPORT = 'csp_report',
    MEDIA = 'media',
    WEBSOCKET = 'websocket',
    OTHER = 'other',
}

browser.runtime.getURL.callsFake((url: string) => `chrome-extension://test/${url}`);
browser.runtime.getManifest.callsFake(() => ({
    name: 'AdGuard AdBlocker',
    version: '0.0.0',
    manifest_version: MANIFEST_ENV as any,
}));
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

// Set up global `chrome` object
// @ts-ignore
global.chrome = browser;

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({ default: browser }));

vi.mock('nanoid', () => ({
    nanoid: (): string => 'cTkoV5Vs',
    customAlphabet: (): Function => (): string => 'cTkoV5Vs',
}));

// Mock log to hide all logger message
vi.mock('./Extension/src/common/logger.ts');

// TODO: Add mock for mv3 version. AG-37302
vi.mock('@adguard/tswebextension', async () => ({
    ...(await vi.importActual('@adguard/tswebextension')),
    TsWebExtension: MockedTsWebExtension,
}));

vi.mock('lodash-es', async () => ({
    ...await vi.importActual('lodash-es'),
    debounce: ((func: (...args: unknown[]) => unknown) => func as DebouncedFunc<(...args: unknown[]) => unknown>),
}));

mockLocalStorage();

// register fake server for xhr requests
const server = mockXhrRequests();

global.fetch = fetchPolyfill;

// @ts-ignore
global.sinonFakeServer = server;
