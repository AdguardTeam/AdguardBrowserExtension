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

import { type Browser } from '../../constants';

export enum E2EBrowserEngine {
    PlaywrightChromium = 'playwright-chromium',
    SeleniumFirefox = 'selenium-firefox',
}

export enum E2EMatrixId {
    ChromeMv2 = 'chrome-mv2',
    ChromeMv3 = 'chrome-mv3',
    FirefoxMv2 = 'firefox-mv2',
}

export enum E2EExtensionScheme {
    ChromeExtension = 'chrome-extension',
    MozExtension = 'moz-extension',
}

export enum E2ESurfaceId {
    Popup = 'popup',
    Options = 'options',
    FilteringLog = 'filtering-log',
}

export enum E2ESpecialSurfaceId {
    Background = 'background',
}

export type E2EResultSurfaceId = E2ESurfaceId | E2ESpecialSurfaceId;

/**
 * E2E test matrix entry configuration.
 */
export type E2EMatrixEntry = {
    /**
     * E2E matrix entry id.
     */
    id: E2EMatrixId;

    /**
     * Browser build target.
     */
    buildTarget: Browser;

    /**
     * Browser automation engine.
     */
    engine: E2EBrowserEngine;

    /**
     * Whether the target build uses Manifest V3.
     */
    isMv3: boolean;
};

/**
 * E2E test surface configuration.
 */
export type E2ESurface = {
    /**
     * E2E surface id.
     */
    id: E2ESurfaceId;

    /**
     * Extension page path.
     */
    path: string;

    /**
     * Shared page readiness state to wait for before assertions.
     */
    waitUntil: 'load' | 'domcontentloaded';
};

/**
 * E2E test error details.
 */
export type E2EError = {
    /**
     * E2E matrix entry id.
     */
    matrixId: string;

    /**
     * E2E result surface id.
     */
    surfaceId: E2EResultSurfaceId;

    /**
     * Error source.
     */
    source: string;

    /**
     * Error message.
     */
    message: string;

    /**
     * Page URL where the error occurred.
     */
    url: string;

    /**
     * Error timestamp.
     */
    timestamp: string;
};
