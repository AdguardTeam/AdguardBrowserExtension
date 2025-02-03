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
import {
    BACKGROUND_OUTPUT,
    DEVTOOLS_OUTPUT,
    POPUP_OUTPUT,
} from '../../../constants';
import { OPTIONS_PAGE } from '../../../Extension/src/common/constants';

export const chromeMv3Manifest = {
    'manifest_version': 3,
    'action': {
        'default_icon': {
            '19': 'assets/icons/on-19.png',
            '38': 'assets/icons/on-38.png',
        },
        'default_title': '__MSG_name__',
        'default_popup': `${POPUP_OUTPUT}.html`,
    },
    'background': {
        'service_worker': `${BACKGROUND_OUTPUT}.js`,
    },
    'host_permissions': [
        '<all_urls>',
    ],
    'minimum_chrome_version': '121.0',
    'web_accessible_resources': [
        {
            'resources': ['web-accessible-resources/*'],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'use_dynamic_url': true,
        },
    ],
    'options_page': OPTIONS_PAGE,
    'devtools_page': `${DEVTOOLS_OUTPUT}.html`,
    'permissions': [
        'tabs',
        'webRequest',
        'webNavigation',
        'storage',
        'unlimitedStorage',
        'contextMenus',
        'cookies',
        'declarativeNetRequest',
        'declarativeNetRequestFeedback',
        'scripting',
    ],
    'optional_permissions': [
        'privacy',
    ],
};
