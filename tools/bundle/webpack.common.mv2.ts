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

import type { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';

import {
    BACKGROUND_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    BLOCKING_BLOCKED_OUTPUT,
    BLOCKING_SAFEBROWSING_OUTPUT,
    INDEX_HTML_FILE_NAME,
} from '../../constants';

import {
    BACKGROUND_PATH,
    BLOCKING_BLOCKED_PATH,
    BLOCKING_SAFEBROWSING_PATH,
    CONTENT_SCRIPT_START_PATH,
    htmlTemplatePluginCommonOptions,
    type BrowserConfig,
} from './common-constants';
import { ENTRY_POINTS_CHUNKS, genCommonConfig } from './webpack.common';

export const genMv2CommonConfig = (browserConfig: BrowserConfig, isWatchMode = false): Configuration => {
    const commonConfig = genCommonConfig(browserConfig, isWatchMode);

    return merge(commonConfig, {
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                dependOn: ENTRY_POINTS_CHUNKS[BACKGROUND_OUTPUT],
            },
            [BLOCKING_SAFEBROWSING_OUTPUT]: {
                import: BLOCKING_SAFEBROWSING_PATH,
            },
            [BLOCKING_BLOCKED_OUTPUT]: {
                import: BLOCKING_BLOCKED_PATH,
            },
            [CONTENT_SCRIPT_START_OUTPUT]: {
                import: path.resolve(CONTENT_SCRIPT_START_PATH, 'mv2.ts'),
                runtime: false,
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BACKGROUND_PATH, INDEX_HTML_FILE_NAME),
                templateParameters: {
                    browser: process.env.BROWSER,
                },
                filename: `${BACKGROUND_OUTPUT}.html`,
                chunks: [
                    ...ENTRY_POINTS_CHUNKS[BACKGROUND_OUTPUT],
                    BACKGROUND_OUTPUT,
                ],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BLOCKING_BLOCKED_PATH, INDEX_HTML_FILE_NAME),
                filename: `${BLOCKING_BLOCKED_OUTPUT}.html`,
                chunks: [BLOCKING_BLOCKED_OUTPUT],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BLOCKING_SAFEBROWSING_PATH, INDEX_HTML_FILE_NAME),
                filename: `${BLOCKING_SAFEBROWSING_OUTPUT}.html`,
                chunks: [BLOCKING_SAFEBROWSING_OUTPUT],
            }),
        ],
    });
};
