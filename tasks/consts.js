
export const LOCALES = ['en', 'ru', 'de', 'tr', 'uk', 'pl', 'pt_BR', 'pt_PT', 'ko', 'zh_CN', 'sr-Latn', 'fr', 'sk', 'hy', 'es_419', 'it', 'id', 'nl', 'bg', 'vi', 'hr', 'hu', 'ca', 'zh_TW', 'da', 'sv', 'ms', 'ar', 'ro', 'sr', 'fa', 'ja', 'bg-BG', 'el', 'cs', 'fi', 'mk-MK',  'he'];

export const LAST_ADGUARD_FILTER_ID = 14;

export const BUILD_DIR = 'Build';

export const LOCALES_DIR = './Extension/_locales/';

export const FILTERS_DEST = 'Extension/filters/%browser';

export const PRIVATE_FILES = 'private/AdguardBrowserExtension';

export const SAFARI_CERTS_PRIVATE_FILES = PRIVATE_FILES + '/safari_certs';

export const EXTENSION_FILTERS_SERVER_URL_FORMAT = 'https://filters.adtidy.org/extension/%browser';

export const METADATA_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters.json';

export const METADATA_I18N_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters_i18n.json';

export const FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters/%filter.txt';

export const OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = EXTENSION_FILTERS_SERVER_URL_FORMAT + '/filters/%s_optimized.txt';

export const LOCAL_SCRIPT_RULES_COMMENT = 'By the rules of AMO and addons.opera.com we cannot use remote scripts (and our JS injection rules could be counted as remote scripts).\r\n' +
        'So what we do:\r\n' +
        '1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object (see lib/utils/local-script-rules.js)\r\n' +
        '2. We disable JS rules got from remote server\r\n' +
        '3. We allow only custom rules got from the User filter (which user creates manually) or from this DEFAULT_SCRIPT_RULES object';

// Firefox extension IDs
export const FIREFOX_EXTENSION_ID_DEV = 'adguardadblockerdev@adguard.com';
export const FIREFOX_EXTENSION_ID_BETA = 'adguardadblockerbeta@adguard.com';
export const FIREFOX_EXTENSION_ID_RELEASE = 'adguardadblocker@adguard.com';
export const FIREFOX_LEGACY_ID_BETA = 'adguardadblockerlegacy@adguard.com';

// Update urls
export const CHROME_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/chrome_updates.xml';
export const FIREFOX_LEGACY_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/firefox_updates.rdf';
export const FIREFOX_WEBEXT_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/firefox_updates.json';
export const SAFARI_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/safari_updates.xml';

// Safari extension IDs
export const SAFARI_EXTENSION_ID_DEV = 'com.adguard.safaridev';
export const SAFARI_EXTENSION_ID_BETA = 'com.adguard.safaribeta';
export const SAFARI_EXTENSION_ID_RELEASE = 'com.adguard.safari';

export const FIREFOX_LEGACY = 'FIREFOX_LEGACY';

export const FIREFOX_WEBEXT = 'FIREFOX_WEBEXT';

export const BRANCH_DEV = 'dev';

export const BRANCH_BETA = 'beta';

export const BRANCH_RELEASE = 'release';

// URL for reserved domains
export const PUBLIC_SUFFIXES_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';
export const PUBLIC_SUFFIXES_FILE = './resources/public_suffix_list.dat';