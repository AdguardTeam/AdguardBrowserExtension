/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    type Configuration,
    HtmlRspackPlugin,
    CopyRspackPlugin,
} from '@rspack/core';
import { merge } from 'webpack-merge';

import { RulesetsInjector } from '@adguard/dnr-rulesets';

import {
    BACKGROUND_OUTPUT,
    BLOCKING_BLOCKED_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    DNR_CONVERTER_VENDOR_OUTPUT,
    AGTREE_VENDOR_OUTPUT,
    CSS_TOKENIZER_VENDOR_OUTPUT,
    INDEX_HTML_FILE_NAME,
    GPC_SCRIPT_OUTPUT,
    HIDE_DOCUMENT_REFERRER_OUTPUT,
} from '../../constants';
import {
    MV3_BROWSER_TO_ASSETS_BROWSER_MAP,
    FILTERS_DEST,
    BUILD_ENV,
    type Mv3Browser,
} from '../constants';
import { updateManifestBuffer } from '../helpers';

import {
    BACKGROUND_PATH,
    BLOCKING_BLOCKED_PATH,
    CONTENT_SCRIPT_START_PATH,
    htmlTemplatePluginCommonOptions,
    type BrowserConfig,
    type BuildOptions,
} from './common-constants';
import {
    genCommonConfig,
    CHROMIUM_DEVTOOLS_ENTRIES,
    CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
} from './rspack.common';
import { commonManifest } from './manifest.common';
import { createMv3Manifest } from './manifest.common.mv3';
import { isBrowserMv3 } from './helpers';

const bundleDirectory = path.dirname(fileURLToPath(import.meta.url));

/** Main filter enabled in a fresh installation. */
const BASE_FILTER_ID = '2';
const RULESET_NAME_PREFIX = 'ruleset_';
const rulesetsInjector = new RulesetsInjector();

/**
 * Creates a manifest with the rulesets bundled for the selected MV3 browser.
 *
 * @param content Common manifest JSON.
 * @param browser Target MV3 browser.
 *
 * @returns Manifest JSON with browser-specific versions and rulesets.
 */
export const createBundledMv3Manifest = (content: Buffer, browser: Mv3Browser): Buffer => {
    const filtersBrowser = MV3_BROWSER_TO_ASSETS_BROWSER_MAP[browser];
    const filters = fs.readdirSync(path.join(FILTERS_DEST.replace('%browser', filtersBrowser), 'declarative'))
        .filter((filter) => filter.match(/ruleset_\d+/));

    return updateManifestBuffer(
        BUILD_ENV,
        browser,
        content,
        rulesetsInjector.applyRulesets(
            (id: string) => `filters/declarative/${id}/${id}.json`,
            createMv3Manifest(browser),
            filters,
            {
                forceUpdate: true,
                enable: [BASE_FILTER_ID],
                rulesetPrefix: RULESET_NAME_PREFIX,
            },
        ),
    );
};

export const genMv3Config = (browserConfig: BrowserConfig, options: BuildOptions = {}): Configuration => {
    if (!isBrowserMv3(browserConfig.browser)) {
        throw new Error(`Expected an MV3 build target, got ${browserConfig.browser}`);
    }

    const browser = browserConfig.browser;
    const filtersDirectory = FILTERS_DEST.replace('%browser', MV3_BROWSER_TO_ASSETS_BROWSER_MAP[browser]);
    const commonConfig = genCommonConfig(
        browserConfig,
        options,
        // MV3-only: append the dnr-converter vendor chunk to the shared
        // dependOn arrays for this call only, without mutating the
        // module-level constants (which would duplicate entries across
        // repeated calls, e.g. chrome-mv3 + opera-mv3 in one process).
        [DNR_CONVERTER_VENDOR_OUTPUT],
    );

    if (!commonConfig.output?.path) {
        throw new Error('commonConfig.output.path is undefined');
    }

    return merge(commonConfig, {
        devtool: BUILD_ENV === 'dev' ? 'inline-source-map' : false,
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        resolve: {
            alias: {
                'local-script-rules': path.resolve(filtersDirectory, 'local_script_rules.js'),
            },
        },
        entry: {
            [GPC_SCRIPT_OUTPUT]: {
                import: path.resolve(bundleDirectory, '../../Extension/pages/gpc'),
                runtime: false,
            },
            [HIDE_DOCUMENT_REFERRER_OUTPUT]: {
                import: path.resolve(bundleDirectory, '../../Extension/pages/hide-document-referrer'),
                runtime: false,
            },
            ...CHROMIUM_DEVTOOLS_ENTRIES,
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
            // DNR converter vendor chunk — used by options, filtering-log,
            // and fullscreen-user-rules pages.
            [DNR_CONVERTER_VENDOR_OUTPUT]: {
                import: '@adguard/dnr-converter',
                dependOn: [
                    AGTREE_VENDOR_OUTPUT,
                    CSS_TOKENIZER_VENDOR_OUTPUT,
                ],
            },
        },
        plugins: [
            new HtmlRspackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BLOCKING_BLOCKED_PATH, INDEX_HTML_FILE_NAME),
                filename: `${BLOCKING_BLOCKED_OUTPUT}.html`,
                chunks: [BLOCKING_BLOCKED_OUTPUT],
            }),
            new CopyRspackPlugin({
                patterns: [
                    {
                        // CopyRspackPlugin needs a source file; the transform serializes the imported manifest.
                        from: path.resolve(bundleDirectory, 'manifest.common.ts'),
                        to: 'manifest.json',
                        transform: () => createBundledMv3Manifest(Buffer.from(JSON.stringify(commonManifest)), browser),
                    },
                    {
                        from: filtersDirectory,
                        to: 'filters',
                    },
                ],
            }),
            ...CHROMIUM_DEVTOOLS_PAGES_PLUGINS,
        ],
    });
};
