import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { genCommonConfig } from '../webpack.common';
import { chromeManifest } from './manifest.chrome';
import { updateManifest } from '../../helpers';

export const genChromeConfig = (browserConfig) => {
    const commonConfig = genCommonConfig(browserConfig);
    const plugins = [
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
    ];

    const chromeConfig = {
        output: {
            path: path.join(commonConfig.output.path, browserConfig.buildDir),
        },
        plugins,
    };

    return merge(commonConfig, chromeConfig);
};
