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
import { fileURLToPath } from 'node:url';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import { merge } from 'webpack-merge';
import { WebpackPluginInstance } from 'webpack';

import { genMv2CommonConfig } from '../webpack.common-mv2';
import { updateManifestBuffer } from '../../helpers';
import {
    Browser,
    BUILD_ENV,
    BuildTargetEnv,
} from '../../constants';
import { type BrowserConfig } from '../common-constants';
import { megabytesToBytes, SizeLimitPlugin } from '../size-limit-plugin';

import { firefoxManifest, firefoxManifestStandalone } from './manifest.firefox';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const SIZE_LIMITS_MB = {
    // Need to be less than 4 MB, because Firefox Extensions Store has a limit of 4 MB for .js files.
    '.js': megabytesToBytes(4),
};

export const genFirefoxConfig = (browserConfig: BrowserConfig, isWatchMode = false) => {
    const commonConfig = genMv2CommonConfig(browserConfig);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const isDev = BUILD_ENV === BuildTargetEnv.Dev;

    let zipFilename = `${browserConfig.browser}.zip`;
    if (!isDev) {
        zipFilename = 'firefox.zip';
    }

    const plugins: WebpackPluginInstance[] = [
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
        // Check the size of the output JS files and fail the build if any file exceeds the limit
        // but not in the development mode.
        new SizeLimitPlugin(isDev ? {} : SIZE_LIMITS_MB),
    ];

    // Run the archive only if it is not a watch mode
    if (!isWatchMode && plugins) {
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
