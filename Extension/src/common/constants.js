/**
 * Filter ids used in the code on the background page and filtering log page
 */
export const ANTIBANNER_FILTERS_ID = {
    STEALTH_MODE_FILTER_ID: -1,
    USER_FILTER_ID: 0,
    RUSSIAN_FILTER_ID: 1,
    ENGLISH_FILTER_ID: 2,
    TRACKING_FILTER_ID: 3,
    SOCIAL_FILTER_ID: 4,
    SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
    URL_TRACKING_FILTER_ID: 17,
    ALLOWLIST_FILTER_ID: 100,
    EASY_PRIVACY: 118,
    FANBOY_ANNOYANCES: 122,
    FANBOY_SOCIAL: 123,
    FANBOY_ENHANCED: 215,
    MOBILE_ADS_FILTER_ID: 11,
};

/**
 * Group ids used in the code on the multiple entry points
 */
export const ANTIBANNER_GROUPS_ID = {
    // custom filters group identifier
    CUSTOM_FILTERS_GROUP_ID: 0,
    PRIVACY_FILTERS_GROUP_ID: 2,
    // other filters group identifier
    OTHER_FILTERS_GROUP_ID: 6,
    // language-specific group identifier
    LANGUAGE_FILTERS_GROUP_ID: 7,
};

/**
 * Stealth action bitwise masks used o the background page and on the filtering log page
 */
export const STEALTH_ACTIONS = {
    HIDE_REFERRER: 1 << 0,
    HIDE_SEARCH_QUERIES: 1 << 1,
    BLOCK_CHROME_CLIENT_DATA: 1 << 2,
    SEND_DO_NOT_TRACK: 1 << 3,
    STRIPPED_TRACKING_URL: 1 << 4,
    FIRST_PARTY_COOKIES: 1 << 5,
    THIRD_PARTY_COOKIES: 1 << 6,
};

/**
 * Message types used for message passing between background page and
 * other pages (popup, filtering log, content scripts)
 */
export const MESSAGE_TYPES = {
    CREATE_EVENT_LISTENER: 'createEventListener',
    REMOVE_LISTENER: 'removeListener',
    OPEN_EXTENSION_STORE: 'openExtensionStore',
    ADD_AND_ENABLE_FILTER: 'addAndEnableFilter',
    APPLY_SETTINGS_JSON: 'applySettingsJson',
    OPEN_FILTERING_LOG: 'openFilteringLog',
    OPEN_FULLSCREEN_USER_RULES: 'openFullscreenUserRules',
    RESET_BLOCKED_ADS_COUNT: 'resetBlockedAdsCount',
    RESET_SETTINGS: 'resetSettings',
    GET_USER_RULES: 'getUserRules',
    SAVE_USER_RULES: 'saveUserRules',
    GET_ALLOWLIST_DOMAINS: 'getAllowlistDomains',
    SAVE_ALLOWLIST_DOMAINS: 'saveAllowlistDomains',
    CHECK_ANTIBANNER_FILTERS_UPDATE: 'checkAntiBannerFiltersUpdate',
    DISABLE_FILTERS_GROUP: 'disableFiltersGroup',
    DISABLE_ANTIBANNER_FILTER: 'disableAntiBannerFilter',
    LOAD_CUSTOM_FILTER_INFO: 'loadCustomFilterInfo',
    SUBSCRIBE_TO_CUSTOM_FILTER: 'subscribeToCustomFilter',
    REMOVE_ANTIBANNER_FILTER: 'removeAntiBannerFilter',
    GET_TAB_INFO_FOR_POPUP: 'getTabInfoForPopup',
    CHANGE_APPLICATION_FILTERING_DISABLED: 'changeApplicationFilteringDisabled',
    OPEN_SETTINGS_TAB: 'openSettingsTab',
    OPEN_ASSISTANT: 'openAssistant',
    OPEN_ABUSE_TAB: 'openAbuseTab',
    OPEN_SITE_REPORT_TAB: 'openSiteReportTab',
    RESET_CUSTOM_RULES_FOR_PAGE: 'resetCustomRulesForPage',
    REMOVE_ALLOWLIST_DOMAIN: 'removeAllowlistDomainPopup',
    ADD_ALLOWLIST_DOMAIN_POPUP: 'addAllowlistDomainPopup',
    GET_STATISTICS_DATA: 'getStatisticsData',
    ON_OPEN_FILTERING_LOG_PAGE: 'onOpenFilteringLogPage',
    GET_FILTERING_LOG_DATA: 'getFilteringLogData',
    INITIALIZE_FRAME_SCRIPT: 'initializeFrameScript',
    ON_CLOSE_FILTERING_LOG_PAGE: 'onCloseFilteringLogPage',
    GET_FILTERING_INFO_BY_TAB_ID: 'getFilteringInfoByTabId',
    SYNCHRONIZE_OPEN_TABS: 'synchronizeOpenTabs',
    CLEAR_EVENTS_BY_TAB_ID: 'clearEventsByTabId',
    REFRESH_PAGE: 'refreshPage',
    OPEN_TAB: 'openTab',
    ADD_USER_RULE: 'addUserRule',
    UN_ALLOWLIST_FRAME: 'unAllowlistFrame',
    REMOVE_USER_RULE: 'removeUserRule',
    GET_TAB_FRAME_INFO_BY_ID: 'getTabFrameInfoById',
    ENABLE_FILTERS_GROUP: 'enableFiltersGroup',
    NOTIFY_LISTENERS: 'notifyListeners',
    ADD_LONG_LIVED_CONNECTION: 'addLongLivedConnection',
    GET_OPTIONS_DATA: 'getOptionsData',
    CHANGE_USER_SETTING: 'changeUserSetting',
    CHECK_REQUEST_FILTER_READY: 'checkRequestFilterReady',
    OPEN_THANKYOU_PAGE: 'openThankYouPage',
    OPEN_SAFEBROWSING_TRUSTED: 'openSafebrowsingTrusted',
    GET_SELECTORS_AND_SCRIPTS: 'getSelectorsAndScripts',
    CHECK_PAGE_SCRIPT_WRAPPER_REQUEST: 'checkPageScriptWrapperRequest',
    PROCESS_SHOULD_COLLAPSE: 'processShouldCollapse',
    PROCESS_SHOULD_COLLAPSE_MANY: 'processShouldCollapseMany',
    ADD_FILTERING_SUBSCRIPTION: 'addFilterSubscription',
    SET_NOTIFICATION_VIEWED: 'setNotificationViewed',
    SAVE_CSS_HITS_STATS: 'saveCssHitStats',
    GET_COOKIE_RULES: 'getCookieRules',
    SAVE_COOKIE_LOG_EVENT: 'saveCookieRuleEvent',
    LOAD_SETTINGS_JSON: 'loadSettingsJson',
    ADD_URL_TO_TRUSTED: 'addUrlToTrusted',
    SET_PRESERVE_LOG_STATE: 'setPreserveLogState',
    GET_USER_RULES_EDITOR_DATA: 'getUserRulesEditorData',
    GET_EDITOR_STORAGE_CONTENT: 'getEditorStorageContent',
    SET_EDITOR_STORAGE_CONTENT: 'setEditorStorageContent',
};

export const NOTIFIER_TYPES = {
    ADD_RULES: 'event.add.rules',
    REMOVE_RULE: 'event.remove.rule',
    UPDATE_FILTER_RULES: 'event.update.filter.rules',
    FILTER_GROUP_ENABLE_DISABLE: 'filter.group.enable.disable', // enabled or disabled filter group
    FILTER_ENABLE_DISABLE: 'event.filter.enable.disable', // Enabled or disabled
    FILTER_ADD_REMOVE: 'event.filter.add.remove', // Added or removed
    ADS_BLOCKED: 'event.ads.blocked',
    START_DOWNLOAD_FILTER: 'event.start.download.filter',
    SUCCESS_DOWNLOAD_FILTER: 'event.success.download.filter',
    ERROR_DOWNLOAD_FILTER: 'event.error.download.filter',
    ENABLE_FILTER_SHOW_POPUP: 'event.enable.filter.show.popup',
    LOG_EVENT: 'event.log.track',
    UPDATE_TAB_BUTTON_STATE: 'event.update.tab.button.state',
    REQUEST_FILTER_UPDATED: 'event.request.filter.updated',
    APPLICATION_INITIALIZED: 'event.application.initialized',
    APPLICATION_UPDATED: 'event.application.updated',
    CHANGE_PREFS: 'event.change.prefs',
    UPDATE_FILTERS_SHOW_POPUP: 'event.update.filters.show.popup',
    USER_FILTER_UPDATED: 'event.user.filter.updated',
    UPDATE_ALLOWLIST_FILTER_RULES: 'event.update.allowlist.filter.rules',
    SETTING_UPDATED: 'event.update.setting.value',
    FILTERS_UPDATE_CHECK_READY: 'event.update.filters.check',
    // Log events
    TAB_ADDED: 'log.tab.added',
    TAB_CLOSE: 'log.tab.close',
    TAB_UPDATE: 'log.tab.update',
    TAB_RESET: 'log.tab.reset',
    LOG_EVENT_ADDED: 'log.event.added',
    // Sync events
    SETTINGS_UPDATED: 'event.sync.finished',
    // Fullscreen user rules events
    FULLSCREEN_USER_RULES_EDITOR_UPDATED: 'event.user.rules.editor.updated',
};

export const FULLSCREEN_USER_RULES_EDITOR = 'fullscreen_user_rules_editor';
export const FILTERING_LOG = 'filtering-log';

export const NAVIGATION_TAGS = {
    REGULAR: 'regular',
    PARTY: 'party',
};

/**
 * Custom filters group display number
 *
 * @type {number}
 */
export const CUSTOM_FILTERS_GROUP_DISPLAY_NUMBER = 99;

/**
 * Custom filters identifiers starts from this number
 *
 * @type {number}
 */
export const CUSTOM_FILTERS_START_ID = 1000;
