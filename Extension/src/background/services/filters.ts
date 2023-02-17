/**
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
    AddAndEnableFilterMessage,
    DisableFilterMessage,
    DisableFiltersGroupMessage,
    EnableFiltersGroupMessage,
    MessageType,
} from '../../common/messages';
import { SettingOption } from '../schema';
import { messageHandler } from '../message-handler';
import { Engine } from '../engine';
import {
    FilterMetadata,
    FiltersApi,
    FilterUpdateApi,
    toasts,
    Categories,
    PageStatsApi,
    HitStatsApi,
} from '../api';
import {
    ContextMenuAction,
    contextMenuEvents,
    settingsEvents,
} from '../events';
import { listeners } from '../notifier';

/**
 * FiltersService creates handlers for messages that relate to filters.
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
        messageHandler.addListener(MessageType.CheckFiltersUpdate, FiltersService.checkFiltersUpdate);
        messageHandler.addListener(MessageType.ResetBlockedAdsCount, FiltersService.resetBlockedAdsCount);

        contextMenuEvents.addListener(ContextMenuAction.UpdateFilters, FiltersService.checkFiltersUpdate);

        settingsEvents.addListener(SettingOption.UseOptimizedFilters, FiltersService.onOptimizedFiltersSwitch);
        settingsEvents.addListener(SettingOption.DisableCollectHits, FiltersService.onCollectHitsSwitch);
    }

    /**
     * Called at the request to enable the filter.
     *
     * @param message Message of {@link AddAndEnableFilterMessage} with filter
     * id to enable.
     */
    private static async onFilterEnable(message: AddAndEnableFilterMessage): Promise<void> {
        const { filterId } = message.data;

        await FiltersApi.loadAndEnableFilters([filterId]);

        Engine.debounceUpdate();
    }

    /**
     * Called at the request to disable filter.
     *
     * @param message Message of {@link DisableFilterMessage} with filter
     * id to disable.
     */
    private static async onFilterDisable(message: DisableFilterMessage): Promise<void> {
        const { filterId } = message.data;

        FiltersApi.disableFilters([filterId]);

        Engine.debounceUpdate();
    }

    /**
     * Called at the request to enable group of filters.
     *
     * @param message Message of {@link EnableFiltersGroupMessage} with group
     * id to enable.
     */
    private static async onGroupEnable(message: EnableFiltersGroupMessage): Promise<void> {
        const { groupId } = message.data;

        await Categories.enableGroup(groupId);
        Engine.debounceUpdate();
    }

    /**
     * Called at the request to disable group of filters.
     *
     * @param message Message of {@link DisableFiltersGroupMessage} with group
     * id to disable.
     */
    private static async onGroupDisable(message: DisableFiltersGroupMessage): Promise<void> {
        const { groupId } = message.data;

        Categories.disableGroup(groupId);
        Engine.debounceUpdate();
    }

    /**
     * Called when requesting an update for filters.
     */
    private static async checkFiltersUpdate(): Promise<FilterMetadata[] | undefined> {
        try {
            const updatedFilters = await FilterUpdateApi.updateEnabledFilters();

            Engine.debounceUpdate();

            toasts.showFiltersUpdatedAlertMessage(true, updatedFilters);
            listeners.notifyListeners(listeners.FiltersUpdateCheckReady, updatedFilters);

            return updatedFilters;
        } catch (e) {
            toasts.showFiltersUpdatedAlertMessage(false);
            listeners.notifyListeners(listeners.FiltersUpdateCheckReady);
        }
    }

    /**
     * Called at the request to use optimized filters.
     */
    private static async onOptimizedFiltersSwitch(): Promise<void> {
        await FiltersApi.reloadEnabledFilters();
        Engine.debounceUpdate();
    }

    /**
     * Called when prompted to disable or enable hit collection.
     *
     * @param value Desired collecting status.
     */
    private static async onCollectHitsSwitch(value: boolean): Promise<void> {
        if (value) {
            HitStatsApi.cleanup();
        }
    }

    /**
     * Called on a request to reset the counters of blocked ads.
     */
    private static async resetBlockedAdsCount(): Promise<void> {
        await PageStatsApi.reset();
    }
}
