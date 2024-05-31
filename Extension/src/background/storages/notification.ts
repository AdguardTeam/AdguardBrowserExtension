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

export type IconData = {
    '19': string;
    '38': string;
};

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
    /**
     * Update popup background image may have a bit different width.
     */
    bgImageOnUpdate?: string,
    bgColor?: string,
    textColor?: string,
    badgeBgColor?: string,
    badgeText?: string,
    icons?: Record<string, IconData>,
};

const BIRTHDAY_24_ID = 'birthday24';

const birthday24Notification: Notification = {
    id: BIRTHDAY_24_ID,
    locales: {
        en: {
            title: 'Would you fit in AdGuard?',
            btn: 'Find out',
        },
        fr: {
            title: 'Qui seriez-vous chez AdGuard ?',
            btn: 'Découvrez-le',
        },
        it: {
            title: 'Chi sarai ad AdGuard ?',
            btn: 'Scoprirlo',
        },
        de: {
            title: 'Wer wären Sie bei AdGuard?',
            btn: 'Herausfinden',
        },
        ru: {
            title: 'Кем бы вы были в AdGuard?',
            btn: 'Узнать',
        },
        es: {
            title: '¿Quién eres en AdGuard?',
            btn: 'Descubrirlo',
        },
        es_419: {
            title: '¿Quién eres en AdGuard?',
            btn: 'Descubrirlo',
        },
        pt_pt: {
            title: 'Quem seria no AdGuard?',
            btn: 'Descobrir',
        },
        pt_br: {
            title: 'Quem é você no AdGuard?',
            btn: 'Descobrir',
        },
        zh_cn: {
            title: '如果你在 AdGuard 工作',
            btn: '你的岗位会是...',
        },
        zh_tw: {
            title: '如果您在 AdGuard 工作',
            btn: '您的崗位會是...',
        },
        ja: {
            title: 'あなたが AdGuard メンバーだったら？',
            btn: 'おもしろアンケート',
        },
        ko: {
            title: '여러분이 AdGuard 직원이라면?',
            btn: '테스트 시작',
        },
        uk: {
            title: 'Ким би ви були в AdGuard?',
            btn: 'Дізнатися',
        },
        ar: {
            title: '؟AdGuard من كنت ستكون في ',
            btn: 'اكتشاف',
        },
        be: {
            title: 'Кім бы вы былі ў AdGuard?',
            btn: 'Даведацца',
        },
        id: {
            title: 'Siapa yang akan Anda jadi di AdGuard?',
            btn: 'Mengetahui',
        },
        pl: {
            title: 'Kim byłbyś w AdGuard?',
            btn: 'Dowiedzieć się',
        },
        tr: {
            title: "AdGuard'da kim olurdunuz?",
            btn: 'Öğrenmek',
        },
        vi: {
            title: 'Bạn sẽ là ai trong AdGuard?',
            btn: 'Tìm hiểu',
        },
        bg: {
            title: 'Кой бихте били в AdGuard?',
            btn: 'Разбера',
        },
        ca: {
            title: 'Qui seríeu a AdGuard?',
            btn: 'Esbrinar',
        },
        cs: {
            title: 'Kým byste byli v AdGuard?',
            btn: 'Zjistit',
        },
        da: {
            title: 'Hvem ville du være i AdGuard?',
            btn: 'Finde ud af',
        },
        el: {
            title: 'Ποιος θα ήσασταν στο AdGuard;',
            btn: 'Μάθω',
        },
        fa: {
            title: 'چه نقشی داشته‌اید؟ AdGuard شما در ',
            btn: 'فهمیدن',
        },
        fi: {
            title: 'Kuka olisit AdGuardissa?',
            btn: 'Selvittää',
        },
        he: {
            title: '?AdGuardמי היית ב',
            btn: 'לגלות',
        },
        hr: {
            title: 'Tko bi bio u AdGuardu?',
            btn: 'Saznati',
        },
        hu: {
            title: 'Ki lennél az AdGuardban?',
            btn: 'Megtudni',
        },
        hy: {
            title: 'Ով կլինեիք AdGuard-ում՞',
            btn: 'Պարզել',
        },
        lt: {
            title: 'Kuo būtumėte AdGuard?',
            btn: 'Sužinoti',
        },
        ms: {
            title: 'Siapa anda akan jadi di AdGuard?',
            btn: 'Ketahui',
        },
        no: {
            title: 'Hvem ville du vært i AdGuard?',
            btn: 'Finne ut',
        },
        nl: {
            title: 'Wie zou je zijn bij AdGuard?',
            btn: 'Uitvinden',
        },
        ro: {
            title: 'Cine ai fi în AdGuard?',
            btn: 'Afla',
        },
        sk: {
            title: 'Kým by ste boli v AdGuard?',
            btn: 'Zistiť',
        },
        sl: {
            title: 'Kdo bi bil v AdGuard?',
            btn: 'Izvedeti',
        },
        'sr-Latn': {
            title: 'Ko bi ste bili u AdGuard?',
            btn: 'Saznati',
        },
        sv: {
            title: 'Vem skulle du vara i AdGuard?',
            btn: 'Ta reda på',
        },
        hi: {
            title: 'आप AdGuard में कौन होंगे?',
            btn: 'पता लगाना',
        },
        et: {
            title: 'Kes sa oleksid AdGuardis?',
            btn: 'Teada saama',
        },
        th: {
            title: 'คุณจะเป็นใครใน AdGuard?',
            btn: 'หาข้อมูล',
        },
        mk: {
            title: 'Кој би биле вие во AdGuard?',
            btn: 'Дознај',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Birthday24 }),
    from: '30 May 2024 12:00:00',
    to: '5 June 2024 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/birthday24.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/birthday24-on-update.svg'),
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/birthday24-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/birthday24-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/birthday24-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/birthday24-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [BIRTHDAY_24_ID, birthday24Notification],
]);
