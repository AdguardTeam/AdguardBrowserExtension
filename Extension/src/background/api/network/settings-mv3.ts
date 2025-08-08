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
// TODO (AG-44868): Reduce code duplication across mv2 and mv3
import {
    REMOTE_METADATA_FILE_NAME,
    REMOTE_I18N_METADATA_FILE_NAME,
    ADGUARD_FILTERS_IDS,
} from '../../../../../constants';
import { BrowserUtils } from '../../utils/browser-utils';
import { logger } from '../../../common/logger';

/**
 * NetworkSettings contains a bunch of url's which are using by extension.
 */
export class NetworkSettings {
    // Base url of our backend server
    readonly backendUrl = 'https://chrome.adtidy.org';

    // Api key
    readonly apiKey = '4DDBE80A3DA94D819A00523252FB6380';

    // Browsing Security lookups. In case of Firefox lookups are disabled for HTTPS urls.
    readonly safebrowsingLookupUrl = 'https://sb.adtidy.org/safebrowsing-lookup-short-hash.html';

    /**
     * Search for 'JS_RULES_EXECUTION' to find all parts of script execution
     * process in the extension.
     *
     * Base URL for downloading filter rules.
     *
     * Note, that downloading filter rules is DISABLED in the current MV3 build
     * in order to ensure that remotely hosted rules are not used in Chrome.
     */
    private readonly DEFAULT_FILTER_RULES_BASE_URL = 'https://filters.adtidy.org/extension';

    /**
     * By this key, qa can set the base url for filter rules through the local storage for testing
     * purposes.
     *
     * @example
     * ```javascript
     *  localStorage.setItem('ag_filters_base_url', 'https://filters.adtidy.org/extension/');
     * ```
     *
     * @private
     */
    private readonly FILTERS_BASE_URL_KEY = 'ag_filters_base_url';

    // Folder that contains filters metadata and files with rules. 'filters' by default
    readonly localFiltersFolder = 'filters';

    // TODO: Check, not used in the code.
    // Path to the redirect sources
    readonly redirectSourcesFolder = 'assets/libs/scriptlets';

    // Array of filter identifiers, that have local file with rules.
    // We don't use this check for MV3, because all filters in MV3 already
    // packed in the extension.
    readonly localFilterIds = ADGUARD_FILTERS_IDS;

    /**
     * Base url for downloading filter rules.
     */
    private filtersRulesBaseUrl: string = this.DEFAULT_FILTER_RULES_BASE_URL;

    /**
     * Initializes the network settings.
     */
    public async init(): Promise<void> {
        // For testing purposes, we can set the base url for filter rules
        // through the local storage.
        this.filtersRulesBaseUrl = await this.getFilterRulesBaseUrl();
        logger.info('[ext.NetworkSettings.init]: filters rules base url:', this.filtersRulesBaseUrl);
    }

    /**
     * Used to set the base url for filter rules through the local storage
     * for testing purposes.
     *
     * @returns Promise that resolves to the base url for filter rules.
     */
    private async getFilterRulesBaseUrl(): Promise<string> {
        // We don't need to set base url in MV3 because we cannot update filters via patches.
        // TODO: Remove check when filters will support patches in MV3.
        return this.DEFAULT_FILTER_RULES_BASE_URL;
    }

    /**
     * Returns the url from which the filters can be downloaded.
     *
     * @returns The url from which filters can be downloaded.
     */
    // eslint-disable-next-line class-methods-use-this
    get filtersUrl(): string {
        // First of all check whether it is mv3-build
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2985

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
         *
         * Downloading rules from remote server is completely disabled in the
         * MV3 build by returning `null` here.
         */
        return `${this.filtersRulesBaseUrl}/chromium-mv3`;
    }

    /**
     * Returns URL for downloading AG filters.
     *
     * @returns URL for downloading AG filters.
     */
    get filterRulesUrl(): string {
        return `${this.filtersUrl}/filters/{filter_id}.txt`;
    }

    /**
     * Returns URL for downloading optimized AG filters.
     *
     * @returns URL for downloading optimized AG filters.
     */
    get optimizedFilterRulesUrl(): string {
        return `${this.filtersUrl}/filters/{filter_id}_optimized.txt`;
    }

    /**
     * Returns URL for checking filter updates.
     *
     * @returns URL for checking filter updates.
     */
    get filtersMetadataUrl(): string {
        const params = BrowserUtils.getExtensionParams();
        return `${this.filtersUrl}/${REMOTE_METADATA_FILE_NAME}?${params.join('&')}`;
    }

    /**
     * Returns URL for downloading i18n localizations.
     *
     * @returns URL for downloading i18n localizations.
     */
    get filtersI18nMetadataUrl(): string {
        const params = BrowserUtils.getExtensionParams();
        return `${this.filtersUrl}/${REMOTE_I18N_METADATA_FILE_NAME}?${params.join('&')}`;
    }

    /**
     * URL for collecting filter rules statistics.
     * We do not collect it by default, unless user is willing to help.
     * Filter rules stats are covered in our privacy policy and on also here:
     * http://adguard.com/en/filter-rules-statistics.html.
     *
     * @returns Rule stats url.
     */
    get ruleStatsUrl(): string {
        return `${this.backendUrl}/api/1.0/rulestats.html`;
    }
}
