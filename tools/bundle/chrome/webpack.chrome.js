import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { genCommonConfig } from '../webpack.common';
import { chromeManifest } from './manifest.chrome';
import { updateManifest } from '../../helpers';

export const genChromeConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

    const DEVTOOLS_PATH = path.resolve(__dirname, '../../../Extension/pages/devtools');

    const chromeConfig = {
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
                        transform: (content) => updateManifest(process.env.BUILD_ENV, content, chromeManifest),
                    },
                    {
                        context: 'Extension',
                        from: 'filters/chromium',
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

    return merge(commonConfig, chromeConfig);
};
