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

// General settings configuration

export const enum GeneralSettingsOption {
    AppLanguage = 'app-language',
    AllowAcceptableAds = 'allow-acceptable-ads',
    ShowBlockedAdsCount = 'show-blocked-ads-count',
    AutodetectFilters = 'autodetect-filters',
    SafebrowsingEnabled = 'safebrowsing-enabled',
    FiltersUpdatePeriod = 'filters-update-period',
    AppearanceTheme = 'appearance-theme',
}

export const generalSettingsConfigValidator = zod.object({
    [GeneralSettingsOption.AppLanguage]: zod.string().optional(),
    [GeneralSettingsOption.AllowAcceptableAds]: zod.boolean(),
    [GeneralSettingsOption.ShowBlockedAdsCount]: zod.boolean(),
    [GeneralSettingsOption.AutodetectFilters]: zod.boolean(),
    [GeneralSettingsOption.SafebrowsingEnabled]: zod.boolean(),
    [GeneralSettingsOption.FiltersUpdatePeriod]: zod.number().int(),
    [GeneralSettingsOption.AppearanceTheme]: zod.enum(['system', 'dark', 'light']).optional(),
});

export type GeneralSettingsConfig = zod.infer<typeof generalSettingsConfigValidator>;
