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

import { type RspackPluginInstance, CopyRspackPlugin } from '@rspack/core';
import { merge } from 'webpack-merge';

// eslint-disable-next-line no-restricted-imports
import { genMv2CommonConfig } from '../rspack.common.mv2';
import { updateManifestBuffer } from '../../helpers';
import { Browser, BUILD_ENV } from '../../constants';
import { type BrowserConfig, type BuildOptions } from '../common-constants';
import { commonManifest } from '../manifest.common';

import { firefoxManifest, firefoxManifestStandalone } from './manifest.firefox';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

export const genFirefoxConfig = (browserConfig: BrowserConfig, options: BuildOptions = {}) => {
    const commonConfig = genMv2CommonConfig(browserConfig, options);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const plugins: RspackPluginInstance[] = [
        new CopyRspackPlugin({
            patterns: [
                {
                    /**
                     * This is a dummy import to keep "clean" usage of
                     * `CopyRspackPlugin`. We actually use `commonManifest`
                     * imported above.
                     */
                    from: path.resolve(__dirname, '../manifest.common.ts'),
                    to: 'manifest.json',
                    transform: () => {
                        const commonManifestContent = Buffer.from(JSON.stringify(commonManifest));

                        const firefoxManifestContent = updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            commonManifestContent,
                            firefoxManifest,
                        );

                        if (browserConfig.browser === Browser.FirefoxStandalone) {
                            return updateManifestBuffer(
                                BUILD_ENV,
                                browserConfig.browser,
                                firefoxManifestContent, // target part
                                firefoxManifestStandalone, // added part
                            );
                        }

                        return firefoxManifestContent;
                    },
                },
                {
                    context: 'Extension',
                    from: 'filters/firefox',
                    to: 'filters',
                },
            ],
        }),
    ];

    const firefoxConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, firefoxConfig);
};
