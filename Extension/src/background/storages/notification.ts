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

const SPRING_25_ID = 'spring25';

const spring25Notification: PromoNotification = {
    id: SPRING_25_ID,
    locales: {
        en: {
            title: 'Time to tidy up for spring',
            btn: 'Learn how',
        },
        fr: {
            title: 'Nettoyez l\'Internet ce printemps',
            btn: 'Voir l\'offre',
        },
        it: {
            title: 'Un internet pulito per la primavera',
            btn: 'Vedere offerta',
        },
        de: {
            title: 'Bereit für den Frühjahrsputz?',
            btn: 'So geht’s!',
        },
        ru: {
            title: 'Сделаем интернет чище к весне',
            btn: 'Узнать как',
        },
        es: {
            title: 'Es hora de protegerte',
            btn: 'Ver la oferta',
        },
        es_419: {
            title: 'Es hora de ordenar para la primavera',
            btn: 'Aprender cómo',
        },
        pt_pt: {
            title: 'Proteja-se nessa primavera',
            btn: 'Ver oferta',
        },
        pt_br: {
            title: 'É hora de se proteger',
            btn: 'Ver oferta',
        },
        zh_cn: {
            title: '暖春特惠',
            btn: '立即享受',
        },
        zh_tw: {
            title: '暖春優惠',
            btn: '立即领取',
        },
        // For Japanese, there will be other promo soon
        // ja: {
        //     title: 'AdGuard Christmas キャンペーン',
        //     btn: 'プレゼントはこちら',
        // },
        ko: {
            title: '봄맞이 프로모션',
            btn: '자세히 알아보기',
        },
        uk: {
            title: 'Час навести порядок до весни',
            btn: 'Дізнатись як',
        },
        ar: {
            title: 'حان الوقت لترتيب الأمور من أجل الربيع',
            btn: 'تعلم كيف',
        },
        be: {
            title: 'Час навесці парадак да вясны',
            btn: 'Даведацца як',
        },
        bg: {
            title: 'Време е да почистим за пролетта',
            btn: 'Разберете как',
        },
        ca: {
            title: 'Fem ordre per a la primavera',
            btn: 'Aprèn com',
        },
        cs: {
            title: 'Čas na úklid na jaře',
            btn: 'Zjistěte jak',
        },
        da: {
            title: 'Tid til at rydde op til foråret',
            btn: 'Lær hvordan',
        },
        el: {
            title: 'Τακτοποιούμε για την άνοιξη',
            btn: 'Βρες πως',
        },
        fa: {
            title: 'زمان آن رسیده که برای بهار مرتب کنیم',
            btn: 'دریابید که چگونه',
        },
        fi: {
            title: 'Aika siivota kevättä varten',
            btn: 'Opi kuinka',
        },
        he: {
            title: 'זמן לסדר לקראת האביב',
            btn: 'לברר איך',
        },
        hr: {
            title: 'Vrijeme je za spremanje za proljeće',
            btn: 'Nauči kako',
        },
        hu: {
            title: 'Itt az ideje rendet rakni tavaszra',
            btn: 'Hogyan?',
        },
        hy: {
            title: 'Մաքրություն՝ գարնան համար',
            btn: 'Պարզել, թե ինչպես',
        },
        id: {
            title: 'Bersihkan untuk musim semi',
            btn: 'Cari tahu caranya',
        },
        lt: {
            title: 'Laikas sutvarkyti pavasariui',
            btn: 'Išmokti kaip',
        },
        ms: {
            title: 'Kemaskan untuk musim bunga',
            btn: 'Ketahui caranya',
        },
        nb: {
            title: 'På tide å rydde opp til våren',
            btn: 'Lær hvordan',
        },
        nl: {
            title: 'Tijd om op te ruimen voor de lente',
            btn: 'Leren hoe',
        },
        pl: {
            title: 'Czas na porządki przed wiosną',
            btn: 'Naucz się jak',
        },
        ro: {
            title: 'Facem ordine pentru primăvară',
            btn: 'Afla cum',
        },
        sk: {
            title: 'Čas upratať pred jarnom',
            btn: 'Zistite ako',
        },
        sl: {
            title: 'Čas je, da pospravimo za pomlad',
            btn: 'Nauči se kako',
        },
        'sr-Latn': {
            title: 'Vreme je da pospremimo za proleće',
            btn: 'Saznajte kako',
        },
        sv: {
            title: 'Dags att städa inför våren',
            btn: 'Lära sig hur',
        },
        tr: {
            title: 'Bahar için temizlik zamanı',
            btn: 'Nasıl öğrenilir',
        },
        vi: {
            title: 'Đã đến lúc dọn dẹp cho mùa xuân',
            btn: 'Tìm hiểu cách',
        },
        mk: {
            title: 'Правиме ред за пролетта',
            btn: 'Дознајте како',
        },
        hi: {
            title: 'वसंत के लिए सफाई का समय',
            btn: 'कैसे जानें',
        },
        et: {
            title: 'Aeg kevadeks koristamiseks',
            btn: 'Õpi kuidas',
        },
        th: {
            title: 'ถึงเวลาทำความสะอาดเพื่อฤดูใบไม้ผลิ',
            btn: 'เรียนรู้วิธีการ',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Spring25 }),
    from: '28 April 2025 12:00:00',
    to: '4 May 2025 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/spring25.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/spring25-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/spring25-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/spring25-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/spring25-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/spring25-off-38.png'),
        },
        warning: defaultIconVariants.warning,
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [SPRING_25_ID, spring25Notification],
]);
