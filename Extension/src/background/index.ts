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
import browser from 'webextension-polyfill';

import { App } from 'app';

import { UserAgent } from '../common/user-agent';

let isInitialized = false;

/**
 * Initializes the app if it has not been initialized yet.
 */
const initWrapper = (): void => {
    if (isInitialized) {
        return;
    }

    App.init();
    isInitialized = true;
};

initWrapper();

/**
 * Initializes background services.
 * For Firefox, initialization happens both immediately and is registered for `onStartup` and `onInstalled` events
 * to ensure proper initialization in Firefox's non-persistent background page model.
 * This ensures the extension starts even when there are no open tabs.
 */
if (UserAgent.isFirefox) {
    browser.runtime.onStartup.addListener(initWrapper);
    browser.runtime.onInstalled.addListener(initWrapper);
}
