/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import './promo-notification.pcss';

export const PromoNotification = observer(() => {
    const {
        promoNotification,
        closePromoNotification,
        openPromoNotificationUrl,
    } = useContext(popupStore);

    const [notificationIsClosed, setNotificationIsClosed] = useState(false);

    // schedule notification removal
    useEffect(() => {
        if (promoNotification) {
            messenger.setNotificationViewed(true);
        }
    }, [promoNotification]);

    if (
        !promoNotification
        || !promoNotification.text
        || typeof promoNotification.text === 'string'
    ) {
        return null;
    }

    const closeTimeoutMs = 300;

    const handleNotificationClose = () => {
        setNotificationIsClosed(true);
        setTimeout(() => {
            closePromoNotification();
        }, closeTimeoutMs);
    };

    const { bgImage, text: { title, btn } } = promoNotification;

    const promoStyle = {
        backgroundImage: `url(${bgImage})`,
    };

    const notificationClassnames = classnames('promo-notification', {
        'promo-notification--closing': notificationIsClosed,
    });

    return (
        <div
            className={notificationClassnames}
            style={promoStyle}
        >
            <button
                aria-label="close"
                type="button"
                className="promo-notification__close"
                onClick={handleNotificationClose}
            >
                <svg className="icon icon--24">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <div className="promo-notification__content">
                <div className="promo-notification__title">
                    {title}
                </div>
                <button
                    type="button"
                    className="promo-notification__btn"
                    onClick={openPromoNotificationUrl}
                >
                    {btn}
                </button>
            </div>
        </div>
    );
});
