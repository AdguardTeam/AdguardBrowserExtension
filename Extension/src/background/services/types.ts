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

/**
 * MV3-specific options for pages — options and popup.
 */
export type MV3SpecificOptions = {
    /**
     * Whether the rule limits are exceeded
     * and browser changed the list of enabled filters.
     */
    areFilterLimitsExceeded: boolean;

    /**
     * Whether the extension update is available after the checking.
     */
    isExtensionUpdateAvailable: boolean;

    /**
     * Whether the extension was reloaded after update.
     */
    isExtensionReloadedOnUpdate: boolean;

    /**
     * Whether the extension update was successful.
     */
    isSuccessfulExtensionUpdate: boolean;
};
