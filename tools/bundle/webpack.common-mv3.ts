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

import { NormalModuleReplacementPlugin, type Configuration } from 'webpack';
import merge from 'webpack-merge';

import {
    AGTREE_VENDOR_OUTPUT,
    BACKGROUND_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    CSS_TOKENIZER_VENDOR_OUTPUT,
    TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
    TSURLFILTER_VENDOR_OUTPUT,
    TSWEBEXTENSION_VENDOR_OUTPUT,
} from '../../constants';

import {
    BACKGROUND_PATH,
    CONTENT_SCRIPT_START_PATH,
    type BrowserConfig,
} from './common-constants';
import { genCommonConfig } from './webpack.common';

export const genMv3CommonConfig = (browserConfig: BrowserConfig, isWatchMode: boolean): Configuration => {
    const commonConfig = genCommonConfig(browserConfig, isWatchMode);

    return merge(commonConfig, {
        entry: {
            [BACKGROUND_OUTPUT]: {
                import: BACKGROUND_PATH,
                runtime: false,
                dependOn: [
                    TSURLFILTER_VENDOR_OUTPUT,
                    CSS_TOKENIZER_VENDOR_OUTPUT,
                    AGTREE_VENDOR_OUTPUT,
                    TSWEBEXTENSION_VENDOR_OUTPUT,
                    TEXT_ENCODING_POLYFILL_VENDOR_OUTPUT,
                ],
            },
            [CONTENT_SCRIPT_START_OUTPUT]: {
                import: path.resolve(CONTENT_SCRIPT_START_PATH, 'mv3.ts'),
                runtime: false,
            },
        },
        plugins: [
            // FIXME: (v5.0) If there are no manifest-dependant components,
            // remove this plugin.
            // Replace manifest-dependant components with the ones
            // for the current build target manifest version.
            new NormalModuleReplacementPlugin(
                // Regexp to match the path to the abstract components that should
                // be replaced for mv2 and mv3.
                new RegExp(
                    `\\.\\/Abstract(${
                        [].join('|') // TODO: Add the list of abstract components
                    })`,
                ),
                ((resource: any) => {
                    resource.request = resource.request.replace(
                        /\.\/Abstract(.*)/,
                        './Mv3$1',
                    );
                }),
            ),
        ],
    });
};
