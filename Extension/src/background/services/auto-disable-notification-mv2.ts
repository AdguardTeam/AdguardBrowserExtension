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

import { type AutoDisabledFilter } from '../../common/auto-disable-notification';
import { MessageType, type AcknowledgeAutoDisableNotificationsMessage } from '../../common/messages';
import { logger } from '../../common/logger';
import { messageHandler } from '../message-handler';
import {
    autoDisableFiltersStorage,
    filterStateStorage,
    metadataStorage,
} from '../storages';

/**
 * Serves pending notifications about automatically disabled language filters to the settings page.
 *
 * Pending filter IDs are persistent and acknowledged by ID, so a background
 * restart between reading and acknowledging does not lose or duplicate them.
 */
export class AutoDisableNotificationService {
    /**
     * Registers message handlers.
     */
    public static init(): void {
        messageHandler.addListener(
            MessageType.GetAutoDisableNotifications,
            AutoDisableNotificationService.getNotifications,
        );
        messageHandler.addListener(
            MessageType.AcknowledgeAutoDisableNotifications,
            AutoDisableNotificationService.acknowledge,
        );
    }

    /**
     * Reads pending automatic disables without consuming them.
     * Skips filters that are enabled again and removes filters missing from the catalog.
     *
     * @returns Pending filters with their display names.
     */
    private static async getNotifications(): Promise<AutoDisabledFilter[]> {
        const { pendingNotificationFilterIds } = await autoDisableFiltersStorage.getState();
        const missingFilterIds: number[] = [];
        const filters = pendingNotificationFilterIds.flatMap((filterId) => {
            if (filterStateStorage.get(filterId)?.enabled) {
                return [];
            }
            const name = metadataStorage.getFilter(filterId)?.name;
            if (!name) {
                missingFilterIds.push(filterId);
                return [];
            }
            return [{ filterId, name }];
        });

        if (missingFilterIds.length > 0) {
            logger.warn('[ext.AutoDisableNotificationService.getNotifications]: removing pending filters missing from the catalog:', missingFilterIds);
            await AutoDisableNotificationService.removePending(missingFilterIds);
        }

        return filters;
    }

    /**
     * Removes displayed filters from the pending notification.
     *
     * @param message Message with displayed filter IDs.
     *
     * @returns Promise resolved after the removal is applied.
     */
    private static async acknowledge(message: AcknowledgeAutoDisableNotificationsMessage): Promise<void> {
        await AutoDisableNotificationService.removePending(message.data.filterIds);
    }

    /**
     * Removes the specified filters from the pending notification.
     *
     * @param filterIds Filter IDs to remove.
     *
     * @returns Promise resolved after the removal is applied.
     */
    private static removePending(filterIds: number[]): Promise<void> {
        const removed = new Set(filterIds);

        return autoDisableFiltersStorage.update((state) => {
            const remaining = state.pendingNotificationFilterIds.filter((id) => !removed.has(id));
            if (remaining.length === state.pendingNotificationFilterIds.length) {
                return state;
            }
            return { ...state, pendingNotificationFilterIds: remaining };
        });
    }
}
