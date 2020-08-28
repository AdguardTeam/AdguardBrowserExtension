import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { genCommonConfig } from '../webpack.common';
import { operaManifest } from './manifest.opera';
import { updateManifest } from '../../helpers';

export const genOperaConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);
    const plugins = [
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
    ];

    const operaConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, operaConfig);
};
