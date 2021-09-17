import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { Icon } from '../../../common/components/ui/Icon';

export const Notification = (props) => {
    const [notificationOnClose, setNotificationOnClose] = useState(false);

    const { id, title, description } = props;

    const { uiStore } = useContext(rootStore);

    const displayTimeoutAnimationMs = 5000;
    const displayTimeoutMs = 5300;

    useEffect(() => {
        const displayTimeoutAnimationId = setTimeout(() => {
            setNotificationOnClose(true);
        }, displayTimeoutAnimationMs);

        const displayTimeout = setTimeout(() => {
            uiStore.removeNotification(id);
        }, displayTimeoutMs);

        return () => {
            clearTimeout(displayTimeoutAnimationId);
            clearTimeout(displayTimeout);
        };
    }, [id, uiStore]);

    const notificationClassnames = classnames('notification', {
        'notification--close': notificationOnClose,
    });

    const close = () => {
        setNotificationOnClose(true);
        setTimeout(() => {
            uiStore.removeNotification(id);
        }, 300);
    };

    return (
        <div className={notificationClassnames}>
            <Icon id="#info" classname="notification__icon notification__icon--info" />
            {title.length > 0
            && <div className="notification__title">{title}</div>}
            <div className="notification__description">{description}</div>
            <button
                type="button"
                className="button notification__close"
                onClick={close}
            >
                <Icon id="#cross" classname="notification__icon notification__icon--close" />
            </button>
        </div>
    );
};

Notification.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
};
