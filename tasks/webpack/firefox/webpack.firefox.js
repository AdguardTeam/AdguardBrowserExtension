const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');
const { commonConfig } = require('../webpack.common');
const { firefoxManifest } = require('./manifest.firefox');
const { updateManifest } = require('../helpers');
const { FIREFOX_BUILD_DIR } = require('../constants');

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

module.exports = merge(commonConfig, firefoxConfig);
