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

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import { Browser } from '../constants';

import { genChromeConfig } from './chrome/webpack.chrome';
import { genFirefoxConfig } from './firefox/webpack.firefox';
import { genEdgeConfig } from './edge/webpack.edge';
import { genOperaConfig } from './opera/webpack.opera';
import { genChromeMv3Config } from './chrome-mv3/webpack.chrome.mv3';
import { getBrowserConf } from './helpers';

const ANALYZE_REPORTS_DIR = '../../analyze-reports';

export const getWebpackConfig = (browser: Browser, isWatchMode = false) => {
    const browserConf = getBrowserConf(browser);

    let webpackConfig;

    switch (browser) {
        case Browser.Chrome: {
            webpackConfig = genChromeConfig(browserConf, isWatchMode);
            break;
        }
        case Browser.ChromeMv3: {
            webpackConfig = genChromeMv3Config(browserConf, isWatchMode);
            break;
        }
        case Browser.FirefoxStandalone:
        case Browser.FirefoxAmo: {
            webpackConfig = genFirefoxConfig(browserConf);
            break;
        }
        case Browser.Opera: {
            webpackConfig = genOperaConfig(browserConf);
            break;
        }
        case Browser.Edge: {
            webpackConfig = genEdgeConfig(browserConf);
            break;
        }
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }

    if (process.env.ANALYZE === 'true' && webpackConfig.plugins) {
        const reportFilename = process.env.BUILD_ENV
            ? path.join(ANALYZE_REPORTS_DIR, `${browser}-${process.env.BUILD_ENV}.html`)
            : path.join(ANALYZE_REPORTS_DIR, `${browser}.html`);

        webpackConfig.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename,
            openAnalyzer: true,
        }));
    }

    return webpackConfig;
};
