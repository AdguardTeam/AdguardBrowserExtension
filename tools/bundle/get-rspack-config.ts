/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import path from 'node:path';

// rspack supports webpack bundle analyzer
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import {
    ANALYZE_REPORTS_DIR,
    Browser,
    BUILD_ENV,
} from '../constants';

import { type BuildOptions } from './common-constants';
import { genChromeConfig } from './chrome/rspack.chrome';
import { genFirefoxConfig } from './firefox/rspack.firefox';
import { genEdgeConfig } from './edge/rspack.edge';
import { genOperaConfig } from './opera/rspack.opera';
// eslint-disable-next-line no-restricted-imports
import { genChromeMv3Config } from './chrome-mv3/rspack.chrome.mv3';
import { getBrowserConf } from './helpers';

export const getRspackConfig = (browser: Browser, options: BuildOptions = {}) => {
    const browserConf = getBrowserConf(browser);

    let rspackConfig;

    switch (browser) {
        case Browser.Chrome: {
            rspackConfig = genChromeConfig(browserConf, options);
            break;
        }
        case Browser.ChromeMv3: {
            rspackConfig = genChromeMv3Config(browserConf, options);
            break;
        }
        case Browser.FirefoxStandalone:
        case Browser.FirefoxAmo: {
            rspackConfig = genFirefoxConfig(browserConf, options);
            break;
        }
        case Browser.Opera: {
            rspackConfig = genOperaConfig(browserConf, options);
            break;
        }
        case Browser.Edge: {
            rspackConfig = genEdgeConfig(browserConf, options);
            break;
        }
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }

    if (process.env.ANALYZE === 'true' && rspackConfig.plugins) {
        const reportFilename = BUILD_ENV
            ? path.join(ANALYZE_REPORTS_DIR, `${browser}-${BUILD_ENV}.html`)
            : path.join(ANALYZE_REPORTS_DIR, `${browser}.html`);

        rspackConfig.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename,
            openAnalyzer: true,
        }));
    }

    return rspackConfig;
};
