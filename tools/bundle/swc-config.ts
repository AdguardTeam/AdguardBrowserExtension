/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { MIN_SUPPORTED_VERSION } from '../../constants';

/**
 * Matches the core-js `Object.create` polyfill module.
 *
 * The regex is tested against the resolved resource path, so it covers both
 * the extension's copy of core-js and copies bundled by linked packages.
 */
export const OBJECT_CREATE_MODULE_REGEX = /[\\/]core-js[\\/]internals[\\/]object-create\.js$/;

/**
 * Returns the SWC `env.targets` for the current build.
 *
 * MV3 builds use the Chromium MV3 minimum from `MIN_SUPPORTED_VERSION`.
 * MV2 builds must support the older Chrome, Firefox, and Opera minimums.
 *
 * @param isMv3 Whether the build is for MV3.
 *
 * @returns SWC targets.
 */
export const getSwcTargets = (isMv3: boolean): Record<string, string> => {
    if (isMv3) {
        return { chrome: String(MIN_SUPPORTED_VERSION.CHROMIUM_MV3) };
    }

    return {
        chrome: String(MIN_SUPPORTED_VERSION.CHROMIUM_MV2),
        firefox: String(MIN_SUPPORTED_VERSION.FIREFOX),
        opera: String(MIN_SUPPORTED_VERSION.OPERA),
    };
};
