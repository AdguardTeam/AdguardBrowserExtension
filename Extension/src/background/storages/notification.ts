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

export const BIRTHDAY_14_PROMO_ID = 'birthday14Promo';

export const birthday14Notification: Notification = {
    id: BIRTHDAY_14_PROMO_ID,
    locales: {
        en: {
            title: 'What does AI say?',
            btn: 'Guess',
        },
        ru: {
            title: 'Пойми ИИ',
            btn: 'Играть',
        },
        ko: {
            title: '인공지능은 무엇을 말하나요?',
            btn: '퀴즈 시작',
        },
        es: {
            title: 'Quiz: piensa como una IA',
            btn: 'Comenzar',
        },
        de: {
            title: 'Was sagt KI?',
            btn: 'Spielen',
        },
        pt_pt: {
            title: 'Quiz: pensa como uma IA',
            btn: 'Começar',
        },
        pt_br: {
            title: 'Quiz: pense como uma IA',
            btn: 'Começar',
        },
        zh_tw: {
            title: '成為一個“更懂” AI 的人',
            btn: '進行遊戲！',
        },
        zh_cn: {
            title: '成为一个“更懂” AI 的人',
            btn: '玩儿游戏！',
        },
        fr: {
            title: 'L\'IA dit quoi?',
            btn: 'Devinez!',
        },
        it: {
            title: 'Cosa dice l\'IA?',
            btn: 'Indovinarlo',
        },
        uk: {
            title: 'Що говорить штучний інтелект?',
            btn: 'Грати',
        },
        ar: {
            title: 'ماذا يقول الذكاء الاصطناعي؟',
            btn: 'لعب',
        },
        be: {
            title: 'Што кажа штучны інтэлект?',
            btn: 'Гуляць',
        },
        bg: {
            title: 'Какво казва ИИ?',
            btn: 'Играя',
        },
        ca: {
            title: 'Què diu la IA?',
            btn: 'Jugar',
        },
        cs: {
            title: 'Co říká umělá inteligence?',
            btn: 'Přehrát',
        },
        da: {
            title: 'Hvad siger den kunstige intelligens?',
            btn: 'Spil',
        },
        el: {
            title: 'Τι λέει η Τεχνητή Νοημοσύνη;',
            btn: 'Παίζω',
        },
        es_419: {
            title: 'Quiz: piensa como una IA',
            btn: 'Comenzar',
        },
        fa: {
            title: 'هوش مصنوعی چه می گوید؟',
            btn: 'بازی',
        },
        fi: {
            title: 'Mitä tekoäly sanoo?',
            btn: 'Leikkiä',
        },
        he: {
            title: 'מה אומרת בינה מלאכותית?',
            btn: 'משחק',
        },
        hr: {
            title: 'Što kaže umjetna inteligencija?',
            btn: 'Igrati',
        },
        hu: {
            title: 'Mit mond az MI?',
            btn: 'Játszik',
        },
        hy: {
            title: 'Ի՞նչ է ասում ԱԻ-ն:',
            btn: 'Խաղալ',
        },
        id: {
            title: 'Apa yang dikatakan AI?',
            btn: 'Bermain',
        },
        lt: {
            title: 'Ką sako dirbtinis intelektas?',
            btn: 'Žaisti',
        },
        ms: {
            title: 'Apa kata Kecerdasan Buatan?',
            btn: 'Bermain',
        },
        nb: {
            title: 'Hva sier kunstig intelligens?',
            btn: 'Skuespill',
        },
        nl: {
            title: 'Wat zegt KI?',
            btn: 'Spelen',
        },
        pl: {
            title: 'Co mówi sztuczna inteligencja?',
            btn: 'Grać',
        },
        ro: {
            title: 'Ce spune inteligența artificială?',
            btn: 'Juca',
        },
        sk: {
            title: 'Čo hovorí umelá inteligencia?',
            btn: 'Hrať',
        },
        sl: {
            title: 'Kaj pravi umetna inteligenca?',
            btn: 'Igrati',
        },
        sr: {
            title: 'Šta kaže veštačka inteligencija?',
            btn: 'Igra',
        },
        sv: {
            title: 'Vad säger artificiell intelligens?',
            btn: 'Leka',
        },
        tr: {
            title: 'Yapay zeka ne diyor?',
            btn: 'Oyun',
        },
        vi: {
            title: 'AI nói gì?',
            btn: 'Chơi',
        },
        hi: {
            title: 'आर्टिफिशियल इंटेलिजेंस क्या कहता है?',
            btn: 'खेल',
        },
        et: {
            title: 'Mida ütleb tehisintellekt?',
            btn: 'Mängima',
        },
        th: {
            title: 'ปัญญาประดิษฐ์พูดว่าอย่างไร?',
            btn: 'เล่น',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Birthday14Promo }),
    from: '01 June 2023 12:00:00',
    to: '07 June 2023 23:59:00',
    type: 'animated',
    icons: {
        ICON_GREEN: {
            '19': browser.runtime.getURL('assets/icons/bd14-on-19.png'),
            '38': browser.runtime.getURL('assets/icons/bd14-on-38.png'),
        },
        ICON_GRAY: {
            '19': browser.runtime.getURL('assets/icons/bd14-off-19.png'),
            '38': browser.runtime.getURL('assets/icons/bd14-off-38.png'),
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, Notification>([
    [BIRTHDAY_14_PROMO_ID, birthday14Notification],
]);
