/* eslint-disable max-len */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CreateFileWebpack from 'create-file-webpack';
import path from 'path';
import { NormalModuleReplacementPlugin } from 'webpack';

import { BROWSERS, BUILD_PATH } from '../constants';
import { getEnvConf, updateLocalesMSGName } from '../helpers';
import packageJson from '../../package.json';

const config = getEnvConf(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../Extension/pages/background');
const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');
const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');
const FILTER_DOWNLOAD_PATH = path.resolve(__dirname, '../../Extension/pages/filter-download');
const EXPORT_PATH = path.resolve(__dirname, '../../Extension/pages/export');
const CONTENT_SCRIPT_START_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-start');
const CONTENT_SCRIPT_END_PATH = path.resolve(__dirname, '../../Extension/pages/content-script-end');
const THANKYOU_PATH = path.resolve(__dirname, '../../Extension/pages/thankyou');

const OUTPUT_PATH = config.outputPath;

// TODO in dev build use sourcemaps while in prod no
// TODO prepare zip artifacts
export const genCommonConfig = (browserConfig) => {
    return {
        mode: config.mode,
        devtool: false,
        entry: {
            'pages/background': BACKGROUND_PATH,
            'pages/options': OPTIONS_PATH,
            'pages/popup': POPUP_PATH,
            'pages/filtering-log': FILTERING_LOG_PATH,
            'pages/filter-download': FILTER_DOWNLOAD_PATH,
            'pages/export': EXPORT_PATH,
            'pages/content-script-start': CONTENT_SCRIPT_START_PATH,
            'pages/content-script-end': CONTENT_SCRIPT_END_PATH,
            'pages/thankyou': THANKYOU_PATH,
        },
        output: {
            path: path.join(BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['*', '.js', '.jsx'],
        },
        module: {
            rules: [
                {
                    include: [
                        path.resolve(__dirname, '../../Extension/lib/filter/request-filter.js'),
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
                    use: ['cache-loader', {
                        loader: 'babel-loader',
                        options: { babelrc: true },
                    }],
                },
                {
                    test: /\.(css|pcss)$/,
                    exclude: /node_modules/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: { importLoaders: 1 },
                        },
                        'postcss-loader',
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: { outputPath: 'assets' },
                        },
                    ],
                },
            ],
        },

        plugins: [
            new CleanWebpackPlugin(),
            // TODO refactor NormalModuleReplacementPlugin
            new NormalModuleReplacementPlugin(/\.\/abstract-rules-storage/, ((resource) => {
                if (browserConfig.browser === BROWSERS.FIREFOX_AMO
                    || browserConfig.browser === BROWSERS.FIREFOX_STANDALONE) {
                    resource.request = resource.request.replace(/\.\/abstract-rules-storage/, './firefox/rules-storage');
                } else if (browserConfig.browser === BROWSERS.CHROME
                    || browserConfig.browser === BROWSERS.OPERA
                    || browserConfig.browser === BROWSERS.EDGE
                ) {
                    resource.request = resource.request.replace(/\.\/abstract-rules-storage/, './chrome/rules-storage');
                } else {
                    throw new Error(`There is no proxy api for browser: ${process.env.BROWSER}`);
                }
            })),
            new NormalModuleReplacementPlugin(/\.\/abstract-content-filtering/, ((resource) => {
                if (browserConfig.browser === BROWSERS.FIREFOX_AMO
                    || browserConfig.browser === BROWSERS.FIREFOX_STANDALONE) {
                    resource.request = resource.request.replace(/\.\/abstract-content-filtering/, './firefox/content-filtering');
                } else if (browserConfig.browser === BROWSERS.CHROME
                || browserConfig.browser === BROWSERS.OPERA
                || browserConfig.browser === BROWSERS.EDGE) {
                    resource.request = resource.request.replace(/\.\/abstract-content-filtering/, './chrome/content-filtering');
                } else {
                    throw new Error(`There is no proxy api for browser: ${process.env.BROWSER}`);
                }
            })),
            new HtmlWebpackPlugin({
                template: path.join(BACKGROUND_PATH, 'index.html'),
                templateParameters: {
                    browser: process.env.BROWSER,
                },
                filename: 'pages/background.html',
                chunks: ['pages/background'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(OPTIONS_PATH, 'index.html'),
                filename: 'pages/options.html',
                chunks: ['pages/options'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(POPUP_PATH, 'index.html'),
                filename: 'pages/popup.html',
                chunks: ['pages/popup'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(FILTERING_LOG_PATH, 'index.html'),
                filename: 'pages/filtering-log.html',
                chunks: ['pages/filtering-log'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(FILTER_DOWNLOAD_PATH, 'index.html'),
                filename: 'pages/filter-download.html',
                chunks: ['pages/filter-download'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(EXPORT_PATH, 'index.html'),
                filename: 'pages/export.html',
                chunks: ['pages/export'],
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
                        from: 'pages/blocking-pages',
                        to: 'pages/blocking-pages',
                    },
                ],
            }),
        ],
    };
};
