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

    const HALLOWEEN_PROMO_22_ID = 'halloweenPromo22';

    const halloweenPromo22Notification = {
        id: HALLOWEEN_PROMO_22_ID,
        locales: {
            en: {
                title: 'Halloween promo',
                btn: 'Get 40% off',
            },
            ru: {
                title: 'Акция на Хэллоуин',
                btn: 'Скидка 40%',
            },
            ja: {
                title: 'ハロウィンキャンペーン',
                btn: '40%OFF割引をGET',
            },
            ko: {
                title: '할로윈 프로모션',
                btn: '40% 할인 받기',
            },
            es: {
                title: 'Rebajas de Halloween',
                btn: 'Obtén un 40% off',
            },
            de: {
                title: 'Halloween-Sale',
                btn: '40% Rabatt erhalten',
            },
            fr: {
                title: 'Promo Halloween',
                btn: 'Remise 40%',
            },
            it: {
                title: 'Offerta Halloween',
                btn: '40% di sconto',
            },
            zh_cn: {
                title: '万圣节优惠',
                btn: '低至6折',
            },
            zh_tw: {
                title: '萬聖節折扣',
                btn: '低至六折',
            },
            pt_pt: {
                title: 'Promoção de Halloween',
                btn: 'Garanta 40% off',
            },
            pt_br: {
                title: 'Promoção de Halloween',
                btn: 'Garanta 40% off',
            },
            uk: {
                title: 'Акція на Хелловін',
                btn: 'Знижка 40%',
            },
            ar: {
                title: 'عرض عيد الهالوين',
                btn: '٪احصل على خصم 40',
            },
            be: {
                title: 'Прома на Хэлоўін',
                btn: 'Зніжка 40%',
            },
            bg: {
                title: 'Хелоуин промо',
                btn: '40% отстъпка',
            },
            ca: {
                title: 'Promoció de Halloween',
                btn: '40% de descompte',
            },
            cs: {
                title: 'Halloweenská promo akce',
                btn: '40% sleva',
            },
            da: {
                title: 'Halloween-kampagne',
                btn: 'Få 40% rabat',
            },
            el: {
                title: 'Απόκριες promo',
                btn: 'Έκπτωση 40%',
            },
            es_419: {
                title: 'Rebajas de Halloween',
                btn: 'Obtén un 40% off',
            },
            fa: {
                title: 'تبلیغاتی هالووین',
                btn: 'دریافت 40٪ خاموش',
            },
            fi: {
                title: 'Halloween-kampanja',
                btn: 'Saat 40% alennuksen',
            },
            he: {
                title: 'פרומו ליל כל הקדושים',
                btn: 'קבל 40% הנחה',
            },
            hr: {
                title: 'Promocija za Noć vještica',
                btn: '40% popusta',
            },
            hu: {
                title: 'Halloween promóció',
                btn: '40% kedvezmény',
            },
            hy: {
                title: 'Հելոուինի պրոմո',
                btn: '40% զեղչ',
            },
            id: {
                title: 'Promosi Halloween',
                btn: 'Dapatkan diskon 40%',
            },
            lt: {
                title: 'Helovino akcija',
                btn: '40% nuolaida',
            },
            ms: {
                title: 'Promosi Halloween',
                btn: 'Diskaun 40%',
            },
            nb: {
                title: 'Halloween-kampanje',
                btn: 'Få 40% avslag',
            },
            nl: {
                title: 'Halloween promotie',
                btn: 'Ontvang 40% korting',
            },
            pl: {
                title: 'Promocja Halloween',
                btn: 'Uzyskaj 40% zniżki',
            },
            ro: {
                title: 'Promoție de Halloween',
                btn: '40% reducere',
            },
            sk: {
                title: 'Propagácia Halloweenu',
                btn: 'Získajte 40% zľavu',
            },
            sl: {
                title: 'Promocija noči čarovnic',
                btn: 'Dobi 40% popusta',
            },
            sr: {
                title: 'Promocija za Noć veštica',
                btn: 'Skini 40% popusta',
            },
            sv: {
                title: 'Halloween-kampanj',
                btn: 'Få 40% rabatt',
            },
            tr: {
                title: 'Cadılar Bayramı promosyonu',
                btn: '%40 indirim',
            },
            vi: {
                title: 'Khuyến mãi Halloween',
                btn: 'Giảm giá 40%',
            },
            hi: {
                title: 'हेलोवीन पदोन्नति',
                btn: '40% की छूट',
            },
            et: {
                title: 'Halloweeni promo',
                btn: '40% allahindlust',
            },
            th: {
                title: 'โปรโมชั่นฮาโลวีน',
                btn: 'รับส่วนลด 40%',
            },
        },
        text: '',
        url: 'https://link.adtidy.org/forward.html?action=halloween_promo_22&app=browser_extension',
        from: '27 October 2022 12:00:00',
        to: '2 November 2022 23:59:00',
        type: 'animated',
        get icons() {
            return lazyGet(halloweenPromo22Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('assets/icons/hlw22-on-19.png'),
                    '38': backgroundPage.getURL('assets/icons/hlw22-on-38.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('assets/icons/hlw22-off-19.png'),
                    '38': backgroundPage.getURL('assets/icons/hlw22-off-38.png'),
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
        halloweenPromo22: halloweenPromo22Notification,
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
