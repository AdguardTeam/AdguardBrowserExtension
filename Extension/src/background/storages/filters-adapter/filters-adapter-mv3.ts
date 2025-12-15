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

import { FiltersStorage as TsWebExtensionFiltersStorage } from '@adguard/tswebextension/filters-storage';
import { extractRuleSetId } from '@adguard/tsurlfilter/es/declarative-converter-utils';
import { METADATA_RULESET_ID } from '@adguard/tsurlfilter/es/declarative-converter';
import { type ConversionData, type ConvertedFilterList } from '@adguard/tsurlfilter';

import { FiltersStorage as BrowserExtensionFiltersStorage } from '../filters';
import { logger } from '../../../common/logger';

import { FiltersStoragesAdapterCommon } from './filters-adapter-common';

/**
 * The `FiltersStoragesAdapter` is a high-level class responsible for ensuring that
 * the appropriate filter storage is invoked for different types of filters.
 *
 * In the MV3 version, static filters (rulesets) are deployed alongside the extension in JSON format.
 * Our engine operates on binary data (which is part of the preprocessed filters),
 * but these JSON rulesets do not support storing binary data. Additionally,
 * querying data from JSON is not the most efficient operation.
 *
 * To address this, `TSWebExtension` internally manages its own IndexedDB store,
 * where it automatically synchronizes rulesets as preprocessed filter lists.
 * However, this logic applies only to rulesets in MV3. User filters, allowlists, and custom filters
 * are not affected by this mechanism—they are still stored using the classic `FiltersStorage`,
 * which is managed by the browser extension.
 *
 * To simplify the usage of multiple storages, we introduced this adapter,
 * which always calls the appropriate storage for each filter list.
 * This allows the lower-level storage implementations to remain focused on
 * their specific responsibilities while ensuring seamless integration.
 */
export class FiltersStoragesAdapter extends FiltersStoragesAdapterCommon {
    /**
     * Cache for static filter IDs.
     */
    private static staticFilterIds: ReadonlySet<number> | null = null;

    /**
     * Sets specified filter list with the specified ID in the storage.
     *
     * @note This method does nothing in MV3 version if the filter ID is a static filter ID,
     * because static filters are managed by TSWebExtension.
     *
     * @param filterId Filter id.
     * @param filter Raw filter list or preprocessed filter list.
     */
    public static async set(filterId: number, filter: string | ConvertedFilterList): Promise<void> {
        // Do not allow to modify static filters in MV3.
        if (FiltersStoragesAdapter.isStaticFilterId(filterId)) {
            logger.error(`[ext.FiltersStoragesAdapter.set]: filter id ${filterId} is a static filter id, modifying it is not allowed from the extension.`);
            return;
        }

        await FiltersStoragesAdapterCommon.set(filterId, filter);
    }

    /** @inheritdoc */
    public static async has(filterId: number): Promise<boolean> {
        if (FiltersStoragesAdapter.isStaticFilterId(filterId)) {
            return TsWebExtensionFiltersStorage.has(filterId);
        }

        return FiltersStoragesAdapterCommon.has(filterId);
    }

    /**
     * Removes the filter list with the specified ID from the storage.
     *
     * @note This method does nothing in MV3 version if the filter ID is a static filter ID,
     * because static filters are managed by TSWebExtension.
     *
     * @param filterId Filter id.
     */
    public static async remove(filterId: number): Promise<void> {
        if (FiltersStoragesAdapter.isStaticFilterId(filterId)) {
            logger.error(`[ext.FiltersStoragesAdapter.remove]: filter id ${filterId} is a static filter id, removing it is not allowed from the extension.`);
            return;
        }

        await FiltersStoragesAdapterCommon.remove(filterId);
    }

    /**
     * Gets the raw filter list content for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Raw filter list content or `undefined` if the filter list does not exist.
     */
    public static async getFilterContent(filterId: number): Promise<string | undefined> {
        if (__IS_MV3__) {
            const staticFilterIds = FiltersStoragesAdapter.getStaticFilterIds();
            if (staticFilterIds !== null && staticFilterIds.has(filterId)) {
                return TsWebExtensionFiltersStorage.getRawFilterList(filterId);
            }
        }

        return BrowserExtensionFiltersStorage.getFilterContent(filterId);
    }

    /**
     * Gets the conversion map for the specified filter ID.
     *
     * @param filterId Filter id.
     *
     * @returns Conversion map or `undefined` if the filter list does not exist.
     */
    public static async getConversionData(filterId: number): Promise<ConversionData | undefined> {
        if (__IS_MV3__) {
            const staticFilterIds = FiltersStoragesAdapter.getStaticFilterIds();
            if (staticFilterIds !== null && staticFilterIds.has(filterId)) {
                return TsWebExtensionFiltersStorage.getConversionData(filterId);
            }
        }

        return BrowserExtensionFiltersStorage.getConversionData(filterId);
    }

    /**
     * Checks whether the given filter ID corresponds to a *static* filter.
     *
     * @param filterId Filter id.
     *
     * @returns True if the given ID represents a static filter, otherwise false.
     */
    private static isStaticFilterId(filterId: number): boolean {
        const staticFilterIds = FiltersStoragesAdapter.getStaticFilterIds();

        return staticFilterIds !== null && staticFilterIds.has(filterId);
    }

    /**
     * Returns a set of static filter IDs for MV3.
     *
     * @note This method caches the result for subsequent calls.
     *
     * @returns Set of static filter ids or `null` if the manifest does not have declarative_net_request.
     */
    private static getStaticFilterIds(): ReadonlySet<number> | null {
        if (FiltersStoragesAdapter.staticFilterIds !== null) {
            return FiltersStoragesAdapter.staticFilterIds;
        }

        const manifest = browser.runtime.getManifest();

        if (!manifest.declarative_net_request) {
            return null;
        }

        FiltersStoragesAdapter.staticFilterIds = new Set(
            manifest.declarative_net_request.rule_resources
                .map(({ id }) => extractRuleSetId(id))
                // Metadata ruleset is not a real ruleset, so we should not include it in the list of static rulesets.
                // Also, its ID is conflicting with the ID of User Rules.
                .filter((id): id is number => id !== null && id !== METADATA_RULESET_ID),
        );

        return FiltersStoragesAdapter.staticFilterIds;
    }
}
