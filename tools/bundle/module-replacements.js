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

/* eslint-disable no-console */
import { NormalModuleReplacementPlugin } from 'webpack';
import { BROWSERS } from '../constants';

/**
 * Returns module replacement plugins
 * Yes, this way is looking ugly. If you know better way to build with different implementation
 * please feel free to fix
 *
 * @param browserConfig
 */
export const getModuleReplacements = (browserConfig) => {
    const apiRegexp = /(\.\/.*)__ABSTRACT_API__(\.*)/;
    const browsersRegexp = /(\.\/.*)__ABSTRACT_BROWSERS__(\.*)/;

    const apiModuleReplacement = new NormalModuleReplacementPlugin(apiRegexp, (resource) => {
        const from = resource.request;
        if (browserConfig.browser === BROWSERS.ADGUARD_API) {
            resource.request = resource.request.replace(apiRegexp, '$1adguard-api$2');
        } else {
            resource.request = resource.request.replace(apiRegexp, '$1browsers$2');
        }
        const to = resource.request;
        console.info(`resource.request was replaced from: "${from}" to: "${to}"`);
    });

    const browserModuleReplacement = new NormalModuleReplacementPlugin(browsersRegexp, (resource) => {
        const from = resource.request;
        if (browserConfig.browser === BROWSERS.FIREFOX_STANDALONE
                || browserConfig.browser === BROWSERS.FIREFOX_AMO) {
            resource.request = resource.request.replace(browsersRegexp, '$1firefox$2');
        } else {
            resource.request = resource.request.replace(browsersRegexp, '$1chrome$2');
        }
        const to = resource.request;
        console.info(`resource.request was replaced from: "${from}" to: "${to}"`);
    });

    return [apiModuleReplacement, browserModuleReplacement];
};
