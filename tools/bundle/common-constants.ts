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

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import HtmlWebpackPlugin from 'html-webpack-plugin';

import { Browser } from '../constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

export const BACKGROUND_PATH = path.resolve(__dirname, '../../Extension/pages/background');
export const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
export const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');
export const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');
export const POST_INSTALL_PATH = path.resolve(__dirname, '../../Extension/pages/post-install');
export const CONTENT_SCRIPT_START_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-start');
export const ASSISTANT_INJECT_PATH = path.resolve(__dirname, '../../Extension/pages/assistant-inject');
export const CONTENT_SCRIPT_END_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-end');
export const SUBSCRIBE_PATH = path.resolve(__dirname, '../../Extension/pages/subscribe');
export const THANKYOU_PATH = path.resolve(__dirname, '../../Extension/pages/thankyou');
export const FULLSCREEN_USER_RULES_PATH = path.resolve(__dirname, '../../Extension/pages/fullscreen-user-rules');
export const SAFEBROWSING_PATH = path.resolve(__dirname, '../../Extension/pages/safebrowsing');
export const AD_BLOCKED_PATH = path.resolve(__dirname, '../../Extension/pages/ad-blocked');
export const EDITOR_PATH = path.resolve(__dirname, '../../Extension/src/pages/common/components/Editor');

export const htmlTemplatePluginCommonOptions: Partial<HtmlWebpackPlugin.Options> = {
    cache: false,
    scriptLoading: 'blocking',
};

export type BrowserConfig = {
    browser: Browser;
    devtools: boolean;
    buildDir: string;
};

export const BROWSERS_CONF: Record<Browser, BrowserConfig> = {
    [Browser.Chrome]: {
        browser: Browser.Chrome,
        devtools: true,
        buildDir: Browser.Chrome,
    },
    [Browser.ChromeMv3]: {
        browser: Browser.ChromeMv3,
        devtools: true,
        buildDir: Browser.ChromeMv3,
    },
    [Browser.FirefoxStandalone]: {
        browser: Browser.FirefoxStandalone,
        devtools: false,
        buildDir: Browser.FirefoxStandalone,
    },
    [Browser.FirefoxAmo]: {
        browser: Browser.FirefoxAmo,
        devtools: false,
        buildDir: Browser.FirefoxAmo,
    },
    [Browser.Opera]: {
        browser: Browser.Opera,
        devtools: true,
        buildDir: Browser.Opera,
    },
    [Browser.Edge]: {
        browser: Browser.Edge,
        devtools: true,
        buildDir: Browser.Edge,
    },
};
