/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import path from 'path';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import { type Configuration, NormalModuleReplacementPlugin } from 'webpack';

import { type BrowserConfig } from '../constants';
import {
    REACT_VENDOR_OUTPUT,
    MOBX_VENDOR_OUTPUT,
    XSTATE_VENDOR_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
    FILTERING_LOG_OUTPUT,
    BACKGROUND_OUTPUT,
} from '../../constants';

import { BACKGROUND_PATH, htmlTemplatePluginCommonOptions } from './common-constants';
import {
    genCommonConfig,
    genCommonEntry,
    genCommonPlugins,
    replacementMatchRegexp,
} from './webpack.common';

const FILTERING_LOG_PATH = path.resolve(__dirname, '../../Extension/pages/filtering-log');

const FILTERING_LOG_ENTRY = {
    import: FILTERING_LOG_PATH,
    dependOn: [
        TSURLFILTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
    ],
};

export const filteringLogHtmlPlugin = new HtmlWebpackPlugin({
    ...htmlTemplatePluginCommonOptions,
    template: path.join(FILTERING_LOG_PATH, 'index.html'),
    filename: `${FILTERING_LOG_OUTPUT}.html`,
    chunks: [
        TSURLFILTER_VENDOR_OUTPUT,
        TSWEBEXTENSION_VENDOR_OUTPUT,
        REACT_VENDOR_OUTPUT,
        MOBX_VENDOR_OUTPUT,
        XSTATE_VENDOR_OUTPUT,
        FILTERING_LOG_OUTPUT,
    ],
});

const Mv2ReplacementPlugin = new NormalModuleReplacementPlugin(
    replacementMatchRegexp,
    ((resource: any) => {
        resource.request = resource.request.replace(/\.\/Abstract(.*)/, './Mv2$1');
    }),
);

export const genMv2CommonConfig = (browserConfig: BrowserConfig): Configuration => {
    return {
        ...genCommonConfig(browserConfig),
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                dependOn: [
                    TSURLFILTER_VENDOR_OUTPUT,
                    TSWEBEXTENSION_VENDOR_OUTPUT,
                ],
            },
            [FILTERING_LOG_OUTPUT]: FILTERING_LOG_ENTRY,
            ...genCommonEntry(browserConfig),
        },
        plugins: [
            Mv2ReplacementPlugin,
            filteringLogHtmlPlugin,
            ...genCommonPlugins(browserConfig),
        ],
    };
};
