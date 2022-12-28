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
import zod from 'zod';
import { SchemaPreprocessor } from '../preprocessor';

export enum SettingOption {
    // filters states
    FiltersState = 'filters-state',
    FiltersVersion = 'filters-version',
    GroupsState = 'groups-state',

    // filters metadata
    Metadata = 'filters-metadata',
    I18nMetadata = 'filters-i18n-metadata',
    CustomFilters = 'custom_filters',

    // user settings
    DisableDetectFilters = 'detect-filters-disabled',
    DisableShowPageStats = 'disable-show-page-statistic',

    // allowlist domains
    AllowlistDomains = 'allowlist-domains',
    InvertedAllowlistDomains = 'block-list-domains',

    // flag used to show link to comparison of desktop and browser adblocker versions
    DisableShowAdguardPromoInfo = 'show-info-about-adguard-disabled',

    DisableSafebrowsing = 'safebrowsing-disabled',
    DisableFiltering = 'adguard-disabled',
    DisableCollectHits = 'hits-count-disabled',
    DisableShowContextMenu = 'context-menu-disabled',
    UseOptimizedFilters = 'use-optimized-filters',
    DefaultAllowlistMode = 'default-allowlist-mode',
    AllowlistEnabled = 'allowlist-enabled',
    DisableShowAppUpdatedNotification = 'show-app-updated-disabled',
    FiltersUpdatePeriod = 'filters-update-period',
    AppearanceTheme = 'appearance-theme',

    // User filter
    UserFilterEnabled = 'user-filter-enabled',

    // stealth mode
    DisableStealthMode = 'stealth-disable-stealth-mode',
    HideReferrer = 'stealth-hide-referrer',
    HideSearchQueries = 'stealth-hide-search-queries',
    SendDoNotTrack = 'stealth-send-do-not-track',
    BlockChromeClientData = 'stealth-remove-x-client',
    BlockWebRTC = 'stealth-block-webrtc',
    SelfDestructThirdPartyCookies = 'stealth-block-third-party-cookies',
    SelfDestructThirdPartyCookiesTime = 'stealth-block-third-party-cookies-time',
    SelfDestructFirstPartyCookies = 'stealth-block-first-party-cookies',
    SelfDestructFirstPartyCookiesTime = 'stealth-block-first-party-cookies-time',

    // UI misc
    HideRateBlock = 'hide-rate-block',
    UserRulesEditorWrap = 'user-rules-editor-wrap',
}

// Setting options may be stringified, use preprocessors for correct type casting
export const settingsValidator = zod.object({
    [SettingOption.DisableShowAdguardPromoInfo]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableSafebrowsing]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableCollectHits]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DefaultAllowlistMode]: SchemaPreprocessor.booleanValidator,
    [SettingOption.AllowlistEnabled]: SchemaPreprocessor.booleanValidator,
    [SettingOption.UseOptimizedFilters]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableDetectFilters]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableShowAppUpdatedNotification]: SchemaPreprocessor.booleanValidator,
    [SettingOption.FiltersUpdatePeriod]: SchemaPreprocessor.numberValidator,
    [SettingOption.DisableStealthMode]: SchemaPreprocessor.booleanValidator,
    [SettingOption.HideReferrer]: SchemaPreprocessor.booleanValidator,
    [SettingOption.HideSearchQueries]: SchemaPreprocessor.booleanValidator,
    [SettingOption.SendDoNotTrack]: SchemaPreprocessor.booleanValidator,
    [SettingOption.BlockChromeClientData]: SchemaPreprocessor.booleanValidator,
    [SettingOption.BlockWebRTC]: SchemaPreprocessor.booleanValidator,
    [SettingOption.SelfDestructThirdPartyCookies]: SchemaPreprocessor.booleanValidator,
    [SettingOption.SelfDestructThirdPartyCookiesTime]: SchemaPreprocessor.numberValidator,
    [SettingOption.SelfDestructFirstPartyCookies]: SchemaPreprocessor.booleanValidator,
    [SettingOption.SelfDestructFirstPartyCookiesTime]: SchemaPreprocessor.numberValidator,
    [SettingOption.AppearanceTheme]: zod.enum(['system', 'dark', 'light']),
    [SettingOption.UserFilterEnabled]: SchemaPreprocessor.booleanValidator,
    [SettingOption.HideRateBlock]: SchemaPreprocessor.booleanValidator,
    [SettingOption.UserRulesEditorWrap]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableFiltering]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableShowPageStats]: SchemaPreprocessor.booleanValidator,
    [SettingOption.DisableShowContextMenu]: SchemaPreprocessor.booleanValidator,
    [SettingOption.AllowlistDomains]: zod.string(),
    [SettingOption.InvertedAllowlistDomains]: zod.string(),

    [SettingOption.FiltersState]: zod.string().optional(),
    [SettingOption.FiltersVersion]: zod.string().optional(),
    [SettingOption.GroupsState]: zod.string().optional(),

    [SettingOption.Metadata]: zod.string().optional(),
    [SettingOption.I18nMetadata]: zod.string().optional(),

    [SettingOption.CustomFilters]: zod.string().optional(),
});

export type Settings = zod.infer<typeof settingsValidator>;
