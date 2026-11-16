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

import {
    action,
    makeObservable,
    observable,
    override,
} from 'mobx';
import { type GetOptionsDataResponse } from 'settings-types';

import { messenger } from '../../../services/messenger';
import { AntibannerGroupsId, MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { type CategoriesFilterData } from '../../../../background/api/filters/categories';
import { type RootStore } from '../RootStore';
import { eventPauseController, ChangeType } from '../../../services/EventPauseController-mv2';

import { SettingsStoreCommon } from './SettingsStore-common';

export class SettingsStore extends SettingsStoreCommon {
    /**
     * Whether filters are currently being updated.
     * Used to show loading state during filter updates.
     */
    @observable
    filtersUpdating = false;

    /**
     * Total count of active filtering rules.
     * Updated after each options data request.
     */
    @observable
    rulesCount = 0;

    /**
     * Filter ids whose 'turned off as unused' status is displayed during the
     * current opening of the Language-specific screen.
     */
    @observable
    private displayedUnusedFiltersIds: number[] = [];

    /**
     * Whether the current opening of the Language-specific screen is initialized.
     */
    private unusedFiltersOpeningInitialized = false;

    constructor(rootStore: RootStore) {
        super(rootStore);

        makeObservable(this);
    }

    /**
     * @inheritdoc
     */
    @override
    protected override applyOptionsData(data: GetOptionsDataResponse, firstRender?: boolean): void {
        const filtersById = new Map(data.filtersMetadata.filters.map((filter) => [filter.filterId, filter]));
        const languageGroupId = AntibannerGroupsId.LanguageFiltersGroupId;
        const wasGroupEnabled = this.categories.find((group) => group.groupId === languageGroupId)?.enabled;
        const isGroupEnabled = data.filtersMetadata.categories
            .find((group) => group.groupId === languageGroupId)?.enabled;
        const isGroupJustEnabled = isGroupEnabled && !wasGroupEnabled;

        this.displayedUnusedFiltersIds = this.displayedUnusedFiltersIds.filter((filterId) => {
            const filter = filtersById.get(filterId);
            return filter && !filter.enabled && !isGroupJustEnabled;
        });

        super.applyOptionsData(data, firstRender);
        // Data requested before the background cleared the current opening's statuses still has them.
        this.setUnusedStatus(this.displayedUnusedFiltersIds, false);
        this.rulesCount = data.filtersInfo.rulesCount;
        this.startUnusedFiltersOpening();
    }

    /**
     * @inheritdoc
     */
    @override
    override setSelectedGroupId(groupId: number | null): void {
        const previousGroupId = this.selectedGroupId;
        super.setSelectedGroupId(groupId);

        if (this.selectedGroupId !== previousGroupId) {
            this.unusedFiltersOpeningInitialized = false;
            this.displayedUnusedFiltersIds = [];
        }
        this.startUnusedFiltersOpening();
    }

    /**
     * Returns whether the 'turned off as unused' status should be displayed
     * for the specified filter.
     *
     * The status is limited to the Language-specific screen: it stays visible
     * during the opening in which it was seen and disappears afterwards or
     * after a successful change of the filter state.
     *
     * @param filter Filter data.
     *
     * @returns True if the status should be displayed.
     */
    public shouldDisplayUnusedStatus(filter: CategoriesFilterData): boolean {
        if (filter.enabled) {
            return false;
        }

        if (this.selectedGroupId !== AntibannerGroupsId.LanguageFiltersGroupId) {
            return false;
        }

        if (filter.groupId !== AntibannerGroupsId.LanguageFiltersGroupId) {
            return false;
        }

        if (this.displayedUnusedFiltersIds.includes(filter.filterId)) {
            return true;
        }

        return !!filter.disabledAsUnused;
    }

    /**
     * Captures the 'turned off as unused' statuses shown when the
     * Language-specific screen is opened and acknowledges them in the background.
     *
     * Acknowledged statuses stay visible until the screen is left, so data
     * updates do not hide the statuses the user is currently reading. New
     * auto-disable events remain available for the next opening.
     */
    private startUnusedFiltersOpening(): void {
        if (this.unusedFiltersOpeningInitialized || !this.optionsReadyToRender) {
            return;
        }

        if (this.selectedGroupId !== AntibannerGroupsId.LanguageFiltersGroupId) {
            return;
        }

        this.unusedFiltersOpeningInitialized = true;

        const unusedFilterIds = this.filters
            .filter((filter) => this.shouldDisplayUnusedStatus(filter))
            .map((filter) => filter.filterId);

        this.displayedUnusedFiltersIds = unusedFilterIds;

        if (unusedFilterIds.length === 0) {
            return;
        }

        // Clear the local flags now; the opening snapshot keeps them visible
        // while the background clears them.
        this.setUnusedStatus(unusedFilterIds, false);
        messenger.clearUnusedFiltersStatus(unusedFilterIds).catch((error) => {
            this.setUnusedStatus(unusedFilterIds, true);
            logger.warn('[ext.SettingsStore.startUnusedFiltersOpening]: cannot clear unused filters status: ', error);
        });
    }

    /**
     * Sets the local 'disabled as unused' flag of the specified filters.
     * The flag is restored only for filters which are still disabled.
     *
     * @param filterIds Filter ids to update.
     * @param disabledAsUnused New flag value.
     */
    @action
    private setUnusedStatus(filterIds: number[], disabledAsUnused: boolean): void {
        const ids = new Set(filterIds);

        [...this.filters, ...this.visibleFilters].forEach((filter) => {
            if (ids.has(filter.filterId) && (!disabledAsUnused || !filter.enabled)) {
                filter.disabledAsUnused = disabledAsUnused;
            }
        });
    }

    /**
     * Removes the specified filters from the displayed statuses and clears their local flags.
     *
     * @param filterIds Filter ids to clear.
     */
    @action
    private clearDisplayedUnusedStatuses(filterIds: number[]): void {
        this.displayedUnusedFiltersIds = this.displayedUnusedFiltersIds
            .filter((displayedFilterId) => !filterIds.includes(displayedFilterId));

        this.setUnusedStatus(filterIds, false);
    }

    /**
     * Removes the filters of the specified group from the displayed statuses.
     *
     * @param groupId Group id.
     */
    private clearGroupUnusedStatuses(groupId: number): void {
        if (groupId !== AntibannerGroupsId.LanguageFiltersGroupId) {
            return;
        }

        const groupFilterIds = this.filters
            .filter((filter) => filter.groupId === groupId)
            .map((filter) => filter.filterId);

        this.clearDisplayedUnusedStatuses(groupFilterIds);
    }

    /**
     * Triggers filters update and refreshes local filters metadata.
     */
    @action
    async updateFilters() {
        this.setFiltersUpdating(true);
        try {
            const filtersUpdates = await messenger.updateFilters();
            this.refreshFilters(filtersUpdates);
            setTimeout(() => {
                this.setFiltersUpdating(false);
            }, MIN_UPDATE_DISPLAY_DURATION_MS);
            return filtersUpdates;
        } catch (error) {
            this.setFiltersUpdating(false);
            throw error;
        }
    }

    /**
     * @inheritdoc
     */
    @action
    async updateFilterSetting(filterId: number, enabled: boolean): Promise<void> {
        eventPauseController.registerPendingChange(ChangeType.Filter, filterId, enabled);

        this.setFilterEnabledState(filterId, enabled);

        try {
            const success = await this.updateFilterSettingCore(filterId, enabled);

            if (success) {
                eventPauseController.confirmChange(ChangeType.Filter, filterId, enabled);
                this.clearDisplayedUnusedStatuses([filterId]);
            } else {
                this.setFilterEnabledState(filterId, !enabled);
                eventPauseController.cancelChange(ChangeType.Filter, filterId);
            }
        } catch (error) {
            this.setFilterEnabledState(filterId, !enabled);
            eventPauseController.cancelChange(ChangeType.Filter, filterId);
            throw error;
        }
    }

    /**
     * @inheritdoc
     */
    @override
    override async updateGroupSetting(groupId: number, enabled: boolean): Promise<void> {
        eventPauseController.registerPendingChange(ChangeType.Group, groupId, enabled);

        this.updateGroupStateUI(groupId, enabled);

        try {
            await super.updateGroupSetting(groupId, enabled);

            eventPauseController.confirmChange(ChangeType.Group, groupId, enabled);

            if (enabled) {
                this.clearGroupUnusedStatuses(groupId);
            }
        } catch (error) {
            this.updateGroupStateUI(groupId, !enabled);
            eventPauseController.cancelChange(ChangeType.Group, groupId);
            throw error;
        }
    }

    @action
    setFiltersUpdating(value: boolean): void {
        this.filtersUpdating = value;
    }
}
