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
import { type GetOptionsDataResponseCommon } from './types-common';

/**
 * Runtime information returned with options data.
 */
type RuntimeInfo = {
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

/**
 * Settings with some additional data for the options page:
 * app version, environment options, constants, filters info, filters metadata, etc.
 */
export type GetOptionsDataResponse = GetOptionsDataResponseCommon & {

    /**
     * Versions of the libraries used in the extension.
     */
    libVersions: GetOptionsDataResponseCommon['libVersions'] & {

        /**
         * Version of the DNR-Rulesets library.
         * Will be filled after extension will load metadata for DNR rulesets.
         */
        dnrRulesets?: string;
    };

    /** Runtime information used by the options page. */
    runtimeInfo: RuntimeInfo;
};
