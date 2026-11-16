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

import { CustomFilterUtils } from '../../../../common/custom-filter-utils';
import { logger } from '../../../../common/logger';
import { engine } from '../../../engine';
import { filterVersionStorage } from '../../../storages';
import { CustomFilterApi } from '../custom';
import { FiltersApi } from '../main';

import { isFullUpdateDue } from './selectors';

/**
 * API for manual custom filter updates and automatic refreshes after extension updates.
 */
export class FilterUpdateApi {
    /**
     * Updates all enabled custom filters if they and their group are enabled.
     *
     * Automatic refreshes use patches until the filter's Expires interval has
     * elapsed since its last full check, then request a full download from
     * {@link CustomFilterApi}. Filters without version metadata also require
     * a full download.
     *
     * @param ignorePatches Whether to force full downloads regardless of Expires. Defaults to false.
     * Should be used for manual updates to make them resilient to broken patch
     * chains, e.g. when the filter URL was moved or redirected and patch files
     * are not available anymore.
     *
     * @throws {AggregateError} If any custom filter fails to update.
     */
    public static async updateCustomFilters(ignorePatches = false): Promise<void> {
        const customFiltersIds = FiltersApi
            .getInstalledAndEnabledFiltersIds()
            .filter((filterId) => CustomFilterUtils.isCustomFilter(filterId));

        const customFiltersUpdateList = customFiltersIds.map((filterId) => {
            if (ignorePatches) {
                return { filterId, ignorePatches: true };
            }

            return {
                filterId,
                ignorePatches: isFullUpdateDue(filterVersionStorage.get(filterId)),
            };
        });

        const tasks = await Promise.allSettled(
            customFiltersUpdateList.map((updateInfo) => CustomFilterApi.updateFilter(updateInfo)),
        );
        const errors: Error[] = [];

        for (const [index, result] of tasks.entries()) {
            if (result.status === 'fulfilled') {
                logger.debug('[ext.FilterUpdateApi.updateCustomFilters]: custom filter updated successfully:', result.value);
            } else {
                const { filterId } = customFiltersUpdateList[index]!;
                logger.error(`[ext.FilterUpdateApi.updateCustomFilters]: failed to update custom filter ${filterId} due to an error:`, result.reason);
                errors.push(new Error(`Failed to update custom filter ${filterId}`, { cause: result.reason }));
            }
        }

        // Update without debounce
        await engine.update();

        if (errors.length > 0) {
            throw new AggregateError(errors, 'Failed to update custom filters');
        }
    }
}
