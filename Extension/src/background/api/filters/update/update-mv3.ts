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
import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { logger } from '../../../../common/logger';
import { engine } from '../../../engine';
import { CustomFilterApi } from '../custom';
import { FiltersApi } from '../main';

/**
 * API for manual custom filter rules updates.
 */
export class FilterUpdateApi {
    /**
     * Updates all enabled custom filters if they and their group are enabled.
     */
    public static async updateCustomFilters(): Promise<void> {
        const customFiltersIds = FiltersApi
            .getInstalledAndEnabledFiltersIds()
            .filter((filterId) => CustomFilterUtils.isCustomFilter(filterId));

        const customFiltersUpdateList = customFiltersIds.map((filterId) => ({
            filterId,
            // Try to download via patches first to save traffic. If patches are
            // not available, library will download the full filter.
            ignorePatches: false,
        }));

        const tasks = await Promise.allSettled(
            customFiltersUpdateList.map((updateInfo) => CustomFilterApi.updateFilter(updateInfo)),
        );

        for (const updatedCustomFilters of tasks) {
            if (updatedCustomFilters.status === 'fulfilled') {
                logger.debug('[ext.FilterUpdateApi.updateCustomFilters]: custom filter updated successfully:', updatedCustomFilters.value);
            } else {
                logger.error('[ext.FilterUpdateApi.updateCustomFilters]: failed to update custom filters due to an error:', updatedCustomFilters.reason);
            }
        }

        // Update without debounce
        await engine.update();
    }
}
