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
import 'whatwg-fetch';

import escape from 'css.escape';
import mockBrowser from 'sinon-chrome';
import { DebouncedFunc } from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import chrome from 'sinon-chrome/extensions';

// After mocked user-agent, we can import all other mocks
// eslint-disable-next-line import/first
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
chrome.runtime.id = 'text';

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
jest.mock('./Extension/src/common/log.ts');

jest.mock('@adguard/tswebextension', () => ({
    ...(jest.requireActual('@adguard/tswebextension')),
    TsWebExtension: MockedTsWebExtension,
}));

jest.mock('lodash', () => ({
    ...jest.requireActual('lodash'),
    debounce: ((func: (...args: unknown[]) => unknown) => func as DebouncedFunc<(...args: unknown[]) => unknown>),
}));

// create browser.storage.local emulator and bound it with sinon-chrome stub
mockLocalStorage();

// register fake server for xhr requests
mockXhrRequests();
