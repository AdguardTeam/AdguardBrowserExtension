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

export type Notification = {
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
    bgColor?: string,
    textColor?: string,
    badgeBgColor?: string,
    badgeText?: string,
    icons?: Record<string, Record<string, string>>,
};

/**
 * List of locales for the Spring promo, not the Easter one. AG-31141.
 */
const SPRING_PROMO_LOCALES = [
    'ru',
    'uk',
    'ar',
    'be',
    'bg',
    'el',
    'sr',
    'hi',
    'hy',
    'fa',
    'he',
    'ms',
    'id',
    'tr',
    'th',
    'vi',
    'zh_cn',
    'zh_tw',
];

const EASTER_24_ID = 'easter24';

let easter24Notification: Notification = {
    id: EASTER_24_ID,
    locales: {
        en: {
            title: 'Time to improve protection',
            btn: 'Learn how',
        },
        // there is no promo for Japanese
        // ja: {},
        ko: {
            title: '개인정보 보호 강화',
            btn: '자세히 알아보기',
        },
        fr: {
            title: 'Le moment de renouveler la protection',
            btn: "Voir l'offre",
        },
        it: {
            title: 'Proteggiti online questa primavera',
            btn: 'Vedere offerta',
        },
        de: {
            title: 'Frühling bedeutet Verbesserung',
            btn: 'Schutz verbessern',
        },
        es: {
            title: 'Es hora de protegerte',
            btn: 'Descubre cómo',
        },
        et: {
            title: 'Aeg kaitset parandada',
            btn: 'Õpi kuidas',
        },
        pt_br: {
            title: 'É hora de se proteger',
            btn: 'Descubra como',
        },
        pt_pt: {
            title: 'É hora de se proteger',
            btn: 'Descubra como',
        },
        ca: {
            title: 'Millorar la protecció',
            btn: 'Aprèn com',
        },
        cs: {
            title: 'Čas zlepšit ochranu',
            btn: 'Zjistěte jak',
        },
        da: {
            title: 'Forbedre beskyttelsen',
            btn: 'Lær hvordan',
        },
        es_419: {
            title: 'Mejorar la protección',
            btn: 'Aprender cómo',
        },
        fi: {
            title: 'Paranna suojausta',
            btn: 'Opi kuinka',
        },
        hr: {
            title: 'Poboljšajte zaštitu',
            btn: 'Nauči kako',
        },
        hu: {
            title: 'Ideje javítani a védelmet',
            btn: 'Hogyan?',
        },
        lt: {
            title: 'Laikas pagerinti apsaugą',
            btn: 'Išmokti kaip',
        },
        ms: {
            title: 'Tingkatkan perlindungan anda',
            btn: 'Ketahui caranya',
        },
        nb: {
            title: 'Forbedre beskyttelsen',
            btn: 'Lær hvordan',
        },
        nl: {
            title: 'Verbeter de bescherming',
            btn: 'Leren hoe',
        },
        pl: {
            title: 'Czas poprawić ochronę',
            btn: 'Naucz się jak',
        },
        ro: {
            title: 'Îmbunătățiți protecția',
            btn: 'Afla cum',
        },
        sk: {
            title: 'Čas na zlepšenie ochrany',
            btn: 'Zistite ako',
        },
        sl: {
            title: 'Čas je za izboljšanje zaščite',
            btn: 'Nauči se kako',
        },
        sv: {
            title: 'Dags att förbättra skyddet',
            btn: 'Lära sig hur',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Easter24 }),
    from: '28 March 2024 12:00:00',
    to: '3 April 2024 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/easter24.svg'),
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/easter24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/easter24-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/easter24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/easter24-off-38.png'),
        },
    },
};

/**
 * Diff data for the Spring promo.
 */
const spring24NotificationUpdateDiff = {
    locales: {
        ar: {
            title: 'حان الوقت لتحسين الحماية',
            btn: 'تعلم كيف',
        },
        be: {
            title: 'Час палепшыць абарону',
            btn: 'Даведацца як',
        },
        bg: {
            title: 'Подобрете защитата си',
            btn: 'Разберете как',
        },
        el: {
            title: 'Βελτιώστε την προστασία σας',
            btn: 'Βρες πως',
        },
        fa: {
            title: 'زمان بهبود دفاع شما است',
            btn: 'دریابید که چگونه',
        },
        hi: {
            title: 'अपनी सुरक्षा में सुधार करें',
            btn: 'कैसे?',
        },
        he: {
            title: 'שפר את ההגנה שלך',
            btn: 'לברר איך',
        },
        hy: {
            title: 'Պաշտպանեք ձեզ հինտերնետում',
            btn: 'Պարզել, թե ինչպես',
        },
        id: {
            title: 'Tingkatkan perlindungan anda',
            btn: 'Cari tahu caranya',
        },
        ms: {
            title: 'Tingkatkan perlindungan anda',
            btn: 'Ketahui caranya',
        },
        ru: {
            title: 'Весна — время улучшить защиту',
            btn: 'Узнать как',
        },
        'sr-Latn': {
            title: 'Poboljšajte zaštitu',
            btn: 'Saznajte kako',
        },
        th: {
            title: 'ปรับปรุงการป้องกัน',
            btn: 'เรียนรู้วิธีการ',
        },
        tr: {
            title: 'Savunmanızı geliştirme zamanı',
            btn: 'Nasıl?',
        },
        uk: {
            title: 'Час покращити захист',
            btn: 'Дізнатись як',
        },
        vi: {
            title: 'Cải thiện khả năng bảo vệ của bạn',
            btn: 'Làm sao?',
        },
        zh_cn: {
            title: '增强隐私保护',
            btn: '了解更多',
        },
        zh_tw: {
            title: '增強隱私保護',
            btn: '了解更多',
        },
    },
    bgImage: browser.runtime.getURL('assets/images/spring24.svg'),
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/spring24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/spring24-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/spring24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/spring24-off-38.png'),
        },
    },
};

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }
    return locale.toLowerCase().replace('-', '_');
};

// possible values of browser lang: 'en', or 'en-US' which is 'en_us' after normalization
const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());

const shouldShowSpring24Promo = currentLocale
    && SPRING_PROMO_LOCALES.some((locale) => currentLocale.startsWith(locale));

if (shouldShowSpring24Promo) {
    easter24Notification = {
        ...easter24Notification,
        // update the notification data with the Spring promo data
        ...spring24NotificationUpdateDiff,
    };
}

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [EASTER_24_ID, easter24Notification],
]);
