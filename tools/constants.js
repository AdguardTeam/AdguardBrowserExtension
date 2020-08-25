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
