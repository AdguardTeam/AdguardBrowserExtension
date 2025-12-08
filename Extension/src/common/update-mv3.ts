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

import { MIN_SUPPORTED_VERSION } from '../../../constants';

/**
 * Returns the Chrome Web Store extension update URL for a given extension
 * ID and Chrome version.
 *
 * @param extensionId The extension ID in the Chrome Web Store.
 * @param chromeVer Chrome version, number, default is {@link MIN_SUPPORTED_VERSION.CHROMIUM_MV3}.
 *
 * @returns The update URL for the CRX file.
 */
export const getCrxUrl = (
    extensionId: string,
    chromeVer = MIN_SUPPORTED_VERSION.CHROMIUM_MV3,
): string => {
    const chromeVersionStr = `${chromeVer}.0.0.0`;

    const url = new URL('https://clients2.google.com/service/update2/crx');

    url.searchParams.set('response', 'redirect');
    url.searchParams.set('acceptformat', 'crx3');
    url.searchParams.set('prodversion', chromeVersionStr);
    url.searchParams.set('x', `id=${extensionId}&installsource=ondemand&uc`);

    return url.href;
};
