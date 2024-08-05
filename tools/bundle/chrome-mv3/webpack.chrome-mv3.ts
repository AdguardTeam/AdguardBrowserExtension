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
import fs from 'fs';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';
import type { Manifest } from 'webextension-polyfill';
import type { Configuration } from 'webpack';

import { genMv3CommonConfig } from '../webpack.common-mv3';
import { CHROMIUM_DEVTOOLS_ENTRIES, CHROMIUM_DEVTOOLS_PAGES_PLUGINS } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import { BUILD_ENV, FILTERS_DEST } from '../../constants';
import { type BrowserConfig } from '../common-constants';
import { GPC_SCRIPT_OUTPUT, HIDE_DOCUMENT_REFERRER_OUTPUT } from '../../../constants';

import { chromeMv3Manifest } from './manifest.chrome-mv3';

type WebExtensionManifest = Manifest.WebExtensionManifest;

export const RULESET_NAME_PREFIX = 'ruleset_';

const GPC_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/gpc');
const HIDE_DOCUMENT_REFERRER_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/hide-document-referrer');

/**
 * Base filter id - it is the main filter that is enabled by default.
 */
const BASE_FILTER_ID = 2;

const addDeclarativeNetRequest = (manifest: Partial<WebExtensionManifest>) => {
    const filtersDir = FILTERS_DEST.replace('%browser', 'chromium-mv3');

    const filtersDirPath = path.resolve(__dirname, '../../../', filtersDir, 'declarative/');

    if (fs.existsSync(filtersDir)) {
        const nameList = fs.readdirSync(filtersDirPath);
        const rules = {
            rule_resources: nameList.map((name) => {
                const nameMatch = name.match(/\d+/);
                if (!nameMatch) {
                    throw new Error(`Invalid ruleset name: ${name}`);
                }

                const rulesetIndex = Number.parseInt(nameMatch[0], 10);
                const id = `${RULESET_NAME_PREFIX}${rulesetIndex}`;
                return {
                    id,
                    // By default, we set the base filter enabled,
                    // so that the browser tries to enable it if we are over limits
                    enabled: rulesetIndex === BASE_FILTER_ID,
                    path: `filters/declarative/${name}/${name}.json`,
                };
            }),
        };

        return {
            ...manifest,
            declarative_net_request: rules,
        };
    }

    throw new Error("Declarative rulesets directory doesn't exist");
};

export const genChromeMv3Config = (browserConfig: BrowserConfig, isWatchMode: boolean) => {
    const commonConfig = genMv3CommonConfig(browserConfig, isWatchMode);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const chromeMv3Config: Configuration = {
        devtool: BUILD_ENV === 'dev' ? 'inline-source-map' : false,
        entry: {
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
                        transform: (content) => updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            content,
                            addDeclarativeNetRequest(chromeMv3Manifest),
                        ),
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

    return merge(commonConfig, chromeMv3Config);
};
