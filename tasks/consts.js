export const LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'ja', 'hu', 'pl', 'da', 'uk', 'ar', 'sv', 'fa', 'it', 'pt_BR', 'pt_PT', 'id', 'sk', 'tr', 'cs', 'nl', 'zh_CN', 'zh_TW', 'hr', 'sr-Latn', 'ms', 'vi', 'hy', 'ro', 'ko', 'bg', 'ca', 'sl', 'be', 'nb', 'bg-BG', 'el', 'fi', 'mk-MK', 'he'];

export const LAST_ADGUARD_FILTER_ID = 14;

export const BUILD_DIR = 'Build';

export const LOCALES_DIR = './Extension/_locales/';

export const FILTERS_DEST = 'Extension/filters/%browser';

export const PRIVATE_FILES = 'private/AdguardBrowserExtension';

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

// Update urls
export const CHROME_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/chrome_updates.xml';
export const FIREFOX_WEBEXT_UPDATE_URL = 'https://adguardteam.github.io/AdguardBrowserExtension/firefox_updates.json';

export const FIREFOX_WEBEXT = 'FIREFOX_WEBEXT';

export const BRANCH_DEV = 'dev';

export const BRANCH_BETA = 'beta';

export const BRANCH_RELEASE = 'release';

// URL for reserved domains
export const PUBLIC_SUFFIXES_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';
export const PUBLIC_SUFFIXES_FILE = '../Extension/lib/utils/public-suffixes.js';
