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

import { BROWSERS } from '../constants';
import { genChromeConfig } from './chrome/webpack.chrome';
import { genFirefoxConfig } from './firefox/webpack.firefox';
import { genEdgeConfig } from './edge/webpack.edge';
import { genOperaConfig } from './opera/webpack.opera';
import { getBrowserConf } from '../helpers';

export const getWebpackConfig = (browser, isWatchMode = false) => {
    const browserConf = getBrowserConf(browser);

    switch (browser) {
        case BROWSERS.CHROME: {
            return genChromeConfig(browserConf, isWatchMode);
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
        default: {
            throw new Error(`Unknown browser: "${browser}"`);
        }
    }
};
