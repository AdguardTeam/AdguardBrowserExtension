import { EXTENSION_FILTERS_SERVER_URL_FORMAT } from '../tasks/consts';

export const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

export const ENV_CONF = {
    [ENVS.DEV]: { outputPath: 'dev', suffix: 'Dev', mode: 'development' },
    [ENVS.BETA]: { outputPath: 'beta', suffix: 'Beta', mode: 'production' },
    [ENVS.RELEASE]: { outputPath: 'release', suffix: '', mode: 'production' },
};

export const CHROME_BUILD_DIR = 'chrome';
export const FIREFOX_BUILD_DIR = 'firefox';

// TODO add opera and edge
export const BROWSERS = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
};

// filters constants
export const METADATA_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters.json`;
export const FILTERS_DEST = 'Extension/filters/%browser';
export const METADATA_I18N_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters_i18n.js`;
export const LAST_ADGUARD_FILTER_ID = 14;
export const FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%filter.txt`;
export const OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%s_optimized.txt`;
