import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';

import { genCommonConfig } from '../webpack.common';
import { firefoxManifest } from './manifest.firefox';
import { updateManifest } from '../../helpers';
import { ENVS } from '../../constants';

export const genFirefoxConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

    let zipFilename = `${browserConfig.browser}.zip`;

    if (process.env.BUILD_ENV === ENVS.BETA
        || process.env.BUILD_ENV === ENVS.RELEASE) {
        zipFilename = 'firefox.zip';
    }

    const plugins = [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../manifest.common.json'),
                    to: 'manifest.json',
                    transform: (content) => updateManifest(process.env.BUILD_ENV, content, firefoxManifest),
                },
                {
                    context: 'Extension',
                    from: 'filters/firefox',
                    to: 'filters',
                },
            ],
        }),
        new ZipWebpackPlugin({
            path: '../',
            filename: zipFilename,
        }),
    ];

    const firefoxConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, firefoxConfig);
};
