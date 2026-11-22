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

import browser, { type Runtime } from 'webextension-polyfill';

import { CloudErrorCode, selectCloudPreferences } from '../../../common/cloud-sync';
import { createCloudPreferencesApplier } from '../../../common/cloud-preferences-apply';
import { OPTIONS_PAGE } from '../../../common/constants';
import { MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { SettingsApi } from '../../api';
import { type SettingOption } from '../../schema/settings/enum';
import { settingsStorage } from '../../storages/settings';

const apply = createCloudPreferencesApplier({
    read: () => selectCloudPreferences(settingsStorage.getData()),
    write: (key, value) => SettingsApi.setSetting(key as SettingOption, value),
    persist: () => settingsStorage.persist(),
});

const isOptionsPage = (sender: Runtime.MessageSender): boolean => {
    if (sender.id !== browser.runtime.id || !sender.url) {
        return false;
    }
    try {
        const url = new URL(sender.url);
        url.search = '';
        url.hash = '';
        return url.href === browser.runtime.getURL(OPTIONS_PAGE);
    } catch {
        return false;
    }
};

/** Registers local-only settings operations. No credentials or remote requests cross the message boundary. */
export const initCloudPreferences = (): void => {
    messageHandler.addListener(MessageType.GetCloudPreferences, (_message, sender) => {
        if (!isOptionsPage(sender)) {
            return null;
        }
        return selectCloudPreferences(settingsStorage.getData());
    });
    messageHandler.addListener(MessageType.ApplyCloudPreferences, async (message, sender) => {
        if (!isOptionsPage(sender) || !message.data) {
            return { ok: false, code: CloudErrorCode.Invalid };
        }
        return apply(message.data.expected, message.data.incoming);
    });
};
