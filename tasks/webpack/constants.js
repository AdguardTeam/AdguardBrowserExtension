const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

const ENV_CONF = {
    [ENVS.DEV]: { outputPath: 'dev', suffix: 'Dev', mode: 'development' },
    [ENVS.BETA]: { outputPath: 'beta', suffix: 'Beta', mode: 'production' },
    [ENVS.RELEASE]: { outputPath: 'release', suffix: '', mode: 'production' },
};

const CHROME_BUILD_DIR = 'chrome';
const FIREFOX_BUILD_DIR = 'firefox';

module.exports = {
    ENVS,
    ENV_CONF,
    CHROME_BUILD_DIR,
    FIREFOX_BUILD_DIR,
};
