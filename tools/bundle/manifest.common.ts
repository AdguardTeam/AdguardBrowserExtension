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
    CONTENT_SCRIPT_END_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    SUBSCRIBE_OUTPUT,
    THANKYOU_OUTPUT,
} from '../../constants';

export const commonManifest = {
    'manifest_version': 2,
    'name': '__MSG_name__',
    'short_name': '__MSG_short_name__',
    'author': 'Adguard Software Ltd',
    'default_locale': 'en',
    'description': '__MSG_description__',
    'icons': {
        '16': 'assets/icons/on-16.png',
        '128': 'assets/icons/on-128.png',
    },
    'content_scripts': [
        {
            'all_frames': true,
            'js': [
                `${CONTENT_SCRIPT_START_OUTPUT}.js`,
            ],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'match_about_blank': true,
            'run_at': 'document_start',
        },
        {
            'all_frames': true,
            'js': [
                `${CONTENT_SCRIPT_END_OUTPUT}.js`,
            ],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'match_about_blank': true,
            'run_at': 'document_end',
        },
        {
            'all_frames': true,
            'js': [
                `${SUBSCRIBE_OUTPUT}.js`,
            ],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'match_about_blank': false,
            'run_at': 'document_end',
        },
        {
            'all_frames': false,
            'js': [
                `${THANKYOU_OUTPUT}.js`,
            ],
            'matches': [
                '*://*.adguard.com/*/thankyou.html*',
                '*://*.adguard.info/*/thankyou.html*',
                '*://*.adguard.app/*/thankyou.html*',
            ],
            'run_at': 'document_start',
        },
    ],
};
