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

export class SettingsService {
    static init(): void {
        messageHandler.addListener(MessageType.GetOptionsData, SettingsService.getOptionsData);
        messageHandler.addListener(MessageType.ResetSettings, SettingsService.reset);
        messageHandler.addListener(MessageType.ChangeUserSettings, SettingsService.changeUserSettings);
        messageHandler.addListener(MessageType.ApplySettingsJson, SettingsService.import);
        messageHandler.addListener(MessageType.LoadSettingsJson, SettingsService.export);

        settingsEvents.addListener(SettingOption.DisableStealthMode, Engine.update);
        settingsEvents.addListener(SettingOption.HideReferrer, Engine.update);
        settingsEvents.addListener(SettingOption.HideSearchQueries, Engine.update);
        settingsEvents.addListener(SettingOption.SendDoNotTrack, Engine.update);
        settingsEvents.addListener(
            SettingOption.BlockChromeClientData,
            Engine.update,
        );
        settingsEvents.addListener(SettingOption.BlockWebRTC, Engine.update);
        settingsEvents.addListener(
            SettingOption.SelfDestructThirdPartyCookies,
            Engine.update,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructThirdPartyCookiesTime,
            Engine.update,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructFirstPartyCookies,
            Engine.update,
        );
        settingsEvents.addListener(
            SettingOption.SelfDestructFirstPartyCookiesTime,
            Engine.update,
        );
        settingsEvents.addListener(
            SettingOption.DisableFiltering,
            SettingsService.onFilteringStateChange,
        );

        contextMenuEvents.addListener(
            ContextMenuAction.EnableProtection,
            SettingsService.enableFiltering,
        );

        contextMenuEvents.addListener(
            ContextMenuAction.DisableProtection,
            SettingsService.disableFiltering,
        );
    }

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

    static async changeUserSettings(message: ChangeUserSettingMessage): Promise<void> {
        const { key, value } = message.data;
        await SettingsApi.setSetting(key, value);
    }

    static async reset(): Promise<boolean> {
        try {
            await SettingsApi.reset();
            await Engine.update();
            return true;
        } catch (e) {
            return false;
        }
    }

    static async import(message: ApplySettingsJsonMessage): Promise<boolean> {
        const { json } = message.data;

        const isImported = await SettingsApi.import(json);

        await Engine.update();

        listeners.notifyListeners(listeners.SettingsUpdated, isImported);
        return isImported;
    }

    static async export(): Promise<ExportMessageResponse> {
        return {
            content: await SettingsApi.export(),
            appVersion: browser.runtime.getManifest().version,
        };
    }

    static async onFilteringStateChange(): Promise<void> {
        await Engine.update();

        const activeTab = await TabsApi.getActive();

        if (activeTab) {
            await browser.tabs.reload(activeTab.id);
        }
    }

    static async enableFiltering(): Promise<void> {
        await SettingsApi.setSetting(SettingOption.DisableFiltering, false);
    }

    static async disableFiltering(): Promise<void> {
        await SettingsApi.setSetting(SettingOption.DisableFiltering, true);
    }
}
