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

/**
 * Separate file with only enum to exclude imports of zod to other files.
 */
export enum SettingOption {
    // General settings.
    AppearanceTheme = 'appearance-theme',
    DisableShowPageStats = 'disable-show-page-statistic',
    DisableDetectFilters = 'detect-filters-disabled',
    DisableSafebrowsing = 'safebrowsing-disabled',
    FiltersUpdatePeriod = 'filters-update-period',
    // Is filtering disabled or not.
    DisableFiltering = 'adguard-disabled',

    // Extension specific settings.
    UseOptimizedFilters = 'use-optimized-filters',
    DisableCollectHits = 'hits-count-disabled',
    AllowAnonymizedUsageData = 'allow-anonymized-usage-data',
    DisableShowContextMenu = 'context-menu-disabled',
    // Flag used to show link to comparison of desktop and browser extension versions.
    DisableShowAdguardPromoInfo = 'show-info-about-adguard-disabled',
    DisableShowAppUpdatedNotification = 'show-app-updated-disabled',
    HideRateBlock = 'hide-rate-block',
    UserRulesEditorWrap = 'user-rules-editor-wrap',

    // Allowlist section.
    AllowlistDomains = 'allowlist-domains',
    InvertedAllowlistDomains = 'block-list-domains',
    AllowlistEnabled = 'allowlist-enabled',
    DefaultAllowlistMode = 'default-allowlist-mode',

    // Tracking protection (formerly Stealth mode).
    DisableStealthMode = 'stealth-disable-stealth-mode',
    HideReferrer = 'stealth-hide-referrer',
    HideSearchQueries = 'stealth-hide-search-queries',
    SendDoNotTrack = 'stealth-send-do-not-track',
    RemoveXClientData = 'stealth-remove-x-client',
    BlockWebRTC = 'stealth-block-webrtc',
    SelfDestructThirdPartyCookies = 'stealth-block-third-party-cookies',
    SelfDestructThirdPartyCookiesTime = 'stealth-block-third-party-cookies-time',
    SelfDestructFirstPartyCookies = 'stealth-block-first-party-cookies',
    SelfDestructFirstPartyCookiesTime = 'stealth-block-first-party-cookies-time',

    // Filters' statuses and states.
    FiltersState = 'filters-state',
    FiltersVersion = 'filters-version',
    GroupsState = 'groups-state',
    UserFilterEnabled = 'user-filter-enabled',

    // Filters metadata.
    Metadata = 'filters-metadata',
    I18nMetadata = 'filters-i18n-metadata',
    CustomFilters = 'custom-filters',

    // Preserve log.
    PreserveLogEnabled = 'preserve-log-enabled',
}
