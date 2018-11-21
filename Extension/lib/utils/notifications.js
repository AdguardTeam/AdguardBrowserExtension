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
    // TODO add localisations and fix typedef
    let notifications = {
        blackFriday: {
            id: 'blackFriday',
            locales: {
                en: 'Black Friday: <strong>50% Off</strong> AdGuard Premium',
                de: 'Black Friday: <strong>-50%</strong> auf AdGuard Premium',
                es: 'Black Friday: <strong>-50%</strong> en AdGuard Premium',
                ja: '【BLACK FRIDAY】AdGuardプレミアム<strong>５０％OFF</strong>',
                fr: 'Black Friday: <strong>-50%</strong> sur AdGuard Premium',
                ru: 'Black Friday: <strong>-50%</strong> на AdGuard Премиум',
            },
            url: 'https://adguard.com/forward.html?action=special_bf18&from=browser_action&app=browser_extension',
            from: '23 Nov 2018 12:00:00',
            to: '25 Nov 2018 23:59:00',
            bgColor: '#000',
            textColor: '#fff',
            badgeBgColor: '#DF3812',
            badgeText: '!',
        },
    };

    let VIEWED_NOTIFICATIONS = 'viewed-notifications';

    let getItem = function (key) {
        return adguard.localStorage.getItem(key);
    };

    let setItem = function (key, value) {
        adguard.localStorage.setItem(key, value);
    };

    let currentNotification;
    let notificationCheckTime;
    let checkTimeoutMs = 10 * 60 * 1000;

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet
     * @returns {void|Notification} - notification
     */
    let getCurrentNotification = function () {
        let currentTime = new Date().getTime();

        if (currentNotification !== undefined
            && notificationCheckTime
            && (currentTime - notificationCheckTime) <= checkTimeoutMs) {
            return currentNotification;
        }

        notificationCheckTime = currentTime;

        let notificationsKeys = Object.keys(notifications);
        let viewedNotifications;

        try {
            viewedNotifications = getItem(VIEWED_NOTIFICATIONS) || [];
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
                && !viewedNotifications.includes(notificationKey)
            ) {
                currentNotification = notification;
                return currentNotification;
            }
        }

        return null;
    };

    let setNotificationViewed = function () {
        if (currentNotification) {
            let viewedNotifications = getItem(VIEWED_NOTIFICATIONS) || [];
            let id = currentNotification.id;
            if (!viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                try {
                    setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
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
