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
import browser from 'webextension-polyfill';
import { tabsApi as tsWebExtTabsApi } from '@adguard/tswebextension';

import { UserAgent } from '../../../common/user-agent';
import {
    notificationStorage,
    Notification,
    storage,
} from '../../storages';
import { NotificationTextRecord } from '../../schema';
import { TabsApi } from '../extension';
import { LAST_NOTIFICATION_TIME_KEY, VIEWED_NOTIFICATIONS_KEY } from '../../../common/constants';
import { UiApi } from './main';
import { Log } from '../../../common/log';
import { I18n } from '../../utils';

/**
 * Notification API is needed to work with notifications.
 */
export class NotificationApi {
    private static readonly CHECK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    private static readonly MIN_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

    private static readonly DELAY_MS = 30 * 1000; // clear notification in 30 seconds

    private currentNotification: Notification | null = null;

    private notificationCheckTime = 0;

    private timeoutId: number | undefined = undefined;

    private isInit = false;

    /**
     * Scans notifications list and prepares them to be used (or removes expired).
     */
    public init(): void {
        notificationStorage.forEach((notification, notificationKey, map) => {
            notification.text = NotificationApi.getNotificationText(notification) || null;

            const to = new Date(notification.to).getTime();
            const expired = new Date().getTime() > to;

            if (!notification.text || expired) {
                // Remove expired and invalid
                map.delete(notificationKey);
            }
        });

        this.isInit = true;
    }

    /**
     * Marks current notification as viewed.
     *
     * @param withDelay If true, do this after a 30 sec delay.
     */
    public async setNotificationViewed(withDelay: boolean): Promise<void> {
        if (withDelay) {
            window.clearTimeout(this.timeoutId);

            this.timeoutId = window.setTimeout(() => {
                this.setNotificationViewed(false);
            }, NotificationApi.DELAY_MS);
            return;
        }

        if (this.currentNotification) {
            const { id } = this.currentNotification;

            const viewedNotifications = await storage.get(VIEWED_NOTIFICATIONS_KEY) || [];

            if (Array.isArray(viewedNotifications) && !viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                await storage.set(VIEWED_NOTIFICATIONS_KEY, viewedNotifications);

                const tab = await TabsApi.getActive();

                if (!tab?.id) {
                    Log.error('Can\'t get active tab');
                    return;
                }

                const tabContext = tsWebExtTabsApi.getTabContext(tab.id);

                if (tabContext) {
                    await UiApi.update(tabContext);
                }

                this.currentNotification = null;
            }
        }
    }

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet.
     */
    public async getCurrentNotification(): Promise<Notification | null> {
        // Do not display notification on Firefox
        if (UserAgent.isFirefox) {
            return null;
        }

        // Do not display notification before initialization
        if (!this.isInit) {
            return null;
        }

        const currentTime = Date.now();
        const timeSinceLastNotification = currentTime - await NotificationApi.getLastNotificationTime();

        // Just a check to not show the notification too often
        if (timeSinceLastNotification < NotificationApi.MIN_PERIOD_MS) {
            return null;
        }

        // Check not often than once in 10 minutes
        const timeSinceLastCheck = currentTime - this.notificationCheckTime;
        if (this.notificationCheckTime > 0 && timeSinceLastCheck <= NotificationApi.CHECK_TIMEOUT_MS) {
            return this.currentNotification;
        }

        // Update the last notification check time
        this.notificationCheckTime = currentTime;

        const notificationsValues = Array.from(notificationStorage.values());

        const viewedNotifications = await storage.get(VIEWED_NOTIFICATIONS_KEY) || [];

        for (let i = 0; i < notificationsValues.length; i += 1) {
            const notification = notificationsValues[i];

            if (!notification) {
                continue;
            }

            const from = new Date(notification.from).getTime();
            const to = new Date(notification.to).getTime();
            if (from < currentTime
                && to > currentTime
                && Array.isArray(viewedNotifications)
                && !viewedNotifications.includes(notification.id)
            ) {
                this.currentNotification = notification;
                return this.currentNotification;
            }
        }

        this.currentNotification = null;

        return this.currentNotification;
    }

    /**
     * Scans notification locales and returns the one matching navigator.language.
     *
     * @param notification Notification object.
     * @returns {NotificationTextRecord | undefined} Matching  notification text settings or undefined.
     */
    private static getNotificationText(notification: Notification): NotificationTextRecord | undefined {
        const language = I18n.normalizeLanguageCode(browser.i18n.getUILanguage());

        if (!language) {
            return;
        }

        const languageCode = language.split('_')[0];
        if (!languageCode) {
            return;
        }

        return notification.locales[language] || notification.locales[languageCode];
    }

    /**
     * Gets the last time a notification was shown.
     * If it was not shown yet, initialized with the current time.
     */
    private static async getLastNotificationTime(): Promise<number> {
        let lastTime = Number(await storage.get(LAST_NOTIFICATION_TIME_KEY) || 0);

        if (lastTime === 0) {
            lastTime = Date.now();
            await storage.set(LAST_NOTIFICATION_TIME_KEY, lastTime);
        }

        return lastTime;
    }
}

export const notificationApi = new NotificationApi();
