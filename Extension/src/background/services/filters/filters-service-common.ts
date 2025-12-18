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
import { messageHandler } from '../../message-handler';
import {
    annoyancesConsent,
    Categories,
    FiltersApi,
    PageStatsApi,
} from '../../api';
import { NotImplementedError } from '../../errors/not-implemented-error';

/**
 * FiltersService creates handlers for messages that relate to filters.
 *
 * **MV2 version**.
 */
export class FiltersServiceCommon {
    /**
     * Adds a listener for background messages about working with filters:
     * disabling, enabling, adding, removing.
     * Adds a listener for updating filters from the context menu.
     * Adds a listener for changing the settings of optimized filters and
     * disabling hit collection.
     */
    public static init(): void {
        messageHandler.addListener(MessageType.AddAndEnableFilter, this.onFilterEnable.bind(this));
        messageHandler.addListener(MessageType.DisableFilter, this.onFilterDisable.bind(this));
        messageHandler.addListener(MessageType.EnableFiltersGroup, this.onGroupEnable.bind(this));
        messageHandler.addListener(MessageType.DisableFiltersGroup, this.onGroupDisable.bind(this));
        messageHandler.addListener(MessageType.ResetBlockedAdsCount, FiltersServiceCommon.resetBlockedAdsCount);
        messageHandler.addListener(MessageType.SetConsentedFilters, FiltersServiceCommon.setConsentedFilters);
        messageHandler.addListener(MessageType.GetIsConsentedFilter, FiltersServiceCommon.getIsConsentedFilter);
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
        logger.trace(`[ext.FiltersServiceCommon.onFilterEnable]: background received message to enable filter: id='${filterId}', name='${FiltersApi.getFilterName(filterId)}'`);

        // FiltersService.enableFilter() method's second arg is 'true'
        // because it is needed to enable not touched group
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2776
        await this.enableFilter(filterId, true);

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
            await this.updateEngine();
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

        logger.trace(`[ext.FiltersServiceCommon.onFilterDisable]: background received message to disable filter: id='${filterId}', name='${FiltersApi.getFilterName(filterId)}'`);

        FiltersApi.disableFilters([filterId]);

        const group = Categories.getGroupByFilterId(filterId);

        if (!group) {
            return;
        }

        const groupState = Categories.getGroupState(group.groupId);

        if (groupState && groupState.enabled) {
            // update the engine only if the group is enabled
            await this.updateEngine();
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

        const group = Categories.getGroupState(groupId);

        logger.trace(`[ext.FiltersServiceCommon.onGroupEnable]: background received message to enable group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);

        if (!group) {
            logger.error(`[ext.FiltersServiceCommon.onGroupEnable]: cannot find group with ${groupId} id`);
            return;
        }

        if (group.touched) {
            await Categories.enableGroup(groupId);
            await this.updateEngine();

            return;
        }

        // If this is the first time the group has been activated - load and
        // enable the recommended filters.
        const recommendedFiltersIds = Categories.getRecommendedFilterIdsByGroupId(groupId);

        await Categories.enableGroup(groupId, recommendedFiltersIds);
        await this.updateEngine();

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

        logger.trace(`[ext.FiltersServiceCommon.onGroupDisable]: background received message to disable group: id='${groupId}', name='${Categories.getGroupName(groupId)}'`);

        Categories.disableGroup(groupId);

        await this.updateEngine();
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
     * Loads and enables specified filter.
     * If filter group has not been touched before, it will be activated.
     *
     * Note: this method **does not update the engine**.
     *
     * @param filterId Id of filter.
     * @param shouldEnableGroup Flag for enabling the filter group if it has not been touched before.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected static async enableFilter(filterId: number, shouldEnableGroup = false): Promise<void> {
        throw new NotImplementedError();
    }

    /**
     * Updates the filtering engine.
     */
    protected static async updateEngine(): Promise<void> {
        throw new NotImplementedError();
    }
}
