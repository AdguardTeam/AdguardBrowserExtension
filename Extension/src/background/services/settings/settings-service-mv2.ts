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
    HitStatsApi,
    SafebrowsingApi,
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

import { type ExportMessageResponse, type GetOptionsDataResponse } from './types';

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
        settingsEvents.addListener(SettingOption.HideReferrer, SettingsService.onHideReferrerStateChange);
        settingsEvents.addListener(SettingOption.HideSearchQueries, SettingsService.onHideSearchQueriesStateChange);
        settingsEvents.addListener(SettingOption.SendDoNotTrack, SettingsService.onSendDoNotTrackStateChange);
        settingsEvents.addListener(SettingOption.RemoveXClientData, SettingsService.onRemoveXClientDataStateChange);
        settingsEvents.addListener(SettingOption.BlockWebRTC, SettingsService.onBlockWebRTCStateChange);
        settingsEvents.addListener(
            SettingOption.SelfDestructThirdPartyCookies,
            SettingsService.onSelfDestructThirdPartyCookiesStateChange,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructThirdPartyCookiesTime,
            SettingsService.onSelfDestructThirdPartyCookiesTimeStateChange,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructFirstPartyCookies,
            SettingsService.onSelfDestructFirstPartyCookiesStateChange,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructFirstPartyCookiesTime,
            SettingsService.onSelfDestructFirstPartyCookiesTimeStateChange,
        );
        settingsEvents.addListener(
            SettingOption.DisableFiltering,
            SettingsService.onDisableFilteringStateChange,
        );
        settingsEvents.addListener(SettingOption.DisableCollectHits, SettingsService.onDisableCollectHitsChange);

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
            // always false for MV2
            areFilterLimitsExceeded: false,
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
            engine.debounceUpdate();

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
     * @returns Result of importing.
     */
    static async import(message: ApplySettingsJsonMessage): Promise<boolean> {
        const { json } = message.data;

        const isImported = await SettingsApi.import(json);

        engine.debounceUpdate();

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

            if (isFilteringDisabled) {
                await SafebrowsingApi.clearCache();
            }

            const activeTab = await TabsApi.getActive();

            if (activeTab) {
                await TabsApi.reload(activeTab.id);
            }
        } catch (e) {
            logger.error('[ext.SettingsService.onDisableFilteringStateChange]: error while updating filtering state', e);
        }
    }

    /**
     * Called when {@link SettingOption.DisableStealthMode} setting changed.
     *
     */
    static async onDisableStealthModeStateChange(): Promise<void> {
        try {
            engine.debounceUpdate();
        } catch (e) {
            logger.error('[ext.SettingsService.onDisableStealthModeStateChange]: failed to change Tracking protection state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideReferrerEnabled Changed {@link SettingOption.HideReferrer} setting value.
     */
    static async onHideReferrerStateChange(isHideReferrerEnabled: boolean): Promise<void> {
        try {
            await engine.api.setHideReferrer(isHideReferrerEnabled);
        } catch (e) {
            logger.error('[ext.SettingsService.onHideReferrerStateChange]: failed to change `hide referrer` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideSearchQueriesEnabled Changed {@link SettingOption.HideSearchQueries} setting value.
     */
    static async onHideSearchQueriesStateChange(isHideSearchQueriesEnabled: boolean): Promise<void> {
        try {
            await engine.api.setHideSearchQueries(isHideSearchQueriesEnabled);
        } catch (e) {
            logger.error('[ext.SettingsService.onHideSearchQueriesStateChange]: failed to change `hide search queries` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isSendDoNotTrackEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static async onSendDoNotTrackStateChange(isSendDoNotTrackEnabled: boolean): Promise<void> {
        try {
            await engine.api.setSendDoNotTrack(isSendDoNotTrackEnabled);
        } catch (e) {
            logger.error('[ext.SettingsService.onSendDoNotTrackStateChange]: failed to change `send do not track` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isRemoveXClientDataEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static async onRemoveXClientDataStateChange(isRemoveXClientDataEnabled: boolean): Promise<void> {
        try {
            await engine.api.setBlockChromeClientData(isRemoveXClientDataEnabled);
        } catch (e) {
            logger.error('[ext.SettingsService.onRemoveXClientDataStateChange]: failed to change `remove x-client-data` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.BlockWebRTC} setting changed.
     *
     * @param isBlockWebRTCEnabled Changed {@link SettingOption.BlockWebRTC} setting value.
     */
    static async onBlockWebRTCStateChange(isBlockWebRTCEnabled: boolean): Promise<void> {
        try {
            await engine.api.setBlockWebRTC(isBlockWebRTCEnabled);
        } catch (e) {
            logger.error('[ext.SettingsService.onBlockWebRTCStateChange]: failed to change `block WebRTC` option state', e);
        }
    }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    /**
     * Called when {@link SettingOption.SelfDestructThirdPartyCookies} setting changed.
     *
     * {@link SettingOption.SelfDestructThirdPartyCookies} Setting value.
     */
    static onSelfDestructThirdPartyCookiesStateChange(): void {
        engine.debounceUpdate();
    }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    /**
     * Called when {@link SettingOption.SelfDestructThirdPartyCookiesTime} setting changed.
     *
     * {@link SettingOption.SelfDestructThirdPartyCookiesTime} Setting value.
     */
    static onSelfDestructThirdPartyCookiesTimeStateChange(): void {
        engine.debounceUpdate();
    }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    /**
     * Called when {@link SettingOption.SelfDestructFirstPartyCookies} setting changed.
     *
     * {@link SettingOption.SelfDestructFirstPartyCookies} Setting value.
     */
    static onSelfDestructFirstPartyCookiesStateChange(): void {
        engine.debounceUpdate();
    }

    // TODO: Possibly can be implemented when https://github.com/w3c/webextensions/issues/439 will be implemented.
    /**
     * Called when {@link SettingOption.SelfDestructFirstPartyCookiesTime} setting changed.
     *
     * {@link SettingOption.SelfDestructFirstPartyCookiesTime} Setting value.
     */
    static onSelfDestructFirstPartyCookiesTimeStateChange(): void {
        engine.debounceUpdate();
    }

    /**
     * Called when {@link SettingOption.DisableCollectHits} changes.
     *
     * @param disableCollectHitsStats Setting value.
     */
    static onDisableCollectHitsChange(disableCollectHitsStats: boolean): void {
        engine.api.setCollectHitStats(!disableCollectHitsStats);
        if (disableCollectHitsStats) {
            HitStatsApi.cleanup();
        }
    }

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
