/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import { type Configuration, HtmlRspackPlugin } from '@rspack/core';
import { merge } from 'webpack-merge';

import {
    BACKGROUND_OUTPUT,
    BLOCKING_BLOCKED_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    INDEX_HTML_FILE_NAME,
} from '../../constants';

import {
    BACKGROUND_PATH,
    BLOCKING_BLOCKED_PATH,
    CONTENT_SCRIPT_START_PATH,
    htmlTemplatePluginCommonOptions,
    type BrowserConfig,
    type BuildOptions,
} from './common-constants';
import { genCommonConfig } from './rspack.common';

export const genMv3CommonConfig = (browserConfig: BrowserConfig, options: BuildOptions = {}): Configuration => {
    const commonConfig = genCommonConfig(browserConfig, options);

    return merge(commonConfig, {
        entry: {
            // Don't needed to specify chunks for MV3, because Service workers
            // in MV3 must be a single file as they run in a short-lived
            // execution environment (they are terminated when idle) and cannot
            // use eval, importScripts, or external scripts dynamically
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                runtime: false,
            },
            [BLOCKING_BLOCKED_OUTPUT]: {
                import: BLOCKING_BLOCKED_PATH,
            },
            [CONTENT_SCRIPT_START_OUTPUT]: {
                import: path.resolve(CONTENT_SCRIPT_START_PATH, 'mv3.ts'),
                runtime: false,
            },
        },
        plugins: [
            new HtmlRspackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BLOCKING_BLOCKED_PATH, INDEX_HTML_FILE_NAME),
                filename: `${BLOCKING_BLOCKED_OUTPUT}.html`,
                chunks: [BLOCKING_BLOCKED_OUTPUT],
            }),
        ],
    });
};
