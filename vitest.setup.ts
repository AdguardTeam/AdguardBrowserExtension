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

import browser from 'sinon-chrome';
import { vi } from 'vitest';

import { MANIFEST_ENV } from './tools/constants';

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

// Set up global `chrome` object
global.chrome = {
    ...browser,
    /**
     * These values are used in the background script to determine the maximum
     * number of rules that can be added.
    */
    // @ts-ignore
    declarativeNetRequest: {
        /** @see https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#property-MAX_NUMBER_OF_REGEX_RULES */
        MAX_NUMBER_OF_REGEX_RULES: 1000,
        MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 5000,
        ResourceType,
    },
};

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => {
    return {
        default: {
            ...browser,
            webRequest: {
                ...browser.webRequest,
                filterResponseData: vi.fn(),
            },
            i18n:{
                getUILanguage: vi.fn(() => 'en'),
                getMessage: vi.fn((value: string) => value),
            },
            runtime: {
                ...browser.runtime,
                getManifest: vi.fn(() => ({
                    version: '0.0.0',
                    manifest_version: MANIFEST_ENV,
                })),
                getURL: vi.fn((url: string) => `chrome-extension://test/${url}`)
            },
        },
    };
});

vi.mock('nanoid', () => ({
    nanoid: (): string => 'cTkoV5Vs',
    customAlphabet: (): Function => (): string => 'cTkoV5Vs',
}));
