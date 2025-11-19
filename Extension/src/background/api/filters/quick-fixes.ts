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

// TODO: revert if Quick Fixes filter is back
// import { type PreprocessedFilterList } from '@adguard/tsurlfilter';

// import { logger } from '../../../common/logger';
// import { AntiBannerFiltersId, emptyPreprocessedFilterList } from '../../../common/constants';
// import { FiltersStorage, filterStateStorage } from '../../storages';
// import { engine } from '../../engine';

// import { FiltersApi } from './main';
// import { CommonFilterApi } from './common';

// /**
//  * API for managing quick fixes filter.
//  *
//  * **Note:** This filter is needed only in MV3 version.
//  *
//  * Quick Fixes Filter does not have a local list of rules, it is loaded from
//  * the server.
//  */
// export class QuickFixesRulesApi {
//     /**
//      * Loads and enabled Quick Fixes rules via updating metadata
//      * for quick fixes filter.
//      */
//     public static async loadAndEnableQuickFixesRules(): Promise<void> {
//         await this.loadQuickFixesRules();

//         filterStateStorage.enableFilters([AntiBannerFiltersId.QuickFixesFilterId]);
//     }

//     /**
//      * Load newest rules from the server without patches (because filter is quite
//      * small), then partially updates metadata for quick fixes filter (because
//      * otherwise we will update metadata for all filters, but filters will only
//      * be updated with update of entire extension and we get mismatch of their
//      * actual version and metadata versions).
//      */
//     private static async loadQuickFixesRules(): Promise<void> {
//         const metadataOfUpdatedFilter = await CommonFilterApi.loadFilterRulesFromBackend(
//             {
//                 filterId: AntiBannerFiltersId.QuickFixesFilterId,
//                 // Without patches because filter is quite small.
//                 // Because otherwise, if we will load it with patches, we should
//                 // also load it fully from time to time (as we do for static
//                 // filters in MV2) to prevent some unexpected problems from
//                 // patches.
//                 ignorePatches: true,
//             },
//             true,
//         );

//         FiltersApi.partialUpdateMetadataForFilter(metadataOfUpdatedFilter);
//     }

//     /**
//      * If quick fixes filter is enabled, updates it from remote and reloads engine.
//      */
//     public static async updateQuickFixesFilter(): Promise<void> {
//         if (!this.isEnabled()) {
//             return;
//         }

//         await this.loadQuickFixesRules();
//         await engine.update();
//     }

//     /**
//      * Checks, if quick fixes filter is enabled.
//      *
//      * @returns True, if quick fixes filter is enabled, else returns false.
//      */
//     public static isEnabled(): boolean {
//         const filterMetadata = FiltersApi.getFilterMetadata(AntiBannerFiltersId.QuickFixesFilterId);
//         if (!filterMetadata) {
//             logger.error('[ext.QuickFixesRulesApi.isEnabled]: not found metadata from Quick Fixes filter');

//             return false;
//         }

//         return FiltersApi.isFilterEnabled(AntiBannerFiltersId.QuickFixesFilterId)
//             && FiltersApi.isGroupEnabled(filterMetadata.groupId);
//     }

//     /**
//      * Returns rules from quick fixes filter.
//      *
//      * @returns Rules from quick fixes filter.
//      */
//     public static async getQuickFixesRules(): Promise<PreprocessedFilterList> {
//         const data = await FiltersStorage.get(AntiBannerFiltersId.QuickFixesFilterId);

//         if (!data) {
//             return { ...emptyPreprocessedFilterList };
//         }

//         return data;
//     }
// }
