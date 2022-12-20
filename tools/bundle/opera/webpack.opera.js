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

import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';

import { genCommonConfig } from '../webpack.common';
import { operaManifest } from './manifest.opera';
import { updateManifestBuffer } from '../../helpers';

export const genOperaConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

    const DEVTOOLS_PATH = path.resolve(__dirname, '../../../Extension/pages/devtools');

    const operaConfig = {
        entry: {
            'pages/devtools': path.join(DEVTOOLS_PATH, 'devtools.js'),
            'pages/devtools-elements-sidebar': path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.js'),
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
                        transform: (content) => updateManifestBuffer(process.env.BUILD_ENV, content, operaManifest),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/opera',
                        to: 'filters',
                    },
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

    return merge(commonConfig, operaConfig);
};
