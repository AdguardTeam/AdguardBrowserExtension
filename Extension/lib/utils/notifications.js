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

/**
 * Object that manages user settings.
 * @constructor
 */
adguard.notifications = (function (adguard) {
    'use strict';

    const VIEWED_NOTIFICATIONS = 'viewed-notifications';

    const halloweenNotification = {
        id: 'halloween',
        locales: {
            en: 'Trick or Treat?',
            de: 'Süßes oder Saures?',
            ru: 'Кошелек или жизнь?',
            fr: 'Bonbons ou bâtons ?',
            it: 'Dolcetto o scherzetto?',
            ja: 'トリック・オア・トリート',
            ko: '트릭 오어 트릿',
        },
        text: '',
        url: 'https://adguard.com/forward.html?action=adguard_site_notify&from=holiday_notify&app=browser_extension',
        from: '29 October 2019 00:00:00',
        to: '1 November 2019 23:59:00',
        type: 'animated',
        get icons() {
            return adguard.lazyGet(halloweenNotification, 'icons', () => ({
                ICON_BLUE: {
                    '19': adguard.getURL('icons/blue-19-halloween.png'),
                    '38': adguard.getURL('icons/blue-38-halloween.png'),
                },
                ICON_GREEN: {
                    '19': adguard.getURL('icons/green-19-halloween.png'),
                    '38': adguard.getURL('icons/green-38-halloween.png'),
                },
                ICON_GRAY: {
                    '19': adguard.getURL('icons/gray-19-halloween.png'),
                    '38': adguard.getURL('icons/gray-38-halloween.png'),
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
    const notifications = {
        tenYear: {
            id: 'tenYear',
            locales: {
                en: '10th Anniversary 50% Sale and a Giveaway! Learn more',
                de: '50% Rabatt und eine Verlosung zum 10. Geburtstag von AdGuard! Erfahren Sie mehr',
                fr: 'Réduction de 50% et Giveaway pour notre 10-éme Anniversaire ! En savoir plus',
                ru: 'Скидка 50% и розыгрыш призов в честь 10-летия AdGuard! Узнайте больше',
                ja: '【10周年】半額セール & プレゼント抽選！詳細はこちら',
            },
            // This field is filled below (see initNotifications)
            text: '',
            url: 'https://adguard.com/forward.html?action=special_ten&from=browser_action&app=browser_extension',
            from: '1 June 2019 00:00:00',
            to: '3 June 2019 23:59:00',
            bgColor: '#67b279',
            textColor: '#fff',
            badgeBgColor: '#DF3812',
            badgeText: '!',
            type: 'simple',
        },
        halloween: halloweenNotification,
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

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet
     * @returns {void|Notification} - notification
     */
    const getCurrentNotification = function () {
        const currentTime = new Date().getTime();
        const timeSinceLastCheck = currentTime - notificationCheckTime;

        // Check not often than once in 10 minutes
        if (notificationCheckTime > 0 && timeSinceLastCheck <= checkTimeoutMs) {
            return currentNotification;
        }

        notificationCheckTime = currentTime;

        const notificationsKeys = Object.keys(notifications);

        const viewedNotifications = adguard.localStorage.getItem(VIEWED_NOTIFICATIONS) || [];

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

    const DELAY = 30 * 1000; // clear notification in 30 seconds
    let timeoutId;

    const setNotificationViewed = function (withDelay) {
        if (withDelay) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setNotificationViewed(false);
            }, DELAY);
            return;
        }

        if (currentNotification) {
            const viewedNotifications = adguard.localStorage.getItem(VIEWED_NOTIFICATIONS) || [];
            const { id } = currentNotification;
            if (!viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                adguard.localStorage.setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
                adguard.tabs.getActive(adguard.ui.updateTabIconAndContextMenu);
                currentNotification = null;
            }
        }
    };

    return {
        getCurrentNotification,
        setNotificationViewed,
    };
})(adguard);
