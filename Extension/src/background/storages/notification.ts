/**
 * @file
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
import { NotificationTextRecord } from '../schema';

export type Notification = {
     id: string,
     locales: Record<string, NotificationTextRecord>
     url: string,
     text: string | NotificationTextRecord | null,
     from: string,
     to: string,
     type: string,
     bgColor?: string,
     textColor?: string,
     badgeBgColor?: string,
     badgeText?: string,
     icons?: Record<string, Record<string, string>>,
 };

export const XMAS_PROMO_23_ID = 'xmasPromo23';

export const xmasPromo23Notification: Notification = {
    id: XMAS_PROMO_23_ID,
    locales: {
        en: {
            title: 'AdGuard X-mas promo',
            btn: 'Upgrade protection',
        },
        ru: {
            title: 'Новогодняя акция',
            btn: 'Улучшите защиту',
        },
        es: {
            title: 'Vuelta al',
            btn: 'Obtén un 40% off',
        },
        de: {
            title: 'Zurück zur',
            btn: '40% Rabatt',
        },
        fr: {
            title: 'La rentrée',
            btn: '40% de remise',
        },
        it: {
            title: 'Ritorno a',
            btn: '40% di sconto',
        },
        ko: {
            title: '백 투 스쿨',
            btn: '40% 할인',
        },
        zh_cn: {
            title: '开学啦',
            btn: '一律享受40%折扣',
        },
        zh_tw: {
            title: '開學啦',
            btn: '獲得40%的折扣',
        },
        uk: {
            title: 'Знову до',
            btn: 'Знижка 40%',
        },
        pt_pt: {
            title: 'De volta à',
            btn: 'Obter 40% de desconto',
        },
        pt_br: {
            title: 'De volta à',
            btn: 'Obtenha 40% de desconto',
        },
        ar: {
            title: 'العودة',
            btn: '%احصل على خصم 40',
        },
        be: {
            title: 'Назад у',
            btn: 'Атрымайце скідку 40%',
        },
        id: {
            title: 'Kembali ke',
            btn: 'Dapatkan diskon 40%',
        },
        pl: {
            title: 'Powrót do',
            btn: 'Zyskaj 40% zniżki',
        },
        tr: {
            title: 'Okula dönüş',
            btn: '40 indirim kazanın',
        },
        vi: {
            title: 'Trở lại',
            btn: 'Được GIẢM GIÁ 40%',
        },
    },
    text: '',
    url: 'https://link.adtidy.net/forward.html?action=xmas_promo_23&app=browser_extension',
    from: '22 December 2022 15:00:00',
    to: '02 January 2023 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/xmas23-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/xmas23-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/xmas23-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/xmas23-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping
 */
export const notificationStorage = new Map<string, Notification>([
    [XMAS_PROMO_23_ID, xmasPromo23Notification],
]);
