const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');
const { commonConfig } = require('../webpack.common');
const { chromeManifest } = require('./manifest.chrome');
const { updateManifest } = require('../helpers');
const { CHROME_BUILD_DIR } = require('../constants');

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
        path: path.join(commonConfig.output.path, CHROME_BUILD_DIR),
    },
    plugins,
};

module.exports = merge(commonConfig, chromeConfig);
