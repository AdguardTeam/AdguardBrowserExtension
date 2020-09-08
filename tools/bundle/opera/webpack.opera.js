import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { genCommonConfig } from '../webpack.common';
import { operaManifest } from './manifest.opera';
import { updateManifest } from '../../helpers';

export const genOperaConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

    const DEVTOOLS_PATH = path.resolve(__dirname, '../../../Extension/pages/devtools');

    const operaConfig = {
        entry: {
            'pages/devtools': path.join(DEVTOOLS_PATH, 'devtools.js'),
            'pages/devtools-elements-sidebar': path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.js'),
        },
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, '../manifest.common.json'),
                        to: 'manifest.json',
                        transform: (content) => updateManifest(process.env.BUILD_ENV, content, operaManifest),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/opera',
                        to: 'filters',
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: path.join(DEVTOOLS_PATH, 'devtools.html'),
                filename: 'pages/devtools.html',
                chunks: ['pages/devtools'],
            }),
            new HtmlWebpackPlugin({
                template: path.join(DEVTOOLS_PATH, 'devtools-elements-sidebar.html'),
                filename: 'pages/devtools-elements-sidebar.html',
                chunks: ['pages/devtools-elements-sidebar'],
            }),
        ],
    };

    return merge(commonConfig, operaConfig);
};
