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
import browser from 'webextension-polyfill';

import { FiltersDownloader, type DownloadResult } from '@adguard/filters-downloader/browser';

import { LOCAL_METADATA_FILE_NAME } from '../../../../../../constants';
import { logger } from '../../../../common/logger';
import { type Metadata, metadataValidator } from '../../../schema';

import {
    type ExtensionXMLHttpRequest,
    NetworkCommon,
    type ResponseLikeXMLHttpRequest,
    type DownloadFilterRulesOptions,
} from './network-common';

/**
 * Api for working with our backend server.
 * All requests sent by this class are covered in the privacy policy:
 * http://adguard.com/en/privacy.html#browsers.
 */
export class Network extends NetworkCommon {
    /**
     * Downloads filter rules by filter ID.
     *
     * @param options Download options.
     * @param options.filterUpdateOptions Filter update detail containing filterId and other update info.
     * @param options.forceRemote Force download filter rules from remote server.
     * @param options.useOptimizedFilters Download optimized filters flag.
     * @param options.rawFilter Raw filter rules for patch updates.
     *
     * @returns Downloaded filter rules.
     *
     * @throws An error if FiltersDownloader.downloadWithRaw() fails.
     */
    public async downloadFilterRules({
        filterUpdateOptions,
        forceRemote = false,
        useOptimizedFilters,
        rawFilter,
    }: DownloadFilterRulesOptions): Promise<DownloadResult> {
        let url: string = '';
        const { filterId } = filterUpdateOptions;

        const hasFilterIdInLocalFilters = this.settings.localFilterIds.indexOf(filterId) >= 0;

        if (!forceRemote && !hasFilterIdInLocalFilters) {
            /**
             * Search for 'JS_RULES_EXECUTION' to find all parts of script execution
             * process in the extension.
             */

            // eslint-disable-next-line max-len
            throw new Error(`Cannot locally load filter with id ${filterId} because it is not built in the extension local resources.`);
        }

        let isLocalFilter = false;

        if (forceRemote || !hasFilterIdInLocalFilters) {
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
            // full remote filter update
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
     * Loads filters metadata from local file.
     *
     * @returns Object of {@link Metadata}.
     *
     * @throws Error if metadata is invalid.
     */
    public async getLocalFiltersMetadata(): Promise<Metadata> {
        // Metadata is stored in a separate JSON file.
        const url = browser.runtime.getURL(`${this.settings.localFiltersFolder}/${LOCAL_METADATA_FILE_NAME}`);

        let response: ExtensionXMLHttpRequest | ResponseLikeXMLHttpRequest;

        try {
            response = await NetworkCommon.fetchJson(url);
        } catch (e: unknown) {
            const exMessage = e instanceof Error ? e.message : 'could not load local filters metadata';
            throw NetworkCommon.createError(exMessage, url);
        }

        if (!response?.responseText) {
            throw NetworkCommon.createError('empty response', url, response);
        }

        try {
            const metadata = JSON.parse(response.responseText);
            return metadataValidator.parse(metadata);
        } catch (e: unknown) {
            // TODO: Return regular error
            // TODO: Zod error doesn't display
            throw NetworkCommon.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }
}

export const network = new Network();
