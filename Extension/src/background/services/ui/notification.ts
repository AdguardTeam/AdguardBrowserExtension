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
import { MessageType, SetNotificationViewedMessage } from '../../../common/messages';
import { notificationApi } from '../../api';
import { messageHandler } from '../../message-handler';

/**
 * Service that manages AdGuard events notifications.
 */
export class NotificationService {
    /**
     * Adds a listener to mark the notification as watched.
     */
    public static init(): void {
        notificationApi.init();

        messageHandler.addListener(MessageType.SetNotificationViewed, NotificationService.setNotificationViewed);
    }

    /**
     * Marks the notification as watched.
     *
     * @param message Message of type {@link SetNotificationViewedMessage}.
     * @param message.data Delay of hiding notification.
     */
    private static async setNotificationViewed({ data }: SetNotificationViewedMessage): Promise<void> {
        // TODO: Don't we need some kind of notification identifier?
        const { withDelay } = data;

        await notificationApi.setNotificationViewed(withDelay);
    }
}
