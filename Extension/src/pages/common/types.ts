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

/**
 * Notification type.
 */
export enum NotificationType {
    /**
     * Notification type for loading state. The icon should be animated.
     */
    Loading = 'loading',

    /**
     * Notification type for success state.
     */
    Success = 'success',

    /**
     * Notification type for error state.
     */
    Error = 'error',
}

/**
 * Notification parameters.
 */
export type NotificationParams = {
    /**
     * Notification type
     */
    type: NotificationType;

    /**
     * Animation condition for the icon. If not specified, the icon will not be animated.
     */
    animationCondition?: boolean;

    /**
     * Text of the notification.
     */
    text: string;

    /**
     * Button to be shown in the notification, optional.
     */
    button?: {
        /**
         * Title of the button.
         */
        title: string;

        /**
         * Click handler for the button.
         */
        onClick: () => void;
    };

    /**
     * Flag to close notification manually.
     *
     * If set, the notification should be closed manually.
     * Otherwise, the notification will be closed automatically (on timeout).
     */
    closeManually?: boolean;
};

/**
 * Notification object.
 */
export type Notification = {
    /**
     * ID of notification
     */
    id: string;

    /**
     * Description of notification
     */
    description: string;

    /**
     * Notification type
     */
    type: NotificationType;

    /**
     * Some additional data, e.g. link and onClick handler.
     *
     * TODO: specify the type.
     */
    extra?: Record<string, any>;
};
