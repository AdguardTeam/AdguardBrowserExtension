import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { MESSAGE_TYPES } from '../../../../common/constants';

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
            messenger.sendMessage(MESSAGE_TYPES.SET_NOTIFICATION_VIEWED, { withDelay: true });
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
                    <use xlinkHref="#cross-gray" />
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
