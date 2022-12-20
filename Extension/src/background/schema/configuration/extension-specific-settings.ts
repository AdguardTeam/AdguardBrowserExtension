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

// Extension specific settings configuration

export const enum ExtensionSpecificSettingsOption {
    UseOptimizedFilters = 'use-optimized-filters',
    CollectHitsCount = 'collect-hits-count',
    ShowContextMenu = 'show-context-menu',
    ShowInfoAboutAdguard = 'show-info-about-adguard',
    ShowAppUpdatedInfo = 'show-app-updated-info',
    HideRateAdguard = 'hide-rate-adguard',
    UserRulesEditorWrap = 'user-rules-editor-wrap',
}

export const extensionSpecificSettingsConfigValidator = zod.object({
    [ExtensionSpecificSettingsOption.UseOptimizedFilters]: zod.boolean(),
    [ExtensionSpecificSettingsOption.CollectHitsCount]: zod.boolean(),
    [ExtensionSpecificSettingsOption.ShowContextMenu]: zod.boolean(),
    [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: zod.boolean(),
    [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: zod.boolean(),
    [ExtensionSpecificSettingsOption.HideRateAdguard]: zod.boolean(),
    [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: zod.boolean(),
});

export type ExtensionSpecificSettingsConfig = zod.infer<typeof extensionSpecificSettingsConfigValidator>;
