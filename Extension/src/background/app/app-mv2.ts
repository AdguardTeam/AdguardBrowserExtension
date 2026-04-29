/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { SafebrowsingService } from '../services/safebrowsing';
import { localeDetect } from '../services/locale-detect-mv2';
import { FiltersApi } from '../api';

import { AppCommon } from './app-common';
/**
 * Logs initialization times for debugging purposes.
 * To enable logging, set `_test_debugInitLoggingFlag` to `true` in local storage.
 *
 * ```js
 * await browser.storage.local.set({'_test_debugInitLoggingFlag': true});
 * ```
 *
 * To get when the extension was initiated from storage, run:
 *
 * ```js
 * await browser.storage.local.get('_test_initTimesKey');
 * ```
 */
const trackInitTimesForDebugging = async (): Promise<void> => {
    const DEBUG_INIT_LOGGING_FLAG_KEY = '_test_debugInitLoggingFlag';
    const LOGGING_DISABLED_BY_DEFAULT = false;
    const INIT_TIMES_STORAGE_KEY = '_test_initTimesKey';

    const isLoggingEnabled = (await browser.storage.local.get(DEBUG_INIT_LOGGING_FLAG_KEY))[DEBUG_INIT_LOGGING_FLAG_KEY]
        || LOGGING_DISABLED_BY_DEFAULT;

    if (isLoggingEnabled) {
        const rawLoggedInitTimes = (await browser.storage.local.get(INIT_TIMES_STORAGE_KEY))[INIT_TIMES_STORAGE_KEY];

        const loggedInitTimes = Array.isArray(rawLoggedInitTimes)
            ? rawLoggedInitTimes
            : [];

        // Current time in local format
        const currentLocalTime = new Date().toLocaleString();

        await browser.storage.local.set({ [INIT_TIMES_STORAGE_KEY]: [...loggedInitTimes, currentLocalTime] });
    }
};

/**
 * This class is app entry point.
 *
 * {@link App.init} Initializes all app services
 * and handle webextension API events for first install and update scenario.
 */
export class App extends AppCommon {
    /**
     * @inheritdoc
     */
    protected static override async asyncInit(): Promise<boolean> {
        await trackInitTimesForDebugging();

        return super.asyncInit();
    }

    /**
     * @inheritdoc
     */
    protected static override async manifestSpecificInit(): Promise<void> {
        // Initializes language detector for auto-enabling relevant filters
        localeDetect.init();

        /**
         * Initializes Safebrowsing module
         * - Initializes persisted lru cache for hashes
         * - Adds listener for filtering web requests
         * - Adds listener for safebrowsing settings option switcher
         * - Adds listener for "add trusted domain" message.
         */
        await SafebrowsingService.init();
    }

    /**
     * @inheritdoc
     */
    protected static override async initFiltersApi(isInstall: boolean): Promise<void> {
        /**
         * Initializes Filters data:
         * - Loads app i18n metadata and caches it in i18n-metadata storage
         * - Loads app metadata, apply localization from i18n-metadata storage and caches it in metadata storage
         * - Initializes storages for userrules, allowlist, custom filters metadata and page-stats
         * - Initializes storages for filters state, groups state and filters versions, based on app metadata.
         */
        await FiltersApi.init(isInstall);
    }

    /**
     * @inheritdoc
     */
    protected static override async handleUpdate(
        currentAppVersion: string,
        previousAppVersion: string,
    ): Promise<void> {
        await super.handleUpdate(currentAppVersion, previousAppVersion);

        /**
         * Some filters may be 'enabled' during update but not 'loaded' yet,
         * e.g. separate annoyances filters are enabled instead of the deprecated
         * combined annoyances filter during the migration.
         *
         * We cannot load them during UpdateApi.update()
         * because it is executed too early,
         * and filter state data is not initialized at that moment.
         *
         * And they should be loaded before the engine start,
         * otherwise we will not be able to enable them later.
         */
        await FiltersApi.reloadEnabledFilters();
    }
}
