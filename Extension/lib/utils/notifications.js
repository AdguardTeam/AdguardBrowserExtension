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

    /**
     * @typedef Notification
     * @type object
     * @property {string} id
     * @property {object} locales
     * @property {string} url
     * @property {string} from
     * @property {string} to
     * @property {string} bgColor;
     * @property {string} textColor;
     * @property {string} badgeBgColor;
     * @property {string} badgeText;
     */

    let notifications = {
        blackFriday: {
            id: 'blackFriday',
            locales: {
                en: 'Black Friday: <strong>50% Off</strong> AdGuard Premium',
                ru: 'Black Friday: <strong>-50%</strong> на AdGuard Премиум',
                fr: 'Black Friday: <strong>-50%</strong> sur AdGuard Premium',
                es: 'Black Friday:<strong>-50%</strong> en AdGuard Premium',
                de: 'Black Friday: <strong>-50%</strong> auf AdGuard Premium',
                ja: 'AdGuardプレミアム<strong>【５０％OFF】</strong>',
            },
            // This field is filled below (see initNotifications)
            text: '',
            url: 'https://adguard.com/forward.html?action=special_bf18&from=browser_action&app=browser_extension',
            from: '23 Nov 2018 12:00:00',
            to: '26 Nov 2018 23:59:00',
            bgColor: '#000',
            textColor: '#fff',
            badgeBgColor: '#DF3812',
            badgeText: '!',
        },
    };

    /**
     * Scans notification locales and returns the one matching navigator.language
     * @param {*} notification notification object
     * @returns {string} matching text or null
     */
    let getNotificationText = function (notification) {
        const language = navigator.language;
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
    let initNotifications = function () {
        let notificationsKeys = Object.keys(notifications);

        for (let i = 0; i < notificationsKeys.length; i += 1) {
            let notificationKey = notificationsKeys[i];
            let notification = notifications[notificationKey];

            notification.text = getNotificationText(notification);

            let to = new Date(notification.to).getTime();
            let expired = new Date().getTime() > to;

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
    let getCurrentNotification = function () {
        let currentTime = new Date().getTime();
        let timeSinceLastCheck = currentTime - notificationCheckTime

        if (notificationCheckTime > 0 && timeSinceLastCheck <= checkTimeoutMs) {
            return currentNotification;
        }

        notificationCheckTime = currentTime;

        let notificationsKeys = Object.keys(notifications);
        let viewedNotifications;

        try {
            viewedNotifications = adguard.localStorage.getItem(VIEWED_NOTIFICATIONS) || [];
        } catch (e) {
            adguard.console.error(e);
            currentNotification = null;
            return currentNotification;
        }

        for (let i = 0; i < notificationsKeys.length; i += 1) {
            let notificationKey = notificationsKeys[i];
            let notification = notifications[notificationKey];
            let from = new Date(notification.from).getTime();
            let to = new Date(notification.to).getTime();
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

    let setNotificationViewed = function (withDelay) {
        if (withDelay) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setNotificationViewed(false);
            }, DELAY);
            return;
        }

        if (currentNotification) {
            let viewedNotifications = adguard.localStorage.getItem(VIEWED_NOTIFICATIONS) || [];
            let id = currentNotification.id;
            if (!viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                try {
                    adguard.localStorage.setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
                    adguard.tabs.getActive(adguard.ui.updateTabIconAndContextMenu);
                    currentNotification = null;
                } catch (e) {
                    adguard.console.error(e);
                }
            }
        }
    };

    return {
        getCurrentNotification: getCurrentNotification,
        setNotificationViewed: setNotificationViewed,
    };
})(adguard);
