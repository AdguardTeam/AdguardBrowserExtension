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

import { FIREFOX_APP_IDS_MAP, FIREFOX_WEBEXT_UPDATE_URL } from '../../constants';
import { OPTIONS_PAGE } from '../../../Extension/src/common/constants';

const buildEnv = process.env.BUILD_ENV;

if (buildEnv === undefined) {
    throw new Error('BUILD_ENV is not set in the environment variables.');
}

const appId = FIREFOX_APP_IDS_MAP[buildEnv];

if (appId === undefined) {
    throw new Error(`App ID not found for BUILD_ENV: ${buildEnv}`);
}

export const firefoxManifest = {
    'background': {
        'page': 'pages/background.html',
        'persistent': false,
    },
    'browser_specific_settings': {
        'gecko': {
            'id': appId,
            'strict_min_version': '78.0',
        },
        'gecko_android': {
            'strict_min_version': '113.0',
        },
    },
    'options_ui': {
        'page': OPTIONS_PAGE,
        'open_in_tab': true,
    },
    'permissions': [
        'tabs',
        '<all_urls>',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'contextMenus',
        'cookies',
        'privacy',
    ],
};

export const firefoxManifestStandalone = {
    'browser_specific_settings': {
        'gecko': {
            'update_url': FIREFOX_WEBEXT_UPDATE_URL,
        },
    },
};
