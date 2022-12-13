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

    const XMAS_PROMO_23_ID = 'xmasPromo23';

    const xmasPromo23Notification = {
        id: XMAS_PROMO_23_ID,
        locales: {
            en: {
                title: 'AdGuard X-mas promo!',
                btn: 'Upgrade protection',
            },
            ru: {
                title: 'Новогодняя акция',
                btn: 'Улучшите защиту',
            },
            ja: {
                title: 'AdGuard Christmas',
                btn: '保護をアップグレード',
            },
            ko: {
                title: 'AdGuard 크리스마스 세일',
                btn: '보호 업그레이드',
            },
            es: {
                title: 'Promoción de Navidad',
                btn: 'Aumenta tu protección',
            },
            de: {
                title: 'AdGuards Weihnachtsangebot',
                btn: 'Schutz erweitern',
            },
            pt_pt: {
                title: 'Promoção de Natal',
                btn: 'Aumenta tua proteção',
            },
            pt_br: {
                title: 'Promoção de Natal',
                btn: 'Aumente sua proteção',
            },
            zh_tw: {
                title: 'AdGuard 聖誕折扣',
                btn: '升級保護',
            },
            zh_cn: {
                title: 'AdGuard 圣诞优惠',
                btn: '升级保护',
            },
            fr: {
                title: 'Promo de Noël chez AdGuard',
                btn: 'Augmentez la protection',
            },
            it: {
                title: 'Promo di Natale ad AdGuard',
                btn: 'Aumentare protezione',
            },
            uk: {
                title: 'Новорічна акція',
                btn: 'Покращити захист',
            },
            ar: {
                title: 'العام الجديد الترويجي',
                btn: 'ترقية الحماية',
            },
            be: {
                title: 'Навагодняя акцыя',
                btn: 'Палепшыце абарону',
            },
            bg: {
                title: 'Новогодишна промоция',
                btn: 'Надстройте защитата си',
            },
            ca: {
                title: 'Promoció d\'Any Nou',
                btn: 'Millora la protecció',
            },
            cs: {
                title: 'Vánoční promo akce',
                btn: 'Upgradujte svou ochranu',
            },
            da: {
                title: 'Nytårs promo',
                btn: 'Beskyttelse mod opgradering',
            },
            el: {
                title: 'Πρωτοχρονιάτικη προσφορά',
                btn: 'Προστασία αναβάθμισης',
            },
            fa: {
                title: 'تخفیف های سال نو',
                btn: 'ارتقاء حفاظت',
            },
            fi: {
                title: 'Uudenvuoden promo',
                btn: 'Päivityksen suojaus',
            },
            he: {
                title: 'פרומו לשנה החדשה',
                btn: 'הגנת שדרוג',
            },
            hr: {
                title: 'Božićna promocija',
                btn: 'Zaštita od nadogradnje',
            },
            hu: {
                title: 'Újévi promóció',
                btn: 'A védelem frissítése',
            },
            hy: {
                title: 'Ամանորյա պրոմո',
                btn: 'Բարձրացնել պաշտպանությունը',
            },
            id: {
                title: 'Promo Tahun Baru',
                btn: 'Tingkatkan perlindungan',
            },
            lt: {
                title: 'Kalėdų reklama',
                btn: 'Atnaujinkite apsaugą',
            },
            ms: {
                title: 'Promosi Tahun Baru',
                btn: 'Perlindungan naik taraf',
            },
            nb: {
                title: 'Nyttårskampanje',
                btn: 'Oppgrader beskyttelse',
            },
            nl: {
                title: 'Nieuwjaarspromo',
                btn: 'Upgrade bescherming',
            },
            pl: {
                title: 'Świąteczna promocja',
                btn: 'Ochrona przed aktualizacją',
            },
            ro: {
                title: 'Promoția de Anul Nou',
                btn: 'Protecția upgrade-ului',
            },
            sk: {
                title: 'Novoročné promo',
                btn: 'Inovujte svoju ochranu',
            },
            sl: {
                title: 'Novoletni promo',
                btn: 'Nadgradite svojo zaščito',
            },
            sr: {
                title: 'Novogodišnja promocija',
                btn: 'Poboljšanje bezbednosti',
            },
            sv: {
                title: 'Nyårskampanj',
                btn: 'Uppgradera skydd',
            },
            tr: {
                title: 'Yılbaşı İndirimi',
                btn: 'Yükseltme koruması',
            },
            vi: {
                title: 'Khuyến mãi năm mới',
                btn: 'Bảo vệ nâng cấp',
            },
            hi: {
                title: 'नए साल का प्रोमो',
                btn: 'सुरक्षा का नवीनीकरण करें',
            },
            et: {
                title: 'Uusaasta promo',
                btn: 'Täienduse kaitse',
            },
            th: {
                title: 'โปรโมชั่นปีใหม่',
                btn: 'การป้องกันการอัพเกรด',
            },
        },
        text: '',
        url: 'https://link.adtidy.net/forward.html?action=xmas_promo_23&app=browser_extension',
        from: '22 December 2022 15:00:00',
        to: '02 January 2023 23:59:00',
        type: 'animated',
        get icons() {
            return lazyGet(xmasPromo23Notification, 'icons', () => ({
                ICON_GREEN: {
                    '19': backgroundPage.getURL('assets/icons/xmas23-on-19.png'),
                    '38': backgroundPage.getURL('assets/icons/xmas23-on-38.png'),
                },
                ICON_GRAY: {
                    '19': backgroundPage.getURL('assets/icons/xmas23-off-19.png'),
                    '38': backgroundPage.getURL('assets/icons/xmas23-off-38.png'),
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
        xmasPromo23: xmasPromo23Notification,
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
