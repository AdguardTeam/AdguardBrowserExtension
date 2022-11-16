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

    const BLACK_FRIDAY_PROMO_22_ID = 'blackFriday22';

    const blackFriday22Notification = {
        id: BLACK_FRIDAY_PROMO_22_ID,
        locales: {
            en: {
                title: 'Black Friday',
                btn: 'Get 50% off',
            },
            ru: {
                title: 'Чёрная пятница',
                btn: 'Скидка 50%',
            },
            ja: {
                title: 'BLACK FRIDAY',
                btn: '50%OFF割引をGETする',
            },
            ko: {
                title: '블랙 프라이데이',
                btn: '50% 할인',
            },
            es: {
                title: 'Black Friday',
                btn: 'Descuento de 50%',
            },
            de: {
                title: 'Black Friday',
                btn: '50% Rabatt',
            },
            fr: {
                title: 'Black Friday',
                btn: '50% de remise',
            },
            it: {
                title: 'Black Friday',
                btn: '50% di sconto',
            },
            zh_cn: {
                title: '黑五优惠',
                btn: '享5折',
            },
            zh_tw: {
                title: '黑五優惠',
                btn: '享5折',
            },
            pt_pt: {
                title: 'Black Friday',
                btn: 'Desconto de 50%',
            },
            pt_br: {
                title: 'Black Friday',
                btn: 'Desconto de 50%',
            },
            uk: {
                title: 'Чорна п\'ятниця',
                btn: 'Знижка 50%',
            },
            ar: {
                title: 'الجمعة السوداء',
                btn: '%خصم 50',
            },
            be: {
                title: 'Чорная пятніца',
                btn: '50% зніжка',
            },
            bg: {
                title: 'Черен петък',
                btn: '50% отстъпка',
            },
            ca: {
                title: 'Divendres Negre',
                btn: '50% de descompte',
            },
            cs: {
                title: 'Černý pátek',
                btn: '50% sleva',
            },
            da: {
                title: 'Black Friday',
                btn: '50% rabat',
            },
            el: {
                title: 'Μαύρη Παρασκευή',
                btn: '50% έκπτωση',
            },
            es_419: {
                title: 'Viernes Negro',
                btn: '50% de descuento',
            },
            fa: {
                title: 'جمعه سیاه',
                btn: '50٪ تخفیف',
            },
            fi: {
                title: 'Musta perjantai',
                btn: '50% alennus',
            },
            he: {
                title: 'Black Friday',
                btn: '50% הנחה',
            },
            hr: {
                title: 'Crni petak',
                btn: '50% popusta',
            },
            hu: {
                title: 'Fekete péntek',
                btn: '50% kedvezmény',
            },
            hy: {
                title: 'Սեւ ուրբաթ',
                btn: '50% զեղչ',
            },
            id: {
                title: 'Jumat Hitam',
                btn: 'Diskon 50%',
            },
            lt: {
                title: 'Juodasis penktadienis',
                btn: '50% nuolaida',
            },
            ms: {
                title: 'Jumaat Hitam',
                btn: 'Diskaun 50%',
            },
            nb: {
                title: 'Svart fredag',
                btn: '50% rabatt',
            },
            nl: {
                title: 'Zwarte Vrijdag',
                btn: '50% korting',
            },
            pl: {
                title: 'Czarny piątek',
                btn: '50% zniżki',
            },
            ro: {
                title: 'Back Friday',
                btn: '50% reducere',
            },
            sk: {
                title: 'Čierny piatok',
                btn: '50% zľava',
            },
            sl: {
                title: 'Črni petek',
                btn: '50% popust',
            },
            sr: {
                title: 'Crni petak',
                btn: '50% popusta',
            },
            sv: {
                title: 'Black Friday',
                btn: '50% rabatt',
            },
            tr: {
                title: 'Black Friday',
                btn: '%50 indirim',
            },
            vi: {
                title: 'Black Friday',
                btn: 'Giảm giá 50%',
            },
            hi: {
                title: 'ब्लैक फ्राइडे',
                btn: '50% छूट',
            },
            et: {
                title: 'Must reede',
                btn: '50% soodustust',
            },
            th: {
                title: 'Black Friday',
                btn: 'ส่วนลด 50%',
            },
        },
        text: '',
        url: 'https://link.adtidy.net/forward.html?action=black_friday_22&app=browser_extension',
        from: '22 November 2022 15:00:00',
        to: '29 November 2022 23:59:00',
        type: 'animated',
        get icons() {
            return lazyGet(blackFriday22Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('assets/icons/bf22-on-19.png'),
                    '38': backgroundPage.getURL('assets/icons/bf22-on-38.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('assets/icons/bf22-off-19.png'),
                    '38': backgroundPage.getURL('assets/icons/bf22-off-38.png'),
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
        blackFriday22: blackFriday22Notification,
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
        VIEWED_NOTIFICATIONS,
        LAST_NOTIFICATION_TIME,
    };
})();
