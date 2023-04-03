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

    const EASTER_PROMO_23_ID = 'easterPromo23';

    const easterPromo23Notification = {
        id: EASTER_PROMO_23_ID,
        locales: {
            en: {
                title: 'Happy Easter',
                btn: 'Get up to 40% off',
            },
            ru: {
                title: 'Весенняя акция',
                btn: 'Скидки до 40%',
            },
            ko: {
                title: '부활절 세일',
                btn: '최대 40% 할인',
            },
            es: {
                title: 'Felices Pascuas',
                btn: 'Hasta un 40% off',
            },
            de: {
                title: 'Frohe Ostern',
                btn: 'Bis zu 40% Rabatt',
            },
            pt_pt: {
                title: 'Feliz Páscoa',
                btn: 'Até 40% off',
            },
            pt_br: {
                title: 'Feliz Páscoa',
                btn: 'Até 40% off',
            },
            zh_tw: {
                title: '暖春特惠',
                btn: '低至6折',
            },
            zh_cn: {
                title: '春季钜惠',
                btn: '低至6折',
            },
            fr: {
                title: 'Joyeuses Pâques',
                btn: "Jusqu'à 40% de remise",
            },
            it: {
                title: 'Buona Pascua',
                btn: 'Fino al 40% di sconto',
            },
            uk: {
                title: 'Весняна акція',
                btn: 'Знижки до 40%',
            },
            ar: {
                title: 'تعزيز الربيع',
                btn: 'خصم حتي 40٪',
            },
            be: {
                title: 'Вясновая акцыя',
                btn: 'Зніжка да 40%',
            },
            bg: {
                title: 'Пролетна промоция',
                btn: 'Отстъпка до 40%',
            },
            ca: {
                title: 'Feliç Pasqua',
                btn: 'Fins a −40%',
            },
            cs: {
                title: 'Veselé Velikonoce',
                btn: 'Sleva až 40%',
            },
            da: {
                title: 'God påske',
                btn: 'Rabat op til 40%',
            },
            el: {
                title: 'ανοιξιάτικη προώθηση',
                btn: 'Έκπτωση έως 40%',
            },
            es_419: {
                title: 'Felices Pascuas',
                btn: 'Hasta un 40% off',
            },
            fa: {
                title: 'تبلیغات بهار',
                btn: 'تخفیف تا 40%',
            },
            fi: {
                title: 'Hyvää pääsiäistä',
                btn: 'Jopa 40% alennus',
            },
            he: {
                title: 'קידום אביב',
                btn: 'הנחות עד 40%',
            },
            hr: {
                title: 'Sretan Uskrs',
                btn: 'Popusti do 40%',
            },
            hu: {
                title: 'Tavaszi akció',
                btn: 'Akár 40% kedvezmény',
            },
            hy: {
                title: 'գարնանային ակցիա',
                btn: 'Զեղչեր մինչև 40%',
            },
            id: {
                title: 'Promosi musim semi',
                btn: 'Diskon hingga 40%',
            },
            lt: {
                title: 'linksmų Velykų',
                btn: 'Nuolaidos iki 40%',
            },
            ms: {
                title: 'Promosi musim bunga',
                btn: 'Diskaun sehingga 40%',
            },
            nb: {
                title: 'God påske',
                btn: 'Opptil 40 % rabatt',
            },
            nl: {
                title: 'Vrolijk Pasen',
                btn: 'Tot 40% korting',
            },
            pl: {
                title: 'Szczęśliwej Wielkanocy',
                btn: 'Do 40% zniżki',
            },
            ro: {
                title: 'Promoție de primăvară',
                btn: 'Până la 40% reducere',
            },
            sk: {
                title: 'Šťastnú Veľkú noc',
                btn: 'Až 40% zľava',
            },
            sl: {
                title: 'Srečno veliko noč',
                btn: 'Do 40% popust',
            },
            sr: {
                title: 'Prolećna promocija',
                btn: 'Popusti do 40%',
            },
            sv: {
                title: 'Glad påsk',
                btn: 'Upp till 40 % rabatt',
            },
            tr: {
                title: 'Bahar promosyonu',
                btn: "%40'a varan indirim",
            },
            vi: {
                title: 'Khuyến mãi mùa xuân',
                btn: 'Giảm giá tới 40%',
            },
            hi: {
                title: 'वसंत पदोन्नति',
                btn: '40% तक की छूट',
            },
            et: {
                title: 'Lihavõttepühade reklaam',
                btn: 'Kuni 40% soodustus',
            },
            th: {
                title: 'โปรโมชั่นฤดูใบไม้ผลิ',
                btn: 'ส่วนลดสูงสุดถึง 40%',
            },
        },
        text: '',
        url: 'https://link.adtidy.net/forward.html?action=easter_promo_23&app=browser_extension',
        from: '06 April 2023 12:00:00',
        to: '12 April 2023 23:59:00',
        type: 'animated',
        get icons() {
            return lazyGet(easterPromo23Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('assets/icons/easter2023-on-19.png'),
                    '38': backgroundPage.getURL('assets/icons/easter2023-on-38.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('assets/icons/easter2023-off-19.png'),
                    '38': backgroundPage.getURL('assets/icons/easter2023-off-38.png'),
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
        easterPromo23: easterPromo23Notification,
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
