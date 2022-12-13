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
        ja: {
            title: 'AdGuard Christmas',
            btn: '保護をアップグレード',
        },
        ko: {
            title: 'AdGuard 크리스마스 세일',
            btn: '',
        },
        es: {
            title: 'Promoción de Navidad',
            btn: '',
        },
        de: {
            title: 'AdGuards Weihnachtsangebot',
            btn: 'Schutz erweitern',
        },
        pt_pt: {
            title: 'Promoção de Natal',
            btn: '',
        },
        pt_br: {
            title: 'Promoção de Natal',
            btn: '',
        },
        zh_tw: {
            title: 'AdGuard 聖誕折扣',
            btn: '',
        },
        zh_cn: {
            title: 'AdGuard 圣诞优惠',
            btn: '',
        },
        fr: {
            title: 'Promo de Noël chez AdGuard',
            btn: '',
        },
        it: {
            title: 'Promo di Natale ad AdGuard',
            btn: '',
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
            title: 'Novoroční propagace',
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
            title: 'Novogodišnja promocija',
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
            title: 'Naujųjų metų reklama',
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
            title: 'Promocja noworoczna',
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
