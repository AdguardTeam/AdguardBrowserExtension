const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { getConfig } = require('./helpers');

const BUILD_PATH = path.resolve(__dirname, '../../build');

const config = getConfig(process.env.BUILD_ENV);

const BACKGROUND_PATH = path.resolve(__dirname, '../../Extension/pages/background');
const OPTIONS_PATH = path.resolve(__dirname, '../../Extension/pages/options');
const POPUP_PATH = path.resolve(__dirname, '../../Extension/pages/popup');

const OUTPUT_PATH = config.outputPath;

const commonConfig = {
    mode: config.mode,
    entry: {
        background: path.resolve(__dirname, BACKGROUND_PATH),
        options: path.resolve(__dirname, OPTIONS_PATH),
        popup: path.resolve(__dirname, POPUP_PATH),
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
            filename: 'background.html',
            chunks: ['background'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(OPTIONS_PATH, 'index.html'),
            filename: 'options.html',
            chunks: ['options'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(POPUP_PATH, 'index.html'),
            filename: 'popup.html',
            chunks: ['popup'],
        }),
    ],
};

module.exports = {
    commonConfig,
};
