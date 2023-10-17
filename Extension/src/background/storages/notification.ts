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
    bgColor?: string,
    textColor?: string,
    badgeBgColor?: string,
    badgeText?: string,
    icons?: Record<string, Record<string, string>>,
};

export const HALLOWEEN_23_ID = 'halloween23';

export const halloween23Notification: Notification = {
    id: HALLOWEEN_23_ID,
    locales: {
        en: {
            title: 'Fact or fiction?',
            btn: 'Investigate',
        },
        ru: {
            title: 'Верю не верю',
            btn: 'Давайте проверим',
        },
        es: {
            title: '¿Realidad o ficción?',
            btn: '¡Adivinar!',
        },
        de: {
            title: 'Falsch oder wahr?',
            btn: 'Kommen Sie klar',
        },
        fr: {
            title: 'Fait ou fiction ?',
            btn: 'Examinons',
        },
        it: {
            title: 'Fatto o finzione?',
            btn: 'Esaminiamo',
        },
        ko: {
            title: '사실일까, 괴담일까?',
            btn: '퀴즈 시작',
        },
        ja: {
            title: '事実か怪談か？',
            btn: 'クイズに挑戦する',
        },
        zh_cn: {
            title: '万圣节答题小游戏',
            btn: '开始玩儿',
        },
        zh_tw: {
            title: '萬聖節答題小遊戲',
            btn: '開始玩',
        },
        uk: {
            title: 'Факт чи вигадка?',
            btn: 'Вгадай!',
        },
        pt_br: {
            title: 'Realidade ou ficção?',
            btn: 'Adivinhar',
        },
        pt_pt: {
            title: 'Realidade ou ficção?',
            btn: 'Adivinhar',
        },
        ar: {
            title: 'حقيقة أم خيال؟',
            btn: '!يخمن',
        },
        be: {
            title: 'Факт ці выдумка?',
            btn: 'Адгадайце!',
        },
        bg: {
            title: 'Факт или измислица?',
            btn: 'Познайте!',
        },
        ca: {
            title: 'Realitat o ficció?',
            btn: 'Endevina!',
        },
        cs: {
            title: 'Pravda nebo fikce?',
            btn: 'Tipni si!',
        },
        da: {
            title: 'Fakta eller fiktion?',
            btn: 'Gætte!',
        },
        el: {
            title: 'Σωστό ή λάθος?',
            btn: 'Εικασία!',
        },
        es_419: {
            title: '¿Realidad o ficción?',
            btn: '¡Adivinar!',
        },
        fa: {
            title: 'واقعیت یا تخیل؟',
            btn: '!حدس بزن',
        },
        fi: {
            title: 'Totta vai tarua?',
            btn: 'Arvaus!',
        },
        he: {
            title: '?עובדה או בדיה',
            btn: '!לְנַחֵשׁ',
        },
        hr: {
            title: 'Činjenica ili fikcija?',
            btn: 'Pogodite!',
        },
        hu: {
            title: 'Tény vagy fikció?',
            btn: 'Találd ki!',
        },
        hy: {
            title: 'Փաստ, թե հորինված.',
            btn: 'Գուշակիր',
        },
        id: {
            title: 'Fakta atau Fiksi?',
            btn: 'Tebakan!',
        },
        lt: {
            title: 'Faktas ar fikcija?',
            btn: 'Atspėk!',
        },
        ms: {
            title: 'Fakta atau fiksyen?',
            btn: 'Teka!',
        },
        nb: {
            title: 'Fakta eller fiksjon?',
            btn: 'Gjett!',
        },
        nl: {
            title: 'Feit of Fictie?',
            btn: 'Gok!',
        },
        pl: {
            title: 'Fakt czy fikcja?',
            btn: 'Zgadywać!',
        },
        ro: {
            title: 'Realitate sau fictiune?',
            btn: 'Ghici!',
        },
        sk: {
            title: 'Skutočnosť alebo fikcia?',
            btn: 'Hádaj!',
        },
        sl: {
            title: 'Dejstvo ali fikcija?',
            btn: 'Ugani!',
        },
        'sr-Latn': {
            title: 'Tačno ili netačno?',
            btn: 'Izgleda!',
        },
        sv: {
            title: 'Fakta eller påhitt?',
            btn: 'Gissa!',
        },
        tr: {
            title: 'Gerçek mi kurgu mu?',
            btn: 'Tahmin etmek!',
        },
        vi: {
            title: 'Sự thật hay hư cấu?',
            btn: 'Đoán!',
        },
        hi: {
            title: 'तथ्य या कल्पना?',
            btn: 'अनुमान लगाना!',
        },
        et: {
            title: 'Fakt või väljamõeldis?',
            btn: 'Arva ära!',
        },
        th: {
            title: 'เรื่องจริงหรือนิยาย?',
            btn: 'เดา!',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Halloween }),
    from: '25 October 2023 12:00:00',
    to: '1 November 2023 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/halloween23-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/halloween23-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/halloween23-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/halloween23-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [HALLOWEEN_23_ID, halloween23Notification],
]);
