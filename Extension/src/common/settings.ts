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

import { SettingOption, type Settings } from '../background/schema/settings';

import { AppearanceTheme } from './constants';
import { UserAgent } from './user-agent';

export const DEFAULT_FILTERS_UPDATE_PERIOD = -1;

export const DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN = 4320;

export const DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN = 2880;

export const DEFAULT_ALLOWLIST = [];

export const DEFAULT_INVERTED_ALLOWLIST = [];

export const defaultSettings: Settings = {
    [SettingOption.DisableShowAdguardPromoInfo]: !(
        UserAgent.isWindows
        || UserAgent.isMacOs
        || UserAgent.isAndroid
    ) || UserAgent.isEdge,
    [SettingOption.DisableSafebrowsing]: true,
    [SettingOption.DisableCollectHits]: true,
    [SettingOption.AllowAnonymizedUsageData]: false,
    [SettingOption.DefaultAllowlistMode]: true,
    [SettingOption.AllowlistEnabled]: true,
    // TODO: consider ditching optimized filters for mobile mv3 builds if (or when) they become available
    [SettingOption.UseOptimizedFilters]: UserAgent.isAndroid,
    [SettingOption.DisableDetectFilters]: false,
    [SettingOption.DisableShowAppUpdatedNotification]: false,
    [SettingOption.FiltersUpdatePeriod]: DEFAULT_FILTERS_UPDATE_PERIOD,
    [SettingOption.DisableStealthMode]: true,
    [SettingOption.HideReferrer]: true,
    [SettingOption.HideSearchQueries]: true,
    [SettingOption.SendDoNotTrack]: true,
    [SettingOption.RemoveXClientData]: UserAgent.isChrome,
    [SettingOption.BlockWebRTC]: false,
    [SettingOption.SelfDestructThirdPartyCookies]: true,
    [SettingOption.SelfDestructThirdPartyCookiesTime]: DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    [SettingOption.SelfDestructFirstPartyCookies]: false,
    [SettingOption.SelfDestructFirstPartyCookiesTime]: DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    [SettingOption.AppearanceTheme]: AppearanceTheme.System,
    [SettingOption.UserFilterEnabled]: true,
    [SettingOption.HideRateBlock]: false,
    [SettingOption.UserRulesEditorWrap]: false,
    [SettingOption.DisableFiltering]: false,
    [SettingOption.DisableShowPageStats]: false,
    [SettingOption.DisableShowContextMenu]: false,
    [SettingOption.AllowlistDomains]: JSON.stringify(DEFAULT_ALLOWLIST),
    [SettingOption.InvertedAllowlistDomains]: JSON.stringify(DEFAULT_INVERTED_ALLOWLIST),
    [SettingOption.PreserveLogEnabled]: false,
};
