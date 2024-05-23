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
import ZipWebpackPlugin from 'zip-webpack-plugin';
import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';

import { genCommonConfig, Mv2ReplacementPlugin } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import {
    BACKGROUND_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
} from '../../../constants';
import { BACKGROUND_PATH, htmlTemplatePluginCommonOptions } from '../common-constants';
import { BrowserConfig, BUILD_ENV } from '../../constants';

import { edgeManifest } from './manifest.edge';

export const genEdgeConfig = (browserConfig: BrowserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

    const DEVTOOLS_PATH = path.resolve(__dirname, '../../../Extension/pages/devtools');

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const edgeConfig: Configuration = {
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                dependOn: [
                    TSURLFILTER_VENDOR_OUTPUT,
                    TSWEBEXTENSION_VENDOR_OUTPUT,
                ],
            },
            'pages/devtools': path.join(DEVTOOLS_PATH, 'devtools.js'),
            'pages/devtools-elements-sidebar': path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.js'),
        },
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins: [
            Mv2ReplacementPlugin,
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../manifest.common.json'),
                        to: 'manifest.json',
                        transform: (content) => updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            content,
                            edgeManifest,
                        ),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/edge',
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
            new HtmlWebpackPlugin({
                template: path.join(DEVTOOLS_PATH, 'devtools.html'),
                filename: 'pages/devtools.html',
                chunks: ['pages/devtools'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.html'),
                filename: 'pages/devtools-elements-sidebar.html',
                chunks: ['pages/devtools-elements-sidebar'],
            }),
            new ZipWebpackPlugin({
                path: '../',
                filename: `${browserConfig.browser}.zip`,
            }),
        ],
    };

    return merge(commonConfig, edgeConfig);
};
