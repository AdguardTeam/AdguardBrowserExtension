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

import { type CategoriesData, type SettingsData } from '../../api';
import { type MV3SpecificOptions } from '../types';

/**
 * Settings data to be exported.
 */
export type ExportMessageResponse = {
    /**
     * Stringified JSON with the exported data.
     */
    content: string;

    /**
     * Extension version.
     */
    appVersion: string;
};

/**
 * Settings with some additional data for the options page:
 * app version, environment options, constants, filters info, filters metadata, etc.
 */
export type GetOptionsDataResponse = {
    /**
     * Settings data.
     */
    settings: SettingsData;

    /**
     * Extension version.
     * Used in the About section of the options page.
     */
    appVersion: string;

    /**
     * Versions of the libraries used in the extension.
     */
    libVersions: {
        /**
         * Version of the TSWebExtension library.
         */
        tswebextension: string;

        /**
         * Version of the TSUrlFilter library.
         */
        tsurlfilter: string;

        /**
         * Version of the Scriptlets library.
         */
        scriptlets: string;

        /**
         * Version of the ExtendedCss library.
         */
        extendedCss: string;

        /**
         * Version of the DNR-Rulesets library.
         * Will be filled after extension will load metadata for DNR rulesets.
         */
        dnrRulesets?: string;
    };

    /**
     * Environment data.
     */
    environmentOptions: {
        /**
         * Whether the extension is running in Chrome.
         */
        isChrome: boolean;
    };

    /**
     * Info about filters.
     */
    filtersInfo: {
        /**
         * Number of rules in the filters. Used in MV2.
         */
        rulesCount: number;
    };

    /**
     * Metadata for filters and groups.
     */
    filtersMetadata: CategoriesData;

    /**
     * Whether the user filter editor is open in the fullscreen mode.
     */
    fullscreenUserRulesEditorIsOpen: boolean;

    /**
     * MV3-specific options.
     *
     * This field is:
     * - contains MV3-specific properties for MV3;
     * - null for MV2.
     */
    mv3SpecificOptions: MV3SpecificOptions | null;
};
