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
import browser from 'webextension-polyfill';

import {
    FiltersDownloader,
    DefinedExpressions,
    type DownloadResult,
} from '@adguard/filters-downloader/browser';

import { LOCAL_METADATA_FILE_NAME, LOCAL_I18N_METADATA_FILE_NAME } from '../../../../../constants';
import { logger } from '../../../common/logger';
import { UserAgent } from '../../../common/user-agent';
import {
    type Metadata,
    type I18nMetadata,
    type LocalScriptRules,
    metadataValidator,
    i18nMetadataValidator,
    localScriptRulesValidator,
} from '../../schema';
import { CustomFilterApi, type FilterUpdateOptions } from '../filters';

import { NetworkSettings } from './settings';

export type ExtensionXMLHttpRequest = XMLHttpRequest & { mozBackgroundRequest: boolean };

export type ResponseLikeXMLHttpRequest = Response
    & Pick<ExtensionXMLHttpRequest, 'responseText' | 'mozBackgroundRequest'>;

/**
 * Hit statistics for a single filter.
 * - Keys are rule texts (strings).
 * - Values are the number of times the rule was applied.
 *
 * @example
 * ```
 * {
 *   "||example.com": 3
 * }
 * ```
 */
export type FilterHitStats = {
    [ruleText: string]: number;
};

/**
 * Hit statistics for multiple filters.
 * - Keys are filter IDs.
 * - Values are the hit statistics for each filter.
 */
export type FiltersHitStats = {
    [filterId: number]: FilterHitStats;
};

/**
 * Aggregated hit statistics for all filters.
 * - Contains a `filters` object, where keys are filter IDs and values are hit statistics for each filter.
 */
type HitStats = {
    filters: FiltersHitStats;
};

/**
 * Api for working with our backend server.
 * All requests sent by this class are covered in the privacy policy:
 * http://adguard.com/en/privacy.html#browsers.
 */
export class Network {
    private settings = new NetworkSettings();

    /**
     * FiltersDownloader constants.
     */
    private filterCompilerConditionsConstants: DefinedExpressions = {
        adguard: true,
        adguard_ext_chromium: UserAgent.isChromium,
        adguard_ext_firefox: UserAgent.isFirefox,
        adguard_ext_edge: UserAgent.isEdge,
        adguard_ext_safari: false,
        adguard_ext_opera: UserAgent.isOpera,
    };

    /**
     * Loading subscriptions map.
     */
    private loadingSubscriptions: Record<string, boolean> = {};

    /**
     * Returns promise that resolves when network is initialized.
     * Only needed in MV3 with async initialization.
     *
     * @returns Promise that resolves when network is initialized.
     */
    public waitForNetworkInit(): Promise<void> | null {
        return this.settings.initPromise;
    }

    /**
     * Checks if filter has local copy in the extension resources or not.
     *
     * @param filterId Filter id.
     *
     * @returns True if filter has local copy, false otherwise.
     */
    public isFilterHasLocalCopy(filterId: number): boolean {
        return this.settings.localFilterIds.includes(filterId);
    }

    /**
     * Downloads filter rules by filter ID.
     *
     * @param filterUpdateOptions Filter update detail.
     * @param forceRemote Force download filter rules from remote server.
     * @param useOptimizedFilters Download optimized filters flag.
     * @param rawFilter Raw filter rules.
     *
     * @returns Downloaded filter rules.
     *
     * @throws An error if FiltersDownloader.downloadWithRaw() fails.
     */
    public async downloadFilterRules(
        filterUpdateOptions: FilterUpdateOptions,
        forceRemote: boolean,
        useOptimizedFilters: boolean,
        rawFilter?: string,
    ): Promise<DownloadResult> {
        let url: string;
        const { filterId } = filterUpdateOptions;

        if (
            !__IS_MV3__
            && !forceRemote
            && this.settings.localFilterIds.indexOf(filterId) < 0
        ) {
            // eslint-disable-next-line max-len
            throw new Error(`Cannot locally load filter with id ${filterId} because it is not build in the extension local resources.`);
        }

        let isLocalFilter = false;
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
        if (__IS_MV3__) {
            url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/filter_${filterId}.txt`);

            // `forceRemote` flag for MV3 can be used only for Custom filters which are not included in the extension
            // and can only be manually added by the user.
            const isRemote = forceRemote && CustomFilterApi.isCustomFilter(filterId);

            if (isRemote) {
                if (useOptimizedFilters) {
                    logger.info('Optimized filters are not supported in MV3, full versions will be downloaded');
                }
                url = this.getUrlForDownloadFilterRules(filterId, false);
            }

            isLocalFilter = !isRemote;
        } else if (forceRemote || this.settings.localFilterIds.indexOf(filterId) < 0) {
            url = this.getUrlForDownloadFilterRules(filterId, useOptimizedFilters);
        } else {
            const filterFileName = useOptimizedFilters
                ? `filter_mobile_${filterId}.txt`
                : `filter_${filterId}.txt`;
            url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/${filterFileName}`);
            isLocalFilter = true;
        }

        // local filters do not support patches, that is why we always download them fully
        if (isLocalFilter || filterUpdateOptions.ignorePatches || !rawFilter) {
            const result = await FiltersDownloader.downloadWithRaw(
                url,
                {
                    force: true,
                    definedExpressions: this.filterCompilerConditionsConstants,
                    verbose: logger.isVerbose(),
                    // Disable checksum checking for local filters, because we
                    // apply preprocessing for them, during which some rules may
                    // be changed, and as a result, the filter checksum will
                    // become invalid.
                    validateChecksum: !isLocalFilter,
                    // use true because we know that our filters have checksums
                    validateChecksumStrict: true,
                },
            );
            return result;
        }

        return FiltersDownloader.downloadWithRaw(
            url,
            {
                rawFilter,
                definedExpressions: this.filterCompilerConditionsConstants,
                verbose: logger.isVerbose(),
                validateChecksum: true,
                // use true because we know that our filters have checksums
                validateChecksumStrict: true,
            },
        );
    }

    /**
     * Downloads filter rules by url. Needed for custom filter lists.
     *
     * @param url Subscription url.
     * @param rawFilter Raw filter rules.
     * @param force Boolean flag to download filter fully or by patches.
     *
     * @returns Downloaded filter rules.
     */
    public async downloadFilterRulesBySubscriptionUrl(
        url: string,
        rawFilter?: string,
        force?: boolean,
    ): Promise<DownloadResult | undefined> {
        if (url in this.loadingSubscriptions) {
            return;
        }

        this.loadingSubscriptions[url] = true;

        try {
            // TODO: runtime validation
            const downloadData = await FiltersDownloader.downloadWithRaw(
                url,
                {
                    definedExpressions: this.filterCompilerConditionsConstants,
                    force,
                    rawFilter,
                    verbose: logger.isVerbose(),
                    validateChecksum: true,
                    // use false because we know that custom filters might not have checksums
                    validateChecksumStrict: false,
                },
            );

            delete this.loadingSubscriptions[url];

            // Get the first rule to check if it is an adblock agent (like [Adblock Plus 2.0]). If so, ignore it.
            const firstRule = downloadData.filter[0]?.trim();

            if (firstRule && firstRule.startsWith('[') && firstRule.endsWith(']')) {
                downloadData.filter.shift();
            }

            return downloadData;
        } catch (e: unknown) {
            delete this.loadingSubscriptions[url];
            const message = e instanceof Error
                ? e.message
                : 'Unknown error while filter downloading by subscription url';

            throw new Error(message, { cause: e });
        }
    }

    /**
     * Loads filter groups metadata.
     *
     * @throws Error if metadata is invalid.
     *
     * @returns Object of {@link Metadata}.
     */
    public async getLocalFiltersMetadata(): Promise<Metadata> {
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/${LOCAL_METADATA_FILE_NAME}`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await Network.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local filters metadata';
            throw Network.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw Network.createError('empty response', url, response);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return metadataValidator.parse(metadata);
        } catch (e: unknown) {
            // TODO: Return regular error
            // TODO: Zod error doesn't display
            throw Network.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Loads filter groups metadata from local file.
     *
     * @throws Error if metadata is invalid.
     *
     * @returns Object of {@link I18nMetadata}.
     */
    public async getLocalFiltersI18nMetadata(): Promise<I18nMetadata> {
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/${LOCAL_I18N_METADATA_FILE_NAME}`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await Network.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local filters i18n metadata';
            throw Network.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw Network.createError('empty response', url, response);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return i18nMetadataValidator.parse(metadata);
        } catch (e: unknown) {
            // TODO: Return regular error
            // TODO: Zod error doesn't display
            throw Network.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Loads script rules from local file.
     * This method should be called only in the Firefox AMO.
     *
     * @throws Error if metadata is invalid.
     *
     * @returns Array of string script rules.
     */
    public async getLocalScriptRules(): Promise<LocalScriptRules> {
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/local_script_rules.json`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await Network.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local script rules';
            throw Network.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw Network.createError('empty response', url, response);
        }

        try {
            const localScriptRules = JSON.parse(response.responseText);

            return localScriptRulesValidator.parse(localScriptRules);
        } catch (e: unknown) {
            throw Network.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Downloads metadata from backend.
     *
     * @returns Object of {@link Metadata}.
     *
     * @throws Error if metadata is invalid.
     */
    public async downloadMetadataFromBackend(): Promise<Metadata> {
        const url = this.settings.filtersMetadataUrl;
        const response = await Network.fetchJson(url);
        if (!response?.responseText) {
            throw new Error(`Empty response: ${response}`);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return metadataValidator.parse(metadata);
        } catch (e: unknown) {
            throw Network.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Downloads i18n metadata from backend and returns it.
     *
     * @throws Error if metadata is invalid.
     *
     * @returns Object of {@link I18nMetadata}.
     */
    public async downloadI18nMetadataFromBackend(): Promise<I18nMetadata> {
        const response = await Network.fetchJson(this.settings.filtersI18nMetadataUrl);

        if (!response?.responseText) {
            throw new Error(`Empty response: ${response}`);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return i18nMetadataValidator.parse(metadata);
        } catch (e) {
            throw new Error(`Invalid response: ${response}`, { cause: e });
        }
    }

    /**
     * Checks specified host hashes with our safebrowsing service.
     *
     * @param hashes Host hashes.
     *
     * @returns Response from the safebrowsing service.
     */
    public async lookupSafebrowsing(hashes: string[]): Promise<ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest> {
        const url = `${this.settings.safebrowsingLookupUrl}?prefixes=${encodeURIComponent(hashes.join('/'))}`;
        const response = await Network.fetchJson(url);
        return response;
    }

    /**
     * Sends filter hits stats to backend server.
     * This method is used if user has enabled "Send statistics for ad filters usage".
     * More information about ad filters usage stats:
     * http://adguard.com/en/filter-rules-statistics.html.
     *
     * @param stats Sent stats.
     */
    public async sendHitStats(stats: HitStats): Promise<void> {
        const statsString = JSON.stringify(stats);

        await fetch(this.settings.ruleStatsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: statsString,
        });
    }

    /**
     * URL for downloading AG filter.
     *
     * @param filterId Filter identifier.
     * @param useOptimizedFilters If true, download optimized filters.
     *
     * @returns Url for filter downloading.
     * @throws Error if filter rules URL is not defined or called in MV3.
     */
    public getUrlForDownloadFilterRules(filterId: number, useOptimizedFilters: boolean): string {
        if (__IS_MV3__) {
            throw new Error('MV3 does not support remote filter downloading');
        }

        if (!this.settings.filterRulesUrl
            || !this.settings.optimizedFilterRulesUrl) {
            throw new Error('Filter rules URL is not defined');
        }

        const url = useOptimizedFilters ? this.settings.optimizedFilterRulesUrl : this.settings.filterRulesUrl;
        return url.replaceAll('{filter_id}', String(filterId));
    }

    /**
     * Appends request key to url.
     *
     * @param url Url string.
     *
     * @returns Url with key query param.
     */
    private addKeyParameter(url: string): string {
        return `${url}&key=${this.settings.apiKey}`;
    }

    /**
     * Makes a request for json.
     *
     * @param url Url.
     *
     * @returns Response with type {@link ResponseLikeXMLHttpRequest} to be
     * compatible with XMLHttpRequest.
     */
    private static async fetchJson(url: string): Promise<ResponseLikeXMLHttpRequest> {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const responseText = await response.text();

        // TODO: Use fetch response directly.
        return {
            ...response,
            mozBackgroundRequest: true,
            responseText,
        };
    }

    /**
     * Creates a custom network error to throw it to a higher level.
     *
     * @param message Error message.
     * @param url Url where the error occurred.
     * @param response Network response information {@link ExtensionXMLHttpRequest}.
     * @param originError Original error.
     *
     * @returns Error "wrapper".
     */
    private static createError(
        message: string,
        url: string,
        response?: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest,
        originError?: Error,
    ): Error {
        let errorMessage = `
            error:                    ${message}
            requested url:            ${url}`;

        if (response) {
            errorMessage = `
            error:                    ${message}
            requested url:            ${url}
            request status text:      ${response.statusText}`;
        }

        return new Error(errorMessage, { cause: originError });
    }
}

export const network = new Network();
