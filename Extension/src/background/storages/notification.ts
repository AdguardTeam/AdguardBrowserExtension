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

const BIRTHDAY_25_ID = 'birthday25';

const birthday25Notification: PromoNotification = {
    id: BIRTHDAY_25_ID,
    locales: {
        en: {
            title: 'Long story short: birthday sale',
            btn: 'Dive in',
        },
        fr: {
            title: "La chose à noter : c'est notre anniversaire !",
            btn: 'Voyons voir',
        },
        it: {
            title: "C'é il nostro anniversario, vieni vedere",
            btn: 'Vedi le cose',
        },
        de: {
            title: 'Eine Geschichte mit Rabatten',
            btn: 'Jetzt entdecken',
        },
        ru: {
            title: 'Есть что рассказать и подарить',
            btn: 'А ну-ка',
        },
        es: {
            title: 'Tenemos algo que decir y algo que regalarte',
            btn: '¿Qué és?',
        },
        es_419: {
            title: 'Tenemos algo que decir y algo que regalarte',
            btn: '¿Qué és?',
        },
        pt_pt: {
            title: 'Temos algo a dizer, e algo a presentear',
            btn: 'O que é?',
        },
        pt_br: {
            title: 'Há algo que precisamos dizer… e uma surpresa',
            btn: 'O que é?',
        },
        zh_cn: {
            title: '周年庆大促',
            btn: '立即参与',
        },
        zh_tw: {
            title: '周年慶大促',
            btn: '立即參與',
        },
        ja: {
            title: 'AdGuard 16周年セール',
            btn: 'セール内容はこちら',
        },
        ko: {
            title: '16주년 기념 세일',
            btn: '자세히 알아보기',
        },
        uk: {
            title: 'Історія зі знижкою',
            btn: 'Дізнатися',
        },
        ar: {
            title: 'قصة تنتهي بخصم',
            btn: 'اكتشف',
        },
        be: {
            title: 'Гісторыя са зніжкай',
            btn: 'Даведайся',
        },
        bg: {
            title: 'История с отстъпка',
            btn: 'Научи се',
        },
        ca: {
            title: 'Història amb descompte',
            btn: 'Descobreix',
        },
        cs: {
            title: 'Příběh se slevou',
            btn: 'Zjistit',
        },
        da: {
            title: 'Historie med rabat',
            btn: 'Find ud af',
        },
        el: {
            title: 'Ιστορία με έκπτωση',
            btn: 'Μάθετε',
        },
        fa: {
            title: 'داستانی با تخفیف',
            btn: 'کشف کن',
        },
        fi: {
            title: 'Tarina alennuksella',
            btn: 'Opi',
        },
        he: {
            title: 'סיפור עם הנחה',
            btn: 'גלה',
        },
        hr: {
            title: 'Priča s popustom',
            btn: 'Saznaj',
        },
        hu: {
            title: 'Történet kedvezménnyel',
            btn: 'Tudj meg',
        },
        hy: {
            title: 'Պատմություն զեղչով',
            btn: 'Բացահայտել',
        },
        id: {
            title: 'Cerita dengan diskon',
            btn: 'Cari tahu',
        },
        lt: {
            title: 'Istorija su nuolaida',
            btn: 'Sužinoti',
        },
        ms: {
            title: 'Kisah dengan diskaun',
            btn: 'Ketahui',
        },
        nb: {
            title: 'Historie med rabatt',
            btn: 'Finn ut',
        },
        nl: {
            title: 'Verhaal met korting',
            btn: 'Ontdek',
        },
        pl: {
            title: 'Historia ze zniżką',
            btn: 'Dowiedz się',
        },
        ro: {
            title: 'Poveste cu reducere',
            btn: 'Află',
        },
        sk: {
            title: 'Príbeh so zľavou',
            btn: 'Zistiť',
        },
        sl: {
            title: 'Zgodba s popustom',
            btn: 'Izvedi',
        },
        sr_latn: {
            title: 'Priča sa popustom',
            btn: 'Saznaj',
        },
        sv: {
            title: 'Berättelse med rabatt',
            btn: 'Ta reda på',
        },
        tr: {
            title: 'İndirimli hikaye',
            btn: 'Keşfet',
        },
        vi: {
            title: 'Câu chuyện giảm giá',
            btn: 'Tìm hiểu',
        },
        mk: {
            title: 'Приказна со попуст',
            btn: 'Дознај',
        },
        hi: {
            title: 'छूट वाली कहानी',
            btn: 'जानें',
        },
        et: {
            title: 'Lugu allahindlusega',
            btn: 'Uuri',
        },
        th: {
            title: 'เรื่องราวพร้อมส่วนลด',
            btn: 'ค้นหา',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Birthday25 }),
    from: '30 May 2025 12:00:00',
    to: '5 June 2025 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/birthday25.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/birthday25-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/birthday25-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/birthday25-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/birthday25-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/birthday25-off-38.png'),
        },
        warning: defaultIconVariants.warning,
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [BIRTHDAY_25_ID, birthday25Notification],
]);
