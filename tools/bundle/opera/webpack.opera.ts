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
import { merge } from 'webpack-merge';

import { genMv2CommonConfig } from '../webpack.common-mv2';
import { CHROMIUM_DEVTOOLS_ENTRIES, CHROMIUM_DEVTOOLS_PAGES_PLUGINS } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import { type BrowserConfig } from '../common-constants';
import { BUILD_ENV } from '../../constants';
import { commonManifest } from '../manifest.common';

import { operaManifest } from './manifest.opera';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

export const genOperaConfig = (browserConfig: BrowserConfig) => {
    const commonConfig = genMv2CommonConfig(browserConfig);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const operaConfig = {
        entry: CHROMIUM_DEVTOOLS_ENTRIES,
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        /**
                         * This is a dummy import to keep "clean" usage of
                         * `CopyWebpackPlugin`. We actually use `commonManifest`
                         * imported above.
                         */
                        from: path.resolve(__dirname, '../manifest.common.ts'),
                        to: 'manifest.json',
                        transform: () => updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            Buffer.from(JSON.stringify(commonManifest)),
                            operaManifest,
                        ),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/opera',
                        to: 'filters',
                    },
                ],
            }),
            ...CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
        ],
    };

    return merge(commonConfig, operaConfig);
};
