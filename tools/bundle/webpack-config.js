import { BROWSERS, BROWSERS_CONF } from '../constants';
import { genChromeConfig } from './chrome/webpack.chrome';
import { genFirefoxConfig } from './firefox/webpack.firefox';

export const webpackConfig = (browser) => {
    const browserConf = BROWSERS_CONF[browser];
    if (!browserConf) {
        throw new Error(`There is no config for browser: "${browser}"`);
    }
    switch (browser) {
        case BROWSERS.CHROME: {
            return genChromeConfig(browserConf);
        }
        case BROWSERS.FIREFOX_STANDALONE:
        case BROWSERS.FIREFOX_AMO: {
            return genFirefoxConfig(browserConf);
        }
        // case BROWSERS.OPERA: {
        //     return genOperaConfig(browserConf);
        // }
        // case BROWSERS.EDGE: {
        //     return genEdgeConfig(browserConf);
        // }
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }
};
