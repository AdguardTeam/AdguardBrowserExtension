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
import ZipWebpackPlugin from 'zip-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';

import { genCommonConfig } from '../webpack.common';
import { firefoxManifest } from './manifest.firefox';
import { updateManifestBuffer } from '../../helpers';
import { ENVS } from '../../constants';

export const genFirefoxConfig = (browserConfig, isWatchMode = false) => {
    const commonConfig = genCommonConfig(browserConfig);

    let zipFilename = `${browserConfig.browser}.zip`;

    if (process.env.BUILD_ENV === ENVS.BETA
        || process.env.BUILD_ENV === ENVS.RELEASE) {
        zipFilename = 'firefox.zip';
    }

    const plugins = [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../manifest.common.json'),
                    to: 'manifest.json',
                    transform: (content) => updateManifestBuffer(process.env.BUILD_ENV, content, firefoxManifest),
                },
                {
                    context: 'Extension',
                    from: 'filters/firefox',
                    to: 'filters',
                },
            ],
        }),
    ];

    // Run the archive only if it is not a watch mode
    if (!isWatchMode) {
        plugins.push(new ZipWebpackPlugin({
            path: '../',
            filename: zipFilename,
        }));
    }

    const firefoxConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, firefoxConfig);
};
