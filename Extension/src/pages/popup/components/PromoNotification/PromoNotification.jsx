import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';

import './promo-notification.pcss';

export const PromoNotification = observer(() => {
    const store = useContext(popupStore);

    const [notificationOnClose, setNotificationOnClose] = useState(false);

    // schedule notification removal
    useEffect(() => {
        if (store.promoNotification) {
            messenger.sendMessage('setNotificationViewed', { withDelay: true });
        }
    }, []);

    if (!store.promoNotification) {
        return null;
    }

    const closeTimeoutMs = 300;

    const handleNotificationClose = (e) => {
        setNotificationOnClose(true);
        setTimeout(() => {
            e.preventDefault();
            store.closePromoNotification();
        }, closeTimeoutMs);
    };

    const handleNotificationClick = (e) => {
        e.preventDefault();
        store.openPromoNotificationUrl();
    };

    const { text } = store.promoNotification;

    const notificationClassnames = classnames('promo-notification', {
        'promo-notification--close': notificationOnClose,
    });

    return (
        <div className={notificationClassnames}>
            <bitton className="promo-notification__close" onClick={handleNotificationClose} />
            <div className="promo-notification__content">
                {text.title
                        && <div className="promo-notification__title">{text.title}</div>}
                {text.btn
                    && (
                        <button
                            type="button"
                            className="promo-notification__btn"
                            onClick={handleNotificationClick}
                        >
                            {text.btn}
                        </button>
                    )}
            </div>
        </div>
    );
});
