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
import { type FilterUpdateOptions } from '../update';
import { logger } from '../../../../common/logger';
import { type FilterMetadata } from '../main';

import { CommonFilterApiCommon } from './common-common';

/**
 * Extends {@link CommonFilterApiCommon}.
 */
export class CommonFilterApi extends CommonFilterApiCommon {
    /**
     * Update common filters.
     *
     * @param filtersUpdateOptions Filters update detail.
     *
     * @returns Updated filter metadata list.
     */
    public static async updateFilters(
        filtersUpdateOptions: FilterUpdateOptions[],
    ): Promise<FilterMetadata[]> {
        logger.info('[ext.CommonFilterApi.updateFilters]: Checking common filters for updates');

        const filtersToUpdate = filtersUpdateOptions.map((filterUpdateOptions) => {
            const filterMetadata = CommonFilterApi.getFilterMetadata(filterUpdateOptions.filterId);
            if (!filterMetadata) {
                logger.error(`[ext.CommonFilterApi.updateFilters]: cannot find metadata for common filter ${filterUpdateOptions.filterId}`);
                return null;
            }

            if (filterUpdateOptions.ignorePatches && !CommonFilterApi.isFilterNeedUpdate(filterMetadata)) {
                return null;
            }

            return {
                metadata: filterMetadata,
                updateOptions: filterUpdateOptions,
            };
        }).filter((filter) => filter !== null);

        filtersToUpdate.forEach((filter) => {
            logger.info(`[ext.CommonFilterApi.updateFilters]: Filter ${filter.updateOptions.filterId} needs to be updated from [${filter.metadata.version}]`);
        });

        const updatedFiltersMetadata: FilterMetadata[] = [];

        const updateTasks = filtersToUpdate.map(async (filter) => {
            const updatedMetadata = await CommonFilterApi.loadFilterRulesFromBackend(filter.updateOptions, true);
            if (updatedMetadata) {
                logger.info(`[ext.CommonFilterApi.updateFilters]: Filter ${filter.updateOptions.filterId} updated to [${updatedMetadata.version}]`);
                updatedFiltersMetadata.push(updatedMetadata);
            }
        });

        await Promise.allSettled(updateTasks);

        if (updatedFiltersMetadata.length > 0) {
            logger.info('[ext.CommonFilterApi.updateFilters]: Finished common filters update');
        } else {
            logger.info('[ext.CommonFilterApi.updateFilters]: Common filters are already up-to-date');
        }
        return updatedFiltersMetadata;
    }
}
