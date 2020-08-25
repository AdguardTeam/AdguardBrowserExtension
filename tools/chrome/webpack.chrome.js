import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { commonConfig } from '../webpack.common';
import { chromeManifest } from './manifest.chrome';
import { updateManifest } from '../helpers';
import { BROWSERS } from '../constants';

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                // TODO update eslint
                transform: (content) => updateManifest(process.env.BUILD_ENV, content, chromeManifest),
            },
            {
                context: 'Extension',
                from: 'browser/chrome',
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
        path: path.join(commonConfig.output.path, BROWSERS.CHROME),
    },
    plugins,
};

export default merge(commonConfig, chromeConfig);
