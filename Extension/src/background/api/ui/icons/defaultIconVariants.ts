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

import browser from 'webextension-polyfill';

import { type IconVariants } from '../../../storages';

export const defaultIconVariants: IconVariants = {
    enabled: {
        '19': browser.runtime.getURL('assets/icons/on-19.png'),
        '38': browser.runtime.getURL('assets/icons/on-38.png'),
    },
    disabled: {
        '19': browser.runtime.getURL('assets/icons/off-19.png'),
        '38': browser.runtime.getURL('assets/icons/off-38.png'),
    },
    warning: {
        '19': browser.runtime.getURL('assets/icons/warning-19.png'),
        '38': browser.runtime.getURL('assets/icons/warning-38.png'),
    },
    updateAvailable: {
        '19': browser.runtime.getURL('assets/icons/update-available-19.png'),
        '38': browser.runtime.getURL('assets/icons/update-available-38.png'),
    },
};
