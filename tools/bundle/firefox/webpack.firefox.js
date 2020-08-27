import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { genCommonConfig } from '../webpack.common';
import { firefoxManifest } from './manifest.firefox';
import { updateManifest } from '../../helpers';

export const genFirefoxConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);

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
                    from: 'browser/firefox',
                },
                {
                    context: 'Extension',
                    from: 'filters/firefox',
                    to: 'filters',
                },
            ],
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
