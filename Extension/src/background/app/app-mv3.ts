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
import zod from 'zod';

import { rulesLimitsService } from 'rules-limits-service';

import { engine } from '../engine';
import { MessageType, sendMessage } from '../../common/messages';
import { logger } from '../../common/logger';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../common/forward';
import { CLIENT_ID_KEY } from '../../common/constants';
import { messageHandler } from '../message-handler';
import { ConnectionHandler } from '../connection-handler';
import {
    appContext,
    AppContextKey,
    settingsStorage,
    browserStorage,
} from '../storages';
import {
    toasts,
    CommonFilterApi,
    PagesApi,
    FiltersApi,
    SettingsApi,
    UpdateApi,
    InstallApi,
    network,
    PageStatsApi,
    UiApi,
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
    localeDetect,
    PromoNotificationService,
    filterUpdateService,
} from '../services';
import { SettingOption } from '../schema';
import { getRunInfo } from '../utils';
import { contextMenuEvents, settingsEvents } from '../events';
import { KeepAlive } from '../keep-alive';

/**
 * This class is app entry point.
 *
 * {@link App.init} Initializes all app services
 * and handle webextension API events for first install and update scenario.
 */
export class App {
    private static uninstallUrl = Forward.get({
        action: ForwardAction.UninstallExtension,
        from: ForwardFrom.Background,
    });

    /**
     * Initializes all app services
     * and handle webextension API events for first install and update scenario.
     *
     * First sync modules are initialized, then async modules.
     */
    public static async init(): Promise<void> {
        // removes listeners on re-initialization, because new ones will be registered during process
        App.removeListeners();

        App.syncInit();
        await App.asyncInit();
    }

    /**
     * Initializes **sync** modules.
     *
     * Important: should be called before {@link App.init}.
     */
    private static syncInit(): void {
        UiService.syncInit();
    }

    // TODO: move other sync modules from App.asyncInit() to App.syncInit()
    /**
     * Initializes **async** modules.
     */
    private static async asyncInit(): Promise<void> {
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

        const { previousAppVersion, currentAppVersion } = runInfo;
        const isAppVersionChanged = previousAppVersion !== currentAppVersion;
        const isInstall = isAppVersionChanged && !previousAppVersion;
        const isUpdate = isAppVersionChanged && !!previousAppVersion;

        if (isInstall) {
            await InstallApi.install(runInfo);
        }

        if (isUpdate) {
            await UpdateApi.update(runInfo);
        }

        // Initializes network settings.
        await network.waitForNetworkInit();

        // Initializes App storage data
        await App.initClientId();

        // Initializes Settings storage data
        await SettingsApi.init();

        await UiApi.init();

        await rulesLimitsService.init();

        // TODO inject content scripts to tabs open before installation AG-33507
        // /**
        //  * When the extension is enabled, disabled and re-enabled during the user session,
        //  * content scripts will be loaded multiple times in each open tab.
        //  * If statistics collection is enabled, the content script will initialize cssHitCounter.
        //  * Multiple cssHitCounters in the same page context will conflict with each other,
        //  * with a high probability of breaking the page.
        //  * To avoid this bug, we don't inject content scripts into open tabs during initialization
        //  * when stats collection is enabled.
        //  */
        // if (SettingsApi.getSetting(SettingOption.DisableCollectHits)) {
        //     // inject content scripts into opened tabs
        //     await ContentScriptInjector.init();
        // }

        /**
         * Initializes Filters data:
         * - Loads app i18n metadata and caches it in i18n-metadata storage
         * - Loads app metadata, apply localization from i18n-metadata storage and caches it in metadata storage
         * - Initializes storages for userrules, allowlist, custom filters metadata and page-stats
         * - Initializes storages for filters state, groups state and filters versions, based on app metadata.
         */
        await FiltersApi.init(isInstall);

        // Update the filters in the MV3 version for each extension update,
        // even for patches, because MV3 does not support remote filter updates
        // (either full or through diffs) and filters are updated only with
        // the update of the entire extension.
        if (isUpdate) {
            const filtersIds = await FiltersApi.reloadFiltersFromLocal();
            logger.info('Following filters has been updated from local resources:', filtersIds);
        }

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
        await UserRulesService.init();

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
        localeDetect.init();

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
                // for isUpdate state previousAppVersion can't be null
                toasts.showApplicationUpdatedPopup(currentAppVersion, previousAppVersion!);
            }
        }

        // Runs tswebextension
        await engine.start();

        /**
         * In MV3 the icon should be updated after the engine start,
         * otherwise 'warning' icon may be displayed until the user do some actions,
         * that is until UiApi.update() is not triggered (on change of tab or window focus).
         *
         * And 'warning' icon can be legitimately displayed during app initialization
         * when base filter ruleset is enabled in manifest — actuallyEnabledFilters is [2] —
         * and there are expectedEnabledFilters — [2, 10] — which should be enabled by default (initDefaultFilters).
         */
        iconsApi.update();

        appContext.set(AppContextKey.IsInit, true);

        // In MV3 we need filters update service to update quick fixes filter.
        filterUpdateService.init();

        await sendMessage({ type: MessageType.AppInitialized });
    }

    /**
     * Remove all registered app event listeners.
     */
    private static removeListeners(): void {
        messageHandler.removeListeners();
        contextMenuEvents.removeListeners();
        settingsEvents.removeListeners();
    }

    /**
     * Handles engine status request from filters-download page.
     *
     * @returns True, if filter engine is initialized, else false.
     */
    private static onCheckRequestFilterReady(): boolean {
        const ready = engine.api.isStarted;

        /**
         * If engine is ready, user will be redirected to thankyou page.
         *
         * CheckRequestFilterReady listener is not needed anymore.
         */
        if (ready) {
            messageHandler.removeListener(MessageType.CheckRequestFilterReady);
        }

        return ready;
    }

    /**
     * Sets app uninstall url.
     */
    private static async setUninstallUrl(): Promise<void> {
        try {
            await browser.runtime.setUninstallURL(App.uninstallUrl);
        } catch (e) {
            logger.error('Cannot set app uninstall url. Origin error: ', e);
        }
    }

    /**
     * Initializes App storage data.
     */
    private static async initClientId(): Promise<void> {
        const storageClientId = await browserStorage.get(CLIENT_ID_KEY);
        let clientId: string;

        try {
            clientId = zod.string().parse(storageClientId);
        } catch (e) {
            logger.warn('Error while parsing client id, generating a new one');
            clientId = InstallApi.genClientId();
            await browserStorage.set(CLIENT_ID_KEY, clientId);
        }

        appContext.set(AppContextKey.ClientId, clientId);
    }
}
