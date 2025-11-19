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

import { BrowserStorage } from './browser-storage';
import { HybridStorage } from './hybrid-storage';
import { IDBStorage } from './idb-storage';

/**
 * Storage instance for accessing `browser.storage.local`.
 */
export const browserStorage = new BrowserStorage(browser.storage.local);

/**
 * Storage instance for accessing `IndexedDB` with fallback to `browser.storage.local`.
 */
export const hybridStorage = new HybridStorage(browser.storage.local);

// Expose storage instances to the global scope for debugging purposes,
// because it's hard to access them from the console in the background
// page or impossible from Application tab -> IndexedDB (showing empty page).
if (!IS_BETA && !IS_RELEASE) {
    // @ts-ignore
    // eslint-disable-next-line no-restricted-globals
    self.hybridStorage = hybridStorage;

    // @ts-ignore
    // eslint-disable-next-line no-restricted-globals
    self.HybridStorage = HybridStorage;

    // @ts-ignore
    // eslint-disable-next-line no-restricted-globals
    self.IDBStorage = IDBStorage;
}
