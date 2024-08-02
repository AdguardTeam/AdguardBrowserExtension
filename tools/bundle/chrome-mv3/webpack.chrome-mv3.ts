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
import { merge } from 'webpack-merge';
import type { Configuration } from 'webpack';

import { addDeclarativeNetRequestToManifest } from '@adguard/dnr-rulesets';

import { genMv3CommonConfig } from '../webpack.common-mv3';
import {
    CHROMIUM_DEVTOOLS_ENTRIES,
    CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
    genChromiumZipPlugin,
} from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import { BUILD_ENV, FILTERS_DEST } from '../../constants';
import { BACKGROUND_PATH, type BrowserConfig } from '../common-constants';
import {
    BACKGROUND_OUTPUT,
    GPC_SCRIPT_OUTPUT,
    HIDE_DOCUMENT_REFERRER_OUTPUT,
} from '../../../constants';

import { chromeMv3Manifest } from './manifest.chrome-mv3';

export const RULESET_NAME_PREFIX = 'ruleset_';

const GPC_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/gpc');
const HIDE_DOCUMENT_REFERRER_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/hide-document-referrer');

/**
 * Base filter id - it is the main filter that is enabled by default.
 */
const BASE_FILTER_ID = '2';

export const genChromeMv3Config = (browserConfig: BrowserConfig, isWatchMode = false) => {
    const commonConfig = genMv3CommonConfig(browserConfig);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const chromeConfig: Configuration = {
        devtool: BUILD_ENV === 'dev' ? 'inline-source-map' : false,
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                runtime: false,
            },
            [GPC_SCRIPT_OUTPUT]: {
                import: GPC_SCRIPT_PATH,
                runtime: false,
            },
            [HIDE_DOCUMENT_REFERRER_OUTPUT]: {
                import: HIDE_DOCUMENT_REFERRER_SCRIPT_PATH,
                runtime: false,
            },
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
                        transform: (content) => {
                            const filtersDir = FILTERS_DEST.replace('%browser', 'chromium-mv3');

                            return updateManifestBuffer(
                                BUILD_ENV,
                                browserConfig.browser,
                                content,
                                addDeclarativeNetRequestToManifest(
                                    chromeMv3Manifest,
                                    path.resolve(__dirname, '../../../', filtersDir, 'declarative/'),
                                    (ruleSetName) => `filters/declarative/${ruleSetName}/${ruleSetName}.json`,
                                    {
                                        forceUpdate: true,
                                        enabled: [BASE_FILTER_ID],
                                    },
                                ),
                            );
                        },
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium-mv3',
                        to: 'filters',
                    },
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
