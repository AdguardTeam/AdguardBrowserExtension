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

import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
// webpack.DefinePlugin is not named exported by webpack.
import webpack, { type Configuration, type EntryObject } from 'webpack';

import {
    BUILD_PATH,
    Browser,
    BUILD_ENV,
} from '../constants';
import { updateLocalesMSGName } from '../helpers';
import {
    WEB_ACCESSIBLE_RESOURCES_OUTPUT,
    CONTENT_SCRIPT_END_OUTPUT,
    OPTIONS_OUTPUT,
    POST_INSTALL_OUTPUT,
    FULLSCREEN_USER_RULES_OUTPUT,
    POPUP_OUTPUT,
    THANKYOU_OUTPUT,
    SHARED_EDITOR_OUTPUT,
    REACT_VENDOR_OUTPUT,
    MOBX_VENDOR_OUTPUT,
    XSTATE_VENDOR_OUTPUT,
    ASSISTANT_INJECT_OUTPUT,
    SCRIPTLETS_VENDOR_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
    FILTERING_LOG_OUTPUT,
    DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT,
    DEVTOOLS_OUTPUT,
    AGTREE_VENDOR_OUTPUT,
    CSS_TOKENIZER_VENDOR_OUTPUT,
    TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
    BACKGROUND_OUTPUT,
    MIN_SUPPORTED_VERSION,
    INDEX_HTML_FILE_NAME,
    SUBSCRIBE_OUTPUT,
    BuildTargetEnv,
} from '../../constants';

import {
    ASSISTANT_INJECT_PATH,
    type BrowserConfig,
    CONTENT_SCRIPT_END_PATH,
    EDITOR_PATH,
    FILTERING_LOG_PATH,
    FULLSCREEN_USER_RULES_PATH,
    htmlTemplatePluginCommonOptions,
    OPTIONS_PATH,
    POPUP_PATH,
    POST_INSTALL_PATH,
    SUBSCRIBE_PATH,
    THANKYOU_PATH,
} from './common-constants';
import { getEnvConf } from './helpers';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

const config = getEnvConf(BUILD_ENV);

const OUTPUT_PATH = config.outputPath;

/**
 * Separately described chunks for large entry points to avoid missing some
 * chunk dependencies in the final bundle, because we list chunks in two places:
 * - `entry.dependOn` option,
 * - `HtmlWebpackPlugin.chunks` option.
 */
export const ENTRY_POINTS_CHUNKS = {
    [BACKGROUND_OUTPUT]: [
        TSWEBEXTENSION_VENDOR_OUTPUT,
        TSURLFILTER_VENDOR_OUTPUT,
        TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT,
        SCRIPTLETS_VENDOR_OUTPUT,
        AGTREE_VENDOR_OUTPUT,
        CSS_TOKENIZER_VENDOR_OUTPUT,
        TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
    ],
    [OPTIONS_OUTPUT]: [
        SCRIPTLETS_VENDOR_OUTPUT,
        TSURLFILTER_VENDOR_OUTPUT,
        TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
        CSS_TOKENIZER_VENDOR_OUTPUT,
        AGTREE_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
        SHARED_EDITOR_OUTPUT,
    ],
    [FILTERING_LOG_OUTPUT]: [
        SCRIPTLETS_VENDOR_OUTPUT,
        TSURLFILTER_VENDOR_OUTPUT,
        TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT,
        AGTREE_VENDOR_OUTPUT,
        CSS_TOKENIZER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
    ],
    [FULLSCREEN_USER_RULES_OUTPUT]: [
        CSS_TOKENIZER_VENDOR_OUTPUT,
        AGTREE_VENDOR_OUTPUT,
        SCRIPTLETS_VENDOR_OUTPUT,
        TSURLFILTER_VENDOR_OUTPUT,
        TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
        SHARED_EDITOR_OUTPUT,
    ],
};

export const genCommonConfig = (browserConfig: BrowserConfig, isWatchMode = false): Configuration => {
    const isDev = BUILD_ENV === BuildTargetEnv.Dev;
    const manifestVersion = browserConfig.browser === Browser.ChromeMv3 ? 3 : 2;

    const alias: Record<string, string> = {
        'tswebextension': path.resolve(__dirname, `../../Extension/src/background/tswebextension/tswebextension-mv${manifestVersion}.ts`),
        'app': path.resolve(__dirname, `../../Extension/src/background/app/app-mv${manifestVersion}.ts`),
        'engine': path.resolve(__dirname, `../../Extension/src/background/engine/engine-mv${manifestVersion}.ts`),
        'scripting-service': path.resolve(__dirname, `../../Extension/src/background/services/scripting/scripting-service-mv${manifestVersion}.ts`),
        'settings-service': path.resolve(__dirname, `../../Extension/src/background/services/settings/settings-service-mv${manifestVersion}.ts`),
        'filters-service': path.resolve(__dirname, `../../Extension/src/background/services/filters/filters-service-mv${manifestVersion}.ts`),
        'custom-filters-service': path.resolve(__dirname, `../../Extension/src/background/services/custom-filters/custom-filters-service-mv${manifestVersion}.ts`),
        'rules-limits-service': path.resolve(__dirname, `../../Extension/src/background/services/rules-limits/rules-limits-service-mv${manifestVersion}.ts`),
        'allowlist-service': path.resolve(__dirname, `../../Extension/src/background/services/allowlist/allowlist-mv${manifestVersion}.ts`),
        'content-script': path.resolve(__dirname, `../../Extension/pages/content-script-start/mv${manifestVersion}.ts`),
        'network-api': path.resolve(__dirname, `../../Extension/src/background/api/network/network-mv${manifestVersion}.ts`),
        'network-api-settings': path.resolve(__dirname, `../../Extension/src/background/api/network/settings-mv${manifestVersion}.ts`),
        'filters-update-api': path.resolve(__dirname, `../../Extension/src/background/api/filters/update/update-mv${manifestVersion}.ts`),
        'common-filter-api': path.resolve(__dirname, `../../Extension/src/background/api/filters/common/common-mv${manifestVersion}.ts`),
        'filter-categories-api': path.resolve(__dirname, `../../Extension/src/background/api/filters/categories/categories-mv${manifestVersion}.ts`),
        'settings-api': path.resolve(__dirname, `../../Extension/src/background/api/settings/settings-mv${manifestVersion}.ts`),
        'filter-update-service': path.resolve(__dirname, `../../Extension/src/background/services/filter-update/filter-update-mv${manifestVersion}.ts`),
        'browser-action': path.resolve(__dirname, `../../Extension/src/background/api/ui/browser-action/browser-action-mv${manifestVersion}.ts`),
        'context-menu-api': path.resolve(__dirname, `../../Extension/src/background/api/ui/context-menu/context-menu-mv${manifestVersion}.ts`),
        'icons-cache': path.resolve(__dirname, `../../Extension/src/common/api/extension/icons-cache/icons-cache-mv${manifestVersion}.ts`),
        'icons-api': path.resolve(__dirname, `../../Extension/src/background/api/ui/icons/icons-mv${manifestVersion}.ts`),
        'metadata-schema': path.resolve(__dirname, `../../Extension/src/background/schema/metadata/metadata/metadata-mv${manifestVersion}.ts`),
        'metadata-storage': path.resolve(__dirname, `../../Extension/src/background/storages/metadata/metadata-mv${manifestVersion}.ts`),
        'filters-api-main': path.resolve(__dirname, `../../Extension/src/background/api/filters/main/main-mv${manifestVersion}.ts`),
        'keep-alive-api': path.resolve(__dirname, `../../Extension/src/background/keep-alive/keep-alive-mv${manifestVersion}.ts`),
        'popup-service': path.resolve(__dirname, `../../Extension/src/background/services/ui/popup/popup-mv${manifestVersion}.ts`),
        'popup-store': path.resolve(__dirname, `../../Extension/src/pages/popup/stores/PopupStore/PopupStore-mv${manifestVersion}.ts`),
        'pages': path.resolve(__dirname, `../../Extension/src/background/api/ui/pages/pages-mv${manifestVersion}.ts`),
        'userrules': path.resolve(__dirname, `../../Extension/src/background/services/userrules/userrules-mv${manifestVersion}.ts`),
        'messenger': path.resolve(__dirname, `../../Extension/src/pages/services/messenger/messenger-mv${manifestVersion}.ts`),
        'user-scripts-api': path.resolve(__dirname, `../../Extension/src/common/user-scripts-api/user-scripts-api-mv${manifestVersion}.ts`),
        'popup-layout': path.resolve(__dirname, `../../Extension/src/pages/popup/components/Popup/Popup-mv${manifestVersion}.tsx`),
        'filters-adapter': path.resolve(__dirname, `../../Extension/src/background/storages/filters-adapter/filters-adapter-mv${manifestVersion}.ts`),
        'prefs': path.resolve(__dirname, `../../Extension/src/background/prefs/prefs-mv${manifestVersion}.ts`),
    };

    const configuration: Configuration = {
        mode: config.mode,
        target: 'web',
        stats: 'verbose',
        optimization: {
            minimize: false,
            runtimeChunk: 'single',
            usedExports: true,
            sideEffects: true,
        },
        cache: isDev,
        devtool: isDev ? 'eval-source-map' : false,
        entry: {
            [OPTIONS_OUTPUT]: {
                import: OPTIONS_PATH,
                dependOn: ENTRY_POINTS_CHUNKS[OPTIONS_OUTPUT],
            },
            [POPUP_OUTPUT]: {
                import: POPUP_PATH,
                dependOn: [
                    REACT_VENDOR_OUTPUT,
                    MOBX_VENDOR_OUTPUT,
                ],
            },
            [POST_INSTALL_OUTPUT]: {
                import: POST_INSTALL_PATH,
                runtime: false,
            },
            [ASSISTANT_INJECT_OUTPUT]: {
                import: ASSISTANT_INJECT_PATH,
                runtime: false,
            },
            [CONTENT_SCRIPT_END_OUTPUT]: {
                import: CONTENT_SCRIPT_END_PATH,
                runtime: false,
            },
            [THANKYOU_OUTPUT]: {
                import: THANKYOU_PATH,
                runtime: false,
            },
            [FULLSCREEN_USER_RULES_OUTPUT]: {
                import: FULLSCREEN_USER_RULES_PATH,
                dependOn: ENTRY_POINTS_CHUNKS[FULLSCREEN_USER_RULES_OUTPUT],
            },
            [FILTERING_LOG_OUTPUT]: {
                import: FILTERING_LOG_PATH,
                dependOn: ENTRY_POINTS_CHUNKS[FILTERING_LOG_OUTPUT],
            },
            [SHARED_EDITOR_OUTPUT]: {
                import: EDITOR_PATH,
                dependOn: [
                    REACT_VENDOR_OUTPUT,
                ],
            },
            [SUBSCRIBE_OUTPUT]: {
                import: SUBSCRIBE_PATH,
                runtime: false,
            },
            // Library vendors
            [TSURLFILTER_VENDOR_OUTPUT]: {
                import: '@adguard/tsurlfilter',
                dependOn: [
                    AGTREE_VENDOR_OUTPUT,
                    CSS_TOKENIZER_VENDOR_OUTPUT,
                    SCRIPTLETS_VENDOR_OUTPUT,
                ],
            },
            [TSURLFILTER_DECLARATIVE_CONVERTER_VENDOR_OUTPUT]: {
                import: '@adguard/tsurlfilter/es/declarative-converter',
                dependOn: [
                    TSURLFILTER_VENDOR_OUTPUT,
                ],
            },
            [TSWEBEXTENSION_VENDOR_OUTPUT]: {
                import: '@adguard/tswebextension',
                dependOn: [
                    SCRIPTLETS_VENDOR_OUTPUT,
                    TSURLFILTER_VENDOR_OUTPUT,
                    TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
                ],
            },
            [SCRIPTLETS_VENDOR_OUTPUT]: {
                import: '@adguard/scriptlets',
                dependOn: [
                    AGTREE_VENDOR_OUTPUT,
                ],
            },
            [AGTREE_VENDOR_OUTPUT]: ['@adguard/agtree'],
            [CSS_TOKENIZER_VENDOR_OUTPUT]: ['@adguard/css-tokenizer'],
            [TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT]: ['@adguard/text-encoding'],
            [REACT_VENDOR_OUTPUT]: ['react', 'react-dom'],
            [MOBX_VENDOR_OUTPUT]: ['mobx'],
            [XSTATE_VENDOR_OUTPUT]: ['xstate'],
        },
        output: {
            path: path.join(BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
        },
        resolve: {
            modules: [
                'node_modules',

                /**
                 * By default, package managers like Yarn and NPM create a flat structure in the `node_modules` folder,
                 * placing all dependencies directly in the root `node_modules`.
                 * For instance, when we install `@adguard/agtree` in this project, both it and its dependency,
                 * `@adguard/css-tokenizer`, are typically placed in the root `node_modules` folder.
                 *
                 * However, pnpm follows a different, nested structure where dependencies are stored
                 * under `node_modules/.pnpm/node_modules`.
                 * This structure helps reduce duplication but also means that dependencies of dependencies
                 * are not directly accessible in the root.
                 *
                 * As a result, Webpack may fail to resolve these "nested" dependencies in pnpm's setup,
                 * since they are not in the root `node_modules`.
                 * To ensure Webpack can locate dependencies correctly in a pnpm project,
                 * we add `node_modules/.pnpm/node_modules` to the module resolution path as a fallback.
                 */
                'node_modules/.pnpm/node_modules',
            ],
            fallback: {
                crypto: 'crypto-browserify',
                stream: 'stream-browserify',
                vm: 'vm-browserify',
            },
            extensions: ['.ts', '.js', '.tsx', '.jsx'],
            // pnpm uses symlinks to manage dependencies, so we need to resolve them
            symlinks: true,
            alias,
        },
        module: {
            rules: [
                {
                    include: [
                        path.resolve(__dirname, '../../Extension/src/background/filter/request-filter.js'),
                        path.resolve(__dirname, '../../Extension/pages/content-script-end/index.js'),
                    ],
                    use: [{
                        loader: 'preprocess-loader',
                        options: {
                            devtools: browserConfig.devtools,
                            ppOptions: {
                                type: 'js',
                            },
                        },
                    }],
                },
                /*
                 * Prevent browser console warnings with source map issue
                 * by deleting source map url comments in production build
                 */
                {
                    test: /\.(js|ts)x?$/,
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'source-map-loader',
                            options: {
                                filterSourceMappingUrl: () => (isDev ? 'skip' : 'remove'),
                            },
                        },
                    ],
                },
                {
                    test: /\.(js|ts)x?$/,
                    // TODO: Check, maybe it can be removed. Added in AG-28996.
                    exclude: /node_modules\/(?!@adguard\/tswebextension)/,
                    use: [
                        {
                            loader: 'swc-loader',
                            options: {
                                env: {
                                    targets: {
                                        chrome: MIN_SUPPORTED_VERSION.CHROMIUM_MV2,
                                        firefox: MIN_SUPPORTED_VERSION.FIREFOX,
                                        opera: MIN_SUPPORTED_VERSION.OPERA,
                                    },
                                    mode: 'usage',
                                    coreJs: '3.32',
                                },
                            },
                        },
                    ],
                    resolve: {
                        // Needed to ignore extensions in the import statements
                        fullySpecified: false,
                    },
                },
                {
                    test: /\.module\.(css|pcss)$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                url: false,
                                modules: {
                                    localIdentName: isDev
                                        ? '[name]__[local]--[hash:base64:5]'
                                        : '[hash:base64]',
                                    exportLocalsConvention: 'camelCaseOnly',
                                },
                            },
                        },
                        'postcss-loader',
                    ],
                },
                {
                    test: /\.(css|pcss)$/,
                    exclude: /\.module\.(css|pcss)$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                url: false,
                            },
                        },
                        'postcss-loader',
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource',
                },
                {
                    test: /\.(svg|png)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/images/[name][ext]',
                    },
                },
                {
                    test: /\.(webm|mp4)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/videos/[name][ext]',
                    },
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(OPTIONS_PATH, INDEX_HTML_FILE_NAME),
                filename: `${OPTIONS_OUTPUT}.html`,
                chunks: [
                    ...ENTRY_POINTS_CHUNKS[OPTIONS_OUTPUT],
                    OPTIONS_OUTPUT,
                ],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(POPUP_PATH, INDEX_HTML_FILE_NAME),
                filename: `${POPUP_OUTPUT}.html`,
                chunks: [REACT_VENDOR_OUTPUT, MOBX_VENDOR_OUTPUT, POPUP_OUTPUT],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(POST_INSTALL_PATH, INDEX_HTML_FILE_NAME),
                filename: `${POST_INSTALL_OUTPUT}.html`,
                chunks: [POST_INSTALL_OUTPUT],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(FULLSCREEN_USER_RULES_PATH, INDEX_HTML_FILE_NAME),
                filename: `${FULLSCREEN_USER_RULES_OUTPUT}.html`,
                chunks: [
                    ...ENTRY_POINTS_CHUNKS[FULLSCREEN_USER_RULES_OUTPUT],
                    FULLSCREEN_USER_RULES_OUTPUT,
                ],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(FILTERING_LOG_PATH, INDEX_HTML_FILE_NAME),
                filename: `${FILTERING_LOG_OUTPUT}.html`,
                chunks: [
                    ...ENTRY_POINTS_CHUNKS[FILTERING_LOG_OUTPUT],
                    FILTERING_LOG_OUTPUT,
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        context: 'Extension',
                        from: 'assets',
                        to: 'assets',
                    },
                    {
                        context: 'Extension',
                        from: '_locales',
                        to: '_locales',
                        transform: (content) => {
                            return updateLocalesMSGName(content, BUILD_ENV, browserConfig.browser);
                        },
                    },
                    {
                        context: 'Extension',
                        from: 'web-accessible-resources',
                        to: WEB_ACCESSIBLE_RESOURCES_OUTPUT,
                    },
                ],
            }),
            new webpack.DefinePlugin({
                // We are doing stricter JS rule checking for Firefox AMO, so we
                // need to determine if the Firefox browser is AMO or not.
                // TODO consider making this variable to be less common used
                //  (e.g., make it to be __IS_FIREFOX_AMO__ instead of IS_FIREFOX_AMO)
                IS_FIREFOX_AMO: browserConfig.browser === Browser.FirefoxAmo,
                // TODO consider making this variable to be less common used
                //  (e.g., make it to be __IS_RELEASE__ instead of IS_RELEASE)
                IS_RELEASE: BUILD_ENV === BuildTargetEnv.Release,
                IS_BETA: BUILD_ENV === BuildTargetEnv.Beta,
                __IS_MV3__: browserConfig.browser === Browser.ChromeMv3,
            }),
        ],
    };

    // Run the archive only if it is not a watch mode to reduce the build time.
    if (!isWatchMode && configuration.plugins) {
        // @ts-expect-error ZipWebpackPlugin has outdated types
        configuration.plugins.push(new ZipWebpackPlugin({
            path: '../',
            filename: `${browserConfig.zipName}.zip`,
        }));
    }

    return configuration;
};

const DEVTOOLS_PATH = path.resolve(__dirname, '../../Extension/pages/devtools');

const DEVTOOLS_ENTRY = path.join(DEVTOOLS_PATH, 'devtools.js');
const DEVTOOLS_ELEMENTS_SIDEBAR_ENTRY = path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.js');

export const CHROMIUM_DEVTOOLS_ENTRIES: EntryObject = {
    [DEVTOOLS_OUTPUT]: DEVTOOLS_ENTRY,
    [DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT]: DEVTOOLS_ELEMENTS_SIDEBAR_ENTRY,
};

export const CHROMIUM_DEVTOOLS_PAGES_PLUGINS = [
    new HtmlWebpackPlugin({
        template: path.join(DEVTOOLS_PATH, 'devtools.html'),
        filename: `${DEVTOOLS_OUTPUT}.html`,
        chunks: [DEVTOOLS_OUTPUT],
    }),
    new HtmlWebpackPlugin({
        template: path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.html'),
        filename: `${DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT}.html`,
        chunks: [DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT],
    }),
];
