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

import { Browser } from '../../constants';

import {
    E2EBrowserEngine,
    E2EMatrixId,
    E2ESurfaceId,
    type E2EMatrixEntry,
    type E2ESurface,
} from './types';

export const E2E_MATRIX: [E2EMatrixEntry, E2EMatrixEntry, E2EMatrixEntry] = [
    {
        id: E2EMatrixId.ChromeMv2,
        buildTarget: Browser.Chrome,
        engine: E2EBrowserEngine.PlaywrightChromium,
        isMv3: false,
    },
    {
        id: E2EMatrixId.ChromeMv3,
        buildTarget: Browser.ChromeMv3,
        engine: E2EBrowserEngine.PlaywrightChromium,
        isMv3: true,
    },
    {
        id: E2EMatrixId.FirefoxMv2,
        buildTarget: Browser.FirefoxStandalone,
        engine: E2EBrowserEngine.SeleniumFirefox,
        isMv3: false,
    },
];

export const E2E_SURFACES: E2ESurface[] = [
    {
        id: E2ESurfaceId.Popup,
        path: '/pages/popup.html',
        waitUntil: 'load',
    },
    {
        id: E2ESurfaceId.Options,
        path: '/pages/options.html',
        waitUntil: 'load',
    },
    {
        id: E2ESurfaceId.FilteringLog,
        path: '/pages/filtering-log.html',
        waitUntil: 'load',
    },
];
