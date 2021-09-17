/* eslint-disable max-len */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

import { BUILD_PATH, ENVS } from '../constants';
import { getEnvConf, updateLocalesMSGName } from '../helpers';
import { getModuleReplacements } from './module-replacements';

const config = getEnvConf(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../Extension/pages/background');
const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');
const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');
const FILTER_DOWNLOAD_PATH = path.resolve(__dirname, '../../Extension/pages/filter-download');
const CONTENT_SCRIPT_START_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-start');
const CONTENT_SCRIPT_END_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-end');
const THANKYOU_PATH = path.resolve(__dirname, '../../Extension/pages/thankyou');
const ASSISTANT_PATH = path.resolve(__dirname, '../../Extension/pages/assistant');
const FULLSCREEN_USER_RULES_PATH = path.resolve(__dirname, '../../Extension/pages/fullscreen-user-rules');
const SAFEBROWSING_PATH = path.resolve(__dirname, '../../Extension/pages/safebrowsing');
const AD_BLOCKED_PATH = path.resolve(__dirname, '../../Extension/pages/ad-blocked');
const EDITOR_PATH = path.resolve(__dirname, '../../Extension/src/pages/common/components/Editor');

const OUTPUT_PATH = config.outputPath;

const htmlTemplatePluginCommonOptions = {
    cache: false,
    scriptLoading: 'blocking',
};

export const genCommonConfig = (browserConfig) => {
    return {
        mode: config.mode,
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            defaults: false,
                            unused: true,
                        },
                        mangle: false,
                        format: {
                            comments: 'all',
                        },
                    },
                    extractComments: false,
                }),
            ],
            runtimeChunk: 'single',
        },
        devtool: process.env.BUILD_ENV === ENVS.DEV ? 'eval-source-map' : false,
        entry: {
            'pages/background': {
                import: BACKGROUND_PATH,
                runtime: false,
            },
            'pages/options': {
                import: OPTIONS_PATH,
                dependOn: [
                    'vendors/react',
                    'vendors/mobx',
                    'vendors/xstate',
                    'shared/editor',
                ],
            },
            'pages/popup': {
                import: POPUP_PATH,
                dependOn: [
                    'vendors/react',
                    'vendors/mobx',
                ],
            },
            'pages/filtering-log': {
                import: FILTERING_LOG_PATH,
                dependOn: [
                    'vendors/react',
                    'vendors/mobx',
                    'vendors/xstate',
                ],
            },
            'pages/filter-download': {
                import: FILTER_DOWNLOAD_PATH,
                runtime: false,
            },
            'pages/content-script-start': {
                import: CONTENT_SCRIPT_START_PATH,
                runtime: false,
            },
            'pages/content-script-end': {
                import: CONTENT_SCRIPT_END_PATH,
                runtime: false,
            },
            'pages/thankyou': {
                import: THANKYOU_PATH,
                runtime: false,
            },
            'pages/assistant': {
                import: ASSISTANT_PATH,
                runtime: false,
            },
            'pages/fullscreen-user-rules': {
                import: FULLSCREEN_USER_RULES_PATH,
                dependOn: [
                    'vendors/react',
                    'vendors/mobx',
                    'vendors/xstate',
                    'shared/editor',
                ],
            },
            'pages/safebrowsing': {
                import: SAFEBROWSING_PATH,
                dependOn: [
                    'vendors/react',
                ],
            },
            'pages/ad-blocked': {
                import: AD_BLOCKED_PATH,
                dependOn: [
                    'vendors/react',
                ],
            },
            'shared/editor': {
                import: EDITOR_PATH,
                dependOn: [
                    'vendors/react',
                ],
            },
            'vendors/react': ['react', 'react-dom'],
            'vendors/mobx': ['mobx'],
            'vendors/xstate': ['xstate'],
        },
        output: {
            path: path.join(BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['*', '.js', '.jsx'],
            // Node modules polyfills
            fallback: {
                url: require.resolve('url'),
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
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
                            remoteScripts: browserConfig.remoteScripts,
                            devtools: browserConfig.devtools,
                            ppOptions: {
                                type: 'js',
                            },
                        },
                    }],
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: { babelrc: true },
                    }],
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

        plugins: [
            new CleanWebpackPlugin(),
            ...getModuleReplacements(browserConfig),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(BACKGROUND_PATH, 'index.html'),
                templateParameters: {
                    browser: process.env.BROWSER,
                },
                filename: 'pages/background.html',
                chunks: ['pages/background'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(OPTIONS_PATH, 'index.html'),
                filename: 'pages/options.html',
                chunks: ['vendors/react', 'vendors/mobx', 'vendors/xstate', 'shared/editor', 'pages/options'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(POPUP_PATH, 'index.html'),
                filename: 'pages/popup.html',
                chunks: ['vendors/react', 'vendors/mobx', 'pages/popup'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(FILTERING_LOG_PATH, 'index.html'),
                filename: 'pages/filtering-log.html',
                chunks: ['vendors/react', 'vendors/mobx', 'vendors/xstate', 'pages/filtering-log'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(FILTER_DOWNLOAD_PATH, 'index.html'),
                filename: 'pages/filter-download.html',
                chunks: ['pages/filter-download'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(FULLSCREEN_USER_RULES_PATH, 'index.html'),
                filename: 'pages/fullscreen-user-rules.html',
                chunks: ['vendors/react', 'vendors/mobx', 'vendors/xstate', 'shared/editor', 'pages/fullscreen-user-rules'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(AD_BLOCKED_PATH, 'index.html'),
                filename: 'pages/ad-blocked.html',
                chunks: ['vendors/react', 'pages/ad-blocked'],
            }),
            new HtmlWebpackPlugin({
                ...htmlTemplatePluginCommonOptions,
                template: path.join(SAFEBROWSING_PATH, 'index.html'),
                filename: 'pages/safebrowsing.html',
                chunks: ['vendors/react', 'pages/safebrowsing'],
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
                            return updateLocalesMSGName(content, process.env.BUILD_ENV, browserConfig.browser);
                        },
                    },
                    {
                        context: 'Extension',
                        from: 'web-accessible-resources',
                        to: 'web-accessible-resources',
                    },
                    {
                        context: 'Extension',
                        from: 'src/content-script/subscribe.js',
                        to: 'content-script/subscribe.js',
                    },
                ],
            }),
        ],
    };
};
