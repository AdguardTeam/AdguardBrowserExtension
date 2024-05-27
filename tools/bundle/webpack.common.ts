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

import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import {
    Configuration,
    DefinePlugin,
    type WebpackPluginInstance,
    type EntryObject,
} from 'webpack';

import {
    BUILD_PATH,
    BuildTargetEnv,
    Browser,
    BUILD_ENV,
    BrowserConfig,
} from '../constants';
import { getEnvConf, updateLocalesMSGName } from '../helpers';
import {
    WEB_ACCESSIBLE_RESOURCES_OUTPUT,
    SUBSCRIBE_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    CONTENT_SCRIPT_END_OUTPUT,
    OPTIONS_OUTPUT,
    POST_INSTALL_OUTPUT,
    FULLSCREEN_USER_RULES_OUTPUT,
    SAFEBROWSING_OUTPUT,
    DOCUMENT_BLOCK_OUTPUT,
    POPUP_OUTPUT,
    THANKYOU_OUTPUT,
    EDITOR_OUTPUT,
    REACT_VENDOR_OUTPUT,
    MOBX_VENDOR_OUTPUT,
    XSTATE_VENDOR_OUTPUT,
    ASSISTANT_INJECT_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
    FILTERING_LOG_OUTPUT,
    DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT,
    DEVTOOLS_OUTPUT,
} from '../../constants';

import { htmlTemplatePluginCommonOptions } from './common-constants';

const config = getEnvConf(BUILD_ENV);

const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');
const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');
const POST_INSTALL_PATH = path.resolve(__dirname, '../../Extension/pages/post-install');
const CONTENT_SCRIPT_START_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-start');
const ASSISTANT_INJECT_PATH = path.resolve(__dirname, '../../Extension/pages/assistant-inject');
const CONTENT_SCRIPT_END_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-end');
const SUBSCRIBE_PATH = path.resolve(__dirname, '../../Extension/pages/subscribe');
const THANKYOU_PATH = path.resolve(__dirname, '../../Extension/pages/thankyou');
const FULLSCREEN_USER_RULES_PATH = path.resolve(__dirname, '../../Extension/pages/fullscreen-user-rules');
const SAFEBROWSING_PATH = path.resolve(__dirname, '../../Extension/pages/safebrowsing');
const AD_BLOCKED_PATH = path.resolve(__dirname, '../../Extension/pages/ad-blocked');
const EDITOR_PATH = path.resolve(__dirname, '../../Extension/src/pages/common/components/Editor');

const OUTPUT_PATH = config.outputPath;

export const FILTERING_LOG_ENTRY = {
    import: FILTERING_LOG_PATH,
    dependOn: [
        TSURLFILTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
    ],
};

export const genCommonEntry = (browserConfig: BrowserConfig): EntryObject => {
    const manifestVersion = browserConfig.browser === Browser.ChromeMv3 ? 3 : 2;

    return {
        [OPTIONS_OUTPUT]: {
            import: OPTIONS_PATH,
            dependOn: [
                REACT_VENDOR_OUTPUT,
                MOBX_VENDOR_OUTPUT,
                XSTATE_VENDOR_OUTPUT,
                EDITOR_OUTPUT,
            ],
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
        [CONTENT_SCRIPT_START_OUTPUT]: {
            import: path.resolve(CONTENT_SCRIPT_START_PATH, `mv${manifestVersion}.ts`),
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
        [SUBSCRIBE_OUTPUT]: {
            import: SUBSCRIBE_PATH,
            runtime: false,
        },
        [THANKYOU_OUTPUT]: {
            import: THANKYOU_PATH,
            runtime: false,
        },
        [FULLSCREEN_USER_RULES_OUTPUT]: {
            import: FULLSCREEN_USER_RULES_PATH,
            dependOn: [
                REACT_VENDOR_OUTPUT,
                MOBX_VENDOR_OUTPUT,
                XSTATE_VENDOR_OUTPUT,
                EDITOR_OUTPUT,
            ],
        },
        [SAFEBROWSING_OUTPUT]: {
            import: SAFEBROWSING_PATH,
            dependOn: [
                REACT_VENDOR_OUTPUT,
            ],
        },
        [DOCUMENT_BLOCK_OUTPUT]: {
            import: AD_BLOCKED_PATH,
            dependOn: [
                REACT_VENDOR_OUTPUT,
            ],
        },
        [EDITOR_OUTPUT]: {
            import: EDITOR_PATH,
            dependOn: [
                REACT_VENDOR_OUTPUT,
            ],
        },
        [REACT_VENDOR_OUTPUT]: ['react', 'react-dom'],
        [MOBX_VENDOR_OUTPUT]: ['mobx'],
        [XSTATE_VENDOR_OUTPUT]: ['xstate'],
        [TSURLFILTER_VENDOR_OUTPUT]: ['@adguard/tsurlfilter'],
        [TSWEBEXTENSION_VENDOR_OUTPUT]: {
            import: '@adguard/tswebextension',
            dependOn: [
                TSURLFILTER_VENDOR_OUTPUT,
            ],
        },
    };
};

export const filteringLogHtmlPlugin = new HtmlWebpackPlugin({
    ...htmlTemplatePluginCommonOptions,
    template: path.join(FILTERING_LOG_PATH, 'index.html'),
    filename: `${FILTERING_LOG_OUTPUT}.html`,
    chunks: [
        TSURLFILTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
        FILTERING_LOG_OUTPUT,
    ],
});

export const genCommonPlugins = (browserConfig: BrowserConfig): WebpackPluginInstance[] => {
    return [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(OPTIONS_PATH, 'index.html'),
            filename: `${OPTIONS_OUTPUT}.html`,
            chunks: [
                TSURLFILTER_VENDOR_OUTPUT,
                REACT_VENDOR_OUTPUT,
                MOBX_VENDOR_OUTPUT,
                XSTATE_VENDOR_OUTPUT,
                EDITOR_OUTPUT,
                OPTIONS_OUTPUT,
            ],
        }),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(POPUP_PATH, 'index.html'),
            filename: `${POPUP_OUTPUT}.html`,
            chunks: [REACT_VENDOR_OUTPUT, MOBX_VENDOR_OUTPUT, POPUP_OUTPUT],
        }),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(POST_INSTALL_PATH, 'index.html'),
            filename: `${POST_INSTALL_OUTPUT}.html`,
            chunks: [POST_INSTALL_OUTPUT],
        }),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(FULLSCREEN_USER_RULES_PATH, 'index.html'),
            filename: `${FULLSCREEN_USER_RULES_OUTPUT}.html`,
            chunks: [
                REACT_VENDOR_OUTPUT,
                MOBX_VENDOR_OUTPUT,
                XSTATE_VENDOR_OUTPUT,
                EDITOR_OUTPUT,
                FULLSCREEN_USER_RULES_OUTPUT,
            ],
        }),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(AD_BLOCKED_PATH, 'index.html'),
            filename: `${DOCUMENT_BLOCK_OUTPUT}.html`,
            chunks: [REACT_VENDOR_OUTPUT, DOCUMENT_BLOCK_OUTPUT],
        }),
        new HtmlWebpackPlugin({
            ...htmlTemplatePluginCommonOptions,
            template: path.join(SAFEBROWSING_PATH, 'index.html'),
            filename: `${SAFEBROWSING_OUTPUT}.html`,
            chunks: [REACT_VENDOR_OUTPUT, SAFEBROWSING_OUTPUT],
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
        new DefinePlugin({
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
    ];
};

export const genCommonConfig = (browserConfig: BrowserConfig): Configuration => {
    const isDev = BUILD_ENV === BuildTargetEnv.Dev;
    const manifestVersion = browserConfig.browser === Browser.ChromeMv3 ? 3 : 2;

    return {
        mode: config.mode,
        target: 'web',
        optimization: {
            minimize: false,
            runtimeChunk: 'single',
        },
        cache: isDev,
        devtool: isDev ? 'eval-source-map' : false,
        // should be re-defined in common-mv2 and common-mv3 webpack configs
        entry: {},
        output: {
            path: path.join(BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
        },
        resolve: {
            fallback: {
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
            },
            extensions: ['.*', '.js', '.jsx', '.ts', '.tsx'],
            symlinks: false,
            alias: {
                'tswebextension': path.resolve(
                    __dirname,
                    `../../Extension/src/background/tswebextension/tswebextension-mv${manifestVersion}.ts`,
                ),
                'engine': path.resolve(
                    __dirname,
                    `../../Extension/src/background/engine/engine-mv${manifestVersion}.ts`,
                ),
                'content-script': path.resolve(
                    __dirname,
                    `../../Extension/pages/content-script-start/mv${manifestVersion}.ts`,
                ),
            },
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
                    exclude: /node_modules\/(?!@adguard\/tswebextension)/,
                    use: [
                        {
                            loader: 'swc-loader',
                            options: {
                                env: {
                                    targets: {
                                        chrome: 79,
                                        firefox: 78,
                                        opera: 66,
                                    },
                                    mode: 'usage',
                                    coreJs: '3.32',
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(css|pcss)$/,
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
            ],
        },
        // should be re-defined in common-mv2 and common-mv3 webpack configs
        plugins: [],
    };
};

/**
 * Regexp to match the path to the abstract components that should be replaced for mv2 and mv3.
 */
export const replacementMatchRegexp = new RegExp(
    `\\.\\/Abstract(${
        [
            'Actions',
            'Tabs',
            'MainContainer',
        ].join('|')
    })`,
);

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
        filename: 'pages/devtools.html',
        chunks: [DEVTOOLS_OUTPUT],
    }),
    new HtmlWebpackPlugin({
        template: path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.html'),
        filename: 'pages/devtools-elements-sidebar.html',
        chunks: [DEVTOOLS_ELEMENT_SIDEBAR_OUTPUT],
    }),
];

export const genChromiumZipPlugin = (browser: Browser): WebpackPluginInstance => {
    return new ZipWebpackPlugin({
        path: '../',
        filename: `${browser}.zip`,
    });
};
