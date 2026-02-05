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

import { type EnableFiltersGroupMessage, MessageType } from '../../../common/messages';
import { SettingOption } from '../../schema';
import { messageHandler } from '../../message-handler';
import { engine } from '../../engine';
import {
    Categories,
    type FilterMetadata,
    FiltersApi,
    FilterUpdateApi,
    toasts,
} from '../../api';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../../events';
import { notifier } from '../../notifier';
import { NotifierType } from '../../../common/constants';
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
        messageHandler.addListener(MessageType.CheckFiltersUpdate, FiltersService.manualCheckFiltersUpdate);
        contextMenuEvents.addListener(ContextMenuAction.UpdateFilters, FiltersService.manualCheckFiltersUpdate);
        settingsEvents.addListener(SettingOption.UseOptimizedFilters, FiltersService.onOptimizedFiltersSwitch);
    }

    /**
     * Called when requesting an force update for filters.
     *
     * @returns Updated filters metadata.
     */
    private static async manualCheckFiltersUpdate(): Promise<FilterMetadata[] | undefined> {
        try {
            const updatedFilters = await FilterUpdateApi.autoUpdateFilters(true);

            toasts.showFiltersUpdatedAlertMessage(true, updatedFilters);
            notifier.notifyListeners(NotifierType.FiltersUpdateCheckReady, updatedFilters);

            return updatedFilters;
        } catch (e) {
            toasts.showFiltersUpdatedAlertMessage(false);
            notifier.notifyListeners(NotifierType.FiltersUpdateCheckReady);
        }
    }

    /**
     * Called at the request to use optimized filters.
     */
    private static async onOptimizedFiltersSwitch(): Promise<void> {
        await FiltersApi.reloadEnabledFilters();
        engine.debounceUpdate();
    }

    /**
     * Enables specified group and updates filter engine.
     *
     * NOTE: we do not await of async task execution and returns array of recommended filters optimistic.
     * TODO (v.zhelvis): handle enabling of recommended filters on frontend instead using this handler,
     * because this is UI edge case.
     *
     * @param filterId Id of filter.
     * @param shouldEnableGroup Flag for enabling the filter group if it has not been touched before.
     */
    protected static override async enableFilter(filterId: number, shouldEnableGroup = false): Promise<void> {
        FiltersApi.loadAndEnableFilters([filterId], true, shouldEnableGroup);
    }

    /**
     * Enables group on {@link EnableFiltersGroupMessage} message via {@link FiltersService.enableGroup}.
     *
     * If group is activated first time, provides list of recommended filters.
     * NOTE: we do not await of async task execution and returns array of recommended filters optimistic.
     * TODO (v.zhelvis): handle enabling of recommended filters on frontend instead using this handler,
     * because this is UI edge case.
     *
     * @param message {@link EnableFiltersGroupMessage} With specified group id.
     *
     * @returns Array of recommended filters on first group activation.
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
            // Fire-and-forget: no await to avoid blocking the response
            this.enableGroup(groupId, []);
            return;
        }

        // If this is the first time the group has been activated - load and
        // enable the recommended filters.
        const recommendedFiltersIds = Categories.getRecommendedFilterIdsByGroupId(groupId);

        // Fire-and-forget: no await to avoid blocking the response
        this.enableGroup(groupId, recommendedFiltersIds);

        return recommendedFiltersIds;
    }

    /**
     * Enables specified group and updates filter engine.
     *
     * On first group activation we provide recommended filters,
     * that will be loaded end enabled before update checking.
     *
     * @see Categories.enableGroup
     *
     * @param groupId Id of filter group.
     * @param recommendedFiltersIds Array of filters ids to enable on first time the group has been activated.
     */
    private static async enableGroup(groupId: number, recommendedFiltersIds: number[] = []): Promise<void> {
        await Categories.enableGroup(groupId, recommendedFiltersIds);
        engine.debounceUpdate();
    }

    /**
     * @inheritdoc
     */
    protected static override async updateEngine(): Promise<void> {
        engine.debounceUpdate();
    }
}
