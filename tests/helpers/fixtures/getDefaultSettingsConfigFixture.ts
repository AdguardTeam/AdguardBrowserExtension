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

import { type SettingsConfig as SettingsConfigMV2 } from '@adguard/tswebextension';
import { type SettingsConfig as SettingsConfigMV3 } from '@adguard/tswebextension/mv3';

import { SettingOption } from '../../../Extension/src/background/schema';
import { defaultSettings } from '../../../Extension/src/common/settings';

export const getDefaultSettingsConfigFixtureMV2 = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
    debugScriptlets: boolean,
): SettingsConfigMV2 => ({
    assistantUrl,
    documentBlockingPageUrl,
    collectStats: !defaultSettings[SettingOption.DisableCollectHits],
    debugScriptlets,
    allowlistInverted: !defaultSettings[SettingOption.DefaultAllowlistMode],
    allowlistEnabled: defaultSettings[SettingOption.AllowlistEnabled],
    stealthModeEnabled: !defaultSettings[SettingOption.DisableStealthMode],
    filteringEnabled: !defaultSettings[SettingOption.DisableFiltering],
    stealth: {
        blockChromeClientData: defaultSettings[SettingOption.RemoveXClientData],
        hideReferrer: defaultSettings[SettingOption.HideReferrer],
        hideSearchQueries: defaultSettings[SettingOption.HideSearchQueries],
        sendDoNotTrack: defaultSettings[SettingOption.SendDoNotTrack],
        blockWebRTC: defaultSettings[SettingOption.BlockWebRTC],
        selfDestructThirdPartyCookies: defaultSettings[SettingOption.SelfDestructThirdPartyCookies],
        selfDestructThirdPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructThirdPartyCookiesTime]
        ),
        selfDestructFirstPartyCookies: defaultSettings[SettingOption.SelfDestructFirstPartyCookies],
        selfDestructFirstPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructFirstPartyCookiesTime]
        ),
    },
});

export const getDefaultSettingsConfigFixtureMV3 = (
    documentBlockingPageUrl: string,
    assistantUrl: string,
    gpcScriptUrl: string,
    hideDocumentReferrerScriptUrl: string,
    debugScriptlets: boolean,
): SettingsConfigMV3 => ({
    assistantUrl,
    documentBlockingPageUrl,
    collectStats: !defaultSettings[SettingOption.DisableCollectHits],
    debugScriptlets,
    gpcScriptUrl,
    hideDocumentReferrerScriptUrl,
    allowlistInverted: !defaultSettings[SettingOption.DefaultAllowlistMode],
    allowlistEnabled: defaultSettings[SettingOption.AllowlistEnabled],
    stealthModeEnabled: !defaultSettings[SettingOption.DisableStealthMode],
    filteringEnabled: !defaultSettings[SettingOption.DisableFiltering],
    stealth: {
        blockChromeClientData: defaultSettings[SettingOption.RemoveXClientData],
        // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
        // AG-34765, Setting to false so that it will remove already added session rules.
        hideReferrer: false,
        // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
        hideSearchQueries: false,
        sendDoNotTrack: defaultSettings[SettingOption.SendDoNotTrack],
        blockWebRTC: defaultSettings[SettingOption.BlockWebRTC],
        selfDestructThirdPartyCookies: defaultSettings[SettingOption.SelfDestructThirdPartyCookies],
        selfDestructThirdPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructThirdPartyCookiesTime]
        ),
        selfDestructFirstPartyCookies: defaultSettings[SettingOption.SelfDestructFirstPartyCookies],
        selfDestructFirstPartyCookiesTime: (
            defaultSettings[SettingOption.SelfDestructFirstPartyCookiesTime]
        ),
    },
});
