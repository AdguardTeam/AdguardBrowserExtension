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
    type AcknowledgeAutoDisableNotificationsMessage,
    type ClearUnusedFiltersStatusMessage,
    type ExtractMessageResponse,
    MessageType,
} from '../../../common/messages';
import { type AutoDisabledFilter } from '../../../common/auto-disable-notification';

import { MessengerCommon } from './messenger-common';

export class Messenger extends MessengerCommon {
    /**
     * Reads pending automatic disables of language filters without consuming them.
     *
     * @returns Pending filters with their display names.
     */
    getAutoDisableNotifications = async (): Promise<AutoDisabledFilter[]> => {
        return this.sendMessage(MessageType.GetAutoDisableNotifications);
    };

    /**
     * Removes displayed filters from the pending notification.
     *
     * @param filterIds Displayed filter IDs.
     *
     * @returns Promise resolved after the background applies the removal.
     */
    acknowledgeAutoDisableNotifications = async (
        filterIds: AcknowledgeAutoDisableNotificationsMessage['data']['filterIds'],
    ): Promise<ExtractMessageResponse<MessageType.AcknowledgeAutoDisableNotifications>> => {
        return this.sendMessage(MessageType.AcknowledgeAutoDisableNotifications, { filterIds });
    };

    /**
     * Sends a message to the background page to clear the 'disabled as unused'
     * statuses captured when the whole Language-specific group is opened.
     * The UI keeps them visible for the remainder of that opening.
     *
     * @param filterIds Filter identifiers whose status should be cleared.
     *
     * @returns Promise resolved after the background clears the statuses; rejected if clearing fails.
     */
    clearUnusedFiltersStatus = async (
        filterIds: ClearUnusedFiltersStatusMessage['data']['filterIds'],
    ): Promise<ExtractMessageResponse<MessageType.ClearUnusedFiltersStatus>> => {
        return this.sendMessage(MessageType.ClearUnusedFiltersStatus, { filterIds });
    };

    /**
     * Sends a message to the background page to update filters.
     *
     * @returns Promise that resolves with the list of filters.
     */
    updateFilters = async (): Promise<ExtractMessageResponse<MessageType.CheckFiltersUpdate>> => {
        return this.sendMessage(MessageType.CheckFiltersUpdate);
    };
}

export const messenger = new Messenger();
