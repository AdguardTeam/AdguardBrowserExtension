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

import { browserStorage } from './storages';

const wrapper1 = (): void => {
    const now = Date.now();
    // save to browser storage time of init
    browserStorage.set(`abc-INIT-${now}`, `OLD - ${new Date(now).toISOString()}`);
    // eslint-disable-next-line no-console
    // console.log('wrapper 1', now);
    App.init();
};

const wrapper2 = (): void => {
    const now = Date.now();
    // save to browser storage time of init
    browserStorage.set(`abc-INIT-${now}`, `NEW - ${new Date(now).toISOString()}`);
    // eslint-disable-next-line no-console
    // console.log('wrapper 2', now);
    App.init();
};

wrapper1();

/**
 * Initializes background services in Firefox.
 * Initialization is deferred to `onStartup` and `onInstalled` events
 * because the Firefox extension uses a non-persistent background page model.
 */
if (UserAgent.isFirefox) {
    browser.runtime.onStartup.addListener(wrapper2);
    browser.runtime.onInstalled.addListener(wrapper2);
}
