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

// replace unsupported fetch API by xhr requests
import { TextEncoder, TextDecoder } from 'util';

import 'whatwg-fetch';
import escape from 'css.escape';
import mockBrowser from 'sinon-chrome';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import chrome from 'sinon-chrome/extensions';
import type { DebouncedFunc } from 'lodash-es';

// After mocked user-agent, we can import all other mocks
// eslint-disable-next-line import/first
import {
    MockedTsWebExtension,
    mockLocalStorage,
    mockXhrRequests,
} from './tests/helpers';

// set missing CSS.escape polyfill for test env
global.CSS.escape = escape;

Object.assign(global, { TextDecoder, TextEncoder });

/**
 * sinon-chrome does declare a browser.runtime.id property, but its value is null, which caused the duck-typing to fail.
 *
 * @see https://github.com/mozilla/webextension-polyfill/issues/218#issuecomment-584936358
 */
chrome.runtime.id = 'test';

/**
 * These values are used in the background script to determine the maximum
 * number of rules that can be added.
 */
chrome.declarativeNetRequest = {
    /** @see https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#property-MAX_NUMBER_OF_REGEX_RULES */
    MAX_NUMBER_OF_REGEX_RULES: 1000,
    MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 5000,
};

declare global {
    interface Global {
        __IS_MV3__: boolean;
    }
}

// FIXME different tests should require different values
(global as any).__IS_MV3__ = false;

// mock chrome webextension api
global.chrome = chrome;

// implements some global function for 'webextension-polyfill' before mocking
mockBrowser.runtime.getURL.callsFake((url: string) => `chrome-extension://test/${url}`);
mockBrowser.runtime.getManifest.returns({ version: '0.0.0' });

mockBrowser.i18n.getUILanguage.returns('en');
mockBrowser.i18n.getMessage.callsFake((value: string) => value);

mockBrowser.tabs.query.returns([]);

jest.mock('webextension-polyfill', () => mockBrowser);

jest.mock('nanoid', () => ({
    nanoid: jest.fn((): string => 'cTkoV5Vs'),
}));

// Mock log to hide all logger message
jest.mock('./Extension/src/common/logger.ts');

// FIXME: Add mock for mv3 version
jest.mock('@adguard/tswebextension', () => ({
    ...(jest.requireActual('@adguard/tswebextension')),
    TsWebExtension: MockedTsWebExtension,
}));

jest.mock('lodash-es', () => ({
    ...jest.requireActual('lodash-es'),
    debounce: ((func: (...args: unknown[]) => unknown) => func as DebouncedFunc<(...args: unknown[]) => unknown>),
}));

// create browser.storage.local emulator and bound it with sinon-chrome stub
mockLocalStorage();

// register fake server for xhr requests
const server = mockXhrRequests();

export { server };
