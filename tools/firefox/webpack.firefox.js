import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { merge } from 'webpack-merge';
import { commonConfig } from '../webpack.common';
import { firefoxManifest } from './manifest.firefox';
import { updateManifest } from '../helpers';
import { FIREFOX_BUILD_DIR } from '../constants';

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                // TODO update eslint
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
        path: path.join(commonConfig.output.path, FIREFOX_BUILD_DIR),
    },
    plugins,
};

export default merge(commonConfig, firefoxConfig);
