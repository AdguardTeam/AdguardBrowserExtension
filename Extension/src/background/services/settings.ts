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
    ChangeUserSettingMessage,
    ApplySettingsJsonMessage,
} from '../../common/messages';
import { Log } from '../../common/log';
import { SettingOption } from '../schema';
import { messageHandler } from '../message-handler';
import { UserAgent } from '../../common/user-agent';
import { AntiBannerFiltersId } from '../../common/constants';
import { Engine } from '../engine';
import {
    Categories,
    CategoriesData,
    SettingsApi,
    SettingsData,
    TabsApi,
} from '../api';
import { Prefs } from '../prefs';
import { listeners } from '../notifier';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../events';

import { fullscreenUserRulesEditor } from './fullscreen-user-rules-editor';

export type ExportMessageResponse = {
    content: string,
    appVersion: string,
};

export type GetOptionsDataResponse = {
    settings: SettingsData,
    appVersion: string,
    environmentOptions: {
        isChrome: boolean,
    },
    constants: {
        AntiBannerFiltersId: typeof AntiBannerFiltersId,
    },
    filtersInfo: {
        rulesCount: number,
    },
    filtersMetadata: CategoriesData,
    fullscreenUserRulesEditorIsOpen: boolean,
};

/**
 * SettingsService handles all setting-related messages and
 * calls {@link SettingsApi} to handle settings.
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

        contextMenuEvents.addListener(ContextMenuAction.EnableProtection, SettingsService.enableFiltering);
        contextMenuEvents.addListener(ContextMenuAction.DisableProtection, SettingsService.disableFiltering);
    }

    /**
     * Returns settings with some additional data: app version,
     * environment options, constants, filters info, filters metadata.
     *
     * @returns Item of {@link GetOptionsDataResponse}.
     */
    static getOptionsData(): GetOptionsDataResponse {
        return {
            settings: SettingsApi.getData(),
            appVersion: Prefs.version,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            constants: {
                AntiBannerFiltersId,
            },
            filtersInfo: {
                rulesCount: Engine.api.getRulesCount(),
            },
            filtersMetadata: Categories.getCategories(),
            fullscreenUserRulesEditorIsOpen: fullscreenUserRulesEditor.isOpen(),
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
            Engine.debounceUpdate();

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Imports settings from JSON.
     *
     * @param message Message with JSON settings {@link ApplySettingsJsonMessage}.
     */
    static async import(message: ApplySettingsJsonMessage): Promise<boolean> {
        const { json } = message.data;

        const isImported = await SettingsApi.import(json);

        Engine.debounceUpdate();

        listeners.notifyListeners(listeners.SettingsUpdated, isImported);
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
            Engine.api.setFilteringEnabled(!isFilteringDisabled);
        } catch (e) {
            Log.error('Failed to change filtering state', e);
        }

        const activeTab = await TabsApi.getActive();

        if (activeTab) {
            await browser.tabs.reload(activeTab.id);
        }
    }

    /**
     * Called when {@link SettingOption.DisableStealthMode} setting changed.
     *
     * @param isStealthModeDisabled Changed {@link SettingOption.DisableStealthMode} setting value.
     */
    static onDisableStealthModeStateChange(isStealthModeDisabled: boolean): void {
        try {
            Engine.api.setStealthModeEnabled(!isStealthModeDisabled);
        } catch (e) {
            Log.error('Failed to change stealth mode state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideReferrerEnabled Changed {@link SettingOption.HideReferrer} setting value.
     */
    static onHideReferrerStateChange(isHideReferrerEnabled: boolean): void {
        try {
            Engine.api.setHideReferrer(isHideReferrerEnabled);
        } catch (e) {
            Log.error('Failed to change `hide referrer` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.HideSearchQueries} setting changed.
     *
     * @param isHideSearchQueriesEnabled Changed {@link SettingOption.HideSearchQueries} setting value.
     */
    static onHideSearchQueriesStateChange(isHideSearchQueriesEnabled: boolean): void {
        try {
            Engine.api.setHideSearchQueries(isHideSearchQueriesEnabled);
        } catch (e) {
            Log.error('Failed to change `hide search queries` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isSendDoNotTrackEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static onSendDoNotTrackStateChange(isSendDoNotTrackEnabled: boolean): void {
        try {
            Engine.api.setSendDoNotTrack(isSendDoNotTrackEnabled);
        } catch (e) {
            Log.error('Failed to change `send do not track` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.RemoveXClientData} setting changed.
     *
     * @param isRemoveXClientDataEnabled Changed {@link SettingOption.RemoveXClientData} setting value.
     */
    static onRemoveXClientDataStateChange(isRemoveXClientDataEnabled: boolean): void {
        try {
            Engine.api.setBlockChromeClientData(isRemoveXClientDataEnabled);
        } catch (e) {
            Log.error('Failed to change `remove x-client-data` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.BlockWebRTC} setting changed.
     *
     * @param isBlockWebRTCEnabled Changed {@link SettingOption.BlockWebRTC} setting value.
     */
    static async onBlockWebRTCStateChange(isBlockWebRTCEnabled: boolean): Promise<void> {
        try {
            await Engine.api.setBlockWebRTC(isBlockWebRTCEnabled);
        } catch (e) {
            Log.error('Failed to change `block WebRTC` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.SelfDestructThirdPartyCookies} setting changed.
     *
     * @param isSelfDestructThirdPartyCookiesEnabled Changed
     * {@link SettingOption.SelfDestructThirdPartyCookies} setting value.
     */
    static onSelfDestructThirdPartyCookiesStateChange(isSelfDestructThirdPartyCookiesEnabled: boolean): void {
        try {
            Engine.api.setSelfDestructThirdPartyCookies(isSelfDestructThirdPartyCookiesEnabled);
        } catch (e) {
            Log.error('Failed to change `self destruct third party cookies` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.SelfDestructThirdPartyCookiesTime} setting changed.
     *
     * @param selfDestructThirdPartyCookiesTime Changed
     * {@link SettingOption.SelfDestructThirdPartyCookiesTime} setting value.
     */
    static onSelfDestructThirdPartyCookiesTimeStateChange(selfDestructThirdPartyCookiesTime: number): void {
        try {
            Engine.api.setSelfDestructThirdPartyCookiesTime(selfDestructThirdPartyCookiesTime);
        } catch (e) {
            Log.error('Failed to change `self destruct third party cookies time` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.SelfDestructFirstPartyCookies} setting changed.
     *
     * @param isSelfDestructFirstPartyCookiesEnabled Changed
     * {@link SettingOption.SelfDestructFirstPartyCookies} setting value.
     */
    static onSelfDestructFirstPartyCookiesStateChange(isSelfDestructFirstPartyCookiesEnabled: boolean): void {
        try {
            Engine.api.setSelfDestructFirstPartyCookies(isSelfDestructFirstPartyCookiesEnabled);
        } catch (e) {
            Log.error('Failed to change `self destruct first party cookies` option state', e);
        }
    }

    /**
     * Called when {@link SettingOption.SelfDestructFirstPartyCookiesTime} setting changed.
     *
     * @param selfDestructFirstPartyCookiesTime Changed
     * {@link SettingOption.SelfDestructFirstPartyCookiesTime} setting value.
     */
    static onSelfDestructFirstPartyCookiesTimeStateChange(selfDestructFirstPartyCookiesTime: number): void {
        try {
            Engine.api.setSelfDestructFirstPartyCookiesTime(selfDestructFirstPartyCookiesTime);
        } catch (e) {
            Log.error('Failed to change `self destruct first party cookies time` option state', e);
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
