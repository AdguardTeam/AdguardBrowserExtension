/* eslint-disable max-len */
import path from 'path';

export const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

export const ENV_CONF = {
    [ENVS.DEV]: { outputPath: 'dev', mode: 'development' },
    [ENVS.BETA]: { outputPath: 'beta', mode: 'production' },
    [ENVS.RELEASE]: { outputPath: 'release', mode: 'production' },
};

export const BROWSERS = {
    CHROME: 'chrome',
    FIREFOX_AMO: 'firefox-amo',
    FIREFOX_STANDALONE: 'firefox-standalone',
    OPERA: 'opera',
    EDGE: 'edge',
};

export const BROWSERS_CONF = {
    [BROWSERS.CHROME]: {
        browser: BROWSERS.CHROME,
        remoteScripts: true,
        buildDir: BROWSERS.CHROME,
    },
    [BROWSERS.FIREFOX_STANDALONE]: {
        browser: BROWSERS.FIREFOX_STANDALONE,
        remoteScripts: true,
        buildDir: BROWSERS.FIREFOX_STANDALONE,
    },
    [BROWSERS.FIREFOX_AMO]: {
        browser: BROWSERS.FIREFOX_AMO,
        remoteScripts: false,
        buildDir: BROWSERS.FIREFOX_AMO,
    },
    [BROWSERS.OPERA]: {
        browser: BROWSERS.OPERA,
        remoteScripts: false,
        buildDir: BROWSERS.OPERA,
    },
    [BROWSERS.EDGE]: {
        browser: BROWSERS.EDGE,
        remoteScripts: true,
        buildDir: BROWSERS.EDGE,
    },
};

export const FIREFOX_APP_IDS_MAP = {
    [ENVS.DEV]: 'adguardadblockerdev-maximtop@adguard.com',
    [ENVS.BETA]: 'adguardadblockerbeta-maximtop@adguard.com',
    [ENVS.RELEASE]: 'adguardadblocker-maximtop@adguard.com',
};

export const BUILD_PATH = path.resolve(__dirname, '../build');

// filters constants
export const EXTENSION_FILTERS_SERVER_URL_FORMAT = 'https://filters.adtidy.org/extension/%browser';
export const METADATA_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters.json`;
export const FILTERS_DEST = 'Extension/filters/%browser';
export const METADATA_I18N_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters_i18n.js`;
export const LAST_ADGUARD_FILTER_ID = 14;
export const FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%filter.txt`;
export const OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%s_optimized.txt`;
export const LOCAL_SCRIPT_RULES_COMMENT = `By the rules of AMO and addons.opera.com we cannot use remote scripts (and our JS injection rules could be counted as remote scripts).
So what we do:
    1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object (see lib/filter/rules/local-script-rules.js)
    2. We disable JS rules got from remote server
    3. We allow only custom rules got from the User filter (which user creates manually) or from this DEFAULT_SCRIPT_RULES object`;

// public suffixes list constants
export const PUBLIC_SUFFIXES_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';
export const PUBLIC_SUFFIXES_FILE = '../../Extension/lib/utils/public-suffixes.js';

// locales constants
const LOCALES_BASE_URL = 'https://twosky.adtidy.org/api/v1';
export const LOCALES_DOWNLOAD_URL = `${LOCALES_BASE_URL}/download`;
export const LOCALES_UPLOAD_URL = `${LOCALES_BASE_URL}/upload`;
export const LOCALES_DIR = path.resolve(__dirname, '../Extension/_locales/');

// artifacts constants
export const CHROME_UPDATE_URL = 'https://static.adguard.com/extensions/adguardadblocker/beta/update.xml';
export const CHROME_CERT = path.resolve(__dirname, '../private/AdguardBrowserExtension/certificate.pem');
export const CHROME_CODEBASE_URL = 'https://static.adguard.com/extensions/adguardadblocker/beta/chrome.crx';
export const FIREFOX_CREDENTIALS = path.resolve(__dirname, '../private/AdguardBrowserExtension/mozilla_credentials.json');
export const FIREFOX_UPDATE_TEMPLATE = path.resolve(__dirname, './bundle/firefox/update_template.json');
export const FIREFOX_WEBEXT_UPDATE_URL = 'https://static.adguard.com/extensions/adguardadblocker/beta/update.json';
