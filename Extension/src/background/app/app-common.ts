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
import zod from 'zod';

import { engine } from '../engine';
import { MessageType, sendMessage } from '../../common/messages';
import { logger } from '../../common/logger';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../common/forward';
import { CLIENT_ID_KEY } from '../../common/constants';
import { ContentScriptInjector } from '../content-script-injector';
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
import { contextMenuEvents, settingsEvents } from '../events';
import { KeepAlive } from '../keep-alive';
import { getZodErrorMessage } from '../../common/error';
import { NotImplementedError } from '../errors/not-implemented-error';

/**
 * This class is app entry point.
 *
 * {@link AppCommon.init} Initializes all app services
 * and handle webextension API events for first install and update scenario.
 */
export abstract class AppCommon {
    /**
     * The uninstall URL for the extension.
     */
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
        AppCommon.removeListeners();

        // First initialize critical sync event handlers.
        this.syncInit();

        // Set the current log level from session storage.
        await logger.init();

        // Then "lazy" call for all other stuff.
        await this.asyncInit();
    }

    /**
     * Synchronous initialization hook.
     *
     *
     * Important: should be called before async part inside {@link App.init},
     * because in MV3 handlers should be registered on the top level in sync
     * functions.
     */
    protected static syncInit(): void {
        UiService.syncInit();
    }

    /**
     * Async initialization of all app services.
     *
     * @returns True if this is an extension update, false otherwise.
     */
    protected static async asyncInit(): Promise<boolean> {
        // TODO: Move to MV3 only after migration Firefox to MV3
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

        // Initializes App storage data
        await AppCommon.initClientId();

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

        await this.initFiltersApi(isInstall, isUpdate);

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

        /**
         * Adds listener for creating `notifier` events. Triggers by frontend.
         *
         * TODO: delete after frontend refactoring.
         */
        eventService.init();

        await this.manifestSpecificInit();

        /**
         * Called after eventService init and manifestSpecificInit, otherwise it won't handle messages.
         */
        await KeepAlive.resyncEventSubscriptions();

        /**
         * Initializes Document block module
         * - Initializes persisted cache for trusted domains
         * - Adds listener for "add trusted domain" message.
         */
        await DocumentBlockService.init();

        // Sets app uninstall url
        await AppCommon.setUninstallUrl();

        // First install additional scenario
        if (isInstall) {
            // Adds engine status listener for filters-download page
            messageHandler.addListener(MessageType.CheckRequestFilterReady, AppCommon.onCheckRequestFilterReady);

            // Opens filters-download page
            await PagesApi.openPostInstallPage();

            // Loads default filters
            await CommonFilterApi.initDefaultFilters(true);

            // Write the current version to the storage only after successful initialization of the extension
            await InstallApi.postSuccessInstall(currentAppVersion);
        }

        if (isUpdate) {
            await this.handleUpdate(currentAppVersion, previousAppVersion);
        }

        // Runs tswebextension
        await engine.start();

        appContext.set(AppContextKey.IsInit, true);

        // Update icons to hide "loading" icon
        await iconsApi.update();

        // Initialize filters updates, after engine started, so that it won't mingle with engine
        // initialization from current rules in MV2
        // And set filters last update timestamp for issue reporting in MV3
        await filterUpdateService.init();

        await Telemetry.init();

        await sendMessage({ type: MessageType.AppInitialized });

        return isUpdate;
    }

    /**
     * Hook for initializing manifest-specific (MV2 or MV3) services.
     */
    protected static async manifestSpecificInit(): Promise<void> {
        throw new NotImplementedError();
    }

    /**
     * Initializing FiltersApi.
     *
     * @param isInstall True if this is a fresh installation.
     * @param isUpdate True if this is an extension update.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected static async initFiltersApi(isInstall: boolean, isUpdate: boolean): Promise<void> {
        throw new NotImplementedError();
    }

    /**
     * Handles additional logic during extension update scenario.
     * Can be overridden in derived classes to add manifest-specific update logic.
     *
     * @param currentAppVersion Current extension version.
     * @param previousAppVersion Previous extension version before update.
     */
    protected static async handleUpdate(
        currentAppVersion: string,
        previousAppVersion: string,
    ): Promise<void> {
        if (!settingsStorage.get(SettingOption.DisableShowAppUpdatedNotification)) {
            toasts.showApplicationUpdatedPopup(currentAppVersion, previousAppVersion);
        }
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
            await browser.runtime.setUninstallURL(AppCommon.uninstallUrl);
        } catch (e) {
            logger.error('[ext.AppCommon.setUninstallUrl]: cannot set app uninstall url. Origin error:', e);
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
            logger.warn('[ext.AppCommon.initClientId]: error while parsing client id, generating a new one, error: ', getZodErrorMessage(e));
            clientId = InstallApi.genClientId();
            await browserStorage.set(CLIENT_ID_KEY, clientId);
        }

        appContext.set(AppContextKey.ClientId, clientId);
    }
}
