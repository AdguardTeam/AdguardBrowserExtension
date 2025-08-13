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

/**
 * Time duration for showing update state change. Needed for smoother user experience.
 */
export const MIN_UPDATE_DISPLAY_DURATION_MS = 2 * 1000;

export const MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS = 1500;

/**
 * Minimal delay for showing loader. Needed in mv3 for smoother user experience.
 */
export const MIN_LOADER_SHOWING_TIME_MS = 500;

/**
 * Error cause identifier for when a file has an incorrect extension.
 */
export const FILE_WRONG_EXTENSION_CAUSE = 'fileWrongExtension';

/**
 * Timeout for closing the notification, same as in the styles animation.
 */
export const TIME_TO_REMOVE_NOTIFICATION_MS = 300;

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
