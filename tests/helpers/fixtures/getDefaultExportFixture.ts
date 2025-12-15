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

import {
    type Config,
    RootOption,
    PROTOCOL_VERSION,
    GeneralSettingsOption,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    UserFilterOption,
    AllowlistOption,
    StealthOption,
} from '../../../Extension/src/background/schema';
import { AppearanceTheme } from '../../../Extension/src/common/constants';
import { UserAgent } from '../../../Extension/src/common/user-agent';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDefaultExportFixture = (isMv3: boolean): Config => ({
    [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
    [RootOption.GeneralSettings]: {
        [GeneralSettingsOption.AllowAcceptableAds]: true,
        [GeneralSettingsOption.ShowBlockedAdsCount]: true,
        [GeneralSettingsOption.AutodetectFilters]: true,
        [GeneralSettingsOption.SafebrowsingEnabled]: false,
        [GeneralSettingsOption.FiltersUpdatePeriod]: -1,
        [GeneralSettingsOption.AppearanceTheme]: AppearanceTheme.System,
    },
    [RootOption.ExtensionSpecificSettings]: {
        [ExtensionSpecificSettingsOption.AllowAnonymizedUsageData]: false,
        [ExtensionSpecificSettingsOption.UseOptimizedFilters]: false,
        [ExtensionSpecificSettingsOption.CollectHitsCount]: false,
        [ExtensionSpecificSettingsOption.ShowContextMenu]: true,
        [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: true,
        [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: true,
        [ExtensionSpecificSettingsOption.HideRateAdguard]: false,
        [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: false,
    },
    [RootOption.Filters]: {
        [FiltersOption.EnabledFilters]: [2, 10],
        [FiltersOption.EnabledGroups]: [1, 6],
        [FiltersOption.CustomFilters]: [],
        [FiltersOption.UserFilter]: {
            [UserFilterOption.Enabled]: true,
            [UserFilterOption.Rules]: '',
            [UserFilterOption.DisabledRules]: '',
        },
        [FiltersOption.Allowlist]: {
            [AllowlistOption.Enabled]: true,
            [AllowlistOption.Inverted]: false,
            [AllowlistOption.Domains]: [],
            [AllowlistOption.InvertedDomains]: [],
        },
    },
    [RootOption.Stealth]: {
        [StealthOption.DisableStealthMode]: true,
        [StealthOption.HideReferrer]: true,
        [StealthOption.HideSearchQueries]: true,
        [StealthOption.SendDoNotTrack]: true,
        [StealthOption.BlockWebRTC]: false,
        [StealthOption.RemoveXClientData]: UserAgent.isChrome,
        [StealthOption.SelfDestructThirdPartyCookies]: true,
        [StealthOption.SelfDestructThirdPartyCookiesTime]: 2880,
        [StealthOption.SelfDestructFirstPartyCookies]: false,
        [StealthOption.SelfDestructFirstPartyCookiesTime]: 4320,
        [StealthOption.BlockKnownTrackers]: false,
        [StealthOption.StripTrackingParams]: false,
    },
});
