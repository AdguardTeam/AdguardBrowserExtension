/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import browser from 'sinon-chrome/webextensions';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import chrome from 'sinon-chrome/extensions';

/**
 * sinon-chrome does declare a browser.runtime.id property, but its value is null, which caused the duck-typing to fail.
 *
 * @see https://github.com/mozilla/webextension-polyfill/issues/218#issuecomment-584936358
 */
chrome.runtime.id = 'text';

global.chrome = chrome;

jest.mock('webextension-polyfill', () => ({
    ...browser,
    runtime: {
        ...browser.runtime,
        getURL: (): string => 'chrome-extension://test',
        getManifest: (): { version: string } => ({ version: '0.0.0' }),
    },
    i18n: {
        ...browser.i18n,
        getUILanguage: (): string => 'en',
        getMessage: (value: string): string => value,
    },
}));

jest.mock('nanoid', () => ({
    nanoid: jest.fn((): string => '1'),
}));
