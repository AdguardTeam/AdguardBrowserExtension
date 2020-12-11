/**
 * Filter ids used in the code on the background page and filtering log page
 */
export const ANTIBANNER_FILTERS_ID = {
    USER_FILTER_ID: 0,
    RUSSIAN_FILTER_ID: 1,
    ENGLISH_FILTER_ID: 2,
    TRACKING_FILTER_ID: 3,
    SOCIAL_FILTER_ID: 4,
    SEARCH_AND_SELF_PROMO_FILTER_ID: 10,
    ALLOWLIST_FILTER_ID: 100,
    EASY_PRIVACY: 118,
    FANBOY_ANNOYANCES: 122,
    FANBOY_SOCIAL: 123,
    FANBOY_ENHANCED: 215,
    MOBILE_ADS_FILTER_ID: 11,
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
    RESET_BLOCKED_ADS_COUNT: 'resetBlockedAdsCount',
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
    REMOVE_ALLOWLIST_DOMAIN: 'removeAllowlistDomainPopup',
    ADD_ALLOWLIST_DOMAIN_POPUP: 'addAllowlistDomainPopup',
    GET_STATISTICS_DATA: 'getStatisticsData',
    ON_OPEN_FILTERING_LOG_PAGE: 'onOpenFilteringLogPage',
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
    LOAD_SETTINGS_JSON: 'loadSettingsJson',
    ADD_URL_TO_TRUSTED: 'addUrlToTrusted',
};
