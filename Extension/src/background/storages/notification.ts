/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import browser from 'webextension-polyfill';

import { Forward, ForwardAction } from '../../common/forward';
import { NotificationTextRecord } from '../schema';
import { defaultIconVariants } from '../api/ui/icons';

/**
 * Icon data for different sizes.
 */
export type IconData = {
    /**
     * 19x19 icon size.
     */
    '19': string;

    /**
     * 38x38 icon size.
     */
    '38': string;
};

/**
 * Icon variants for different states.
 */
export type IconVariants = {
    /**
     * Enabled state icon variants (when AdGuard is enabled).
     */
    enabled: IconData;

    /**
     * Disabled state icon variants (when AdGuard is disabled).
     */
    disabled: IconData;

    /**
     * State icon variants when MV3 limitations are exceeded.
     */
    warning: IconData;
};

export type PromoNotification = {
    id: string,
    locales: Record<string, NotificationTextRecord>
    url: string,
    text: string | NotificationTextRecord | null,
    from: string,
    to: string,
    type: string,

    /**
     * Path to the background image for the promo.
     * May be needed for different promos for different locales at the same time.
     */

    bgImage: string,
    /**
     * Update popup background image may have a bit different width.
     */
    bgImageOnUpdate?: string,
    bgColor?: string,
    textColor?: string,
    badgeBgColor?: string,
    badgeText?: string,
    icons?: IconVariants,
};

const CHRISTMAS_24_ID = 'christmas24';

const christmas24Notification: PromoNotification = {
    id: CHRISTMAS_24_ID,
    locales: {
        en: {
            title: 'Christmas at AdGuard',
            btn: 'Unwrap',
        },
        fr: {
            title: 'Noël chez AdGuard',
            btn: 'Venez voir',
        },
        it: {
            title: 'Natale ad AdGuard',
            btn: 'Vieni a vedere',
        },
        de: {
            title: 'Weihnachten bei AdGuard',
            btn: 'Geschenk öffnen',
        },
        ru: {
            title: 'Новый год в AdGuard',
            btn: 'Что под ёлкой?',
        },
        es: {
            title: 'Navidad en AdGuard',
            btn: 'Ven a ver',
        },
        es_419: {
            title: 'Navidad en AdGuard',
            btn: 'Abre',
        },
        pt_pt: {
            title: 'Natal no AdGuard',
            btn: 'Vem ver',
        },
        pt_br: {
            title: 'Natal no AdGuard',
            btn: 'Vem ver',
        },
        zh_cn: {
            title: 'AdGuard Christmas',
            btn: '有什么惊喜？',
        },
        zh_tw: {
            title: 'AdGuard Christmas',
            btn: '有什麼驚喜？',
        },
        ja: {
            title: 'AdGuard Christmas キャンペーン',
            btn: 'プレゼントはこちら',
        },
        ko: {
            title: 'AdGuard 크리스마스 프로모션',
            btn: '선물 찾기',
        },
        uk: {
            title: 'Новий рік в AdGuard',
            btn: 'Що під ялинкою?',
        },
        ar: {
            title: 'تخفيضات العام الجديد',
            btn: 'يفتح',
        },
        be: {
            title: 'Новы год у AdGuard',
            btn: 'Што пад ёлкай?',
        },
        bg: {
            title: 'Нова година в AdGuard',
            btn: 'Отворете',
        },
        ca: {
            title: 'Nadal a AdGuard',
            btn: 'Obert',
        },
        cs: {
            title: 'Vánoce v AdGuardu',
            btn: 'Otevřená',
        },
        da: {
            title: 'Jul på AdGuard',
            btn: 'Åben',
        },
        el: {
            title: 'Πρωτοχρονιά στο AdGuard',
            btn: 'Ανοιξε',
        },
        fa: {
            title: 'AdGuard سال نو در',
            btn: 'باز کن',
        },
        fi: {
            title: 'Joulu AdGuardissa',
            btn: 'Avaa',
        },
        he: {
            title: 'קידום לשנה החדשה',
            btn: 'לִפְתוֹחַ',
        },
        hr: {
            title: 'Božić u AdGuardu',
            btn: 'Otvoren',
        },
        hu: {
            title: 'Karácsony az AdGuard-nál',
            btn: 'Kinyit',
        },
        hy: {
            title: 'Ամանորը AdGuard-ում',
            btn: 'Բացել',
        },
        id: {
            title: 'Tahun Baru di AdGuard',
            btn: 'Membuka',
        },
        lt: {
            title: 'Kalėdos AdGuard',
            btn: 'Atviras',
        },
        ms: {
            title: 'Tahun Baru dalam AdGuard',
            btn: 'Buka',
        },
        nb: {
            title: 'Nyttår i AdGuard',
            btn: 'Åpen',
        },
        nl: {
            title: 'Kerstmis in AdGuard',
            btn: 'Open',
        },
        pl: {
            title: 'Nowy Rok w AdGuard',
            btn: 'Otwarty',
        },
        ro: {
            title: 'Crăciun în AdGuard',
            btn: 'Deschis',
        },
        sk: {
            title: 'Vianoce v AdGuarde',
            btn: 'Otvorený',
        },
        sl: {
            title: 'Božič v AdGuardu',
            btn: 'Odprt',
        },
        'sr-Latn': {
            title: 'Božić u AdGuardu',
            btn: 'Otvorite',
        },
        sv: {
            title: 'Jul i AdGuard',
            btn: 'Öppen',
        },
        tr: {
            title: "AdGuard'da Yeni Yıl",
            btn: 'Açık',
        },
        vi: {
            title: 'Năm mới trong AdGuard',
            btn: 'Mở',
        },
        mk: {
            title: 'Нова година со AdGuard',
            btn: 'Што има под елката?',
        },
        hi: {
            title: 'एडगार्ड में नया साल',
            btn: 'खुला',
        },
        et: {
            title: 'Jõulud AdGuardis',
            btn: 'Avatud',
        },
        th: {
            title: 'ปีใหม่ใน AdGuard',
            btn: 'เปิด',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Christmas24 }),
    from: '23 December 2024 12:00:00',
    to: '3 January 2025 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/christmas24.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/christmas24-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/christmas24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/christmas24-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/christmas24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/christmas24-off-38.png'),
        },
        warning: defaultIconVariants.warning,
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [CHRISTMAS_24_ID, christmas24Notification],
]);
