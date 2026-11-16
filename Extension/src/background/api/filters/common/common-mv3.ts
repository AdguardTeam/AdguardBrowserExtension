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
import { type FilterUpdateOptions } from '../update';
import { type RegularFilterMetadata } from '../../../schema';
import { FiltersStoragesAdapter } from '../../../storages/filters-adapter';

import { CommonFilterApiCommon } from './common-common';

/**
 * Extends {@link CommonFilterApiCommon}.
 */
export class CommonFilterApi extends CommonFilterApiCommon {
    /**
     * @inheritdoc
     */
    public static override async loadFilterRulesFromBackend(
        filterUpdateOptions: FilterUpdateOptions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        forceRemote: boolean,
    ): Promise<RegularFilterMetadata> {
        return CommonFilterApiCommon.loadFilterRulesFromBackend(filterUpdateOptions, false);
    }

    /**
     * Checks whether the filter is supported: the extension bundle must contain
     * the filter ruleset.
     *
     * @param filterId Filter id.
     *
     * @returns True if filter is supported, false otherwise.
     */
    public static isFilterSupported(filterId: number): boolean {
        // The manifest does not declare rulesets, so the check is not possible;
        // fall back to the presence of the filter in the metadata.
        if (!FiltersStoragesAdapter.hasStaticFilterIds()) {
            return super.getFilterMetadata(filterId) !== undefined;
        }

        return CommonFilterApi.hasRuleset(filterId);
    }

    /**
     * Returns common filters metadata without filters that have no ruleset in
     * the extension bundle.
     *
     * The MV3 engine can enable only filters with a bundled ruleset, while the
     * metadata can be downloaded from the remote source and list such filters.
     *
     * @returns Common filters metadata array.
     */
    public static override getFiltersMetadata(): RegularFilterMetadata[] {
        const filters = super.getFiltersMetadata();

        // The manifest does not declare rulesets, so the check is not possible.
        if (!FiltersStoragesAdapter.hasStaticFilterIds()) {
            return filters;
        }

        return filters.filter((filter) => CommonFilterApi.hasRuleset(filter.filterId));
    }

    /**
     * Returns common filter metadata without filters that have no ruleset in
     * the extension bundle.
     *
     * @param filterId Filter id.
     *
     * @returns Common filter metadata or `undefined` if the filter has no
     * ruleset in the extension bundle.
     */
    public static override getFilterMetadata(filterId: number): RegularFilterMetadata | undefined {
        // The manifest does not declare rulesets, so the check is not possible.
        if (FiltersStoragesAdapter.hasStaticFilterIds() && !CommonFilterApi.hasRuleset(filterId)) {
            return undefined;
        }

        return super.getFilterMetadata(filterId);
    }

    /**
     * Checks whether the extension bundle contains a ruleset for the filter.
     *
     * @param filterId Filter id.
     *
     * @returns True if the manifest declares a ruleset for the filter, false
     * otherwise, including the case when the manifest declares no rulesets.
     */
    private static hasRuleset(filterId: number): boolean {
        return FiltersStoragesAdapter.isStaticFilterId(filterId);
    }
}
