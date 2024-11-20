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

const BLACK_FRIDAY_24_ID = 'blackFriday24';

const blackFriday24Notification: PromoNotification = {
    id: BLACK_FRIDAY_24_ID,
    locales: {
        en: {
            title: 'The best time to improve your protection',
            btn: 'Learn how',
        },
        fr: {
            title: 'Augmentez votre protection',
            btn: 'Comment faire',
        },
        it: {
            title: 'Il tempo per una maggiore protezione',
            btn: 'Come fare',
        },
        de: {
            title: 'Zeit, sich besser zu schützen',
            btn: "Auf geht's!",
        },
        ru: {
            title: 'Время улучшить защиту',
            btn: 'Узнать как',
        },
        es: {
            title: 'El mejor momento para mejorar tu protección',
            btn: 'Cómo hacerlo',
        },
        es_419: {
            title: 'Es hora de mejorar tu protección',
            btn: 'Averiguar como',
        },
        pt_pt: {
            title: 'O melhor momento para aumentar tua proteção',
            btn: 'Saiba como',
        },
        pt_br: {
            title: 'O melhor momento para aumentar sua proteção',
            btn: 'Saiba como',
        },
        zh_cn: {
            title: '增强保护',
            btn: '了解更多',
        },
        zh_tw: {
            title: '增強保護',
            btn: '了解詳情',
        },
        ja: {
            title: '保護機能を強化\nするなら今だ。',
            btn: '詳細はこちら',
        },
        ko: {
            title: '보호 기능을 개선하기 가장 좋은 시기',
            btn: '자세히 알아보기',
        },
        uk: {
            title: 'Час покращити захист',
            btn: 'Дізнатись як',
        },
        ar: {
            title: 'حان الوقت لتحسين الحماية الخاصة بك',
            btn: 'اكتشف كيف',
        },
        be: {
            title: 'Час палепшыць абарону',
            btn: 'Даведацца як',
        },
        bg: {
            title: 'Време е да подобрите защитата си',
            btn: 'Разберете как',
        },
        ca: {
            title: 'És hora de millorar la teva protecció',
            btn: 'Descobriu com',
        },
        cs: {
            title: 'Je čas zlepšit vaši ochranu',
            btn: 'Zjistěte jak',
        },
        da: {
            title: 'Tid til at forbedre din beskyttelse',
            btn: 'Find ud af hvordan',
        },
        el: {
            title: 'Ώρα να βελτιώσετε την άμυνά σας',
            btn: 'Βρες πως',
        },
        fa: {
            title: 'زمان بهبود محافظت از خود است',
            btn: 'دریابید که چگونه',
        },
        fi: {
            title: 'Aika parantaa suojaustasi',
            btn: 'Saada selville miten',
        },
        he: {
            title: 'הגיע הזמן לשפר את ההגנה שלך',
            btn: 'לברר איך',
        },
        hr: {
            title: 'Vrijeme je da poboljšate svoju zaštitu',
            btn: 'Saznajte kako',
        },
        hu: {
            title: 'A legjobb idő a védelem felturbózására',
            btn: 'Tudd meg, hogyan',
        },
        hy: {
            title: 'Ցանկանու՞մ եք պաշտպանել ձեր սարքը:',
            btn: 'Պարզեք, թե ինչպես',
        },
        id: {
            title: 'Tingkatkan perlindungan Anda',
            btn: 'Cari tahu caranya',
        },
        lt: {
            title: 'Laikas pagerinti savo apsaugą',
            btn: 'Sužinokite, kaip',
        },
        ms: {
            title: 'Tingkatkan perlindungan anda',
            btn: 'Ketahui caranya',
        },
        nb: {
            title: 'På tide å forbedre beskyttelsen',
            btn: 'Finn ut hvordan',
        },
        nl: {
            title: 'Verbeter uw bescherming',
            btn: 'Uitvinden hoe',
        },
        pl: {
            title: 'Czas ulepszyć swoją ochronę',
            btn: 'Naucz się jak',
        },
        ro: {
            title: 'Îmbunătățiți-vă protecția',
            btn: 'Aflați cum',
        },
        sk: {
            title: 'Čas na zlepšenie ochrany',
            btn: 'Zistite, ako',
        },
        sl: {
            title: 'Čas za izboljšanje zaščite',
            btn: 'Ugotovite, kako',
        },
        'sr-Latn': {
            title: 'Vreme je da poboljšaš svoju odbranu',
            btn: 'Saznajte kako',
        },
        sv: {
            title: 'Dags att förbättra ditt skydd',
            btn: 'Ta reda på hur',
        },
        tr: {
            title: 'Korumanızı geliştirme zamanı',
            btn: 'Nasıl olduğunu öğren',
        },
        vi: {
            title: 'Cải thiện khả năng bảo vệ của bạn',
            btn: 'Tìm hiểu cách',
        },
        mk: {
            title: 'Време е да ја подобрите заштитата',
            btn: 'Дознајте како',
        },
        hi: {
            title: 'अपनी सुरक्षा में सुधार करें',
            btn: 'सीखो कैसे',
        },
        et: {
            title: 'Aeg parandada oma kaitset',
            btn: 'Uurige, kuidas',
        },
        th: {
            title: 'ปรับปรุงการป้องกันของคุณ',
            btn: 'ค้นหาวิธีการ',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.BlackFriday24 }),
    from: '25 November 2024 12:00:00',
    to: '6 December 2024 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/blackfriday24.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/blackfriday24-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/blackfriday24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/blackfriday24-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/blackfriday24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/blackfriday24-off-38.png'),
        },
        warning: defaultIconVariants.warning,
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [BLACK_FRIDAY_24_ID, blackFriday24Notification],
]);
