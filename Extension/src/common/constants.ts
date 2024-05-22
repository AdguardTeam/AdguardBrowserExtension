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

/**
 * Current version of app storage data schema.
 *
 * Schema version is used on extension version update.
 *
 * Note: Do not to be confused with the protocol version of the imported config.
 */
export const APP_SCHEMA_VERSION = 3;

export const CLIENT_ID_KEY = 'client-id';
export const APP_VERSION_KEY = 'app-version';
export const SCHEMA_VERSION_KEY = 'schema-version';
export const ADGUARD_SETTINGS_KEY = 'adguard-settings';
export const PAGE_STATISTIC_KEY = 'page-statistic';
export const TRUSTED_DOCUMENTS_CACHE_KEY = 'trusted-documents';
export const SB_LRU_CACHE_KEY = 'sb-lru-cache';
export const SB_SUSPENDED_CACHE_KEY = 'safebrowsing-suspended-from';
export const VIEWED_NOTIFICATIONS_KEY = 'viewed-notifications';
export const LAST_NOTIFICATION_TIME_KEY = 'viewed-notification-time';
export const FILTERING_LOG_WINDOW_STATE = 'filtering-log-window-state';
export const HIT_STATISTIC_KEY = 'filters-hit-count';
export const ANNOYANCES_CONSENT_KEY = 'annoyances-consent';

// Filter ids used in the code on the background page and filtering log page
export enum AntiBannerFiltersId {
    StealthModeFilterId = -1,
    UserFilterId = 0,
    EnglishFilterId = 2,
    TrackingFilterId = 3,
    SocialFilterId = 4,
    SearchAndSelfPromoFilterId = 10,
    AnnoyancesCombinedFilterId = 14,
    UrlTrackingFilterId = 17,
    AllowlistFilterId = 100,
    MobileAdsFilterId = 11,
}

// Group ids used in the code on the multiple entry points
export const enum AntibannerGroupsId {
    // custom filters group identifier
    CustomFiltersGroupId = 0,
    AdBlockingFiltersGroupId = 1,
    PrivacyFiltersGroupId = 2,
    SocialFiltersGroupId = 3,
    AnnoyancesFiltersGroupId = 4,
    SecurityFiltersGroupId = 5,
    // other filters group identifier
    OtherFiltersGroupId = 6,
    // language-specific group identifier
    LanguageFiltersGroupId = 7,
}

// https://github.com/AdguardTeam/FiltersRegistry/blob/4528f7ae6b38aec90111a27efb0a7e0958d0cf37/tags/metadata.json#L40
export const RECOMMENDED_TAG_ID = 10;

// TODO: Add types checking for messages payload, because it many messages data
// are not used in the fronted code, except FiltersUpdateCheckReady and FullscreenUserRulesEditorUpdated.
export enum NotifierType {
    RequestFilterUpdated = 'event.request.filter.updated',
    UserFilterUpdated = 'event.user.filter.updated',
    CustomFilterAdded = 'event.custom.filter.added',
    UpdateAllowlistFilterRules = 'event.update.allowlist.filter.rules',
    SettingUpdated = 'event.update.setting.value',
    FiltersUpdateCheckReady = 'event.update.filters.check',
    // Log events
    TabAdded = 'log.tab.added',
    TabClose = 'log.tab.close',
    TabUpdate = 'log.tab.update',
    TabReset = 'log.tab.reset',
    LogEventAdded = 'log.event.added',
    // Sync events
    SettingsUpdated = 'event.sync.finished',
    // Fullscreen user rules events
    FullscreenUserRulesEditorUpdated = 'event.user.rules.editor.updated',
}

export const FULLSCREEN_USER_RULES_EDITOR = 'fullscreen_user_rules_editor' as const;
export const FILTERING_LOG = 'filtering-log' as const;
export const KEEP_ALIVE_PORT_NAME = 'keep-alive' as const;

export const enum NavigationTag {
    Regular = 'regular',
    Party = 'party',
}

/**
 * Trusted tag for custom filters
 */
export const TRUSTED_TAG_KEYWORD = 'trusted' as const;

/**
 * Trusted tag id for custom filters.
 */
export const TRUSTED_TAG_ID = 999 as const;

/**
 * Custom filters group display number
 */
export const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99 as const;

/**
 * Custom filters identifier starts from this number
 */
export const CUSTOM_FILTERS_START_ID = 1000 as const;

// Unnecessary characters that will be replaced
export const WASTE_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

// Custom scrollbar width
export const SCROLLBAR_WIDTH = 12 as const;

export const BACKGROUND_TAB_ID = -1 as const;

/**
 *  Time interval between filter updates.
 */
export enum FiltersUpdateTime {
    Disabled = 0,
    OneHour = 1000 * 60 * 60 * 1,
    SixHours = 1000 * 60 * 60 * 6,
    TwelveHours = 1000 * 60 * 60 * 12,
    TwentyFourHours = 1000 * 60 * 60 * 24,
    FortyEightHours = 1000 * 60 * 60 * 48,
    Default = -1,
}

export const NEWLINE_CHAR_UNIX = '\n';
export const NEWLINE_CHAR_REGEX = /\r?\n/;

export const OPTIONS_PAGE = 'pages/options.html';
