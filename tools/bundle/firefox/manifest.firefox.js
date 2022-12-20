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

import { FIREFOX_APP_IDS_MAP } from '../../constants';

const appId = FIREFOX_APP_IDS_MAP[process.env.BUILD_ENV];

export const firefoxManifest = {
    'applications': {
        'gecko': {
            'id': appId,
            'strict_min_version': '78.0',
        },
    },
    'options_ui': {
        'page': 'pages/options.html',
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
