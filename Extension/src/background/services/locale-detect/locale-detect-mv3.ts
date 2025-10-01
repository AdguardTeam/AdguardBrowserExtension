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

import { type LocaleDetectCommon } from './locale-detect-common';

/**
 * Locale detection service for Manifest V3.
 *
 * Empty stub - functionality disabled in MV3. Enabling filters based on
 * detected locale would require checking declarative rules limits, adding
 * significant complexity. For simplicity, this feature is not implemented.
 *
 * NOTE: This module is intentionally not used anywhere in MV3 build, but kept
 * for consistency with MV2/MV3 architecture pattern to avoid confusion.
 */
class LocaleDetect implements LocaleDetectCommon {
    /**
     * Adds listener for tab update message.
     */
    // eslint-disable-next-line class-methods-use-this
    init(): void {}
}

export const localeDetect = new LocaleDetect();
