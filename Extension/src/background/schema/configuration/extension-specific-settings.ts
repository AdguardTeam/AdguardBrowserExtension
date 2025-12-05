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

/**
 * Extension specific settings configuration.
 */
export const enum ExtensionSpecificSettingsOption {
    UseOptimizedFilters = 'use-optimized-filters',
    CollectHitsCount = 'collect-hits-count',
    AllowAnonymizedUsageData = 'allow-anonymized-usage-data',
    ShowContextMenu = 'show-context-menu',
    ShowInfoAboutAdguard = 'show-info-about-adguard',
    ShowAppUpdatedInfo = 'show-app-updated-info',
    HideRateAdguard = 'hide-rate-adguard',
    UserRulesEditorWrap = 'user-rules-editor-wrap',
}

export const extensionSpecificSettingsConfigValidator = zod.object({
    /**
     * If the flag is set to true, the application uses the optimized versions
     * of filter lists — the lists which contain needed and popular rules.
     *
     * @see https://adguard.com/kb/general/ad-filtering/create-own-filters/#not_optimized-hint for details.
     */
    [ExtensionSpecificSettingsOption.UseOptimizedFilters]: zod.boolean(),
    /**
     * If the flag is set to true, the application will send anonymous
     * statistics about the use of ad filters, which will help us to improve and
     * optimize them: for example, to remove obsolete rules in order to reduce
     * the time it takes to apply the rules.
     *
     * @see https://adguard.com/kb/general/ad-filtering/tracking-filter-statistics/ for clarification.
     */
    [ExtensionSpecificSettingsOption.CollectHitsCount]: zod.boolean(),
    /**
     * If the flag is set to true, the application will send anonymized
     * statistics about the extension usage, which will help us to improve and
     * optimize the product.
     */
    [ExtensionSpecificSettingsOption.AllowAnonymizedUsageData]: zod.boolean().optional(),
    /**
     * Whether or not to add filtering options (add domain to allowlist,
     * enable or disable filtering) to the context menu (available by
     * right-clicking) in the browser.
     */
    [ExtensionSpecificSettingsOption.ShowContextMenu]: zod.boolean(),
    /**
     * If set to true - a banner will be displayed in the extensions
     * settings with information about AdGuard's system ad blocking app.
     */
    [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: zod.boolean(),
    /**
     * If set to true - the extension will show app update notifications.
     */
    [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: zod.boolean(),
    /**
     * If set to true - the extension will hide the block about requesting
     * feedback with rating in the extension settings.
     */
    [ExtensionSpecificSettingsOption.HideRateAdguard]: zod.boolean(),
    /**
     * If set to true - the extension will enable word wrap in the user rules
     * editor to display a window without horizontal scroll bars.
     */
    [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: zod.boolean(),
});

/**
 * Contains some additional extension settings and UI settings.
 */
export type ExtensionSpecificSettingsConfig = zod.infer<typeof extensionSpecificSettingsConfigValidator>;
