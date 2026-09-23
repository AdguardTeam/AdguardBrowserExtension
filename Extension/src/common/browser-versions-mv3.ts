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

import { MIN_SUPPORTED_VERSION } from '../../../constants';

/** Minimum browser versions supported by the MV3 extension. */
export const MIN_SUPPORTED_BROWSER_VERSION = {
    CHROMIUM: MIN_SUPPORTED_VERSION.CHROMIUM_MV3,
    EDGE: MIN_SUPPORTED_VERSION.EDGE_CHROMIUM_MV3,
    OPERA: MIN_SUPPORTED_VERSION.OPERA_MV3,
};
