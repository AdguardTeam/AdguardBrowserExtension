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

import { logger } from '../../../../common/logger';
import { CommonFilterUtils } from '../../../../common/common-filter-utils';
import { getZodErrorMessage } from '../../../../common/error';
import { filterStateStorage, metadataStorage } from '../../../storages';
import { Prefs } from '../../../prefs';

import { FiltersApiCommon } from './main-common';

/**
 * API for managing filters data. This class is a facade for working with
 * filters, for example, its methods are called by the handlers of user actions:
 * enabling or disabling a filter or filter group, updating, etc. It depends on
 * CommonFilterApi and CustomFilterApi.
 */
export class FiltersApi extends FiltersApiCommon {
    /**
     * Initialize filters storages.
     * Called while filters service initialization and app resetting.
     *
     * @param isInstall Is this is an installation initialization or not.
     */
    public static override async init(isInstall: boolean): Promise<void> {
        await FiltersApiCommon.init(isInstall);

        Prefs.libVersions.dnrRulesets = metadataStorage.getDnrRulesetsVersion();
    }

    /**
     * Reload filters and their metadata from local storage.
     *
     * Needed only in MV3 version because we don't update filters from remote,
     * we use bundled filters from local resources and their converted rulesets.
     *
     * @returns List of loaded filter IDs.
     */
    public static async reloadFiltersFromLocal(): Promise<number[]> {
        try {
            await FiltersApiCommon.loadI18nMetadataFromBackend(false);
            await FiltersApiCommon.loadMetadataFromFromBackend(false);
        } catch (e) {
            logger.error('[ext.FiltersApi.reloadFiltersFromLocal]: cannot load local metadata due to:', getZodErrorMessage(e));
        }

        FiltersApiCommon.loadFilteringStates();

        await FiltersApiCommon.removeObsoleteFilters();

        // For MV3 we should reload all filters, because they are actually
        // loaded into IDB by TsWebExtension during it's initialization.
        const filterIds = filterStateStorage.getAllFilters();

        // Ignore custom filters, user-rules and allowlist filter.
        const commonFiltersIds = filterIds.filter((id) => CommonFilterUtils.isCommonFilter(id));

        try {
            // Only re-load filters without changed their states: enabled or disabled.
            const loadedFiltersIds = await FiltersApiCommon.loadFilters(commonFiltersIds, false);

            return loadedFiltersIds;
        } catch (e) {
            logger.error('[ext.FiltersApi.reloadFiltersFromLocal]: cannot load local filters due to:', getZodErrorMessage(e));

            return [];
        }
    }
}
