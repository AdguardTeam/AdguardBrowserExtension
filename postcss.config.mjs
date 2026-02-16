/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import postcssGlobalData from '@csstools/postcss-global-data';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import postcssCustomMedia from 'postcss-custom-media';
import postcssSvg from 'postcss-svg';

export default {
    plugins: [
        // should go before postcss-custom-media to correctly inject media rules
        postcssGlobalData({ files: ['./Extension/src/pages/common/styles/media.pcss'] }),
        // should go before postcssPresetEnv with nesting-rules enabled
        postcssNested(),
        postcssPresetEnv({ stage: 3, features: { 'nesting-rules': true } }),
        postcssCustomMedia(),
        postcssSvg(),
    ],
};
