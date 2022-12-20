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
    DisableAntiBannerFilterMessage,
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

export class FiltersService {
    public static async init(): Promise<void> {
        messageHandler.addListener(MessageType.AddAndEnableFilter, FiltersService.onFilterEnable);
        messageHandler.addListener(MessageType.DisableAntibannerFilter, FiltersService.onFilterDisable);
        messageHandler.addListener(MessageType.EnableFiltersGroup, FiltersService.onGroupEnable);
        messageHandler.addListener(MessageType.DisableFiltersGroup, FiltersService.onGroupDisable);
        messageHandler.addListener(MessageType.CheckAntibannerFiltersUpdate, FiltersService.checkFiltersUpdate);
        messageHandler.addListener(MessageType.ResetBlockedAdsCount, FiltersService.resetBlockedAdsCount);
        contextMenuEvents.addListener(ContextMenuAction.UpdateAntibannerFilters, FiltersService.checkFiltersUpdate);

        settingsEvents.addListener(SettingOption.UseOptimizedFilters, FiltersService.onOptimizedFiltersSwitch);
        settingsEvents.addListener(SettingOption.DisableCollectHits, FiltersService.onCollectHitsSwitch);
    }

    private static async onFilterEnable(message: AddAndEnableFilterMessage): Promise<void> {
        const { filterId } = message.data;

        await FiltersApi.loadAndEnableFilters([filterId]);

        Engine.debounceUpdate();
    }

    private static async onFilterDisable(message: DisableAntiBannerFilterMessage): Promise<void> {
        const { filterId } = message.data;

        FiltersApi.disableFilters([filterId]);

        Engine.debounceUpdate();
    }

    private static async onGroupEnable(message: EnableFiltersGroupMessage): Promise<void> {
        const { groupId } = message.data;

        await Categories.enableGroup(groupId);
        Engine.debounceUpdate();
    }

    private static async onGroupDisable(message: DisableFiltersGroupMessage): Promise<void> {
        const { groupId } = message.data;

        Categories.disableGroup(groupId);
        Engine.debounceUpdate();
    }

    private static async checkFiltersUpdate(): Promise<FilterMetadata[] | undefined> {
        try {
            const updatedFilters = await FilterUpdateApi.updateEnabledFilters();

            await Engine.update();

            toasts.showFiltersUpdatedAlertMessage(true, updatedFilters);
            listeners.notifyListeners(listeners.FiltersUpdateCheckReady, updatedFilters);

            return updatedFilters;
        } catch (e) {
            toasts.showFiltersUpdatedAlertMessage(false);
            listeners.notifyListeners(listeners.FiltersUpdateCheckReady);
        }
    }

    private static async onOptimizedFiltersSwitch(): Promise<void> {
        await FiltersApi.reloadEnabledFilters();
        await Engine.update();
    }

    private static async onCollectHitsSwitch(value: boolean): Promise<void> {
        if (value) {
            HitStatsApi.cleanup();
        }
    }

    private static async resetBlockedAdsCount(): Promise<void> {
        await PageStatsApi.reset();
    }
}
