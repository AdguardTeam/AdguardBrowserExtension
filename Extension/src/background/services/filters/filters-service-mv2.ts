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

import { MessageType } from '../../../common/messages';
import { SettingOption } from '../../schema';
import { messageHandler } from '../../message-handler';
import { engine } from '../../engine';
import {
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
     * @inheritdoc
     */
    protected static override async enableFilter(filterId: number, shouldEnableGroup = false): Promise<void> {
        await FiltersApi.loadAndEnableFilters([filterId], true, shouldEnableGroup);
    }

    /**
     * @inheritdoc
     */
    protected static override async updateEngine(): Promise<void> {
        engine.debounceUpdate();
    }
}
