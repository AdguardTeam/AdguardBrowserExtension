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
import {
    REMOTE_METADATA_FILE_NAME,
    REMOTE_I18N_METADATA_FILE_NAME,
    ADGUARD_FILTERS_IDS,
} from '../../../../../constants';
import { UserAgent } from '../../../common/user-agent';
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
     * Default base url for downloading filter rules.
     *
     * MV3_REMOTE_POLICY.
     * This keyword can be used to grep all code related to MV3 remote
     * hosting policy.
     *
     * In MV3 extension we do not download anything from remote servers
     * except custom filter lists which added by the users themselves.
     * Having this logic is particularly important for an ad blocker since
     * websites breakages can occur at any time and we need to be able to
     * fix them ASAP.
     *
     * To ensure compliance with Chrome Store policies, we have safeguards
     * that restrict execution to rules that are included into the extension
     * package and can be reviewed there. These safeguards can be found by
     * searching for 'JS_RULES_EXECUTION'.
     *
     * @private
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

    // TODO: Check, not using.
    // Path to the redirect sources
    readonly redirectSourcesFolder = 'assets/libs/scriptlets';

    // Array of filter identifiers, that have local file with rules.
    // We don't use this check for MV3, because all filters in MV3 already
    // packed in the extension.
    readonly localFilterIds = ADGUARD_FILTERS_IDS;

    /**
     * Base url for downloading filter rules.
     *
     * Can be null if remote resources loading is forbidden, e.g. in MV3.
     *
     * @private
     */
    private filtersRulesBaseUrl: string | null = null;

    /**
     * Promise that resolves when the network settings are initialized.
     * Only needed in MV3 with async initialization.
     */
    public initPromise: Promise<void> | null = null;

    /**
     * Constructor.
     */
    constructor() {
        this.initPromise = this.init();
    }

    /**
     * Initializes the network settings.
     */
    private async init(): Promise<void> {
        this.filtersRulesBaseUrl = await this.getFilterRulesBaseUrl();
        logger.info('Filters rules base url:', this.filtersRulesBaseUrl);
    }

    /**
     * Used to set the base url for filter rules through the local storage for testing purposes.
     *
     * MV3_REMOTE_POLICY.
     * This keyword can be used to grep all code related to MV3 remote
     * hosting policy.
     *
     * In MV3 extension we do not download anything from remote servers
     * except custom filter lists which added by the users themselves.
     * Having this logic is particularly important for an ad blocker since
     * websites breakages can occur at any time and we need to be able to
     * fix them ASAP.
     *
     * To ensure compliance with Chrome Store policies, we have safeguards
     * that restrict execution to rules that are included into the extension
     * package and can be reviewed there. These safeguards can be found by
     * searching for 'JS_RULES_EXECUTION'.
     *
     * @returns The base url for filter rules or null for MV3.
     */
    private async getFilterRulesBaseUrl(): Promise<string | null> {
        // TODO: Remove check when filters will support patches in MV3.
        if (__IS_MV3__) {
            return null;
        }

        const url = localStorage.getItem(this.FILTERS_BASE_URL_KEY);
        if (url) {
            return url;
        }

        return this.DEFAULT_FILTER_RULES_BASE_URL;
    }

    /**
     * Returns the url from which the filters can be loaded.
     *
     * @returns The url from which filters can be downloaded
     * or null if remote resources loading is forbidden, e.g. in MV3.
     * @throws Error if the filters rules base url is not initialized in non-MV3 build since it is required.
     */
    // eslint-disable-next-line class-methods-use-this
    get filtersUrl(): string | null {
        // first of all check whether it is mv3-build
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2985
        if (__IS_MV3__) {
            /**
             * MV3_REMOTE_POLICY.
             * This keyword can be used to grep all code related to MV3 remote
             * hosting policy.
             *
             * In MV3 extension we do not download anything from remote servers
             * except custom filter lists which added by the users themselves.
             * Having this logic is particularly important for an ad blocker since
             * websites breakages can occur at any time and we need to be able to
             * fix them ASAP.
             *
             * To ensure compliance with Chrome Store policies, we have safeguards
             * that restrict execution to rules that are included into the extension
             * package and can be reviewed there. These safeguards can be found by
             * searching for 'JS_RULES_EXECUTION'.
             */
            return null;
        }

        // for non-mv3 build it should be initialized
        if (!__IS_MV3__ && !this.filtersRulesBaseUrl) {
            throw new Error('Filters rules base url is not initialized but it is required');
        }

        if (UserAgent.isFirefox) {
            return `${this.filtersRulesBaseUrl}/firefox`;
        }

        if (UserAgent.isEdge) {
            return `${this.filtersRulesBaseUrl}/edge`;
        }

        if (UserAgent.isOpera) {
            return `${this.filtersRulesBaseUrl}/opera`;
        }

        return `${this.filtersRulesBaseUrl}/chromium`;
    }

    /**
     * Returns URL for downloading AG filters.
     *
     * @returns URL for downloading AG filters
     * or null for MV3 since remote resource downloading is not allowed due to CWR.
     */
    get filterRulesUrl(): string | null {
        return !this.filtersUrl
            ? null
            : `${this.filtersUrl}/filters/{filter_id}.txt`;
    }

    /**
     * Returns URL for downloading optimized AG filters.
     *
     * @returns URL for downloading optimized AG filters
     * or null for MV3 since remote resource downloading is not allowed dur to CWR.
     */
    get optimizedFilterRulesUrl(): string | null {
        return !this.filtersUrl
            ? null
            : `${this.filtersUrl}/filters/{filter_id}_optimized.txt`;
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
     * Returns URL for user complaints on missed ads or malware/phishing websites.
     *
     * @returns URL for user complaints on missed ads or malware/phishing websites.
     */
    get reportUrl(): string {
        return `${this.backendUrl}/url-report.html`;
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
