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
    BUILD_ENV,
    FIREFOX_APP_IDS_MAP,
    FIREFOX_WEBEXT_UPDATE_URL,
} from '../../constants';
import { OPTIONS_PAGE } from '../../../Extension/src/common/constants';
import {
    BACKGROUND_OUTPUT,
    MIN_SUPPORTED_VERSION,
    POPUP_OUTPUT,
} from '../../../constants';

const appId = FIREFOX_APP_IDS_MAP[BUILD_ENV];

if (appId === undefined) {
    throw new Error(`App ID not found for BUILD_ENV: ${BUILD_ENV}`);
}

const MIN_SUPPORTED_DESKTOP_VERSION_STR = `${String(MIN_SUPPORTED_VERSION.FIREFOX)}.0`;

const MIN_SUPPORTED_ANDROID_VERSION_STR = `${String(MIN_SUPPORTED_VERSION.FIREFOX_MOBILE)}.0`;

export const firefoxManifest = {
    'background': {
        'page': `${BACKGROUND_OUTPUT}.html`,
        'persistent': false,
    },
    'browser_action': {
        'default_icon': {
            '19': 'assets/icons/on-19.png',
            '38': 'assets/icons/on-38.png',
        },
        'default_title': '__MSG_name__',
        'default_popup': `${POPUP_OUTPUT}.html`,
    },
    'web_accessible_resources': [
        '/web-accessible-resources/*',
    ],
    'browser_specific_settings': {
        'gecko': {
            'id': appId,
            'strict_min_version': MIN_SUPPORTED_DESKTOP_VERSION_STR,
        },
        'gecko_android': {
            'strict_min_version': MIN_SUPPORTED_ANDROID_VERSION_STR,
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
        'clipboardRead',
        'clipboardWrite',
    ],
};

export const firefoxManifestStandalone = {
    'browser_specific_settings': {
        'gecko': {
            'update_url': FIREFOX_WEBEXT_UPDATE_URL,
        },
    },
};
