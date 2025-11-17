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
import { logger } from '../../common/logger';
import {
    MessageType,
    type SaveAllowlistDomainsMessage,
    type AddAllowlistDomainForTabIdMessage,
    type AddAllowlistDomainForUrlMessage,
    type RemoveAllowlistDomainMessage,
} from '../../common/messages';
import { messageHandler } from '../message-handler';
import { engine } from '../engine';
import { SettingOption } from '../schema';
import { AllowlistApi, TabsApi } from '../api';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../events';
import { Prefs } from '../prefs';

export type GetAllowlistDomainsResponse = {
    content: string;
    appVersion: string;
};

/**
 * Service for processing events with a allowlist.
 */
export class AllowlistService {
    /**
     * Initialize handlers.
     */
    public static init(): void {
        messageHandler.addListener(MessageType.GetAllowlistDomains, AllowlistService.onGetAllowlistDomains);
        messageHandler.addListener(MessageType.SaveAllowlistDomains, AllowlistService.handleDomainsSave);
        messageHandler.addListener(
            MessageType.AddAllowlistDomainForTabId,
            AllowlistService.onAddAllowlistDomainForTabId,
        );
        messageHandler.addListener(
            MessageType.AddAllowlistDomainForUrl,
            AllowlistService.onAddAllowlistDomainForUrl,
        );
        messageHandler.addListener(MessageType.RemoveAllowlistDomain, AllowlistService.onRemoveAllowlistDomain);

        settingsEvents.addListener(SettingOption.AllowlistEnabled, AllowlistService.updateEngine);
        settingsEvents.addListener(SettingOption.DefaultAllowlistMode, AllowlistService.updateEngine);

        contextMenuEvents.addListener(
            ContextMenuAction.SiteFilteringOn,
            AllowlistService.enableSiteFilteringFromContextMenu,
        );
        contextMenuEvents.addListener(
            ContextMenuAction.SiteFilteringOff,
            AllowlistService.disableSiteFilteringFromContextMenu,
        );
    }

    /**
     * Returns domains depending on current allowlist mode.
     *
     * @returns Object of type {@link GetAllowlistDomainsResponse}.
     */
    private static onGetAllowlistDomains(): GetAllowlistDomainsResponse {
        const domains = AllowlistApi.isInverted()
            ? AllowlistApi.getInvertedAllowlistDomains()
            : AllowlistApi.getAllowlistDomains();

        const content = domains.join('\n');

        return { content, appVersion: Prefs.version };
    }

    /**
     * The listener for the allowlist domain addition event from popup.
     *
     * @param message Message of type {@link AddAllowlistDomainForTabIdMessage}.
     */
    private static async onAddAllowlistDomainForTabId(message: AddAllowlistDomainForTabIdMessage): Promise<void> {
        const { tabId } = message.data;

        await AllowlistApi.disableTabFilteringForTabId(tabId);
    }

    /**
     * The listener for the allowlist domain addition event from popup.
     *
     * @param message Message of type {@link AddAllowlistDomainForUrlMessage}.
     */
    private static async onAddAllowlistDomainForUrl(message: AddAllowlistDomainForUrlMessage): Promise<void> {
        const { url } = message.data;

        await AllowlistApi.disableFilteringForUrl(url);
    }

    /**
     * The listener for the allowlist domain deletion event.
     *
     * @param message Message of type {@link RemoveAllowlistDomainMessage}.
     */
    private static async onRemoveAllowlistDomain(message: RemoveAllowlistDomainMessage): Promise<void> {
        const { tabId, tabRefresh } = message.data;

        await AllowlistApi.enableTabFiltering(tabId, tabRefresh);
    }

    /**
     * Stores domains depending on current allowlist mode.
     *
     * @param message Message data.
     */
    private static async handleDomainsSave(message: SaveAllowlistDomainsMessage): Promise<void> {
        const { value } = message.data;

        const domains = value.split(/[\r\n]+/);

        if (AllowlistApi.isInverted()) {
            AllowlistApi.setInvertedAllowlistDomains(domains);
        } else {
            AllowlistApi.setAllowlistDomains(domains);
        }

        // update the engine only if the module is enabled
        if (AllowlistApi.isEnabled()) {
            await engine.update();
        }
    }

    /**
     * Listener for an event to enable site filtering from the context menu.
     */
    private static async enableSiteFilteringFromContextMenu(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.id) {
            await AllowlistApi.enableTabFiltering(activeTab.id, true);
        } else {
            logger.warn('[ext.AllowlistService.enableSiteFilteringFromContextMenu]: cannot open site report page for active tab, active tab is undefined');
        }
    }

    /**
     * Listener for an event to disable site filtering from the context menu.
     */
    private static async disableSiteFilteringFromContextMenu(): Promise<void> {
        const activeTab = await TabsApi.getActive();

        if (activeTab?.id) {
            await AllowlistApi.disableTabFilteringForTabId(activeTab.id);
        } else {
            logger.warn('[ext.AllowlistService.disableSiteFilteringFromContextMenu]: cannot open site report page for active tab, active tab is undefined');
        }
    }

    /**
     * Updates the tswebextension engine on {@link SettingOption.AllowlistEnabled}
     * or {@link SettingOption.DefaultAllowlistMode} setting change.
     * This setting can be changed by the switch ui element, so it is important
     * to update the engine config via debounce function for MV2, as this
     * is a heavyweight call.
     * For MV3 we should wait for the engine to be ready and then check for
     * possible exceeding the limits.
     */
    private static async updateEngine(): Promise<void> {
        if (__IS_MV3__) {
            await engine.update();
        } else {
            engine.debounceUpdate();
        }
    }
}
