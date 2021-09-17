import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { MESSAGE_TYPES } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';

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

    const { text } = promoNotification;

    const notificationClassnames = classnames('promo-notification', {
        'promo-notification--close': notificationOnClose,
    });

    return (
        <div className={notificationClassnames}>
            <bitton className="promo-notification__close" onClick={handleNotificationClose}>
                <Icon id="#cross" classname="icon--cross" />
            </bitton>
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
