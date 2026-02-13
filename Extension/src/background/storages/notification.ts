/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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
import { type NotificationTextRecord } from '../schema';
import { defaultIconVariants } from '../api/ui/icons';

/**
 * Icon data for different sizes.
 */
export type IconData = {

    /**
     * Icon paths for different sizes.
     */
    iconPaths: {
        '19': string;
        '38': string;
    };

    /**
     * Tooltip text to display.
     */
    tooltip?: string;
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

    /**
     * State icon variants when the extension update is available.
     */
    updateAvailable: IconData;

    /**
     * State icon variants when the extension is loading.
     */
    loading: IconData;
};

export type PromoNotification = {
    id: string;
    locales: Record<string, NotificationTextRecord>;
    url: string;
    text: string | NotificationTextRecord | null;
    from: string;
    to: string;
    type: string;

    /**
     * Path to the background image for the promo.
     * May be needed for different promos for different locales at the same time.
     */
    bgImage: string;

    /**
     * Update popup background image may have a bit different width.
     */
    bgImageOnUpdate?: string;
    bgColor?: string;
    textColor?: string;
    badgeBgColor?: string;
    badgeText?: string;
    icons?: IconVariants;
};

const isRuLocale = browser.i18n.getUILanguage().substring(0, 2).toLowerCase() === 'ru';

const dateTo = isRuLocale
    ? '3 January 2026 23:59:00'
    : '1 January 2026 23:59:00';

const NEW_YEAR_25_ID = 'new_year_25';

const newYear25Notification: PromoNotification = {
    id: NEW_YEAR_25_ID,
    locales: {
        en: {
            title: 'Add spark to browsing',
            btn: 'Unlock the deal',
        },
        fr: {
            title: 'Le Web rayonnera avec AdGuard',
            btn: 'Découvrez l\'offre',
        },
        it: {
            title: 'Il Web brillerà con AdGuard',
            btn: 'Vedi l\'offerta',
        },
        de: {
            title: 'Mehr Glanz beim Surfen',
            btn: 'Deal öffnen',
        },
        ru: {
            title: 'Интернет засияет с AdGuard',
            btn: 'Попробовать',
        },
        es: {
            title: 'Tu web brilla con AdGuard',
            btn: 'Aprovechar',
        },
        es_419: {
            title: 'Tu web brilla con AdGuard',
            btn: 'Aprovechar',
        },
        pt_pt: {
            title: 'A sua web brilha com o AdGuard',
            btn: 'Ver a oferta',
        },
        pt_br: {
            title: 'Sua web brilha com AdGuard',
            btn: 'Ver oferta',
        },
        zh_cn: {
            title: '一键点亮，浏览再无干扰',
            btn: '解锁专属特惠',
        },
        zh_tw: {
            title: '一鍵點亮，瀏覽再無干擾',
            btn: '解鎖專屬特惠',
        },
        ja: {
            title: 'クリスマスセールと 有料版の特徴について',
            btn: '詳細はこちら',
        },
        ko: {
            title: 'AdGuard 크리스마스 프로모션',
            btn: '자세히 알아보기',
        },
        uk: {
            title: 'Інтернет засяє з AdGuard',
            btn: 'Спробуйте',
        },
        ar: {
            title: 'أضف لمسة لتصفحك',
            btn: 'افتح العرض',
        },
        be: {
            title: 'Інтэрнэт заззяе з AdGuard',
            btn: 'Паспрабаваць',
        },
        bg: {
            title: 'Интернетът ще засияе с AdGuard',
            btn: 'Опитайте',
        },
        ca: {
            title: 'Dóna llum a la navegació',
            btn: 'Obre l’oferta',
        },
        cs: {
            title: 'Internet zazáří s AdGuardem',
            btn: 'Vyzkoušejte',
        },
        da: {
            title: 'Giv browseren lidt glans',
            btn: 'Åpne tilbudet',
        },
        el: {
            title: 'Πρωτοχρονιά στο AdGuard',
            btn: 'Ανοιξε',
        },
        fa: {
            title: 'مرور خود را درخشان کن',
            btn: 'پیشنهاد را باز کن',
        },
        fi: {
            title: 'Lisää säihkettä selaamiseen',
            btn: 'Avaa diili',
        },
        he: {
            title: 'הוסף ניצוץ לגלישה',
            btn: 'פתח את ההצעה',
        },
        hr: {
            title: 'Internet će zasjati uz AdGuard',
            btn: 'Isprobajte',
        },
        hu: {
            title: 'Vigyél szikrást böngészéshez',
            btn: 'Fogd a deal-t',
        },
        hy: {
            title: 'Ինտերնետը կփայլի AdGuard-ով',
            btn: 'Փորձեք',
        },
        id: {
            title: 'Tambahkan kilau saat browsing',
            btn: 'Buka penawaran',
        },
        lt: {
            title: 'Įnešk žaismo naršymui',
            btn: 'Atidaryk pasiūlymą',
        },
        ms: {
            title: 'Tahun Baru dalam AdGuard',
            btn: 'Buka',
        },
        nb: {
            title: 'Gi surfing en gnist',
            btn: 'Lås opp tilbudet',
        },
        nl: {
            title: 'Geef browsen wat extra glans',
            btn: 'Open de deal',
        },
        pl: {
            title: 'Wszystko zabłyśnie z AdGuardem',
            btn: 'Wypróbuj',
        },
        ro: {
            title: 'Dă strălucire navigării',
            btn: 'Deschide oferta',
        },
        sk: {
            title: 'Všetko sa rozžiari s AdGuardom',
            btn: 'Vyskúšajte',
        },
        sl: {
            title: 'Vse bo zasijalo z AdGuardom',
            btn: 'Preizkusite',
        },
        sr_latn: {
            title: 'Sve će zasijati uz AdGuard',
            btn: 'Probajte',
        },
        sv: {
            title: 'Ge surfing en gnista',
            btn: 'Öppna erbjudandet',
        },
        tr: {
            title: 'Taramaya ışıltı kat',
            btn: 'Teklifi aç',
        },
        vi: {
            title: 'Thêm tinh tú cho trình duyệt',
            btn: 'Mở ưu đãi',
        },
        mk: {
            title: 'Сè ќе заблеска со AdGuard',
            btn: 'Пробајте',
        },
        hi: {
            title: 'ब्राउज़िंग में चमक जोड़ें',
            btn: 'डील अनलॉक करें',
        },
        et: {
            title: 'Lisa sära sirvimisele',
            btn: 'Ava diil',
        },
        th: {
            title: 'เพิ่มความสดใสให้การท่องเว็บ',
            btn: 'ปลดล็อกดีล',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.NewYear25 }),
    from: '22 December 2025 12:00:00',
    to: dateTo,
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/newyear25.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/newyear25.svg'),
    icons: {
        ...defaultIconVariants,
        enabled: {
            iconPaths: {
                '19': browser.runtime.getURL('assets/icons/newyear25-on-19.png'),
                '38': browser.runtime.getURL('assets/icons/newyear25-on-38.png'),
            },
        },
        disabled: {
            iconPaths: {
                '19': browser.runtime.getURL('assets/icons/newyear25-off-19.png'),
                '38': browser.runtime.getURL('assets/icons/newyear25-off-38.png'),
            },
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [NEW_YEAR_25_ID, newYear25Notification],
]);
