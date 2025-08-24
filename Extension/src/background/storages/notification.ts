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
import { type NotificationTextRecord } from '../schema';
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

const BACK_TO_SCHOOL_25_ID = 'backToSchool25';

const backToSchool25Notification: PromoNotification = {
    id: BACK_TO_SCHOOL_25_ID,
    locales: {
        en: {
            title: 'Back to School promo',
            btn: 'Up to 40% off',
        },
        fr: {
            title: 'La Rentrée avec AdGuard',
            btn: "Jusqu'à 40% de remise",
        },
        it: {
            title: 'A Scuola con AdGuard',
            btn: 'Fino al 40% di sconto',
        },
        de: {
            title: 'Back to School Promo',
            btn: 'Bis zu 40% Rabatt',
        },
        ru: {
            title: 'Снова в школу',
            btn: 'Скидки до 40%',
        },
        es: {
            title: 'Promo de vuelta al cole',
            btn: 'Hasta un 40% OFF',
        },
        es_419: {
            title: 'Vuelta al cole',
            btn: 'Hasta un 40% OFF',
        },
        pt_pt: {
            title: 'Promo de volta às aulas',
            btn: 'Até 40% OFF',
        },
        pt_br: {
            title: 'Promo de volta às aulas',
            btn: 'Até 40% OFF',
        },
        zh_cn: {
            title: '返校季 SALE',
            btn: '低至6折',
        },
        zh_tw: {
            title: '返校 SALE',
            btn: '低至6折',
        },
        // ja: {
        //     title: 'AdGuard 16周年セール',
        //     btn: 'セール内容はこちら',
        // },
        ko: {
            title: '백투스쿨 세일',
            btn: '최대 40% 할인',
        },
        uk: {
            title: 'Знову до школи',
            btn: 'Знижки до 40%',
        },
        ar: {
            title: 'عرض العودة إلى المدرسة',
            btn: '٪خصومات تصل إلى 40',
        },
        be: {
            title: 'Зноў у школу',
            btn: 'Зніжкі да 40%',
        },
        bg: {
            title: 'Обратно на училище: промоция',
            btn: 'Отстъпки до 40%',
        },
        ca: {
            title: "Tornada a l'escola",
            btn: 'Descomptes –40%',
        },
        cs: {
            title: 'Zpátky do školy: Akce',
            btn: 'Slevy až 40%',
        },
        da: {
            title: 'Tilbage til skole promo',
            btn: 'Rabatter op til 40%',
        },
        el: {
            title: 'Επιστροφή στα σχολεία',
            btn: 'Εκπτώσεις έως και 40%',
        },
        fa: {
            title: 'تبلیغات بازگشت به مدرسه',
            btn: '٪خفیف‌ها تا 40',
        },
        fi: {
            title: 'Takaisin kouluun -kampanja',
            btn: 'Alennukset jopa 40%',
        },
        he: {
            title: 'מבצע חזרה לבית הספר',
            btn: 'הנחות עד 40%',
        },
        hr: {
            title: 'Natrag u školu: Promo',
            btn: 'Popusti do 40%',
        },
        hu: {
            title: 'Vissza az iskolába promóció',
            btn: 'Akár 40% kedvezmény',
        },
        hy: {
            title: 'Վերադառնալ դպրոց',
            btn: 'Զեղչեր՝ մինչև 40%',
        },
        id: {
            title: 'Promo Kembali ke Sekolah',
            btn: 'Diskon hingga 40%',
        },
        lt: {
            title: 'Atgal į mokyklą: akcija',
            btn: 'Nuolaidos iki 40%',
        },
        ms: {
            title: 'Promosi Kembali ke Sekolah',
            btn: 'Diskaun sehingga 40%',
        },
        nb: {
            title: 'Tilbake til skolen',
            btn: 'Rabatter opptil 40%',
        },
        nl: {
            title: 'Terug naar school promotie',
            btn: 'Kortingen tot 40%',
        },
        pl: {
            title: 'Powrót do szkoły: Promocja',
            btn: 'Zniżki do 40%',
        },
        ro: {
            title: 'Înapoi la școală: Promoția',
            btn: 'Reduceri de până la 40%',
        },
        sk: {
            title: 'Späť do školy: Promo akcia',
            btn: 'Zľavy až do 40%',
        },
        sl: {
            title: 'Nazaj v šolo: Promocija',
            btn: 'Popusti do 40%',
        },
        sr_latn: {
            title: 'Povratak u školu: Promocija',
            btn: 'Popusti do 40%',
        },
        sv: {
            title: 'Tillbaka till skolan',
            btn: 'Rabatter upp till 40%',
        },
        tr: {
            title: 'Okula Dönüş kampanyası',
            btn: '%40’a varan indirimler',
        },
        vi: {
            title: 'Back to School: Khuyến mãi',
            btn: 'Giảm giá lên đến 40%',
        },
        mk: {
            title: 'Назад на училиште: Промоција',
            btn: 'Попусти до 40%',
        },
        hi: {
            title: 'स्कूल वापसी प्रमो',
            btn: '40% तक की छूट',
        },
        et: {
            title: 'Tagasi kooli pakkumine',
            btn: 'Allahindlus kuni 40%',
        },
        th: {
            title: 'Back to School',
            btn: 'ส่วนลดสูงสุด 40%',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.BackToSchool25 }),
    from: '25 August 2025 12:00:00',
    to: '1 September 2025 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/bts25.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/bts25-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/bts25-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/bts25-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/bts25-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/bts25-off-38.png'),
        },
        warning: defaultIconVariants.warning,
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [BACK_TO_SCHOOL_25_ID, backToSchool25Notification],
]);
