import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';

import './notification.pcss';

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

    const notificationClassnames = classnames('notification', {
        'notification--close': notificationOnClose,
    });

    return (
        <div className={notificationClassnames}>
            <bitton className="notification__close" onClick={handleNotificationClose} />
            <div className="notification__content">
                {text.title
                        && <div className="notification__title">{text.title}</div>}
                {text.btn
                    && (
                        <button
                            type="button"
                            className="notification__btn"
                            onClick={handleNotificationClick}
                        >
                            {text.btn}
                        </button>
                    )}
            </div>
        </div>
    );
});
