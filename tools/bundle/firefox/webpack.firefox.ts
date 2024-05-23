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
import ZipWebpackPlugin from 'zip-webpack-plugin';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { WebpackPluginInstance } from 'webpack';

import { genCommonConfig, Mv2ReplacementPlugin } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import {
    Browser,
    BrowserConfig,
    BUILD_ENV,
    BuildTargetEnv,
} from '../../constants';
import {
    BACKGROUND_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
} from '../../../constants';
import { BACKGROUND_PATH, htmlTemplatePluginCommonOptions } from '../common-constants';

import { firefoxManifest, firefoxManifestStandalone } from './manifest.firefox';

export const genFirefoxConfig = (browserConfig: BrowserConfig, isWatchMode = false) => {
    const commonConfig = genCommonConfig(browserConfig);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    let zipFilename = `${browserConfig.browser}.zip`;
    if (BUILD_ENV === BuildTargetEnv.Beta
        || BUILD_ENV === BuildTargetEnv.Release) {
        zipFilename = 'firefox.zip';
    }

    const plugins: WebpackPluginInstance[] = [
        Mv2ReplacementPlugin,
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../manifest.common.json'),
                    to: 'manifest.json',
                    transform: (content) => {
                        content = updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            content,
                            firefoxManifest,
                        );
                        if (browserConfig.browser === Browser.FirefoxStandalone) {
                            content = updateManifestBuffer(
                                BUILD_ENV,
                                browserConfig.browser,
                                content,
                                firefoxManifestStandalone,
                            );
                        }
                        return content;
                    },
                },
                {
                    context: 'Extension',
                    from: 'filters/firefox',
                    to: 'filters',
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
    ];

    // Run the archive only if it is not a watch mode
    if (!isWatchMode && plugins) {
        plugins.push(new ZipWebpackPlugin({
            path: '../',
            filename: zipFilename,
        }));
    }

    const firefoxConfig = {
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                dependOn: [
                    TSURLFILTER_VENDOR_OUTPUT,
                    TSWEBEXTENSION_VENDOR_OUTPUT,
                ],
            },
        },
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, firefoxConfig);
};
