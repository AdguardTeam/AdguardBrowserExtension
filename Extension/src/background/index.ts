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

import { App } from 'app';

import { UserAgent } from '../common/user-agent';

const wrapper1 = (): void => {
    // eslint-disable-next-line no-console
    console.log('wrapper 1', Date.now());
    App.init();
};

const wrapper2 = (): void => {
    // eslint-disable-next-line no-console
    console.log('wrapper 2', Date.now());
    App.init();
};

wrapper1();

if (UserAgent.isFirefox) {
    browser.runtime.onStartup.addListener(wrapper2);
    browser.runtime.onInstalled.addListener(wrapper2);
}
