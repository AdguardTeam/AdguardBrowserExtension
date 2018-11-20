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
     * @property {string} messageKey
     * @property {string} url
     * @property {string} from
     * @property {string} to
     * @property {string} bgColor;
     * @property {string} textColor;
     */

    var notifications = {
        blackFriday: {
            id: 'blackFriday',
            messageKey: 'popup_ad_notification_black_friday',
            // TODO set real url
            url: 'https://adguard.com',
            // TODO change date to 23 Nov
            from: '20 Nov 2018 00:00:00',
            to: '25 Nov 2018 23:59:59',
            bgColor: '#000',
            textColor: '#fff',
        },
    };

    var VIEWED_NOTIFICATIONS = 'viewed-notifications';

    // TODO add cache

    var getItem = function (key) {
        var value = adguard.localStorage.getItem(key);
        if (value) {
            return JSON.parse(value);
        }
        return value;
    };

    var setItem = function (key, value) {
        adguard.localStorage.setItem(key, JSON.stringify(value));
    };

    /**
     * Finds out notification for current time and checks if notification wasn't shown yet
     * @returns {void|Notification} - notification
     */
    var getCurrentNotification = function () {
        var currentTime = new Date().getTime();
        var notificationsKeys = Object.keys(notifications);
        var viewedNotifications;

        try {
            viewedNotifications = getItem(VIEWED_NOTIFICATIONS) || [];
        } catch (e) {
            adguard.console.error(e);
            return;
        }

        console.log(viewedNotifications);

        for (var i = 0; i < notificationsKeys.length; i += 1) {
            var notificationKey = notificationsKeys[i];
            var notification = notifications[notificationKey];
            var from = new Date(notification.from).getTime();
            var to = new Date(notification.to).getTime();
            if (from < currentTime
                && to > currentTime
                && !viewedNotifications.includes(notificationKey)
            ) {
                return notification;
            }
        }
    };

    var setNotificationViewed = function (notificationId) {
        var viewedNotifications = getItem(VIEWED_NOTIFICATIONS) || [];
        if (!viewedNotifications.includes(notificationId)) {
            viewedNotifications.push(notificationId);
            try {
                setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
            } catch (e) {
                adguard.console.error(e);
            }
        }
    };

    return {
        getCurrentNotification: getCurrentNotification,
        setNotificationViewed: setNotificationViewed,
    };
})(adguard);
