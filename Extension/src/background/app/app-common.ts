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
import { contextMenuEvents, settingsEvents } from '../events';
import { KeepAlive } from '../keep-alive';
import { SafebrowsingService } from '../services/safebrowsing';
import { getZodErrorMessage } from '../../common/error';


export class AppCommon {
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
        AppCommon.syncInit();

        // Set the current log level from session storage.
        await logger.init();

        // Then "lazy" call for all other stuff.
        await AppCommon.asyncInit();
    }

    /**
     * Remove all registered app event listeners.
     */
    protected static removeListeners(): void {
        messageHandler.removeListeners();
        contextMenuEvents.removeListeners();
        settingsEvents.removeListeners();
    }

        /**
     * Handles engine status request from filters-download page.
     *
     * @returns True, if filter engine is initialized, else false.
     */
    protected static onCheckRequestFilterReady(): boolean {
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
    protected static async setUninstallUrl(): Promise<void> {
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
            logger.warn('[ext.App.initClientId]: error while parsing client id, generating a new one, error: ', getZodErrorMessage(e));
            clientId = InstallApi.genClientId();
            await browserStorage.set(CLIENT_ID_KEY, clientId);
        }

        appContext.set(AppContextKey.ClientId, clientId);
    }
}