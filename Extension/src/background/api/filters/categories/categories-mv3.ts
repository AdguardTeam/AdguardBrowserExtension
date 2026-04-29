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

import { groupStateStorage } from '../../../storages';
import { logger } from '../../../../common/logger';
import { FiltersApi } from '../main';

import { CategoriesCommon } from './categories-common';

/**
 * Class for filter groups management.
 */
export class Categories extends CategoriesCommon {
    /**
     * Enables specified group of filters.
     *
     * On first group activation we provide recommended filters,
     * that will be loaded and enabled.
     *
     * @param groupId Id of group of filters.
     * @param recommendedFiltersIds Array of filters ids to enable on first time
     * the group has been activated after enabling.
     */
    public static override async enableGroup(
        groupId: number,
        recommendedFiltersIds: number[] = [],
    ): Promise<void> {
        if (recommendedFiltersIds.length > 0) {
            await FiltersApi.loadAndEnableFilters(recommendedFiltersIds, false);
        }

        groupStateStorage.enableGroups([groupId]);
        logger.info(`[ext.Categories.enableGroup]: enabled group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);
    }
}
