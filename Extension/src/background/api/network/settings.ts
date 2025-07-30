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
import { browserStorage } from '../../storages/shared-instances';

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
     * Default base URL for downloading filter rules.
     *
     * To fully comply with Chrome Web Store policies regarding remote code execution,
     * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
     *
     * 1. Default - regular users that did not grant User scripts API permission explicitly:
     *    - We collect and pre-build script rules from the filters and statically bundle
     *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
     *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
     *    - These pre-verified local scripts are passed to the engine - STEP 2.
     *    - At runtime before the execution, we check if each script rule is included
     *      in our local scripts list (STEP 3).
     *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
     *      All other scripts are discarded.
     *    - Custom filters are NOT allowed for regular users to prevent any possibility
     *      of remote code execution, regardless of rule interpretation.
     *
     * 2. For advanced users that explicitly granted User scripts API permission -
     *    via enabling the Developer mode or Allow user scripts in the extension details:
     *    - Custom filters are allowed and may contain Scriptlet and JS rules
     *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
     *      which provides a secure sandbox.
     *    - This execution bypasses the local script verification process but remains
     *      isolated and secure through Chrome's native sandboxing.
     *    - This mode requires explicit user activation and is intended for advanced users only.
     *
     * IMPORTANT:
     * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
     * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
     * When custom filters are allowed, they may contain:
     * 1. Network rules – converted to DNR rules and applied via dynamic rules.
     * 2. Cosmetic rules – interpreted directly in the extension code.
     * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
     *    with Chrome's native sandboxing providing security isolation.
     *
     * For regular users without User scripts API permission (default case):
     * - Only pre-bundled filters with statically verified scripts are supported.
     * - Downloading custom filters or any rules from remote sources is blocked entirely
     *   to ensure compliance with the store policies.
     *
     * This implementation ensures perfect compliance with Chrome Web Store policies
     * by preventing any possibility of remote code execution for regular users.
     *
     * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
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
     * Used to set the base url for filter rules through the local storage for testing purposes.
     *
     * To fully comply with Chrome Web Store policies regarding remote code execution,
     * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
     *
     * 1. Default - regular users that did not grant User scripts API permission explicitly:
     *    - We collect and pre-build script rules from the filters and statically bundle
     *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
     *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
     *    - These pre-verified local scripts are passed to the engine - STEP 2.
     *    - At runtime before the execution, we check if each script rule is included
     *      in our local scripts list (STEP 3).
     *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
     *      All other scripts are discarded.
     *    - Custom filters are NOT allowed for regular users to prevent any possibility
     *      of remote code execution, regardless of rule interpretation.
     *
     * 2. For advanced users that explicitly granted User scripts API permission -
     *    via enabling the Developer mode or Allow user scripts in the extension details:
     *    - Custom filters are allowed and may contain Scriptlet and JS rules
     *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
     *      which provides a secure sandbox.
     *    - This execution bypasses the local script verification process but remains
     *      isolated and secure through Chrome's native sandboxing.
     *    - This mode requires explicit user activation and is intended for advanced users only.
     *
     * IMPORTANT:
     * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
     * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
     * When custom filters are allowed, they may contain:
     * 1. Network rules – converted to DNR rules and applied via dynamic rules.
     * 2. Cosmetic rules – interpreted directly in the extension code.
     * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
     *    with Chrome's native sandboxing providing security isolation.
     *
     * For regular users without User scripts API permission (default case):
     * - Only pre-bundled filters with statically verified scripts are supported.
     * - Downloading custom filters or any rules from remote sources is blocked entirely
     *   to ensure compliance with the store policies.
     *
     * This implementation ensures perfect compliance with Chrome Web Store policies
     * by preventing any possibility of remote code execution for regular users.
     *
     * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
     *
     * @returns Promise that resolves to the base URL for filter rules.
     */
    private async getFilterRulesBaseUrl(): Promise<string> {
        // We don't need to set base url in MV3 because we cannot update filters via patches.
        // TODO: Remove check when filters will support patches in MV3.
        if (__IS_MV3__) {
            return this.DEFAULT_FILTER_RULES_BASE_URL;
        }

        try {
            const url = await browserStorage.get(this.FILTERS_BASE_URL_KEY);

            if (typeof url !== 'string' || !url) {
                logger.warn('[ext.NetworkSettings.getFilterRulesBaseUrl]: Invalid filter rules base url from storage:', url);
                return this.DEFAULT_FILTER_RULES_BASE_URL;
            }

            return url;
        } catch (error) {
            logger.warn('[ext.NetworkSettings.getFilterRulesBaseUrl]: Failed to get filters base url from storage:', error);
            return this.DEFAULT_FILTER_RULES_BASE_URL;
        }
    }

    /**
     * Returns the url from which the filters can be loaded.
     *
     * @returns The url from which filters can be downloaded.
     */
    // eslint-disable-next-line class-methods-use-this
    get filtersUrl(): string {
        // first of all check whether it is mv3-build
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2985
        if (__IS_MV3__) {
            /**
             * To fully comply with Chrome Web Store policies regarding remote code execution,
             * we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.
             *
             * 1. Default - regular users that did not grant User scripts API permission explicitly:
             *    - We collect and pre-build script rules from the filters and statically bundle
             *      them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
             *      IMPORTANT: all scripts and their arguments are local and bundled within the extension.
             *    - These pre-verified local scripts are passed to the engine - STEP 2.
             *    - At runtime before the execution, we check if each script rule is included
             *      in our local scripts list (STEP 3).
             *    - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
             *      All other scripts are discarded.
             *    - Custom filters are NOT allowed for regular users to prevent any possibility
             *      of remote code execution, regardless of rule interpretation.
             *
             * 2. For advanced users that explicitly granted User scripts API permission -
             *    via enabling the Developer mode or Allow user scripts in the extension details:
             *    - Custom filters are allowed and may contain Scriptlet and JS rules
             *      that can be executed using the browser's built-in userScripts API (STEP 4.3),
             *      which provides a secure sandbox.
             *    - This execution bypasses the local script verification process but remains
             *      isolated and secure through Chrome's native sandboxing.
             *    - This mode requires explicit user activation and is intended for advanced users only.
             *
             * IMPORTANT:
             * Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
             * This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
             * When custom filters are allowed, they may contain:
             * 1. Network rules – converted to DNR rules and applied via dynamic rules.
             * 2. Cosmetic rules – interpreted directly in the extension code.
             * 3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
             *    with Chrome's native sandboxing providing security isolation.
             *
             * For regular users without User scripts API permission (default case):
             * - Only pre-bundled filters with statically verified scripts are supported.
             * - Downloading custom filters or any rules from remote sources is blocked entirely
             *   to ensure compliance with the store policies.
             *
             * This implementation ensures perfect compliance with Chrome Web Store policies
             * by preventing any possibility of remote code execution for regular users.
             *
             * It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.
             */
            return `${this.filtersRulesBaseUrl}/chromium-mv3`;
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
