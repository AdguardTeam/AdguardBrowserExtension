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

import React, {
    useContext,
    useEffect,
    useState,
} from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { MessageType } from '../../../../common/messages';

import './promo-notification.pcss';

export const PromoNotification = observer(() => {
    const {
        promoNotification,
        closePromoNotification,
        openPromoNotificationUrl,
    } = useContext(popupStore);

    const [notificationOnClose, setNotificationOnClose] = useState(false);

    // schedule notification removal
    useEffect(() => {
        if (promoNotification) {
            messenger.sendMessage(MessageType.SetNotificationViewed, { withDelay: true });
        }
    }, [promoNotification]);

    if (!promoNotification) {
        return null;
    }

    const closeTimeoutMs = 300;

    const handleNotificationClose = (e) => {
        setNotificationOnClose(true);
        setTimeout(() => {
            e.preventDefault();
            closePromoNotification();
        }, closeTimeoutMs);
    };

    const handleNotificationClick = (e) => {
        e.preventDefault();
        openPromoNotificationUrl();
    };

    const { title, btn } = promoNotification.text;

    const notificationClassnames = classnames('promo-notification', {
        'promo-notification--close': notificationOnClose,
    });

    return (
        <div className={notificationClassnames}>
            <button
                aria-label="close"
                type="button"
                className="promo-notification__close"
                onClick={handleNotificationClose}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#cross-white" />
                </svg>
            </button>
            <div className="promo-notification__content">
                <div className="promo-notification__title">
                    {title}
                </div>
                <button
                    type="button"
                    className="promo-notification__btn"
                    onClick={handleNotificationClick}
                >
                    {btn}
                </button>
            </div>
        </div>
    );
});
