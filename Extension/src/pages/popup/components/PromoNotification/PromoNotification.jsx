import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';

import './notification.pcss';

export const PromoNotification = observer(() => {
    const store = useContext(popupStore);

    console.log(toJS(store.promoNotification));

    // schedule notification removal
    useEffect(() => {
        if (store.promoNotification) {
            messenger.sendMessage('setNotificationViewed', { withDelay: true });
        }
    }, []);

    if (!store.promoNotification) {
        return null;
    }

    const handleNotificationClose = (e) => {
        e.preventDefault();
        store.closePromoNotification();
    };

    const handleNotificationClick = (e) => {
        e.preventDefault();
        store.openPromoNotificationUrl();
    };

    const { text } = store.promoNotification;

    return (
        <div className="notification">
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
