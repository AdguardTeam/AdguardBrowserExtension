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
import { UserAgent } from '../../../common/user-agent';
import { BrowserUtils } from '../../utils/browser-utils';

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

    // Folder that contains filters metadata and files with rules. 'filters' by default
    readonly localFiltersFolder = 'filters';

    // TODO: Check, not using.
    // Path to the redirect sources
    readonly redirectSourcesFolder = 'assets/libs/scriptlets';

    // Array of filter identifiers, that have local file with rules. Range from 1 to 14 by default
    readonly localFilterIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    /**
     * Returns the url from which the filters can be loaded.
     *
     * @returns The url from which filters can be downloaded.
     */
    // eslint-disable-next-line class-methods-use-this
    get filtersUrl(): string {
        if (UserAgent.isFirefox) {
            return 'https://filters.adtidy.org/extension/firefox';
        } if (UserAgent.isEdge) {
            return 'https://filters.adtidy.org/extension/edge';
        } if (UserAgent.isOpera) {
            return 'https://filters.adtidy.org/extension/opera';
        }
        return 'https://filters.adtidy.org/extension/chromium';
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
        return `${this.filtersUrl}/filters.js?${params.join('&')}`;
    }

    /**
     * Returns URL for downloading i18n localizations.
     *
     * @returns URL for downloading i18n localizations.
     */
    get filtersI18nMetadataUrl(): string {
        const params = BrowserUtils.getExtensionParams();
        return `${this.filtersUrl}/filters_i18n.json?${params.join('&')}`;
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
