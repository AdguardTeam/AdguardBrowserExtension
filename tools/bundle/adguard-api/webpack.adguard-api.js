/* eslint-disable max-len */
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import path from 'path';
import { BUILD_PATH, ENVS } from '../../constants';

import { getEnvConf, updateManifestBuffer } from '../../helpers';
import { getModuleReplacements } from '../module-replacements';

const config = getEnvConf(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/background');
const POPUP_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/popup');
const ADGUARD_ASSISTANT_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/adguard-assistant.js');
const ADGUARD_CONTENT_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/adguard-content.js');
const ADGUARD_API_PATH = path.resolve(__dirname, '../../../Extension/api/sample-extension/entries/adguard-api.js');

export const genSampleApiConfig = (browserConfig) => {
    const OUTPUT_PATH = path.join(BUILD_PATH, config.outputPath, browserConfig.buildDir);
    const isDev = process.env.BUILD_ENV === ENVS.DEV;

    return {
        mode: config.mode,
        devtool: isDev ? 'eval-source-map' : false,
        optimization: {
            minimize: false,
        },
        entry: {
            'background': BACKGROUND_PATH,
            'popup': POPUP_PATH,
            'adguard-assistant': ADGUARD_ASSISTANT_PATH,
            'adguard-content': ADGUARD_CONTENT_PATH,
            'adguard-api': ADGUARD_API_PATH,
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
                        path.resolve(__dirname, '../../../Extension/src/filter/request-filter.js'),
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
                    use: [{
                        loader: 'babel-loader',
                        options: { babelrc: true },
                    }],
                },
            ],
            strictExportPresence: true, // set to true, to throw error if used non exported modules on build
        },

        plugins: [
            new CleanWebpackPlugin(),
            ...getModuleReplacements(browserConfig),
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
                    {
                        from: path.resolve(__dirname, 'manifest.adguard-api.json'),
                        to: 'manifest.json',
                        transform: (content) => updateManifestBuffer(process.env.BUILD_ENV, content, {}),
                    },
                ],
            }),
            new ZipWebpackPlugin({
                path: '../',
                filename: `${browserConfig.browser}.zip`,
            }),
        ],
    };
};
