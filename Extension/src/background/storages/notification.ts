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
import { type NotificationTextRecord } from '../schema';
import { defaultIconVariants } from '../api/ui/icons';

/**
 * Icon data for different sizes.
 */
export type IconData = {

    /**
     * Icon paths for different sizes.
     */
    iconPaths: {
        '19': string;
        '38': string;
    };

    /**
     * Tooltip text to display.
     */
    tooltip?: string;
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

    /**
     * State icon variants when the extension update is available.
     */
    updateAvailable: IconData;

    /**
     * State icon variants when the extension is loading.
     */
    loading: IconData;
};

export type PromoNotification = {
    id: string;
    locales: Record<string, NotificationTextRecord>;
    url: string;
    text: string | NotificationTextRecord | null;
    from: string;
    to: string;
    type: string;

    /**
     * Path to the background image for the promo.
     * May be needed for different promos for different locales at the same time.
     */
    bgImage: string;

    /**
     * Update popup background image may have a bit different width.
     */
    bgImageOnUpdate?: string;
    bgColor?: string;
    textColor?: string;
    badgeBgColor?: string;
    badgeText?: string;
    icons?: IconVariants;
};

const HALLOWEEN_25_ID = 'halloween25';

const halloween25Notification: PromoNotification = {
    id: HALLOWEEN_25_ID,
    locales: {
        en: {
            title: 'Buy with discount, win Golden Ticket',
            btn: 'Grab the deal',
        },
        fr: {
            title: 'Achetez avec une remise, gagnez un billet doré',
            btn: 'Profitez de l\'offre',
        },
        it: {
            title: 'Acquista con lo sconto, ricevi il biglietto d\'oro',
            btn: 'Tenta la fortuna',
        },
        de: {
            title: 'Mit Rabatt kaufen — Goldticket gewinnen',
            btn: 'Angebot holen',
        },
        ru: {
            title: 'Купите со скидкой — выиграйте золотой билет',
            btn: 'Испытать удачу',
        },
        es: {
            title: 'Compra con descuento, gana un boleto dorado',
            btn: 'Aprovechar la oferta',
        },
        es_419: {
            title: 'Compra con descuento, gana un boleto dorado',
            btn: 'Aprovechar la oferta',
        },
        pt_pt: {
            title: 'Compre com desconto, ganhe um bilhete dourado',
            btn: 'Aproveitar a oferta',
        },
        pt_br: {
            title: 'Compre com desconto, ganhe um bilhete dourado',
            btn: 'Aproveitar a oferta',
        },
        zh_cn: {
            title: '限时特价期间购买，即有机会抽中金奖券',
            btn: '试试手气',
        },
        zh_tw: {
            title: '限時特價期間購買，即有機會抽中金獎券喔',
            btn: '試試手氣',
        },
        ja: {
            title: '特価で購入すれば、抽選でゴールデン チケットが当たる',
            btn: '運を試す',
        },
        ko: {
            title: '할인받고 골든 티켓을 잡으세요!',
            btn: '할인 받기',
        },
        uk: {
            title: 'Купуй зі знижкою — вигравай золотий квиток',
            btn: 'Спробуй удачу',
        },
        ar: {
            title: 'اشترِ بخصم واربح تذكرة ذهبية',
            btn: 'اغتنم العرض',
        },
        be: {
            title: 'Купляй са зніжкай і выйграй залаты білет',
            btn: 'Паспрабаваць удачу',
        },
        bg: {
            title: 'Купи с отстъпка и спечели златен билет',
            btn: 'Опита късмета',
        },
        ca: {
            title: 'Compra amb descompte i prova sort',
            btn: 'Aprofita l\'oferta',
        },
        cs: {
            title: 'Kup se slevou a vyhraj zlatou vstupenku',
            btn: 'Zkusit štěstí',
        },
        da: {
            title: 'Køb med rabat og vind en gylden billet',
            btn: 'Prøve lykken',
        },
        el: {
            title: 'Κερδίστε Χρυσό Εισιτήριο με έκπτωση',
            btn: 'Αποκτήστε έκπτωση',
        },
        fa: {
            title: 'با تخفیف بخر و بلیط طلایی برنده شو',
            btn: 'امتحان کردن شانس',
        },
        fi: {
            title: 'Osta alennuksella ja voita kultainen lippu',
            btn: 'Kokeilla onnea',
        },
        he: {
            title: 'קנו בהנחה וזכו בכרטיס זהב',
            btn: 'לנסות מזל',
        },
        hr: {
            title: 'Kupi s popustom i osvoji zlatnu kartu',
            btn: 'Okušati sreću',
        },
        hu: {
            title: 'Vásárolj kedvezménnyel és nyerj aranyjegyet',
            btn: 'Kipróbálni szerencsét',
        },
        hy: {
            title: 'Գնիր զեղչով և շահիր ոսկե տոմս',
            btn: 'Փորձել բախտը',
        },
        id: {
            title: 'Beli dengan diskon dan menangkan tiket emas',
            btn: 'Coba keberuntungan',
        },
        lt: {
            title: 'Pirk su nuolaida ir laimėk auksinį bilietą',
            btn: 'Išbandyti sėkmę',
        },
        ms: {
            title: 'Beli dengan diskaun dan menangi tiket emas',
            btn: 'Cuba nasib',
        },
        nb: {
            title: 'Kjøp med rabatt og vinn en gullbillett',
            btn: 'Prøve lykken',
        },
        nl: {
            title: 'Koop met korting en win een gouden ticket',
            btn: 'Proberen geluk',
        },
        pl: {
            title: 'Kup ze zniżką i wygraj złoty bilet',
            btn: 'Spróbować szczęścia',
        },
        ro: {
            title: 'Cumpără cu reducere și câștigă',
            btn: 'Încerca norocul',
        },
        sk: {
            title: 'Kúp so zľavou a vyhraj zlatý lístok',
            btn: 'Skúsiť šťastie',
        },
        sl: {
            title: 'Kupite s popustom in osvojite zlato vstopnico',
            btn: 'Preizkusiti srečo',
        },
        sr_latn: {
            title: 'Kupi sa popustom i osvoji zlatnu kartu',
            btn: 'Oprobati sreću',
        },
        sv: {
            title: 'Köp med rabatt och vinn en gyllene biljett',
            btn: 'Prova lyckan',
        },
        tr: {
            title: 'İndirimle satın al ve altın bilet kazan',
            btn: 'Şansı denemek',
        },
        vi: {
            title: 'Mua với giá giảm và trúng vé vàng',
            btn: 'Thử vận may',
        },
        mk: {
            title: 'Купи со попуст и освои златен билет',
            btn: 'Обиди ја среќата',
        },
        hi: {
            title: 'छूट पर खरीदें और गोल्डन टिकट जीतें',
            btn: 'किस्मत आज़माना',
        },
        et: {
            title: 'Osta soodustusega ja võida kuldne pilet',
            btn: 'Proovida õnne',
        },
        th: {
            title: 'ซื้อพร้อมส่วนลดและลุ้นรับตั๋วทอง',
            btn: 'ลองเสี่ยงโชค',
        },
    },
    text: '',
    url: Forward.get({ action: ForwardAction.Halloween25 }),
    from: '25 October 2025 12:00:00',
    to: '31 October 2025 23:59:00',
    type: 'animated',
    bgImage: browser.runtime.getURL('assets/images/halloween25.svg'),
    bgImageOnUpdate: browser.runtime.getURL('assets/images/halloween25.svg'),
    icons: {
        ...defaultIconVariants,
        enabled: {
            iconPaths: {
                '19': browser.runtime.getURL('assets/icons/halloween25-on-19.png'),
                '38': browser.runtime.getURL('assets/icons/halloween25-on-38.png'),
            },
        },
        disabled: {
            iconPaths: {
                '19': browser.runtime.getURL('assets/icons/halloween25-off-19.png'),
                '38': browser.runtime.getURL('assets/icons/halloween25-off-38.png'),
            },
        },
    },
};

/**
 * In-memory notifications mapping.
 */
export const notificationStorage = new Map<string, PromoNotification>([
    [HALLOWEEN_25_ID, halloween25Notification],
]);
