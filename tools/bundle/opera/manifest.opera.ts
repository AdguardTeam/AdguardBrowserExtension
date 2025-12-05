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
    BACKGROUND_OUTPUT,
    DEVTOOLS_OUTPUT,
    MIN_SUPPORTED_VERSION,
    POPUP_OUTPUT,
} from '../../../constants';
import { OPTIONS_PAGE } from '../../../Extension/src/common/constants';

export const operaManifest = {
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
    'background': {
        'page': `${BACKGROUND_OUTPUT}.html`,
        'persistent': true,
    },
    'options_page': OPTIONS_PAGE,
    'devtools_page': `${DEVTOOLS_OUTPUT}.html`,
    'permissions': [
        'tabs',
        '<all_urls>',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'unlimitedStorage',
        'contextMenus',
        'cookies',
    ],
    'optional_permissions': [
        'privacy',
    ],
    'minimum_opera_version': String(MIN_SUPPORTED_VERSION.OPERA),
};
