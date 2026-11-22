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

import browser, { type Runtime, type Storage } from 'webextension-polyfill';

import { OPTIONS_OUTPUT } from '../../../../../../constants';
import {
    type BrowserSyncPreferences,
    type BrowserSyncResponse,
    BrowserSyncError,
} from '../../../../common/browser-sync';
import { type BrowserSyncMessage } from '../../../../common/messages';
import { type AppearanceTheme, NotifierType } from '../../../../common/constants';
import { UserAgent } from '../../../../common/user-agent';
import { SettingOption } from '../../../schema/settings/enum';
import { settingsStorage } from '../../../storages/settings';
import { notifier } from '../../../notifier';
import { settingsEvents } from '../../../events/settings';

import { BrowserSyncController, sameBrowserSyncPreferences } from './controller';

/**
 * Reads only the presentation settings supported by this protocol.
 *
 * @returns The current transferable preferences.
 */
const readLocal = (): BrowserSyncPreferences => ({
    'appearance-theme': settingsStorage.get(SettingOption.AppearanceTheme),
    'disable-show-page-statistic': settingsStorage.get(SettingOption.DisableShowPageStats),
    'user-rules-editor-wrap': settingsStorage.get(SettingOption.UserRulesEditorWrap),
});

/**
 * Applies reviewed values without resetting filters, permissions or other preferences.
 *
 * @param next Reviewed preferences.
 * @param expected Local preferences when the review was created.
 */
const applyLocal = async (next: BrowserSyncPreferences, expected: BrowserSyncPreferences): Promise<void> => {
    if (!sameBrowserSyncPreferences(readLocal(), expected)) {
        throw new Error('Local preferences changed; review again.');
    }
    // No await between the comparison and the three cache writes.
    settingsStorage.set(SettingOption.AppearanceTheme, next['appearance-theme'] as AppearanceTheme);
    settingsStorage.set(SettingOption.DisableShowPageStats, next['disable-show-page-statistic']);
    settingsStorage.set(SettingOption.UserRulesEditorWrap, next['user-rules-editor-wrap']);
    await settingsStorage.flush();

    for (const key of [
        SettingOption.AppearanceTheme,
        SettingOption.DisableShowPageStats,
        SettingOption.UserRulesEditorWrap,
    ] as const) {
        const value = settingsStorage.get(key);
        await settingsEvents.publishEvent(key, value);
        notifier.notifyListeners(NotifierType.SettingUpdated, { propertyName: key, propertyValue: value });
    }
};

const controller = new BrowserSyncController({
    storage: (): Storage.StorageArea | undefined => browser.storage.sync,
    readLocal,
    applyLocal,
    isManaged: async (): Promise<boolean> => {
        if (!browser.storage.managed) {
            return false;
        }
        try {
            return Object.keys(await browser.storage.managed.get(null)).length > 0;
        } catch (error) {
            // Firefox's ext-storage.js reports an absent native manifest with this exact message.
            if (UserAgent.isFirefox && error !== null && typeof error === 'object'
                && 'message' in error && error.message === 'Managed storage manifest not found') {
                return false;
            }
            // Fail closed when policy cannot be read; never import over unknown policy.
            throw error;
        }
    },
    createToken: (): string => crypto.randomUUID(),
});

/**
 * Accepts manual sync requests only from this extension's options page.
 *
 * @param message Typed app message; the controller validates its data at runtime.
 * @param sender Browser-authenticated sender metadata.
 *
 * @returns The operation result, without exposing raw storage errors or data.
 */
export const handleBrowserSync = async (
    message: BrowserSyncMessage,
    sender: Runtime.MessageSender,
): Promise<BrowserSyncResponse> => {
    const optionsUrl = browser.runtime.getURL(`${OPTIONS_OUTPUT}.html`);
    const senderUrl = sender.url?.split(/[?#]/, 1)[0];
    if (sender.id !== browser.runtime.id || senderUrl !== optionsUrl || (sender.frameId ?? 0) !== 0) {
        return { ok: false, error: BrowserSyncError.Forbidden };
    }
    return controller.handle(message.data);
};
