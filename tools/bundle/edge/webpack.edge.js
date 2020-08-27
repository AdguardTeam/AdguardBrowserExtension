import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { genCommonConfig } from '../webpack.common';
import { edgeManifest } from './manifest.edge';
import { updateManifest } from '../../helpers';

export const genEdgeConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);
    const plugins = [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../manifest.common.json'),
                    to: 'manifest.json',
                    transform: (content) => updateManifest(process.env.BUILD_ENV, content, edgeManifest),
                },
                {
                    context: 'Extension',
                    from: 'filters/edge',
                    to: 'filters',
                },
            ],
        }),
    ];

    const edgeConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, edgeConfig);
};
