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
import zod from 'zod';

import { SchemaPreprocessor } from '../preprocessor';
import { AppearanceTheme } from '../../../common/constants';

import { SettingOption } from './enum';

export const appearanceValidator = zod.enum([AppearanceTheme.System, AppearanceTheme.Light, AppearanceTheme.Dark]);

/**
 * Setting options may be stringified, use preprocessors for correct type casting.
 */
export const settingsValidator = zod.object({
    // ----- General settings section -----
    /**
     * See {@link GeneralSettingsConfig[GeneralSettingsOption.AppearanceTheme]}.
     */
    [SettingOption.AppearanceTheme]: appearanceValidator,
    /**
     * See {@link GeneralSettingsConfig[GeneralSettingsOption.ShowBlockedAdsCount]}.
     */
    [SettingOption.DisableShowPageStats]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link GeneralSettingsConfig[GeneralSettingsOption.AutodetectFilters]}.
     */
    [SettingOption.DisableDetectFilters]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link GeneralSettingsConfig[GeneralSettingsOption.SafebrowsingEnabled]}.
     */
    [SettingOption.DisableSafebrowsing]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link GeneralSettingsConfig[GeneralSettingsOption.FiltersUpdatePeriod]}.
     */
    [SettingOption.FiltersUpdatePeriod]: SchemaPreprocessor.numberValidator,
    // ----- General settings section -----

    // ----- Extension specific settings section -----
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.UseOptimizedFilters]}.
     */
    [SettingOption.UseOptimizedFilters]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.CollectHitsCount]}.
     */
    [SettingOption.DisableCollectHits]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.ShowContextMenu]}.
     */
    [SettingOption.DisableShowContextMenu]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]}.
     */
    [SettingOption.DisableShowAdguardPromoInfo]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]}.
     */
    [SettingOption.DisableShowAppUpdatedNotification]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.HideRateAdguard]}.
     */
    [SettingOption.HideRateBlock]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link ExtensionSpecificSettingsConfig[ExtensionSpecificSettingsOption.UserRulesEditorWrap]}.
     */
    [SettingOption.UserRulesEditorWrap]: SchemaPreprocessor.booleanValidator,
    // ----- Extension specific settings section -----

    // ----- Allowlist section -----
    /**
     * See {@link AllowlistConfig[AllowlistOption.Domains]}.
     */
    [SettingOption.AllowlistDomains]: zod.string(),
    /**
     * See {@link AllowlistConfig[AllowlistOption.InvertedDomains]}.
     */
    [SettingOption.InvertedAllowlistDomains]: zod.string(),
    /**
     * See {@link AllowlistConfig[AllowlistOption.Enabled]}.
     */
    [SettingOption.AllowlistEnabled]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link AllowlistConfig[AllowlistOption.Inverted]}.
     */
    [SettingOption.DefaultAllowlistMode]: SchemaPreprocessor.booleanValidator,
    // ----- Allowlist section -----

    // ----- Stealth section -----
    /**
     * See {@link StealthConfig[StealthOption.DisableStealthMode]}.
     */
    [SettingOption.DisableStealthMode]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.HideReferrer]}.
     */
    [SettingOption.HideReferrer]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.HideSearchQueries]}.
     */
    [SettingOption.HideSearchQueries]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.SendDoNotTrack]}.
     */
    [SettingOption.SendDoNotTrack]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.BlockWebRTC]}.
     */
    [SettingOption.BlockWebRTC]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.RemoveXClientData]}.
     */
    [SettingOption.RemoveXClientData]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.SelfDestructThirdPartyCookies]}.
     */
    [SettingOption.SelfDestructThirdPartyCookies]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.SelfDestructThirdPartyCookiesTime]}.
     */
    [SettingOption.SelfDestructThirdPartyCookiesTime]: zod.number(),
    /**
     * See {@link StealthConfig[StealthOption.SelfDestructFirstPartyCookies]}.
     */
    [SettingOption.SelfDestructFirstPartyCookies]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link StealthConfig[StealthOption.SelfDestructFirstPartyCookiesTime]}.
     */
    [SettingOption.SelfDestructFirstPartyCookiesTime]: zod.number(),
    // ----- Stealth section -----

    // ----- Statuses section -----
    /**
     * See {@link UserFilterConfig[UserFilterOption.Enabled]}.
     */
    [SettingOption.UserFilterEnabled]: SchemaPreprocessor.booleanValidator,
    /**
     * See {@link FilterStateStorageData}.
     */
    [SettingOption.FiltersState]: zod.string().optional(),
    /**
     * See {@link FilterVersionStorageData}.
     */
    [SettingOption.FiltersVersion]: zod.string().optional(),
    /**
     * See {@link GroupStateStorageData}.
     */
    [SettingOption.GroupsState]: zod.string().optional(),
    // ----- Statuses section -----

    // ----- Metadata section -----
    /**
     * See {@link Metadata}.
     */
    [SettingOption.Metadata]: zod.string().optional(),
    /**
     * See {@link I18nMetadata}.
     */
    [SettingOption.I18nMetadata]: zod.string().optional(),
    /**
     * See {@link CustomFilterMetadataStorageData}.
     */
    [SettingOption.CustomFilters]: zod.string().optional(),
    // ----- Metadata section -----

    /**
     * Is filtering enabled or not. Is needed for fast toggling filtering
     * without reload entire extension.
     */
    [SettingOption.DisableFiltering]: SchemaPreprocessor.booleanValidator,

    /**
     * Preserve log enabled setting for filtering log UI.
     */
    [SettingOption.PreserveLogEnabled]: SchemaPreprocessor.booleanValidator,
});

/**
 * Describes the root flat object with all the settings that are necessary for
 * the application to work and that are stored in the storage.
 */
export type Settings = zod.infer<typeof settingsValidator>;
