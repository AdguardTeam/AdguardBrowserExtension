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

const RU_LOCALE = 'ru';

const CHRISTMAS_23_ID = 'christmas23';

const christmas23Notification: Notification = {
    id: CHRISTMAS_23_ID,
    locales: {
        en: {
            title: 'Christmas at AdGuard',
            btn: 'Unwrap',
        },
        ru: {
            title: 'Новый год в AdGuard',
            btn: 'Что под ёлкой?',
        },
        ja: {
            title: 'AdGuard Christmas キャンペーン',
            btn: 'プレゼントはこちら',
        },
        ko: {
            title: 'AdGuard 크리스마스 프로모션',
            btn: '선물 찾기',
        },
        zh_cn: {
            title: 'AdGuard Christmas',
            btn: '有什么惊喜？',
        },
        zh_tw: {
            title: 'AdGuard Christmas',
            btn: '有什麼驚喜？',
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
            btn: 'Öffnen',
        },
        es: {
            title: 'Navidad en AdGuard',
            btn: 'Abrir',
        },
        pt_br: {
            title: 'É Natal no AdGuard',
            btn: 'Abrir',
        },
        pt_pt: {
            title: 'É Natal no AdGuard',
            btn: 'Abrir',
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
        es_419: {
            title: 'Navidad en AdGuard',
            btn: 'Abre',
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
            title: 'Új év az AdGuardban',
            btn: 'Nyisd ki',
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
    url: Forward.get({ action: ForwardAction.Christmas23 }),
    from: '22 December 2023 12:00:00',
    to: '1 January 2024 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/christmas23-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/christmas23-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/christmas23-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/christmas23-off-38.png'),
        },
    },
};

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }
    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());
// possible values of Prefs.language: 'ru', or 'ru-RU' which is 'ru_ru' after normalization
if (currentLocale?.startsWith(RU_LOCALE)) {
    christmas23Notification.to = '8 January 2024 23:59:00';
}

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [CHRISTMAS_23_ID, christmas23Notification],
]);
