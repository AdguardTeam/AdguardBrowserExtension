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

import { FiltersUpdateTime } from '../../../common/constants';
import { appearanceValidator } from '../settings';

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
    /**
     * The two-letter code of the application language that is used to display
     * the translations in the user interface.
     */
    [GeneralSettingsOption.AppLanguage]: zod.string().optional(),
    /**
     * This option allows for "Search advertising and self-promotion":
     * advertising that the user sees among search results when using online
     * search engines, as well as a kind of "first-party" advertising on sites
     * that promote that particular site or closely related sites, social
     * networks, and so on.
     *
     * @see https://adguard.com/kb/general/ad-filtering/search-ads/
     */
    [GeneralSettingsOption.AllowAcceptableAds]: zod.boolean(),
    /**
     * Whether or not to show the number of blocked ads on the extension icon.
     */
    [GeneralSettingsOption.ShowBlockedAdsCount]: zod.boolean(),
    /**
     * Should the extension automatically enable a language filter that matches
     * the top-level domain.
     */
    [GeneralSettingsOption.AutodetectFilters]: zod.boolean(),
    /**
     * This setting enables module that protects against malicious and phishing
     * sites by checking the url hash in a database of malicious or phishing
     * sites.
     *
     * @see https://adguard.com/kb/general/browsing-security/
     */
    [GeneralSettingsOption.SafebrowsingEnabled]: zod.boolean(),
    /**
     * Time interval between filter updates.
     */
    [GeneralSettingsOption.FiltersUpdatePeriod]: zod.nativeEnum(FiltersUpdateTime),
    // TODO: Should be not optional?
    /**
     * Appearance theme of the application.
     */
    [GeneralSettingsOption.AppearanceTheme]: appearanceValidator.optional(),
});

/**
 * Contains general application settings: appearance theme, language, time
 * to check for updates to filters and some filtering options.
 */
export type GeneralSettingsConfig = zod.infer<typeof generalSettingsConfigValidator>;
