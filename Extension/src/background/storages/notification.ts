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

export const DESKTOP_COMPARE_23_ID = 'desktopCompare23';

export const desktopCompare23Notification: Notification = {
    id: DESKTOP_COMPARE_23_ID,
    locales: {
        en: {
            title: "App vs extension: what's better?",
            btn: 'Compare',
        },
        ru: {
            title: 'Приложение или расширение: что лучше?',
            btn: 'Сравнить',
        },
        es: {
            title: 'App vs. extensión: ¿cuál es la mejor?',
            btn: 'Comparar',
        },
        de: {
            title: 'App oder Browsererweiterung: Was ist besser?',
            btn: 'Vergleichen',
        },
        fr: {
            title: "Application ou extension : qu'est-ce qui est mieux ?",
            btn: 'Comparer',
        },
        it: {
            title: 'App vs. estensione: cosa è meglio?',
            btn: 'Confronto',
        },
        ko: {
            title: 'AdGuard 확장 프로그램과 앱의 차이점',
            btn: '비교해보기',
        },
        ja: {
            title: 'AdGuard拡張機能版とアプリ版の違い',
            btn: '比較を見る',
        },
        zh_cn: {
            title: '应用程序还是浏览器扩展：要选择哪一个？',
            btn: '比较',
        },
        zh_tw: {
            title: '應用程式還是瀏覽器擴充功能：要選擇哪一個？',
            btn: '比較',
        },
        uk: {
            title: 'Програма чи розширення: що краще?',
            btn: 'Порівняти',
        },
        pt_br: {
            title: 'App x extensão: qual é melhor?',
            btn: 'Comparar',
        },
        pt_pt: {
            title: 'App x extensão: qual é melhor?',
            btn: 'Comparar',
        },
        ar: {
            title: 'التطبيق مقابل الامتداد: أيهما أفضل؟',
            btn: 'يقارن',
        },
        be: {
            title: 'Праграма супраць пашырэння: што лепш?',
            btn: 'Параўнайце',
        },
        bg: {
            title: 'Приложение срещу разширение: кое е по-добро?',
            btn: 'Сравни',
        },
        ca: {
            title: 'Aplicació versus extensió: què és millor?',
            btn: 'Compara',
        },
        cs: {
            title: 'Aplikace vs. rozšíření: co je lepší?',
            btn: 'Porovnat',
        },
        da: {
            title: 'App vs. udvidelse: Hvad er bedst?',
            btn: 'Sammenlign',
        },
        el: {
            title: 'Εφαρμογή vs. επέκταση: τι είναι καλύτερο;',
            btn: 'Σύγκριση',
        },
        es_419: {
            title: 'App vs. extensión: ¿cuál es la mejor?',
            btn: 'Comparar',
        },
        et: {
            title: 'Rakendus vs. laiendus: mis on parem?',
            btn: 'Võrdle',
        },
        fa: {
            title: 'برنامه در مقابل برنامه افزودنی: چه چیزی بهتر است؟',
            btn: 'مقایسه کنید',
        },
        fi: {
            title: 'Sovellus vs. laajennus: mikä on parempi?',
            btn: 'Vertaa',
        },
        he: {
            title: 'אפליקציה לעומת הרחבה: מה עדיף?',
            btn: 'לְהַשְׁווֹת',
        },
        hr: {
            title: 'Aplikacija protiv proširenja: što je bolje?',
            btn: 'Usporedi',
        },
        hi: {
            title: 'ऐप बनाम एक्सटेंशन: क्या बेहतर है?',
            btn: 'तुलना करना',
        },
        hu: {
            title: 'Alkalmazás vs. bővítmény: melyik a jobb?',
            btn: 'Összehasonlítás',
        },
        hy: {
            title: 'Հավելվածն ընդդեմ ընդլայնման. ո՞րն է ավելի լավ:',
            btn: 'Համեմատեք',
        },
        id: {
            title: 'Aplikasi vs. ekstensi: apa yang lebih baik?',
            btn: 'Bandingkan',
        },
        lt: {
            title: 'Programėlė ir plėtinys: kas geriau?',
            btn: 'Palyginkite',
        },
        ms: {
            title: 'Apl lwn sambungan: apakah yang lebih baik?',
            btn: 'Bandingkan',
        },
        nb: {
            title: 'App vs. utvidelse: hva er best?',
            btn: 'Sammenlign',
        },
        nl: {
            title: 'App vs. extensie: wat is beter?',
            btn: 'Vergelijk',
        },
        pl: {
            title: 'Aplikacja vs. rozszerzenie: co jest lepsze?',
            btn: 'Porównaj',
        },
        ro: {
            title: 'Aplicație vs. extensie: ce este mai bine?',
            btn: 'Comparați',
        },
        sk: {
            title: 'Aplikácia vs. rozšírenie: čo je lepšie?',
            btn: 'Porovnaj',
        },
        sl: {
            title: 'Aplikacija proti razširitvi: kaj je bolje?',
            btn: 'Primerjaj',
        },
        'sr-Latn': {
            title: 'Aplikacija vs. ekstenzija: šta je bolje?',
            btn: 'Uporedite',
        },
        sv: {
            title: 'App vs. tillägg: vad är bäst?',
            btn: 'Jämför',
        },
        th: {
            title: 'แอปเทียบกับส่วนขยาย: อะไรดีกว่ากัน',
            btn: 'เปรียบเทียบ',
        },
        tr: {
            title: 'Uygulama vs. uzantı: hangisi daha iyi?',
            btn: 'Karşılaştır',
        },
        vi: {
            title: 'Ứng dụng so với tiện ích mở rộng: cái nào tốt hơn?',
            btn: 'So sánh',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.ComparePromo }),
    from: '20 July 2023 12:00:00',
    to: '1 September 2023 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/compare-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/compare-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/compare-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/compare-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [DESKTOP_COMPARE_23_ID, desktopCompare23Notification],
]);
