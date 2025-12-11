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

import { type PreprocessedFilterList } from '@adguard/tswebextension';

import { type ForwardFrom } from './forward';

/**
 * Current version of app storage data schema.
 *
 * Schema version is used on extension version update.
 *
 * Note: Do not to be confused with the protocol version of the imported config.
 */
export const APP_SCHEMA_VERSION = 13;

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
export const RULES_LIMITS_KEY = 'rules-limits';
export const MANUAL_EXTENSION_UPDATE_KEY = 'manual-extension-update';
/**
 * Storage key to prevent double injection of content scripts after extension update.
 * Set before extension reload, checked and cleared after reload.
 */
export const CONTENT_SCRIPT_INJECTION_FLAG = 'content-script-injection-flag';
/**
 * Storage key for auto-update state data, used only in MV3.
 */
export const AUTO_UPDATE_STATE_KEY_MV3 = 'auto-update-state-mv3';
/**
 * Storage key for auto-update configuration override, used only in MV3 for testing.
 */
export const AUTO_UPDATE_CONFIG_KEY_MV3 = 'auto-update-config-mv3';

/**
 * Storage key for telemetry synthetic ID.
 */
export const TELEMETRY_SYNTHETIC_ID_KEY = 'telemetry-synthetic-id';

/**
 * Filter ids used in the code on the background page and filtering log page.
 */
export enum AntiBannerFiltersId {
    StealthModeFilterId = -1,
    UserFilterId = 0,
    EnglishFilterId = 2,
    TrackingFilterId = 3,
    SocialFilterId = 4,
    SearchAndSelfPromoFilterId = 10,
    AnnoyancesCombinedFilterId = 14,
    DnsFilterId = 15,
    UrlTrackingFilterId = 17,
    AnnoyancesCookieNoticesFilterId = 18,
    AnnoyancesPopupsFilterId = 19,
    AnnoyancesMobileAppBannersFilterId = 20,
    AnnoyancesOtherAnnoyancesFilterId = 21,
    AnnoyancesWidgetsFilterId = 22,
    QuickFixesFilterId = 24,
    AllowlistFilterId = 100,
    MobileAdsFilterId = 11,
}

/**
 * AdGuard Annoyances filter has been splitted into 5 other filters:
 * Cookie Notices, Popups, Mobile App Banners, Other Annoyances
 * and Widgets - which we should enabled instead of the Annoyances filter.
 */
export const SEPARATE_ANNOYANCE_FILTER_IDS = [
    AntiBannerFiltersId.AnnoyancesCookieNoticesFilterId,
    AntiBannerFiltersId.AnnoyancesPopupsFilterId,
    AntiBannerFiltersId.AnnoyancesMobileAppBannersFilterId,
    AntiBannerFiltersId.AnnoyancesOtherAnnoyancesFilterId,
    AntiBannerFiltersId.AnnoyancesWidgetsFilterId,
];

/**
 * Group ids used in the code on the multiple entry points.
 */
export const enum AntibannerGroupsId {
    /**
     * Custom filters group identifier.
     */
    CustomFiltersGroupId = 0,
    AdBlockingFiltersGroupId = 1,
    PrivacyFiltersGroupId = 2,
    SocialFiltersGroupId = 3,
    AnnoyancesFiltersGroupId = 4,
    SecurityFiltersGroupId = 5,

    /**
     * Other filters group identifier.
     */
    OtherFiltersGroupId = 6,

    /**
     * Language-specific group identifier.
     */
    LanguageFiltersGroupId = 7,
}

/**
 * Recommended filters tag ID.
 *
 * @see https://github.com/AdguardTeam/FiltersRegistry/blob/4528f7ae6b38aec90111a27efb0a7e0958d0cf37/tags/metadata.json#L40
 */
export const RECOMMENDED_TAG_ID = 10;

/**
 * Enum with the list of the messages which are sent from the background
 * to notify UI about some events, e.g. some field in settings was updated.
 */
export enum NotifierType {
    RequestFilterUpdated = 'event.request.filter.updated',
    UserFilterUpdated = 'event.user.filter.updated',
    CustomFilterAdded = 'event.custom.filter.added',
    UpdateAllowlistFilterRules = 'event.update.allowlist.filter.rules',
    SettingUpdated = 'event.update.setting.value',
    FiltersUpdateCheckReady = 'event.update.filters.check',
    ExtensionUpdateStateChange = 'event.update.extension.state.change',
    // Filtering log events.
    TabAdded = 'log.tab.added',
    TabClose = 'log.tab.close',
    TabUpdate = 'log.tab.update',
    TabReset = 'log.tab.reset',
    // Fullscreen user rules events
    FullscreenUserRulesEditorUpdated = 'event.user.rules.editor.updated',
}

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
 * Custom filters identifiers starts from this number
 */
export const CUSTOM_FILTERS_START_ID = 1000 as const;

// Unnecessary characters that will be replaced
export const WASTE_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

// Custom scrollbar width
export const SCROLLBAR_WIDTH = 12 as const;

export const BACKGROUND_TAB_ID = -1 as const;

export const TOTAL_BLOCKED_STATS_GROUP_ID = 'total';

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

export const FILTER_LIST_EXTENSION = '.txt';

/**
 * Special event name for extension initialization, needed for run automatic
 * integration tests.
 */
export const EXTENSION_INITIALIZED_EVENT = 'initialized';

/**
 * This is just a syntax sugar for setting default value if we not have
 * preprocessed list for user rules or for custom filters.
 */
export const emptyPreprocessedFilterList: PreprocessedFilterList = {
    filterList: [],
    sourceMap: {},
    rawFilterList: '',
    conversionMap: {},
};

/**
 * Chrome's extensions settings page url.
 */
export const CHROME_EXTENSIONS_SETTINGS_URL = 'chrome://extensions';

/**
 * Time-to-live for notifications in milliseconds.
 */
export const NOTIFICATION_TTL_MS = 4000;

/**
 * Minimum Chrome versions required for different toggles which enables usage of User Scripts API.
 *
 * User scripts API with needed 'execute' method is supported from Chrome 135 and higher.
 * But prior to 138 it can be enabled only via Developer mode toggle.
 * And for 138 and higher it can be enabled via User Scripts API toggle in the extensions details.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts
 */
export const USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED = {
    /**
     * Minimum Chrome version where Developer mode should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_prior_to_138_developer_mode_toggle
     */
    DEV_MODE_TOGGLE: 135,
    /**
     * Minimum Chrome version where User Scripts API toggle should be enabled.
     *
     * @see https://developer.chrome.com/docs/extensions/reference/api/userScripts#chrome_versions_138_and_newer_allow_user_scripts_toggle
     */
    ALLOW_USER_SCRIPTS_TOGGLE: 138,
};

/**
 * Delay in milliseconds before rechecking the state of the User Scripts API permission.
 *
 * Needed to update the state of the warning when the user grants or revokes the permission.
 */
export const USER_SCRIPTS_API_WARNING_RECHECK_DELAY_MS = 2000;

/**
 * Enum with the list of the pages where manual extension update can be triggered.
 */
export type ManualExtensionUpdatePage = ForwardFrom.Popup | ForwardFrom.Options;

/**
 * States for the extension update finite state machine (FSM).
 */
export const enum ExtensionUpdateFSMState {
    /**
     * Idle state.
     */
    Idle = 'Idle',

    /**
     * Checking for updates state.
     */
    Checking = 'Checking',

    /**
     * Available updates state.
     */
    Available = 'Available',

    /**
     * Updating state.
     */
    Updating = 'Updating',

    /**
     * Not available updates state.
     *
     * It means that the extension is already up-to-date.
     */
    NotAvailable = 'NotAvailable',

    /**
     * Update failed state.
     */
    Failed = 'Failed',

    /**
     * Update success state.
     */
    Success = 'Success',
}

/**
 * Events for the extension update finite state machine (FSM).
 *
 * Note: there is no event for successful update, because it is not needed —
 * the extension is reloaded automatically after the update
 * and needed notification is shown based on the storage value (set before the update).
 * For more details, see `ExtensionUpdateService.handleExtensionReloadOnUpdate()`.
 */
export const enum ExtensionUpdateFSMEvent {
    /**
     * Event to initialize the state machine.
     */
    Init = 'Init',

    /**
     * Event to check for updates.
     */
    Check = 'Check',

    /**
     * Event for no available updates after the check.
     */
    NoUpdateAvailable = 'NoUpdateAvailable',

    /**
     * Event for available updates after the check.
     */
    UpdateAvailable = 'UpdateAvailable',

    /**
     * Event to start the update.
     */
    Update = 'Update',

    /**
     * Event for failed update.
     */
    UpdateFailed = 'UpdateFailed',
}

/**
 * Time duration for showing update state change. Needed for smoother user experience.
 */
export const MIN_UPDATE_DISPLAY_DURATION_MS = 2 * 1000;
