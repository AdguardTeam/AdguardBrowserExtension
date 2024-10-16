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

const HALLOWEEN_24_ID = 'halloween24';

const halloween24Notification: PromoNotification = {
    id: HALLOWEEN_24_ID,
    locales: {
        en: {
            title: 'The Web is full of dangers',
            btn: 'Get rid of them',
        },
        fr: {
            title: 'Le Web est plein de périls',
            btn: 'Èliminons-les',
        },
        it: {
            title: "L'Internet è pieno di pericoli",
            btn: 'Togliamoli',
        },
        de: {
            title: 'Cybermonster bedrohen das Web!',
            btn: 'Das muss aufhören',
        },
        ru: {
            title: 'Кибернежить нападает!',
            btn: 'Сразиться',
        },
        es: {
            title: 'El internet está lleno de peligros',
            btn: 'Terminarlos',
        },
        es_419: {
            title: 'El internet está lleno de peligros',
            btn: 'Terminarlos',
        },
        pt_pt: {
            title: 'A internet está cheia de monstros',
            btn: 'Acabar com eles',
        },
        pt_br: {
            title: 'A internet está cheia de monstros',
            btn: 'Acabar com eles',
        },
        zh_cn: {
            title: '网络威胁无处不在',
            btn: '立即消除它们',
        },
        zh_tw: {
            title: '網路威脅無處不在',
            btn: '立即消除它們',
        },
        ja: {
            title: 'AdGuardで怪物を 倒すゲーム',
            btn: 'プレイしてみる',
        },
        ko: {
            title: '사이버 몬스터와 싸워보세요!',
            btn: '퀴즈 시작',
        },
        uk: {
            title: 'Інтернет повен небезпек',
            btn: 'Позбудьтесь їх',
        },
        ar: {
            title: '!الإنترنت في خطر',
            btn: 'ساعد',
        },
        be: {
            title: 'Інтэрнэт поўны небяспек',
            btn: 'Пазбаўцеся іх',
        },
        bg: {
            title: 'Интернетът е в опасност!',
            btn: 'Помогнете',
        },
        ca: {
            title: 'Internet està en perill!',
            btn: 'Ajuda',
        },
        cs: {
            title: 'Web je plný nebezpečí',
            btn: 'Zbavte se jich',
        },
        da: {
            title: 'Internettet er fuld af farer',
            btn: 'Slip af med dem',
        },
        el: {
            title: 'Το διαδίκτυο κινδυνεύει!',
            btn: 'Βοήθεια',
        },
        fa: {
            title: '!هیولاها به اینترنت حمله کردند',
            btn: 'مبارزه کنید',
        },
        fi: {
            title: 'Hirviöt hyökkäsivät internetiin!',
            btn: 'Taistele',
        },
        he: {
            title: '!המפלצות תקפו את האינטרנט',
            btn: 'להילחם',
        },
        hr: {
            title: 'Internet je pun opasnosti',
            btn: 'Riješite ih se',
        },
        hu: {
            title: 'Az internet veszélyben van!',
            btn: 'Segíts',
        },
        hy: {
            title: 'Ինտերնետը վտանգի մեջ է',
            btn: 'Օգնեք',
        },
        id: {
            title: 'Monster menyerang internet!',
            btn: 'Bertarung',
        },
        lt: {
            title: 'Monstrai užpuolė internetą!',
            btn: 'Kovoti',
        },
        ms: {
            title: 'Raksasa menyerang internet!',
            btn: 'Lawan',
        },
        nb: {
            title: 'Internett er full av farer',
            btn: 'Bli kvitt dem',
        },
        nl: {
            title: 'Cybermonsters vallen aan!',
            btn: 'Vechten',
        },
        pl: {
            title: 'Potwory zaatakowały internet!',
            btn: 'Walczyć',
        },
        ro: {
            title: 'Monștrii au atacat internetul!',
            btn: 'Luptă',
        },
        sk: {
            title: 'Monštrá zaútočili na internet!',
            btn: 'Bojovať',
        },
        sl: {
            title: 'Splet je poln nevarnosti',
            btn: 'Znebite se jih',
        },
        'sr-Latn': {
            title: 'Monstrumi su napali internet!',
            btn: 'Bori se',
        },
        sv: {
            title: 'Monstren attackerar internet!',
            btn: 'Kämpa',
        },
        tr: {
            title: 'Canavarlar internete saldırdı!',
            btn: 'Savaş',
        },
        vi: {
            title: 'Quái vật đã tấn công internet!',
            btn: 'Chiến đấu',
        },
        hi: {
            title: 'राक्षसों ने इंटरनेट पर हमला किया!',
            btn: 'लड़ो',
        },
        et: {
            title: 'Veeb on täis ohte',
            btn: 'Vabane neist',
        },
        th: {
            title: 'สัตว์ประหลาดโจมตีอินเทอร์เน็ต!',
            btn: 'ต่อสู้',
        },
        mk: {
            title: 'Интернетот е во опасност!',
            btn: 'Помош',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Halloween24 }),
    from: '25 October 2024 12:00:00',
    to: '31 October 2024 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/halloween24.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/halloween24-update.svg'),
    icons: {
        enabled: {
            '19': browser.runtime.getURL('assets/icons/halloween24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/halloween24-on-38.png'),
        },
        disabled: {
            '19': browser.runtime.getURL('assets/icons/halloween24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/halloween24-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [HALLOWEEN_24_ID, halloween24Notification],
]);
