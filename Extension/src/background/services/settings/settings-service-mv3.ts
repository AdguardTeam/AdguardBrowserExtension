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

import { RulesLimitsService } from 'rules-limits-service';

import {
    MessageType,
    type ChangeUserSettingMessage,
    type ApplySettingsJsonMessage,
} from '../../../common/messages';
import { logger } from '../../../common/logger';
import { SettingOption } from '../../schema';
import { messageHandler } from '../../message-handler';
import { UserAgent } from '../../../common/user-agent';
import { AntiBannerFiltersId } from '../../../common/constants';
import { engine } from '../../engine';
import {
    Categories,
    SettingsApi,
    TabsApi,
} from '../../api';
import { Prefs } from '../../prefs';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../events';
import { fullscreenUserRulesEditor } from '../fullscreen-user-rules-editor';

import type { ExportMessageResponse, GetOptionsDataResponse } from './types';

/**
 * SettingsService handles all setting-related messages and
 * calls {@link SettingsApi} to handle settings.
 *
 * TODO: gracefully handle errors for tswebextension events. AG-37301.
 */
export class SettingsService {
    /**
     * Adds a listener for background messages about settings: load/apply settings
     * from JSON and change/reset/return of custom settings.
     * Adds a listener with the action of updating the engine when you change
     * any {@link SettingOption} parameter.
     * Adds a listener to enable or disable protection from the context menu.
     */
    static init(): void {
        messageHandler.addListener(MessageType.GetOptionsData, SettingsService.getOptionsData);
        messageHandler.addListener(MessageType.ResetSettings, SettingsService.reset);
        messageHandler.addListener(MessageType.ChangeUserSettings, SettingsService.changeUserSettings);
        messageHandler.addListener(MessageType.ApplySettingsJson, SettingsService.import);
        messageHandler.addListener(MessageType.LoadSettingsJson, SettingsService.export);

        settingsEvents.addListener(SettingOption.DisableStealthMode, SettingsService.onDisableStealthModeStateChange);
        // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
        // AG-34765
        // settingsEvents.addListener(SettingOption.HideReferrer, SettingsService.onHideReferrerStateChange);
        // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
        // AG-34765
        // settingsEvents.addListener(SettingOption.HideSearchQueries, SettingsService.onHideSearchQueriesStateChange);
        settingsEvents.addListener(SettingOption.SendDoNotTrack, SettingsService.onSendDoNotTrackStateChange);
        settingsEvents.addListener(SettingOption.RemoveXClientData, SettingsService.onRemoveXClientDataStateChange);
        settingsEvents.addListener(SettingOption.BlockWebRTC, SettingsService.onBlockWebRTCStateChange);

        // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
        // settingsEvents.addListener(
        //     SettingOption.SelfDestructThirdPartyCookies,
        //     SettingsService.onSelfDestructThirdPartyCookiesStateChange,
        // );
        // settingsEvents.addListener(
        //     SettingOption.SelfDestructThirdPartyCookiesTime,
        //     SettingsService.onSelfDestructThirdPartyCookiesTimeStateChange,
        // );
        // settingsEvents.addListener(
        //     SettingOption.SelfDestructFirstPartyCookies,
        //     SettingsService.onSelfDestructFirstPartyCookiesStateChange,
        // );
        // settingsEvents.addListener(
        //     SettingOption.SelfDestructFirstPartyCookiesTime,
        //     SettingsService.onSelfDestructFirstPartyCookiesTimeStateChange,
        // );

        settingsEvents.addListener(
            SettingOption.DisableFiltering,
            SettingsService.onDisableFilteringStateChange,
        );

        contextMenuEvents.addListener(ContextMenuAction.EnableProtection, SettingsService.enableFiltering);
        contextMenuEvents.addListener(ContextMenuAction.DisableProtection, SettingsService.disableFiltering);
    }

    /**
     * Returns settings with some additional data: app version,
     * environment options, constants, filters info, filters metadata.
     *
     * @returns Item of {@link GetOptionsDataResponse}.
     */
    static async getOptionsData(): Promise<GetOptionsDataResponse> {
        const areFilterLimitsExceeded = await RulesLimitsService.areFilterLimitsExceeded();

        return {
            settings: SettingsApi.getData(),
            appVersion: Prefs.version,
            libVersions: Prefs.libVersions,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            constants: {
                AntiBannerFiltersId,
            },
            filtersInfo: {
                rulesCount: engine.api.getRulesCount(),
            },
            filtersMetadata: Categories.getCategories(),
            fullscreenUserRulesEditorIsOpen: fullscreenUserRulesEditor.isOpen(),
            areFilterLimitsExceeded,
        };
    }

    /**
     * Changes user settings.
     *
     * @param message Item of {@link ChangeUserSettingMessage}.
     */
    static async changeUserSettings(message: ChangeUserSettingMessage): Promise<void> {
        const { key, value } = message.data;
        await SettingsApi.setSetting(key, value);
    }

    /**
     * Resets user settings and updates engine.
     *
     * @returns Result of resetting.
     */
    static async reset(): Promise<boolean> {
        try {
            // Should enable default filters and their groups.
            await SettingsApi.reset(true);
            await engine.update();

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Imports settings from JSON.
     *
     * @param message Message with JSON settings {@link ApplySettingsJsonMessage}.
     *
     * @returns Boolean result of importing.
     */
    static async import(message: ApplySettingsJsonMessage): Promise<boolean> {
        const { json } = message.data;

        const isImported = await SettingsApi.import(json);

        await engine.update();

        return isImported;
    }

    /**
     * Exports settings.
     *
     * @returns Promise with {@link ExportMessageResponse}.
     */
    static async export(): Promise<ExportMessageResponse> {
        return {
            content: await SettingsApi.export(),
            appVersion: browser.runtime.getManifest().version,
        };
    }

    /**
     * Called when {@link SettingOption.DisableFiltering} setting changed.
     *
     * @param isFilteringDisabled Changed {@link SettingOption.DisableFiltering} setting value.
     */
    static async onDisableFilteringStateChange(isFilteringDisabled: boolean): Promise<void> {
        try {
            await engine.setFilteringState(!isFilteringDisabled);

            const activeTab = await TabsApi.getActive();

            if (activeTab) {
                await TabsApi.reload(activeTab.id);
            }
        } catch (e) {
            logger.error('Error while updating filtering state', e);
        }
    }

    /**
     * Called when {@link SettingOption.DisableStealthMode} setting changed.
     */
    static async onDisableStealthModeStateChange(): Promise<void> {
        try {
            await engine.update();
        } catch (e) {
            logger.error('Failed to change Tracking protection state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideReferrerEnabled Changed {@link SettingOption.HideReferrer} setting value.
     */
    static async onHideReferrerStateChange(isHideReferrerEnabled: boolean): Promise<void> {
        try {
            const appliedValue = await engine.api.setHideReferrer(isHideReferrerEnabled);
            if (appliedValue !== isHideReferrerEnabled) {
                // If the setting was not applied, we need to revert it back for
                // the user in the UI and in the storage for configuration persistence.
                await SettingsApi.setSetting(SettingOption.HideReferrer, !isHideReferrerEnabled);
            }
        } catch (e) {
            logger.error('Failed to change `hide referrer` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideSearchQueriesEnabled Changed {@link SettingOption.HideSearchQueries} setting value.
     */
    static async onHideSearchQueriesStateChange(isHideSearchQueriesEnabled: boolean): Promise<void> {
        try {
            const appliedValue = await engine.api.setHideSearchQueries(isHideSearchQueriesEnabled);
            if (appliedValue !== isHideSearchQueriesEnabled) {
                // If the setting was not applied, we need to revert it back for
                // the user in the UI and in the storage for configuration persistence.
                await SettingsApi.setSetting(SettingOption.HideSearchQueries, !isHideSearchQueriesEnabled);
            }
        } catch (e) {
            logger.error('Failed to change `hide search queries` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isSendDoNotTrackEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static async onSendDoNotTrackStateChange(isSendDoNotTrackEnabled: boolean): Promise<void> {
        try {
            const appliedValue = await engine.api.setSendDoNotTrack(isSendDoNotTrackEnabled);
            if (appliedValue !== isSendDoNotTrackEnabled) {
                // If the setting was not applied, we need to revert it back for
                // the user in the UI and in the storage for configuration persistence.
                await SettingsApi.setSetting(SettingOption.SendDoNotTrack, !isSendDoNotTrackEnabled);
            }
        } catch (e) {
            logger.error('Failed to change `send do not track` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isRemoveXClientDataEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static async onRemoveXClientDataStateChange(isRemoveXClientDataEnabled: boolean): Promise<void> {
        try {
            const appliedValue = await engine.api.setBlockChromeClientData(isRemoveXClientDataEnabled);
            if (appliedValue !== isRemoveXClientDataEnabled) {
                // If the setting was not applied, we need to revert it back for
                // the user in the UI and in the storage for configuration persistence.
                await SettingsApi.setSetting(SettingOption.RemoveXClientData, !isRemoveXClientDataEnabled);
            }
        } catch (e) {
            logger.error('Failed to change `remove x-client-data` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.BlockWebRTC} setting changed.
     *
     * @param isBlockWebRTCEnabled Changed {@link SettingOption.BlockWebRTC} setting value.
     */
    static async onBlockWebRTCStateChange(isBlockWebRTCEnabled: boolean): Promise<void> {
        try {
            const appliedValue = await engine.api.setBlockWebRTC(isBlockWebRTCEnabled);
            if (appliedValue !== isBlockWebRTCEnabled) {
                // If the setting was not applied, we need to revert it back for
                // the user in the UI and in the storage for configuration persistence.
                await SettingsApi.setSetting(SettingOption.BlockWebRTC, !isBlockWebRTCEnabled);
            }
        } catch (e) {
            logger.error('Failed to change `block WebRTC` option state', e);
        }
    }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    // /**
    //  * Called when {@link SettingOption.SelfDestructThirdPartyCookies} setting changed.
    //  *
    //  * {@link SettingOption.SelfDestructThirdPartyCookies} Setting value.
    //  *
    //  * @throws Error for mv3.
    //  */
    // static onSelfDestructThirdPartyCookiesStateChange(): void {
    //     throw new Error('onSelfDestructThirdPartyCookiesStateChange not implemented for mv3');
    // }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    // /**
    //  * Called when {@link SettingOption.SelfDestructThirdPartyCookiesTime} setting changed.
    //  *
    //  * {@link SettingOption.SelfDestructThirdPartyCookiesTime} Setting value.
    //  *
    //  * @throws Error for mv3.
    //  */
    // static onSelfDestructThirdPartyCookiesTimeStateChange(): void {
    //     throw new Error('onSelfDestructThirdPartyCookiesTimeStateChange not implemented for mv3');
    // }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    // /**
    //  * Called when {@link SettingOption.SelfDestructFirstPartyCookies} setting changed.
    //  *
    //  * {@link SettingOption.SelfDestructFirstPartyCookies} Setting value.
    //  *
    //  * @throws Error for mv3.
    //  */
    // static onSelfDestructFirstPartyCookiesStateChange(): void {
    //     throw new Error('onSelfDestructFirstPartyCookiesStateChange not implemented for mv3');
    // }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    // /**
    //  * Called when {@link SettingOption.SelfDestructFirstPartyCookiesTime} setting changed.
    //  *
    //  * {@link SettingOption.SelfDestructFirstPartyCookiesTime} Setting value.
    //  *
    //  * @throws Error for mv3.
    //  */
    // static onSelfDestructFirstPartyCookiesTimeStateChange(): void {
    //     throw new Error('onSelfDestructFirstPartyCookiesTimeStateChange not implemented for mv3');
    // }

    /**
     * Called when protection enabling is requested.
     */
    static async enableFiltering(): Promise<void> {
        await SettingsApi.setSetting(SettingOption.DisableFiltering, false);
    }

    /**
     * Called when protection disabling is requested.
     */
    static async disableFiltering(): Promise<void> {
        await SettingsApi.setSetting(SettingOption.DisableFiltering, true);
    }
}
