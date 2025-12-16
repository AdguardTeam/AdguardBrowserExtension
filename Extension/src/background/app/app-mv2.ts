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

import { engine } from '../engine';
import { MessageType, sendMessage } from '../../common/messages';
import { logger } from '../../common/logger';
import { ContentScriptInjector } from '../content-script-injector';
import { messageHandler } from '../message-handler';
import { ConnectionHandler } from '../connection-handler';
import {
    appContext,
    AppContextKey,
    settingsStorage,
} from '../storages';
import {
    toasts,
    CommonFilterApi,
    PagesApi,
    FiltersApi,
    SettingsApi,
    UpdateApi,
    InstallApi,
    UiApi,
    PageStatsApi,
    HitStatsApi,
    iconsApi,
} from '../api';
import {
    UiService,
    PopupService,
    SettingsService,
    FiltersService,
    AllowlistService,
    UserRulesService,
    CustomFiltersService,
    FilteringLogService,
    eventService,
    DocumentBlockService,
    PromoNotificationService,
    filterUpdateService,
    Telemetry,
} from '../services';
import { SettingOption } from '../schema';
import { getRunInfo } from '../utils';
=import { KeepAlive } from '../keep-alive';
import { SafebrowsingService } from '../services/safebrowsing';
import { localeDetect } from '../services/locale-detect-mv2';
import { AppCommon } from './app-common';
// FIXME: CHECK mv2 and mv3 files. Check TODOMV2/3 comments
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
     * Initializes all app services and handle webextension API events for first
     * install and update scenario.
     */
    public static async init(): Promise<void> {
        // removes listeners on re-initialization, because new ones will be registered during process
        App.removeListeners();

        // This call is moved to top in order to keep consistent with MV3 version,
        // where it's needed to register critical event handlers in a sync way.
        UiService.syncInit();

        // Set the current log level from session storage.
        await logger.init();

        await trackInitTimesForDebugging(); // TODOMV2

        // TODO: Remove after migration to MV3
        // This is a temporary solution to keep event pages alive in Firefox.
        // We will remove it once engine initialization becomes faster.
        KeepAlive.init();

        // Reads persisted data from session storage.
        await engine.api.initStorage();

        // Initializes connection and message handler as soon as possible
        // to prevent connection errors from extension pages
        ConnectionHandler.init();
        messageHandler.init();

        // get application run info
        const runInfo = await getRunInfo();

        const {
            previousAppVersion,
            currentAppVersion,
        } = runInfo;

        const isAppVersionChanged = previousAppVersion !== currentAppVersion;

        const isInstall = isAppVersionChanged && !previousAppVersion;
        const isUpdate = isAppVersionChanged && !!previousAppVersion;

        if (isInstall) {
            await InstallApi.install(runInfo);
        }

        if (isUpdate) {
            await UpdateApi.update(runInfo);
        }

        // Initializes App storage data
        await App.initClientId();

        // Initializes Settings storage data
        await SettingsApi.init();

        await UiApi.init();

        /**
         * Injects content scripts into already opened tabs.
         *
         * Does injection when all requirements are met:
         * - Statistics collection is disabled - prevents conflicts from multiple
         * `cssHitCounters`;
         * - Content scripts have not been injected in the current session -
         * avoids unnecessary injections.
         */
        if (
            SettingsApi.getSetting(SettingOption.DisableCollectHits)
            && !await ContentScriptInjector.isInjected()
        ) {
            await ContentScriptInjector.init();
            await ContentScriptInjector.setInjected();
        }

        /**
         * Initializes Filters data:
         * - Loads app i18n metadata and caches it in i18n-metadata storage
         * - Loads app metadata, apply localization from i18n-metadata storage and caches it in metadata storage
         * - Initializes storages for userrules, allowlist, custom filters metadata and page-stats
         * - Initializes storages for filters state, groups state and filters versions, based on app metadata.
         */
        await FiltersApi.init(isInstall);

        await PageStatsApi.init();
        await HitStatsApi.init();

        /**
         * Initializes promo notifications:
         * - Initializes notifications storage
         * - Adds listeners for notification events.
         */
        PromoNotificationService.init();

        // Adds listeners for settings events
        SettingsService.init();

        // Adds listeners for filter and group state events (enabling, updates)
        await FiltersService.init();

        // Adds listeners specified for custom filters
        CustomFiltersService.init();

        // Adds listeners for allowlist events
        AllowlistService.init();

        // Adds listeners for userrules list events
        await UserRulesService.init(engine);

        // Adds listeners for filtering log
        FilteringLogService.init();

        /**
         * Adds listeners for managing ui
         * (routing between extension pages, toasts, icon update).
         */
        await UiService.init();

        // Adds listeners for popup events
        PopupService.init();

        // Initializes language detector for auto-enabling relevant filters
        localeDetect.init(); // TODOMV2

        /**
         * Adds listener for creating `notifier` events. Triggers by frontend.
         *
         * TODO: delete after frontend refactoring.
         */
        eventService.init();

        /**
         * Called after eventService init, otherwise it won't handle messages.
         */
        await KeepAlive.resyncEventSubscriptions();

        /**
         * Initializes Safebrowsing module
         * - Initializes persisted lru cache for hashes
         * - Adds listener for filtering web requests
         * - Adds listener for safebrowsing settings option switcher
         * - Adds listener for "add trusted domain" message.
         */
        await SafebrowsingService.init(); // TODOMV2

        /**
         * Initializes Document block module
         * - Initializes persisted cache for trusted domains
         * - Adds listener for "add trusted domain" message.
         */
        await DocumentBlockService.init();

        // Sets app uninstall url
        await App.setUninstallUrl();

        // First install additional scenario
        if (isInstall) {
            // Adds engine status listener for filters-download page
            messageHandler.addListener(MessageType.CheckRequestFilterReady, App.onCheckRequestFilterReady);

            // Opens filters-download page
            await PagesApi.openPostInstallPage();

            // Loads default filters
            await CommonFilterApi.initDefaultFilters(true);

            // Write the current version to the storage only after successful initialization of the extension
            await InstallApi.postSuccessInstall(currentAppVersion);
        }

        // Update additional scenario
        if (isUpdate) {
            if (!settingsStorage.get(SettingOption.DisableShowAppUpdatedNotification)) {
                toasts.showApplicationUpdatedPopup(currentAppVersion, previousAppVersion);
            }

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
            await FiltersApi.reloadEnabledFilters(); // TODOMV2
        }

        // Runs tswebextension
        await engine.start();

        appContext.set(AppContextKey.IsInit, true);

        // Update icons to hide "loading" icon
        await iconsApi.update();

        // Initialize filters updates, after engine started, so that it won't mingle with engine
        // initialization from current rules
        filterUpdateService.init();

        await sendMessage({ type: MessageType.AppInitialized }); // TODOMV2

        await Telemetry.init();
    }
}

export const app = new App();
