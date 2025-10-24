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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';
import { type Configuration } from 'webpack';

import { RulesetsInjector } from '@adguard/dnr-rulesets';

import { genMv3CommonConfig } from '../webpack.common.mv3';
import { CHROMIUM_DEVTOOLS_ENTRIES, CHROMIUM_DEVTOOLS_PAGES_PLUGINS } from '../webpack.common';
import { updateManifestBuffer } from '../../helpers';
import {
    AssetsFiltersBrowser,
    BUILD_ENV,
    FILTERS_DEST,
} from '../../constants';
import { type BrowserConfig } from '../common-constants';
import { GPC_SCRIPT_OUTPUT, HIDE_DOCUMENT_REFERRER_OUTPUT } from '../../../constants';
import { commonManifest } from '../manifest.common';

import { chromeMv3Manifest } from './manifest.chrome.mv3';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

export const RULESET_NAME_PREFIX = 'ruleset_';

const GPC_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/gpc');
const HIDE_DOCUMENT_REFERRER_SCRIPT_PATH = path.resolve(__dirname, '../../../Extension/pages/hide-document-referrer');

/**
 * Base filter id - it is the main filter that is enabled by default.
 */
const BASE_FILTER_ID = '2';

const rulesetsInjector = new RulesetsInjector();

export const genChromeMv3Config = (browserConfig: BrowserConfig, isWatchMode: boolean) => {
    const commonConfig = genMv3CommonConfig(browserConfig, isWatchMode);

    if (!commonConfig?.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    const transformManifest = (content: Buffer) => {
        const filters = fs
            .readdirSync(
                FILTERS_DEST.replace(
                    '%browser',
                    path.join(AssetsFiltersBrowser.ChromiumMv3, '/declarative'),
                ),
            )
            .filter((filter) => filter.match(/ruleset_\d+/));

        return updateManifestBuffer(
            BUILD_ENV,
            browserConfig.browser,
            content,
            rulesetsInjector.applyRulesets(
                (id: string) => `filters/declarative/${id}/${id}.json`,
                chromeMv3Manifest,
                filters,
                {
                    forceUpdate: true,
                    enable: [BASE_FILTER_ID],
                    rulesetPrefix: RULESET_NAME_PREFIX,
                },
            ),
        );
    };

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
                        /**
                         * This is a dummy import to keep "clean" usage of
                         * `CopyWebpackPlugin`. We actually use `commonManifest`
                         * imported above.
                         */
                        from: path.resolve(__dirname, '../manifest.common.ts'),
                        to: 'manifest.json',
                        transform: () => {
                            return transformManifest(Buffer.from(JSON.stringify(commonManifest)));
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

    return merge(commonConfig, chromeMv3Config);
};
