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
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';
import { Manifest } from 'webextension-polyfill';
import { Configuration } from 'webpack';

import { genCommonConfig, Mv3ReplacementPlugin } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import {
    BrowserConfig,
    BUILD_ENV,
    FILTERS_DEST,
} from '../../constants';
import { BACKGROUND_PATH } from '../common-constants';
import { BACKGROUND_OUTPUT } from '../../../constants';

import { chromeMv3Manifest } from './manifest.chrome-mv3';

import WebExtensionManifest = Manifest.WebExtensionManifest;

export const RULESET_NAME_PREFIX = 'ruleset_';

const addDeclarativeNetRequest = (manifest: Partial<WebExtensionManifest>) => {
    const filtersDir = FILTERS_DEST.replace('%browser', 'chromium');

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
                    enabled: false,
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

export const genChromeMv3Config = (browserConfig: BrowserConfig, isWatchMode = false) => {
    const commonConfig = genCommonConfig(browserConfig);

    const DEVTOOLS_PATH = path.resolve(__dirname, '../../../Extension/pages/devtools');

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
                        transform: (content) => updateManifestBuffer(
                            BUILD_ENV,
                            browserConfig.browser,
                            content,
                            addDeclarativeNetRequest(chromeMv3Manifest),
                        ),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium',
                        to: 'filters',
                        globOptions: {
                            // optimized filters are not used in the mv3 build
                            ignore: ['**/*_mobile_*.txt'],
                        },
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
            Mv3ReplacementPlugin,
        ],
    };

    // Run the archive only if it is not a watch mode
    if (!isWatchMode && chromeConfig.plugins) {
        chromeConfig.plugins.push(new ZipWebpackPlugin({
            path: '../',
            filename: `${browserConfig.browser}.zip`,
        }));
    }

    return merge(commonConfig, chromeConfig);
};
