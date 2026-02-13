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
import {
    type AddAndEnableFilterMessage,
    type DisableFilterMessage,
    type DisableFiltersGroupMessage,
    type EnableFiltersGroupMessage,
    type GetIsConsentedFilterMessage,
    MessageType,
    type SetConsentedFiltersMessage,
} from '../../../common/messages';
import { logger } from '../../../common/logger';
import { RulesLimitsService } from '../rules-limits/rules-limits-service-mv3';
import { messageHandler } from '../../message-handler';
import { engine } from '../../engine';
import {
    annoyancesConsent,
    Categories,
    FiltersApi,
    PageStatsApi,
} from '../../api';

/**
 * FiltersService creates handlers for messages that relate to filters.
 *
 * **MV3 version**.
 */
export class FiltersService {
    /**
     * Adds a listener for background messages about working with filters:
     * disabling, enabling, adding, removing.
     * Adds a listener for updating filters from the context menu.
     * Adds a listener for changing the settings of optimized filters and
     * disabling hit collection.
     */
    public static async init(): Promise<void> {
        messageHandler.addListener(MessageType.AddAndEnableFilter, FiltersService.onFilterEnable);
        messageHandler.addListener(MessageType.DisableFilter, FiltersService.onFilterDisable);
        messageHandler.addListener(MessageType.EnableFiltersGroup, FiltersService.onGroupEnable);
        messageHandler.addListener(MessageType.DisableFiltersGroup, FiltersService.onGroupDisable);
        messageHandler.addListener(MessageType.RestoreFiltersMv3, FiltersService.onRestoreFilters);
        messageHandler.addListener(MessageType.ResetBlockedAdsCount, FiltersService.resetBlockedAdsCount);
        messageHandler.addListener(MessageType.SetConsentedFilters, FiltersService.setConsentedFilters);
        messageHandler.addListener(MessageType.GetIsConsentedFilter, FiltersService.getIsConsentedFilter);
    }

    /**
     * Enables filter on {@link AddAndEnableFilterMessage} message via {@link FiltersService.enableFilter}.
     * If filter group has not been touched before, it will be activated.
     *
     * If filter group has been touched before and it is disabled now, the engine will not be updated.
     *
     * NOTE: we do not await of async task execution and returns group id optimistic.
     * TODO (v.zhelvis): handle enabling of group on frontend instead using this handler,
     * because this is UI edge case.
     *
     * @param message Message of {@link AddAndEnableFilterMessage} with filter
     * id to enable.
     *
     * @returns Id of the enabled filter group, if it has not been touched before, otherwise returns undefined.
     */
    private static async onFilterEnable(message: AddAndEnableFilterMessage): Promise<number | undefined> {
        const { filterId } = message.data;
        logger.trace(`[ext.FiltersService.onFilterEnable]: background received message to enable filter: id='${filterId}', name='${FiltersApi.getFilterName(filterId)}'`);

        // FiltersService.enableFilter() method's second arg is 'true'
        // because it is needed to enable not touched group
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2776
        await FiltersService.enableFilter(filterId, true);

        const group = Categories.getGroupByFilterId(filterId);

        if (!group) {
            return;
        }

        const { groupId } = group;

        const groupState = Categories.getGroupState(groupId);

        if (!groupState) {
            return;
        }

        if (!groupState.touched) {
            return groupId;
        }

        if (groupState.enabled) {
            // update the engine only if the group is enabled
            await engine.update();
        }
    }

    /**
     * Called at the request to disable filter.
     *
     * If filter group is disabled, the engine will not be updated.
     *
     * @param message Message of {@link DisableFilterMessage} with filter id to disable.
     */
    private static async onFilterDisable(message: DisableFilterMessage): Promise<void> {
        const { filterId } = message.data;

        logger.trace(`[ext.FiltersService.onFilterDisable]: background received message to disable filter: id='${filterId}', name='${FiltersApi.getFilterName(filterId)}'`);

        FiltersApi.disableFilters([filterId]);

        const group = Categories.getGroupByFilterId(filterId);

        if (!group) {
            return;
        }

        const groupState = Categories.getGroupState(group.groupId);

        if (groupState && groupState.enabled) {
            // update the engine only if the group is enabled
            await engine.update();
        }
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
    private static async onGroupEnable(message: EnableFiltersGroupMessage): Promise<number[] | undefined> {
        const { groupId } = message.data;
        logger.trace(`[ext.FiltersService.onGroupEnable]: background received message to enable group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);

        const group = Categories.getGroupState(groupId);

        if (!group) {
            logger.error(`[ext.FiltersService.onGroupEnable]: cannot find group with ${groupId} id`);
            return;
        }

        if (group.touched) {
            await FiltersService.enableGroup(groupId);
            return;
        }

        // If this is the first time the group has been activated - load and
        // enable the recommended filters.
        const recommendedFiltersIds = Categories.getRecommendedFilterIdsByGroupId(groupId);

        await FiltersService.enableGroup(groupId, recommendedFiltersIds);

        return recommendedFiltersIds;
    }

    /**
     * Called at the request to disable group of filters.
     *
     * @param message Message of {@link DisableFiltersGroupMessage} with group
     * id to disable.
     */
    private static async onGroupDisable(message: DisableFiltersGroupMessage): Promise<void> {
        const { groupId } = message.data;

        logger.trace(`[ext.FiltersService.onGroupDisable]: background received message to disable group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);

        Categories.disableGroup(groupId);

        await engine.update();
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
     * Called on a request to reset the counters of blocked ads.
     */
    private static async resetBlockedAdsCount(): Promise<void> {
        await PageStatsApi.reset();
    }

    /**
     * Called on a request to add filter ids to consented filters list.
     *
     * @param message Message of {@link SetConsentedFiltersMessage} with filter ids to add.
     */
    private static async setConsentedFilters(message: SetConsentedFiltersMessage): Promise<void> {
        const { filterIds } = message.data;

        await annoyancesConsent.addFilterIds(filterIds);
    }

    /**
     * Called on a request to check if filter is consented.
     *
     * @param message Message of {@link GetIsConsentedFilterMessage} with filter id to check.
     *
     * @returns True if consent is granted for filter, otherwise false.
     */
    private static async getIsConsentedFilter(message: GetIsConsentedFilterMessage): Promise<boolean> {
        const { filterId } = message.data;

        const isConsented = await annoyancesConsent.isConsentedFilter(filterId);

        return isConsented;
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
        await Categories.enableGroup(groupId, false, recommendedFiltersIds);
        await engine.update();
    }

    /**
     * Loads and enables specified filter.
     * If filter group has not been touched before, it will be activated.
     *
     * Note: this method **does not update the engine**.
     *
     * @param filterId Id of filter.
     * @param shouldEnableGroup Flag for enabling the filter group if it has not been touched before.
     */
    private static async enableFilter(filterId: number, shouldEnableGroup = false): Promise<void> {
        await FiltersApi.loadAndEnableFilters([filterId], false, shouldEnableGroup);
    }
}
