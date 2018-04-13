
export const LOCALES = ['en', 'ru', 'de', 'tr', 'uk', 'pl', 'pt_BR', 'pt_PT', 'ko', 'zh_CN', 'sr-Latn', 'fr', 'sk', 'hy', 'es_419', 'it', 'id', 'nl', 'bg', 'vi', 'hr', 'hu', 'ca', 'zh_TW', 'da', 'sv', 'ms', 'ar', 'ro', 'sr', 'fa', 'ja', 'bg-BG', 'el', 'cs', 'fi', 'mk-MK',  'he'];

export const LAST_ADGUARD_FILTER_ID = 14;

export const BUILD_DIR = 'Build';

export const LOCALES_DIR = './Extension/_locales/';

export const FILTERS_DEST = 'Extension/filters/%b';

export const EXTENSION_FILTERS_SERVER_URL_FORMAT = 'https://filters.adtidy.org/extension/%b';

export const METADATA_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters.json';

export const METADATA_I18N_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters_i18n.json';

export const FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters/%f.txt';

export const OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters/%s_optimized.txt';

export const LOCAL_SCRIPT_RULES_COMMENT = 'By the rules of AMO and addons.opera.com we cannot use remote scripts (and our JS injection rules could be counted as remote scripts).\r\n' +
        'So what we do:\r\n' +
        '1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object (see lib/utils/local-script-rules.js)\r\n' +
        '2. We disable JS rules got from remote server\r\n' +
        '3. We allow only custom rules got from the User filter (which user creates manually) or from this DEFAULT_SCRIPT_RULES object';

export const FIREFOX_EXTENSION_ID = 'adguardadblockerdev@adguard.com';

export const SAFARI_EXTENSION_ID = 'com.adguard.safaridev';

export const SAFARI_UPDATE_URL = '';

export const API_SCRIPTS = [
    // Third party libraries
    'Extension/lib/libs/deferred.min.js',
    'Extension/lib/utils/sha256.patched.js',
    'Extension/lib/utils/punycode.js',
    // Adguard Global and preferences
    'Extension/lib/adguard.js',
    'Extension/browser/webkit/lib/prefs.js',
    // Utils libraries
    'Extension/lib/utils/common.js',
    'Extension/lib/utils/log.js',
    'Extension/lib/utils/url.js',
    'Extension/lib/utils/notifier.js',
    'Extension/lib/utils/browser-utils.js',
    'Extension/lib/utils/service-client.js',
    'Extension/lib/utils/page-stats.js',
    'Extension/lib/utils/user-settings.js',
    'Extension/lib/utils/frames.js',
    // Local storage and rules storage libraries
    'Extension/browser/chrome/lib/utils/local-storage.js',
    'Extension/browser/chrome/lib/utils/rules-storage.js',
    'Extension/lib/storage.js',
    // Chromium api adapter libraries
    'Extension/browser/chrome/lib/content-script/common-script.js',
    'Extension/browser/chrome/lib/api/background-page.js',
    // Tabs api library
    'Extension/browser/chrome/lib/api/tabs.js',
    'Extension/lib/tabs/tabs-api.js',
    // Rules and filters libraries
    'Extension/lib/filter/rules/rules.js',
    'Extension/lib/filter/rules/shortcuts-lookup-table.js',
    'Extension/lib/filter/rules/domains-lookup-table.js',
    'Extension/lib/filter/rules/url-filter-lookup-table.js',
    'Extension/lib/filter/rules/simple-regex.js',
    'Extension/lib/filter/rules/base-filter-rule.js',
    'Extension/lib/filter/rules/css-filter-rule.js',
    'Extension/lib/filter/rules/css-filter.js',
    'Extension/lib/filter/rules/script-filter-rule.js',
    'Extension/lib/filter/rules/script-filter.js',
    'Extension/lib/filter/rules/url-filter-rule.js',
    'Extension/lib/filter/rules/url-filter.js',
    'Extension/lib/filter/rules/content-filter-rule.js',
    'Extension/lib/filter/rules/content-filter.js',
    'Extension/lib/filter/rules/csp-filter.js',
    'Extension/lib/filter/rules/filter-rule-builder.js',
    // Filters metadata and filtration modules
    'Extension/lib/filter/subscription.js',
    'Extension/lib/filter/update-service.js',
    'Extension/lib/filter/whitelist.js',
    'Extension/lib/filter/userrules.js',
    'Extension/lib/filter/filters.js',
    'Extension/lib/filter/antibanner.js',
    'Extension/lib/filter/request-blocking.js',
    // Content messaging
    'Extension/lib/content-message-handler.js',
    'Extension/lib/webrequest.js',
    'Extension/lib/blockpopup.js',
    'Extension/api/chrome/lib/api.js'
];
