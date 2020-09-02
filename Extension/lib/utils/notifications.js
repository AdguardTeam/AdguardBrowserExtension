/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import { backgroundPage } from '../../browser/chrome/lib/api/background-page';
import { adguard } from '../adguard';
import { tabsApi } from '../tabs/tabs-api';
import { ui } from '../ui-service';

/**
 * Object that manages user settings.
 * @constructor
 */
export const notifications = (function () {
    const VIEWED_NOTIFICATIONS = 'viewed-notifications';
    const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

    const newYearNotification = {
        id: 'newYear2020',
        locales: {
            en: {
                title: 'AdGuard wishes you happy holidays',
                btn: 'Get your present',
            },
            de: {
                title: 'AdGuard wünscht Ihnen frohe Festtage!',
                btn: 'HOLEN SIE SICH IHR GESCHENK',
            },
            ko: {
                title: 'AdGuard는 행복한 크리스마스가 되길 바랍니다',
                btn: '선물 받기',
            },
            ru: {
                title: 'AdGuard поздравляет вас с праздниками',
                btn: 'Получить подарок!',
            },
            ja: {
                title: 'AdGuardからのクリスマスプレゼント',
                btn: 'プレゼントをGET',
            },
            fr: {
                title: 'AdGuard vous souhaite de joyeuses fêtes !',
                btn: 'VOIR CADEAU',
            },
            it: {
                title: 'AdGuard vi augura buone feste!',
                btn: 'VEDERE IL REGALO',
            },
        },
        text: '',
        url: 'https://adguard.com/forward.html?action=ny2020_notify&from=popup&app=browser_extension',
        from: '24 December 2019 00:00:00',
        to: '1 January 2020 00:00:00',
        type: 'animated',
        get icons() {
            return adguard.lazyGet(newYearNotification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('icons/green-19-ny.png'),
                    '38': backgroundPage.getURL('icons/green-38-ny.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('icons/gray-19-ny.png'),
                    '38': backgroundPage.getURL('icons/gray-38-ny.png'),
                },
            }));
        },
    };

    /**
     * @typedef Notification
     * @type object
     * @property {string} id
     * @property {object} locales
     * @property {string} url
     * @property {string} text
     * @property {string} from
     * @property {string} to
     * @property {string} bgColor;
     * @property {string} textColor;
     * @property {string} badgeBgColor;
     * @property {string} badgeText;
     * @property {string} type;
     */
    let notifications = {
        newYear2020: newYearNotification,
    };

    /**
     * Gets the last time a notification was shown.
     * If it was not shown yet, initialized with the current time.
     */
    const getLastNotificationTime = function () {
        let lastTime = localStorage.getItem(LAST_NOTIFICATION_TIME) || 0;
        if (lastTime === 0) {
            lastTime = new Date().getTime();
            localStorage.setItem(LAST_NOTIFICATION_TIME, lastTime);
        }
        return lastTime;
    };

    /**
     * Scans notification locales and returns the one matching navigator.language
     * @param {*} notification notification object
     * @returns {string} matching text or null
     */
    const getNotificationText = function (notification) {
        const { language } = navigator;
        if (!language) {
            return null;
        }

        const languageCode = language.split('-')[0];
        if (!languageCode) {
            return null;
        }

        return notification.locales[language] || notification.locales[languageCode];
    };

    /**
     * Scans notifications list and prepares them to be used (or removes expired)
     */
    const initNotifications = function () {
        const notificationsKeys = Object.keys(notifications);

        for (let i = 0; i < notificationsKeys.length; i += 1) {
            const notificationKey = notificationsKeys[i];
            const notification = notifications[notificationKey];

            notification.text = getNotificationText(notification);

            const to = new Date(notification.to).getTime();
            const expired = new Date().getTime() > to;

            if (!notification.text || expired) {
                // Remove expired and invalid
                delete notifications[notificationKey];
            }
        }
    };

    // Prepare the notifications
    initNotifications();

    let currentNotification;
    let notificationCheckTime;
    const checkTimeoutMs = 10 * 60 * 1000; // 10 minutes
    const minPeriod = 30 * 60 * 1000; // 30 minutes
    const DELAY = 30 * 1000; // clear notification in 30 seconds
    let timeoutId;

    /**
     * Marks current notification as viewed
     * @param {boolean} withDelay if true, do this after a 30 sec delay
     */
    const setNotificationViewed = function (withDelay) {
        if (withDelay) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setNotificationViewed(false);
            }, DELAY);
            return;
        }

        if (currentNotification) {
            const viewedNotifications = localStorage.getItem(VIEWED_NOTIFICATIONS) || [];
            const { id } = currentNotification;
            if (!viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                localStorage.setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
                tabsApi.tabs.getActive(ui.updateTabIconAndContextMenu);
                currentNotification = null;
            }
        }
    };

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet
     *
     * @returns {void|Notification} - notification
     */
    const getCurrentNotification = function () {
        const currentTime = new Date().getTime();
        const timeSinceLastNotification = currentTime - getLastNotificationTime();
        if (timeSinceLastNotification < minPeriod) {
            // Just a check to not show the notification too often
            return null;
        }

        // Check not often than once in 10 minutes
        const timeSinceLastCheck = currentTime - notificationCheckTime;
        if (notificationCheckTime > 0 && timeSinceLastCheck <= checkTimeoutMs) {
            return currentNotification;
        }
        // Update the last notification check time
        notificationCheckTime = currentTime;

        const notificationsKeys = Object.keys(notifications);
        const viewedNotifications = localStorage.getItem(VIEWED_NOTIFICATIONS) || [];

        for (let i = 0; i < notificationsKeys.length; i += 1) {
            const notificationKey = notificationsKeys[i];
            const notification = notifications[notificationKey];
            const from = new Date(notification.from).getTime();
            const to = new Date(notification.to).getTime();
            if (from < currentTime
                && to > currentTime
                && !viewedNotifications.includes(notification.id)
            ) {
                currentNotification = notification;
                return currentNotification;
            }
        }
        currentNotification = null;
        return currentNotification;
    };

    return {
        getCurrentNotification,
        setNotificationViewed,
    };
})();
