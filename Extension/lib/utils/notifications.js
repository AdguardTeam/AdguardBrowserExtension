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
    const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

    const easter2021Notification = {
        id: 'easter2021',
        locales: {
            en: {
                btn: 'Eggcellent deal',
                updateTitle: 'Happy Easter sale',
                updateBtn: 'Hop on in',
            },
            ru: {
                btn: 'Что в яйце?',
                updateTitle: 'Весенняя распродажа',
                updateBtn: 'Cкидка 40%',
            },
            ja: {
                btn: 'タマゴの中身を見る',
                updateTitle: 'イースターキャンペーン',
                updateBtn: '40%割引を手に入れる',
            },
            ko: {
                btn: '유료 버전의 장점 보기',
                updateTitle: '부활절 맞이 40% 할인',
                updateBtn: '할인 받기',
            },
            zh_cn: {
                btn: '惊喜优惠高级保护',
                updateTitle: '复活节狂欢',
                updateBtn: '一键加入',
            },
            zh_tw: {
                btn: '驚喜優惠進階保護',
                updateTitle: '復活節狂歡優惠',
                updateBtn: '一鍵加入',
            },
            fr: {
                btn: 'Oeuf de Pâques',
                updateTitle: 'Marché de Pâques',
                updateBtn: 'Venez voir',
            },
            es: {
                btn: '–40% en licencias!',
                updateTitle: 'Promoción de Pascua',
                updateBtn: 'Descúbrela',
            },
        },
        text: '',
        url: 'https://adguard.com/forward.html?action=easter2021&app=browser_extension',
        from: '02 April 2021 00:01:00',
        to: '07 April 2021 00:01:00',
        type: 'animated',
        get icons() {
            return adguard.lazyGet(easter2021Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': adguard.getURL('icons/blue-19-easter.png'),
                    '38': adguard.getURL('icons/blue-38-easter.png'),
                },
                ICON_GRAY: {
                    '19': adguard.getURL('icons/gray-19-easter.png'),
                    '38': adguard.getURL('icons/gray-38-easter.png'),
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
        easter2021: easter2021Notification,
    };

    /**
     * Gets the last time a notification was shown.
     * If it was not shown yet, initialized with the current time.
     */
    const getLastNotificationTime = function () {
        let lastTime = adguard.localStorage.getItem(LAST_NOTIFICATION_TIME) || 0;
        if (lastTime === 0) {
            lastTime = new Date().getTime();
            adguard.localStorage.setItem(LAST_NOTIFICATION_TIME, lastTime);
        }
        return lastTime;
    };

    const normalizeLanguage = (locale) => {
        if (!locale) {
            return null;
        }

        return locale.toLowerCase().replace('-', '_');
    };

    /**
     * Scans notification locales and returns the one matching navigator.language
     * @param {*} notification notification object
     * @returns {string} matching text or null
     */
    const getNotificationText = function (notification) {
        const browser = window.browser || chrome;
        const language = normalizeLanguage(browser.i18n.getUILanguage());

        if (!language) {
            return null;
        }

        const languageCode = language.split('_')[0];
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

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet
     *
     * @returns {null|Notification} - notification
     */
    const getCurrentNotification = function () {
        // Do not display notification on Firefox
        if (adguard.utils.browser.isFirefoxBrowser()) {
            return null;
        }

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

    return {
        getCurrentNotification,
        setNotificationViewed,
    };
})(adguard);
