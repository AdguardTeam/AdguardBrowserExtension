/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
import browser from 'webextension-polyfill';
import { NetworkSettings } from 'network-api-settings';

import {
    FiltersDownloader,
    type DefinedExpressions,
    type DownloadResult,
} from '@adguard/filters-downloader/browser';

import { type FilterUpdateOptions } from '../../filters/update';
import { LOCAL_I18N_METADATA_FILE_NAME } from '../../../../../../constants';
import { logger } from '../../../../common/logger';
import { UserAgent } from '../../../../common/user-agent';
import {
    type Metadata,
    type I18nMetadata,
    type LocalScriptRules,
    metadataValidator,
    i18nMetadataValidator,
    localScriptRulesValidator,
} from '../../../schema';

export type ExtensionXMLHttpRequest = XMLHttpRequest & { mozBackgroundRequest: boolean };

export type ResponseLikeXMLHttpRequest = Pick<
    ExtensionXMLHttpRequest,
    'status' | 'statusText' | 'responseText' | 'mozBackgroundRequest'
>;

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
 * Options for downloading filter rules.
 */
export interface DownloadFilterRulesOptions {
    /**
     * Filter update detail containing filterId and other update info.
     */
    filterUpdateOptions: FilterUpdateOptions;
    /**
     * Download optimized filters flag.
     */
    useOptimizedFilters: boolean;
    /**
     * Raw filter rules for patch updates.
     */
    rawFilter?: string;

    /**
     * Force download filter rules from remote server.
     */
    forceRemote?: boolean;
}

/**
 * An in-flight subscription download and the raw base used for its patches.
 */
type LoadingSubscription = {
    promise: Promise<DownloadResult>;
    rawFilter: string | undefined;
    expiresAt: number;
};

/**
 * Api for working with our backend server.
 * All requests sent by this class are covered in the privacy policy:
 * http://adguard.com/en/privacy.html#browsers.
 */
export abstract class NetworkCommon {
    protected settings = new NetworkSettings();

    /**
     * FiltersDownloader constants.
     */
    protected filterCompilerConditionsConstants: DefinedExpressions = {
        adguard: true,
        adguard_ext_chromium: UserAgent.isChromium,
        adguard_ext_firefox: UserAgent.isFirefox,
        adguard_ext_edge: UserAgent.isEdge,
        adguard_ext_safari: false,
        adguard_ext_opera: UserAgent.isOpera,
    };

    /**
     * Map of the filter downloads which are currently in progress.
     *
     * Downloads share results only for the same mode and raw base, except
     * forced downloads, which ignore the raw base. Entries expire after the
     * timeout passed by the caller, so hanging requests do not occupy their
     * slot forever.
     */
    private loadingSubscriptions = new Map<string, LoadingSubscription>();

    /**
     * Initializes the network settings.
     *
     * @returns A promise that resolves when the settings are initialized.
     */
    public async init(): Promise<void> {
        await this.settings.init();
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
     * Downloads filter rules by url. Needed for custom filter lists.
     *
     * Equivalent downloads share their result until the entry expires.
     * Expiry does not cancel the underlying download.
     *
     * @param url Subscription url.
     * @param rawFilter Raw filter rules.
     * @param force Boolean flag to download filter fully or by patches.
     * @param timeoutMs Time limit in milliseconds, after which the in-flight
     * entry is evicted, so later calls start a new request.
     *
     * @returns Downloaded filter rules.
     *
     * @throws Error if filter download fails.
     */
    public async downloadFilterRulesBySubscriptionUrl(
        url: string,
        rawFilter: string | undefined,
        force: boolean | undefined,
        timeoutMs: number,
    ): Promise<DownloadResult> {
        const subscriptionKey = `${force ? 'force' : 'patch'}:${url}`;

        const loadingSubscription = this.loadingSubscriptions.get(subscriptionKey);
        if (
            loadingSubscription
            && loadingSubscription.expiresAt > Date.now()
            && (force || loadingSubscription.rawFilter === rawFilter)
        ) {
            logger.info(`[ext.NetworkCommon.downloadFilterRulesBySubscriptionUrl]: filter ${url} is already loading, reusing the request`);
            return loadingSubscription.promise;
        }

        const downloadingSubscription: LoadingSubscription = {
            promise: this.downloadSubscriptionData(url, rawFilter, force),
            rawFilter,
            expiresAt: Date.now() + timeoutMs,
        };
        this.loadingSubscriptions.set(subscriptionKey, downloadingSubscription);

        const removeSubscription = (): void => {
            // An older request must not evict its replacement.
            if (this.loadingSubscriptions.get(subscriptionKey) === downloadingSubscription) {
                this.loadingSubscriptions.delete(subscriptionKey);
            }
        };
        // eslint-disable-next-line no-restricted-globals
        const timeoutId = self.setTimeout(removeSubscription, timeoutMs);

        try {
            return await downloadingSubscription.promise;
        } finally {
            // eslint-disable-next-line no-restricted-globals
            self.clearTimeout(timeoutId);
            removeSubscription();
        }
    }

    /**
     * Performs the download of filter rules by the subscription url.
     *
     * @param url Subscription url.
     * @param rawFilter Raw filter rules.
     * @param force Boolean flag to download filter fully or by patches.
     *
     * @returns Downloaded filter rules.
     *
     * @throws Error if filter download fails.
     */
    private async downloadSubscriptionData(
        url: string,
        rawFilter?: string,
        force?: boolean,
    ): Promise<DownloadResult> {
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

            // Get the first rule to check if it is an adblock agent (like [Adblock Plus 2.0]). If so, ignore it.
            const firstRule = downloadData.filter[0]?.trim();

            if (firstRule && firstRule.startsWith('[') && firstRule.endsWith(']')) {
                downloadData.filter.shift();
            }

            return downloadData;
        } catch (e: unknown) {
            const message = e instanceof Error
                ? e.message
                : 'Unknown error while filter downloading by subscription url';

            throw new Error(message, { cause: e });
        }
    }

    /**
     * Loads filter groups metadata from local file.
     *
     * @returns Object of {@link I18nMetadata}.
     *
     * @throws Error if metadata is invalid.
     */
    public async getLocalFiltersI18nMetadata(): Promise<I18nMetadata> {
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/${LOCAL_I18N_METADATA_FILE_NAME}`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await NetworkCommon.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local filters i18n metadata';
            throw NetworkCommon.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw NetworkCommon.createError('empty response', url, response);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return i18nMetadataValidator.parse(metadata);
        } catch (e: unknown) {
            // TODO: Return regular error
            // TODO: Zod error doesn't display
            throw NetworkCommon.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Loads script rules from local file.
     * This method should be called only in the Firefox AMO.
     *
     * @returns Array of string script rules.
     *
     * @throws Error if metadata is invalid.
     */
    public async getLocalScriptRules(): Promise<LocalScriptRules> {
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/local_script_rules.json`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await NetworkCommon.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local script rules';
            throw NetworkCommon.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw NetworkCommon.createError('empty response', url, response);
        }

        try {
            const localScriptRules = JSON.parse(response.responseText);

            return localScriptRulesValidator.parse(localScriptRules);
        } catch (e: unknown) {
            throw NetworkCommon.createError('invalid response', url, response, e instanceof Error ? e : undefined);
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
        const response = await NetworkCommon.fetchJson(url);
        if (!response?.responseText) {
            throw new Error(`Empty response: ${response}`);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return metadataValidator.parse(metadata);
        } catch (e: unknown) {
            throw NetworkCommon.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }

    /**
     * Downloads i18n metadata from backend and returns it.
     *
     * @returns Object of {@link I18nMetadata}.
     *
     * @throws Error if metadata is invalid.
     */
    public async downloadI18nMetadataFromBackend(): Promise<I18nMetadata> {
        const response = await NetworkCommon.fetchJson(this.settings.filtersI18nMetadataUrl);

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
        const response = await NetworkCommon.fetchJson(url);
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
     *
     * @throws Error if filter rules URL is not defined.
     */
    public getUrlForDownloadFilterRules(filterId: number, useOptimizedFilters: boolean): string {
        if (!this.settings.filterRulesUrl
            || !this.settings.optimizedFilterRulesUrl) {
            throw new Error('Filter rules URL is not defined');
        }

        const url = useOptimizedFilters ? this.settings.optimizedFilterRulesUrl : this.settings.filterRulesUrl;
        return url.replaceAll('{filter_id}', String(filterId));
    }

    /**
     * Makes a request for json.
     *
     * @param url Url.
     *
     * @returns Response with type {@link ResponseLikeXMLHttpRequest} to be
     * compatible with XMLHttpRequest.
     */
    protected static async fetchJson(url: string): Promise<ResponseLikeXMLHttpRequest> {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const responseText = await response.text();

        return {
            status: response.status,
            statusText: response.statusText,
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
    protected static createError(
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
