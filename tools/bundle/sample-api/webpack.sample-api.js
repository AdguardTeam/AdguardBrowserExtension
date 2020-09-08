/* eslint-disable max-len */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CreateFileWebpack from 'create-file-webpack';
import path from 'path';
import { NormalModuleReplacementPlugin } from 'webpack';
import { BROWSERS, BUILD_PATH } from '../../constants';

import { getEnvConf } from '../../helpers';
import { sampleApiManifest } from './manifest.sample-api';

const config = getEnvConf(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/background');
const POPUP_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/popup');
const ADGUARD_ASSISTANT_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/adguard-assistant.js');
const ADGUARD_CONTENT_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/adguard-content.js');

export const genSampleApiConfig = (browserConfig) => {
    const OUTPUT_PATH = path.join(BUILD_PATH, config.outputPath, browserConfig.buildDir);

    return {
        mode: config.mode,
        devtool: false,
        entry: {
            'background': BACKGROUND_PATH,
            'popup': POPUP_PATH,
            'adguard-assistant': ADGUARD_ASSISTANT_PATH,
            'adguard-content': ADGUARD_CONTENT_PATH,
        },
        output: {
            path: OUTPUT_PATH,
            filename: '[name].js',
        },
        resolve: {
            extensions: ['*', '.js', '.jsx'],
        },
        module: {
            rules: [
                {
                    include: [
                        path.resolve(__dirname, '../../../Extension/lib/filter/request-filter.js'),
                        path.resolve(__dirname, '../../../Extension/pages/content-script-end/index.js'),
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
            ],
        },

        plugins: [
            new CleanWebpackPlugin(),
            new NormalModuleReplacementPlugin(/\.\/abstract-rules-storage/, ((resource) => {
                if (browserConfig.browser === BROWSERS.FIREFOX_AMO
                    || browserConfig.browser === BROWSERS.FIREFOX_STANDALONE) {
                    resource.request = resource.request.replace(/\.\/abstract-rules-storage/, './firefox/rules-storage');
                } else if (browserConfig.browser === BROWSERS.CHROME
                    || browserConfig.browser === BROWSERS.OPERA
                    || browserConfig.browser === BROWSERS.EDGE
                    || browserConfig.browser === BROWSERS.SAMPLE_API
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
                    || browserConfig.browser === BROWSERS.EDGE
                    || browserConfig.browser === BROWSERS.SAMPLE_API
                ) {
                    resource.request = resource.request.replace(/\.\/abstract-content-filtering/, './chrome/content-filtering');
                } else {
                    throw new Error(`There is no proxy api for browser: ${process.env.BROWSER}`);
                }
            })),
            new HtmlWebpackPlugin({
                template: path.join(BACKGROUND_PATH, 'index.html'),
                filename: 'background.html',
                chunks: ['background'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(POPUP_PATH, 'index.html'),
                filename: 'popup.html',
                chunks: ['popup'],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        context: 'Extension/api/sample-extension',
                        from: 'adguard-api.md',
                        to: 'adguard-api.md',
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        context: 'Extension',
                        from: 'filters/chromium/filters_i18n.json',
                        to: 'adguard',
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium/filters.json',
                        to: 'adguard',
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium/local_script_rules.json',
                        to: 'adguard',
                    },
                    {
                        context: 'Extension',
                        from: 'assets/libs/scriptlets/redirects.yml',
                        to: 'adguard',
                    },
                ],
            }),
            new CreateFileWebpack({
                path: OUTPUT_PATH,
                fileName: 'manifest.json',
                content: JSON.stringify(sampleApiManifest, null, 4),
            }),
        ],
    };
};
