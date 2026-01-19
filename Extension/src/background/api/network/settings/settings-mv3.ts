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

import { NetworkSettingsCommon } from './settings-common';

/**
 * NetworkSettings contains a bunch of url's which are using by extension.
 */
export class NetworkSettings extends NetworkSettingsCommon {
    /**
     * Returns the base URL for filter rules.
     * In MV3, always returns the default URL since standard filters
     * are loaded from IndexedDB (bundled with the extension).
     *
     * @returns Default filter rules base URL.
     */
    protected async getFilterRulesBaseUrl(): Promise<string> {
        return this.DEFAULT_FILTER_RULES_BASE_URL;
    }

    /**
     * @inheritdoc
     */
    get filtersUrl(): string {
        /**
         * Search for 'JS_RULES_EXECUTION' to find all parts of script execution
         * process in the extension.
         *
         * 1. We collect and bundle all scripts that can be executed on web pages into
         *    the extension package into so-called `localScriptRules`.
         * 2. Rules that control when and where these scripts can be executed are also
         *    bundled within the extension package inside ruleset files.
         * 3. The rules look like: `example.org#%#scripttext`. Whenever the rule is
         *    matched, we check if there's a function for `scripttext` in
         *    `localScriptRules`, retrieve it from there and execute it.
         */
        return `${this.filtersRulesBaseUrl}/chromium-mv3`;
    }
}
