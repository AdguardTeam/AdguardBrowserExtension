import { BROWSERS } from '../constants';
import { genChromeConfig } from './chrome/webpack.chrome';
import { genFirefoxConfig } from './firefox/webpack.firefox';
import { genEdgeConfig } from './edge/webpack.edge';
import { genOperaConfig } from './opera/webpack.opera';
import { genSampleApiConfig } from './adguard-api/webpack.adguard-api';
import { getBrowserConf } from '../helpers';

export const getWebpackConfig = (browser) => {
    const browserConf = getBrowserConf(browser);

    switch (browser) {
        case BROWSERS.CHROME: {
            return genChromeConfig(browserConf);
        }
        case BROWSERS.FIREFOX_STANDALONE:
        case BROWSERS.FIREFOX_AMO: {
            return genFirefoxConfig(browserConf);
        }
        case BROWSERS.OPERA: {
            return genOperaConfig(browserConf);
        }
        case BROWSERS.EDGE: {
            return genEdgeConfig(browserConf);
        }
        case BROWSERS.ADGUARD_API: {
            return genSampleApiConfig(browserConf);
        }
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }
};
