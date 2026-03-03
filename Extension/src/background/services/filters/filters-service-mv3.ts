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

import { RulesLimitsService } from '../rules-limits/rules-limits-service-mv3';
import { type EnableFiltersGroupMessage, MessageType } from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import { engine } from '../../engine';
import {
    Categories,
    FilterUpdateApi,
    FiltersApi,
} from '../../api';
import { logger } from '../../../common/logger';

import { FiltersServiceCommon } from './filters-service-common';

/**
 * FiltersService creates handlers for messages that relate to filters.
 */
export class FiltersService extends FiltersServiceCommon {
    /**
     * Adds a listener for background messages about working with filters:
     * disabling, enabling, adding, removing.
     * Adds a listener for updating filters from the context menu.
     * Adds a listener for changing the settings of optimized filters and
     * disabling hit collection.
     */
    public static override init(): void {
        super.init();
        messageHandler.addListener(MessageType.RestoreFiltersMv3, FiltersService.onRestoreFilters);
        messageHandler.addListener(MessageType.UpdateCustomFiltersMv3, FiltersService.onUpdateCustomFilters);
    }

    /**
     * Called when user tries to restore filters.
     */
    private static async onRestoreFilters(): Promise<void> {
        const expectedEnabledFilters = RulesLimitsService.getExpectedEnabledFilters();
        await FiltersApi.loadAndEnableFilters(expectedEnabledFilters);
        await engine.update();
    }

    /**
     * @inheritdoc
     */
    protected static override async enableFilter(filterId: number, shouldEnableGroup = false): Promise<void> {
        await FiltersApi.loadAndEnableFilters([filterId], false, shouldEnableGroup);
    }

    /**
     * @inheritdoc
     */
    protected static override async onGroupEnable(message: EnableFiltersGroupMessage): Promise<number[] | undefined> {
        const { groupId } = message.data;

        const group = Categories.getGroupState(groupId);

        logger.trace(`[ext.FiltersService.onGroupEnable]: background received message to enable group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);

        if (!group) {
            logger.error(`[ext.FiltersService.onGroupEnable]: cannot find group with ${groupId} id`);
            return;
        }

        if (group.touched) {
            await Categories.enableGroup(groupId, []);
            await engine.update();
            return;
        }

        // If this is the first time the group has been activated - load and
        // enable the recommended filters.
        const recommendedFiltersIds = Categories.getRecommendedFilterIdsByGroupId(groupId);

        await Categories.enableGroup(groupId, recommendedFiltersIds);
        await engine.update();

        return recommendedFiltersIds;
    }

    /**
     * @inheritdoc
     */
    protected static override async updateEngine(): Promise<void> {
        await engine.update();
    }

    /**
     * Called when user requests custom filters update
     * independently of extension update.
     */
    private static async onUpdateCustomFilters(): Promise<void> {
        try {
            await FilterUpdateApi.updateCustomFilters();
        } catch (e: unknown) {
            logger.error('[ext.FiltersService.onUpdateCustomFilters]: failed to update custom filters:', e);
        }
    }
}
