const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { getConfig } = require('./helpers');

const BUILD_PATH = path.resolve(__dirname, '../../build');

const config = getConfig(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../Extension/pages/background');
const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');
const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');

const OUTPUT_PATH = config.outputPath;

// TODO clean dev folder before build
// TODO copy web-accessible-resources from node_modules on every-build
// TODO build sample extension with api
// TODO in dev build use sourcemaps while in prod no
const commonConfig = {
    mode: config.mode,
    devtool: 'cheap-module-source-map',
    entry: {
        'pages/background': path.resolve(__dirname, BACKGROUND_PATH),
        'pages/options': path.resolve(__dirname, OPTIONS_PATH),
        'pages/popup': path.resolve(__dirname, POPUP_PATH),
        'pages/filtering-log': path.resolve(__dirname, FILTERING_LOG_PATH),
    },
    output: {
        path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [{ loader: 'babel-loader', options: { babelrc: true } }],
            },
            {
                test: /\.(css|pcss)$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader',
                ],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    { loader: 'file-loader', options: { outputPath: 'assets' } },
                ],
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(BACKGROUND_PATH, 'index.html'),
            templateParameters: {
                browser: process.env.BROWSER,
            },
            filename: 'pages/background.html',
            chunks: ['pages/background'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(OPTIONS_PATH, 'index.html'),
            filename: 'pages/options.html',
            chunks: ['pages/options'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(POPUP_PATH, 'index.html'),
            filename: 'pages/popup.html',
            chunks: ['pages/popup'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(FILTERING_LOG_PATH, 'index.html'),
            filename: 'pages/filtering-log.html',
            chunks: ['pages/filtering-log'],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    context: 'Extension',
                    from: 'assets',
                    to: 'assets',
                },
                {
                    context: 'Extension',
                    from: '_locales',
                    to: '_locales',
                },
                {
                    context: 'Extension',
                    from: 'web-accessible-resources',
                    to: 'web-accessible-resources',
                },
                {
                    context: 'Extension',
                    from: 'lib',
                    to: 'lib',
                },
                {
                    context: 'Extension',
                    from: 'browser/webkit', // TODO figure out purpose of this separation
                },
            ],
        }),
    ],
};

module.exports = {
    commonConfig,
};
