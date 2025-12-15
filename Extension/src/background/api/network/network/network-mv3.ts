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
// TODO (AG-44868): Reduce code duplication across mv2 and mv3
import browser from 'webextension-polyfill';

import { FiltersDownloader, type DownloadResult } from '@adguard/filters-downloader/browser';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { METADATA_RULESET_ID, MetadataRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';
import { TsWebExtension } from '@adguard/tswebextension/mv3';

import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { logger } from '../../../../common/logger';
import { type Metadata, metadataValidator } from '../../../schema';
import { type FilterUpdateOptions } from '../../filters';
import { NEWLINE_CHAR_REGEX } from '../../../../common/constants';
import { FiltersStoragesAdapter } from '../../../storages/filters-adapter';
import { isUserScriptsApiSupported } from '../../../../common/user-scripts-api/user-scripts-api-mv3';

import {
    type ExtensionXMLHttpRequest,
    NetworkCommon,
    type ResponseLikeXMLHttpRequest,
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
     * @param filterUpdateOptions Filter update detail.
     * @param forceRemote Force download filter rules from remote server. This parameter is ignored for MV3, and only
     * exists for compatibility.
     * @param useOptimizedFilters Download optimized filters flag.
     * @param rawFilter Raw filter rules.
     *
     * @returns Downloaded filter rules.
     *
     * @throws An error if FiltersDownloader.downloadWithRaw() fails.
     * @throws An error if Userscript API is not enabled. It is required to download remote filters in MV3.
     */
    public async downloadFilterRules(
        filterUpdateOptions: FilterUpdateOptions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        forceRemote: boolean,
        useOptimizedFilters: boolean,
        rawFilter?: string,
    ): Promise<DownloadResult> {
        let url: string = '';
        const { filterId } = filterUpdateOptions;

        // Custom filters are always downloaded from remote.
        const isRemote = CustomFilterUtils.isCustomFilter(filterId);
        const isLocalFilter = !isRemote;

        if (isRemote) {
            // Only allow downloading if the userscript api is enabled
            if (!isUserScriptsApiSupported()) {
                throw new Error('Userscript API is required to download remote filters');
            }

            if (useOptimizedFilters) {
                logger.info('[ext.Network.downloadFilterRules]: optimized filters are not supported in MV3, full versions will be downloaded.');
            }
            url = this.getUrlForDownloadFilterRules(filterId, false);
        }

        // local filters do not support patches, that is why we always download them fully
        if (isLocalFilter || filterUpdateOptions.ignorePatches || !rawFilter) {
            // TODO: Check, if this comment is correct and understandable.
            // For MV3 we load local filters not from files, but from the
            // prepared data in filters storage, to which we write the binary
            // data from @adguard/dnr-rulesets. See AG-36824 for details.

            // Sync the declarative ruleset with IndexedDB to ensure the filter
            // data is available in the storage before attempting to retrieve it.
            // Note: because this method called before first run of tswebextension,
            // it will use it's own default log level.
            await TsWebExtension.syncRuleSetWithIdbByFilterId(filterId, 'filters/declarative');

            const rawFilterList = await FiltersStoragesAdapter.getRawFilterList(filterId);

            if (!rawFilterList) {
                throw new Error(`Cannot find filter with id ${filterId}`);
            }

            return {
                filter: rawFilterList.split(NEWLINE_CHAR_REGEX),
                rawFilter: rawFilterList,
            };
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
     * For MV3, it loads metadata from the metadata ruleset file.
     *
     * @returns Object of {@link Metadata}.
     *
     * @throws Error if metadata is invalid.
     */
    public async getLocalFiltersMetadata(): Promise<Metadata> {
        // For MV3, the filters metadata is stored in the metadata ruleset.
        // The reason for this is that it allows us to perform extension updates
        // where only the JSON files of the rulesets are changed.
        const metadataRuleSetPath = getRuleSetPath(
            METADATA_RULESET_ID,
            `${this.settings.localFiltersFolder}/declarative`,
        );
        const url = browser.runtime.getURL(metadataRuleSetPath);

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
            const metadataRuleSet = MetadataRuleSet.deserialize(response.responseText);
            // Filters metadata is stored as an additional property in the metadata ruleset.
            const filtersMetadata = metadataRuleSet.getAdditionalProperty('metadata') || {};
            const metadata = {
                version: metadataRuleSet.getAdditionalProperty('version'),
                versionTimestampMs: metadataRuleSet.getAdditionalProperty('versionTimestampMs'),
                ...filtersMetadata,
            };
            return metadataValidator.parse(metadata);
        } catch (e: unknown) {
            // TODO: Return regular error
            // TODO: Zod error doesn't display
            throw NetworkCommon.createError('invalid response', url, response, e instanceof Error ? e : undefined);
        }
    }
}

export const network = new Network();
