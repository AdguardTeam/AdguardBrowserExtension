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

import path from 'path';

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import { BROWSERS } from '../constants';
import { getBrowserConf } from '../helpers';

import { genChromeConfig } from './chrome/webpack.chrome';
import { genFirefoxConfig } from './firefox/webpack.firefox';
import { genEdgeConfig } from './edge/webpack.edge';
import { genOperaConfig } from './opera/webpack.opera';

const ANALYZE_REPORTS_DIR = '../../analyze-reports';

export const getWebpackConfig = (browser, isWatchMode = false) => {
    const browserConf = getBrowserConf(browser);

    let webpackConfig;

    switch (browser) {
        case BROWSERS.CHROME: {
            webpackConfig = genChromeConfig(browserConf, isWatchMode);
            break;
        }
        case BROWSERS.FIREFOX_STANDALONE:
        case BROWSERS.FIREFOX_AMO: {
            webpackConfig = genFirefoxConfig(browserConf);
            break;
        }
        case BROWSERS.OPERA: {
            webpackConfig = genOperaConfig(browserConf);
            break;
        }
        case BROWSERS.EDGE: {
            webpackConfig = genEdgeConfig(browserConf);
            break;
        }
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }

    if (process.env.ANALYZE === 'true') {
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
