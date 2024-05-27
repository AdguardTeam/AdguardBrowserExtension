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

import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';

import { genMv2CommonConfig } from '../webpack.common-mv2';
import {
    CHROMIUM_DEVTOOLS_ENTRIES,
    CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
    genChromiumZipPlugin,
} from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import { BrowserConfig, BUILD_ENV } from '../../constants';
import {
    BACKGROUND_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
} from '../../../constants';
import { BACKGROUND_PATH, htmlTemplatePluginCommonOptions } from '../common-constants';

import { chromeManifest } from './manifest.chrome';

export const genChromeConfig = (browserConfig: BrowserConfig, isWatchMode = false) => {
    const commonConfig = genMv2CommonConfig(browserConfig);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const chromeConfig: Configuration = {
        entry: {
            ...CHROMIUM_DEVTOOLS_ENTRIES,
        },
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../manifest.common.json'),
                        to: 'manifest.json',
                        transform: (content: Buffer) => updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            content,
                            chromeManifest,
                        ),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium',
                        to: 'filters',
                        globOptions: {
                            ignore: ['**/declarative/**'],
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BACKGROUND_PATH, 'index.html'),
                templateParameters: {
                    browser: process.env.BROWSER,
                },
                filename: `${BACKGROUND_OUTPUT}.html`,
                chunks: [
                    TSURLFILTER_VENDOR_OUTPUT,
                    TSWEBEXTENSION_VENDOR_OUTPUT,
                    BACKGROUND_OUTPUT,
                ],
            }),
            ...CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
        ],
    };

    // Run the archive only if it is not a watch mode
    if (!isWatchMode && chromeConfig.plugins) {
        chromeConfig.plugins.push(genChromiumZipPlugin(browserConfig.browser));
    }

    return merge(commonConfig, chromeConfig);
};
