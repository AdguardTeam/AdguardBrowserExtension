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
import { MessageType, type SetNotificationViewedMessage } from '../../../common/messages';
import { promoNotificationApi } from '../../api';
import { messageHandler } from '../../message-handler';

/**
 * Service that manages events for promo notifications.
 */
export class PromoNotificationService {
    /**
     * Adds a listener to mark the promo notification as watched.
     */
    public static init(): void {
        promoNotificationApi.init();

        messageHandler.addListener(MessageType.SetNotificationViewed, PromoNotificationService.setNotificationViewed);
    }

    /**
     * Marks the promo notification as watched.
     *
     * @param message Message of type {@link SetNotificationViewedMessage}.
     * @param message.data Delay of hiding notification.
     */
    private static async setNotificationViewed({ data }: SetNotificationViewedMessage): Promise<void> {
        // We don't need id of the notification, because we don't show several
        // notification at once.
        const { withDelay } = data;

        await promoNotificationApi.setNotificationViewed(withDelay);
    }
}
