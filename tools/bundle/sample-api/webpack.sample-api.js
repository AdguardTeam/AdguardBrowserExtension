/* eslint-disable max-len */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CreateFileWebpack from 'create-file-webpack';
import path from 'path';
import { BUILD_PATH } from '../../constants';

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
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: { babelrc: true },
                    }],
                },
            ],
        },

        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: path.join(BACKGROUND_PATH, 'index.html'),
                templateParameters: {
                    browser: process.env.BROWSER,
                },
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
            new CreateFileWebpack({
                path: OUTPUT_PATH,
                fileName: 'manifest.json',
                content: JSON.stringify(sampleApiManifest, null, 4),
            }),
        ],
    };
};
