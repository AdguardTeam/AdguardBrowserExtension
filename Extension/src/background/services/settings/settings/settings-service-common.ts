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

import {
    MessageType,
    type ChangeUserSettingMessage,
    type ApplySettingsJsonMessage,
} from '../../../../common/messages';
import { SettingOption } from '../../../schema';
import { messageHandler } from '../../../message-handler';
import { UserAgent } from '../../../../common/user-agent';
import { engine } from '../../../engine';
import {
    Categories,
    HitStatsApi,
    SettingsApi,
} from '../../../api';
import { Prefs } from '../../../prefs';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../../events';
import { fullscreenUserRulesEditor } from '../../fullscreen-user-rules-editor';
import { type ExportMessageResponse } from '../types';
import { type GetOptionsDataResponseCommon } from '../types/types-common';

/**
 * SettingsService handles all setting-related messages and
 * calls {@link SettingsApi} to handle settings.
 *
 * TODO: gracefully handle errors for tswebextension events. AG-37301.
 */
export class SettingsServiceCommon {
    /**
     * Adds a listener for background messages about settings: load/apply settings
     * from JSON and change/reset/return of custom settings.
     * Adds a listener with the action of updating the engine when you change
     * any {@link SettingOption} parameter.
     * Adds a listener to enable or disable protection from the context menu.
     */
    static init(): void {
        messageHandler.addListener(MessageType.ApplySettingsJson, SettingsServiceCommon.import);

        messageHandler.addListener(MessageType.ResetSettings, SettingsServiceCommon.reset);
        messageHandler.addListener(MessageType.ChangeUserSettings, SettingsServiceCommon.changeUserSettings);

        messageHandler.addListener(MessageType.LoadSettingsJson, SettingsServiceCommon.export);

        settingsEvents.addListener(SettingOption.DisableCollectHits, SettingsServiceCommon.onDisableCollectHitsChange);
        contextMenuEvents.addListener(ContextMenuAction.EnableProtection, SettingsServiceCommon.enableFiltering);
        contextMenuEvents.addListener(ContextMenuAction.DisableProtection, SettingsServiceCommon.disableFiltering);
    }

    /**
     * Returns settings with some additional data: app version,
     * environment options, constants, filters info, filters metadata.
     *
     * @returns Item of {@link GetOptionsDataResponseCommon}.
     */
    static async getOptionsData(): Promise<GetOptionsDataResponseCommon> {
        return {
            settings: SettingsApi.getData(),
            appVersion: Prefs.version,
            libVersions: Prefs.libVersions,
            environmentOptions: {
                isChrome: UserAgent.isChrome,
            },
            filtersInfo: {
                rulesCount: engine.api.getRulesCount(),
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
     * @returns Result of importing.
     */
    static async import(message: ApplySettingsJsonMessage): Promise<boolean> {
        const { json } = message.data;

        const isImported = await SettingsApi.import(json);

        if (isImported) {
            await engine.update();
        }

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
