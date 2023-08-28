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

export const BACK_TO_SCHOOL_23_ID = 'backToSchool23';

export const backToSchool23Notification: Notification = {
    id: BACK_TO_SCHOOL_23_ID,
    locales: {
        en: {
            title: 'Back to school: Quiz and prize',
            btn: 'Test yourself',
        },
        ru: {
            title: 'Снова в школу: квиз и приз',
            btn: 'Пройти',
        },
        es: {
            title: 'Vuelta al cole: quiz y recompensa',
            btn: 'Hacer el quiz',
        },
        de: {
            title: 'Back to School: Quiz und Preis',
            btn: 'Quiz los',
        },
        fr: {
            title: 'La rentrée avec AdGuard : Quiz et cadeaux',
            btn: 'Passez le Quiz',
        },
        it: {
            title: 'A Scuola con AdGuard: un quiz e un regalo',
            btn: 'Supera il Quiz',
        },
        ko: {
            title: '백 투 스쿨: 퀴즈 및 할인',
            btn: '퀴즈게임 시작',
        },
        ja: {
            title: 'Back to School セールとクイズ',
            btn: 'クイズに挑戦！',
        },
        zh_cn: {
            title: '开学特惠：小测验大惊喜',
            btn: '测试自己',
        },
        zh_tw: {
            title: '開學特惠：小測驗大驚喜',
            btn: '測試自己',
        },
        uk: {
            title: 'Знову до школи: іспит і приз',
            btn: 'Скласти',
        },
        pt_br: {
            title: 'Volta às aulas: quiz e prêmio',
            btn: 'Fazer o quiz',
        },
        pt_pt: {
            title: 'Volta às aulas: quiz e prémio',
            btn: 'Fazer o quiz',
        },
        ar: {
            title: 'العودة إلى المدرسة: مسابقة وجائزة',
            btn: 'حل الاختبار',
        },
        be: {
            title: 'Зноў у школу: віктарына і прызы',
            btn: 'Прайсці',
        },
        bg: {
            title: 'Обратно на училище: тест и награда',
            btn: 'Преминете',
        },
        ca: {
            title: "Tornada a l'escola",
            btn: 'Passar',
        },
        cs: {
            title: 'Zpátky do školy: kvíz a cena',
            btn: 'Projít',
        },
        da: {
            title: 'Tilbage til skolen: quiz og præmie',
            btn: 'Test deg selv',
        },
        el: {
            title: 'Επιστροφή στο σχολείο',
            btn: 'Περάστε',
        },
        es_419: {
            title: 'Vuelta al cole: quiz y recompensa',
            btn: 'Hacer el quiz',
        },
        fa: {
            title: 'بازگشت به مدرسه: مسابقه و جایزه',
            btn: 'امتحان را پاس کنید',
        },
        fi: {
            title: 'Takaisin kouluun',
            btn: 'Läpäise',
        },
        he: {
            title: 'חזרה לבית הספר: חידון ופרס',
            btn: 'לעבור',
        },
        hr: {
            title: 'Natrag u školu: kviz i nagrada',
            btn: 'Provjerite se',
        },
        hu: {
            title: 'Vissza az iskolába: egy kvíz és egy díj',
            btn: 'Teszteld magad',
        },
        hy: {
            title: 'Վերադառնալ դպրոց',
            btn: 'Ստուգեք ինքներդ',
        },
        id: {
            title: 'Kembali ke Sekolah: kuis dan Hadiah',
            btn: 'Uji dirimu',
        },
        lt: {
            title: 'Atgal į mokyklą: viktorina ir prizas',
            btn: 'Išbandyk save',
        },
        ms: {
            title: 'Kembali ke Sekolah: kuiz dan Hadiah',
            btn: 'Uji diri sendiri',
        },
        nb: {
            title: 'Tilbake til skolen: quiz og premie',
            btn: 'Test deg selv',
        },
        nl: {
            title: 'Terug naar school: quiz en prijs',
            btn: 'Test jezelf',
        },
        pl: {
            title: 'Powrót do szkoły: quiz i nagroda',
            btn: 'Sprawdź się',
        },
        ro: {
            title: 'Înapoi la școală: test și premiu',
            btn: 'Testați-vă',
        },
        sk: {
            title: 'Späť do školy: kvíz a cena',
            btn: 'Otestujte sa',
        },
        sl: {
            title: 'Nazaj v šolo: kviz in nagrada',
            btn: 'Preizkusite se',
        },
        'sr-Latn': {
            title: 'Povratak u školu: kviz i nagrada',
            btn: 'Proverite sami',
        },
        sv: {
            title: 'Tillbaka till skolan: quiz och pris',
            btn: 'Testa dig själv',
        },
        tr: {
            title: 'Okula Dönüş: Sınav ve Ödül',
            btn: 'Kendinizi test edin',
        },
        vi: {
            title: 'Back to School: câu đố và giải thưởng',
            btn: 'Tự kiểm tra',
        },
        hi: {
            title: 'स्कूल में वापसी: प्रश्नोत्तरी और पुरस्कार',
            btn: 'स्वयं की जांच करो',
        },
        et: {
            title: 'Tagasi kooli: viktoriin ja auhind',
            btn: 'Testige ennast',
        },
        th: {
            title: 'Back to School: แบบทดสอบและรางวัล',
            btn: 'ทดสอบตัวเอง',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.BackToSchool }),
    from: '28 August 2023 12:00:00',
    to: '3 September 2023 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/back-to-school-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/back-to-school-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/back-to-school-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/back-to-school-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [BACK_TO_SCHOOL_23_ID, backToSchool23Notification],
]);
