/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import browser from 'webextension-polyfill';
import { backgroundPage } from '../extension-api/background-page';
import { tabsApi } from '../tabs/tabs-api';
import { uiService } from '../ui-service';
import { lazyGet } from './lazy';
import { browserUtils } from './browser-utils';
import { localStorage } from '../storage';

/**
 * Object that manages user settings.
 * @constructor
 */
export const notifications = (function () {
    const VIEWED_NOTIFICATIONS = 'viewed-notifications';
    const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

    const BIRTHDAY_13_ID = 'birthday13';

    const birthday13Notification = {
        id: BIRTHDAY_13_ID,
        locales: {
            en: {
                title: 'AdGuard',
                desc: 'Anniversary Quiz',
                btn: 'Play',
            },
            ru: {
                title: 'Нам 13 лет!',
                desc: 'Отпразднуем?',
                btn: 'Вперёд!',
            },
            es: {
                title: 'Test de cumpleaños',
                desc: 'de AdGuard',
                btn: 'Ponte a prueba',
            },
            de: {
                title: 'AdGuard-Quiz',
                desc: 'zum 13. Geburtstag',
                btn: "Los geht's!",
            },
            fr: {
                title: 'AdGuard fête ses 13',
                desc: 'ans !',
                btn: 'Test festif ici',
            },
            it: {
                title: 'AdGuard celebra i',
                desc: 'suoi 13 anni!',
                btn: 'Test festivo qui',
            },
            ko: {
                title: 'AdGuard 생일 퀴즈',
                btn: '퀴즈 시작',
            },
            zh_cn: {
                title: 'AdGuard 生日会',
                desc: '知识竞赛',
                btn: '我要参加！',
            },
            zh_tw: {
                title: 'AdGuard 生日派對',
                desc: '知識競賽',
                btn: '我要參加！',
            },
            ja: {
                title: 'AdGuard',
                desc: '創業13周年クイズ',
                btn: '答えてみる',
            },
            uk: {
                title: 'Вікторина до дня',
                desc: 'народження AdGuard',
                btn: 'Взяти участь',
            },
            pt_pt: {
                title: 'Quiz de aniversário',
                desc: 'AdGuard',
                btn: 'Teste-se',
            },
            pt_br: {
                title: 'Quiz de aniversário',
                desc: 'AdGuard',
                btn: 'Teste-se',
            },
            ar: {
                title: 'اختبار عيد ميلاد',
                desc: 'AdGuard',
                btn: 'اختبر نفسك',
            },
            be: {
                title: 'Тэст дня нараджэння',
                btn: 'Праверце сябе',
            },
            id: {
                title: 'Kuis ulang tahun',
                desc: 'AdGuard',
                btn: 'Uji dirimu',
            },
            pl: {
                title: 'Quiz urodzinowy',
                desc: 'AdGuard',
                btn: 'Sprawdź się',
            },
            tr: {
                title: 'AdGuard doğum günü',
                desc: 'testi',
                btn: 'Kendini test et',
            },
            vi: {
                title: 'Câu đố sinh nhật',
                desc: 'AdGuard',
                btn: 'Tự kiểm tra',
            },
        },
        text: '',
        url: 'https://adguard.com/forward.html?action=birthday13&app=browser_extension',
        from: '31 May 2022 12:00:00',
        to: '5 June 2022 23:59:00',
        type: 'animated',
        get icons() {
            return lazyGet(birthday13Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('assets/icons/b13-on-19.png'),
                    '38': backgroundPage.getURL('assets/icons/b13-on-38.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('assets/icons/b13-off-19.png'),
                    '38': backgroundPage.getURL('assets/icons/b13-off-38.png'),
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
        birthday13: birthday13Notification,
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
    const setNotificationViewed = async function (withDelay) {
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
            // TODO remove if for the next promo action, used for hotfix
            if (!viewedNotifications.includes(BIRTHDAY_13_ID)
                && window.localStorage.getItem(VIEWED_NOTIFICATIONS) === BIRTHDAY_13_ID) {
                viewedNotifications.push(BIRTHDAY_13_ID);
                localStorage.setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
            }
            if (!viewedNotifications.includes(id)) {
                viewedNotifications.push(id);
                localStorage.setItem(VIEWED_NOTIFICATIONS, viewedNotifications);
                const tab = await tabsApi.getActive();
                if (tab) {
                    uiService.updateTabIconAndContextMenu(tab);
                }
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
        if (browserUtils.isFirefoxBrowser()) {
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
